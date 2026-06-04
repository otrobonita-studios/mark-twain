#!/usr/bin/env python3
"""Live RSS Knowledge Crawler.

Fetches updates from configured RSS/Atom feeds, scrapes the full text of new
articles, and outputs standardized sidecar files (.html, .txt, .meta.json)
matching the unified corpus schema for indexing.

Usage:
    python rss_crawler.py \
        --config ../feeds.json \
        --output-dir ../../TwainCorpus/rss \
        --delay 1.5
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import warnings
try:
    import requests
    from bs4 import BeautifulSoup
    try:
        from bs4 import XMLParsedAsHTMLWarning
        warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)
    except ImportError:
        pass
except ImportError:
    print(
        "Missing dependency. Install with:\n"
        "    pip install requests beautifulsoup4",
        file=sys.stderr,
    )
    sys.exit(2)

def _load_env_file(name=".env.local"):
    """Walk up from cwd looking for a .env file; load KEY=VALUE pairs into os.environ."""
    for parent in [Path.cwd(), *Path.cwd().parents]:
        f = parent / name
        if f.exists():
            for line in f.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            return

_load_env_file()
CONTACT_EMAIL = os.environ.get("CONTACT_EMAIL", "your-email@example.com")

USER_AGENT = f"rss-crawler/1.0 - live knowledge sync ({CONTACT_EMAIL})"
DEFAULT_DELAY = 1.5
DEFAULT_SOURCE_TAG = "rss-crawler"
BACKOFF_SCHEDULE = (10, 30, 60)
REQUEST_TIMEOUT = 30


@dataclass
class FeedEntry:
    title: str
    link: str
    pub_date: str
    author: str
    feed_name: str
    category: str


@dataclass
class CrawlResult:
    entry_id: str
    title: str
    category: str
    source_url: str
    output_path: str
    bytes_written: int
    status: str
    text_path: str = ""
    meta_path: str = ""
    bytes_text: int = 0
    error: str = ""
    fetched_at: str = ""


# ---------------------------------------------------------------------------
# Sanitization and Helpers
# ---------------------------------------------------------------------------

_TITLE_BAD_CHARS = re.compile(r"[^\w\s\-']", re.UNICODE)
_MULTI_WS = re.compile(r"\s+")

def sanitize_filename(title: str) -> str:
    """Sanitize title into a safe filename."""
    t = title.strip()
    t = t.replace("/", "-").replace("\\", "-")
    t = _TITLE_BAD_CHARS.sub("", t)
    t = _MULTI_WS.sub(" ", t).strip()
    t = t.replace(" ", "-")
    t = re.sub(r"-+", "-", t).strip("-")
    return t or "untitled"

def sanitize_category(text: str) -> str:
    """Sanitize category/feed name into a safe folder name."""
    t = text.strip()
    t = _TITLE_BAD_CHARS.sub("", t)
    t = _MULTI_WS.sub(" ", t).strip()
    t = " ".join(word.capitalize() for word in t.split())
    t = t.replace(" ", "-")
    return t or "Uncategorized"

def make_entry_id(feed_name: str, url: str) -> str:
    """Generate a unique ID for a feed entry using feed name and url hash."""
    url_hash = hashlib.md5(url.encode("utf-8")).hexdigest()[:12]
    safe_feed = sanitize_category(feed_name).lower()
    return f"rss-{safe_feed}-{url_hash}"


# ---------------------------------------------------------------------------
# Polite Fetching Session
# ---------------------------------------------------------------------------

class PoliteSession:
    def __init__(self, delay: float):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        self._last_request_at = 0.0

    def get(self, url: str) -> requests.Response:
        elapsed = time.monotonic() - self._last_request_at
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)

        for attempt, backoff in enumerate([0, *BACKOFF_SCHEDULE]):
            if backoff:
                print(f"    backing off {backoff}s (attempt {attempt + 1})")
                time.sleep(backoff)
            try:
                resp = self.session.get(url, timeout=REQUEST_TIMEOUT)
            except requests.RequestException as e:
                if attempt == len(BACKOFF_SCHEDULE):
                    raise
                print(f"    request error: {e}")
                continue
            self._last_request_at = time.monotonic()
            if resp.status_code in (429, 503) and attempt < len(BACKOFF_SCHEDULE):
                continue
            return resp
        return resp  # type: ignore[unreachable]

    def fetch_text(self, url: str) -> str:
        resp = self.get(url)
        resp.raise_for_status()
        return resp.text


# ---------------------------------------------------------------------------
# Parser and Scraper Logic
# ---------------------------------------------------------------------------

def parse_feed_xml(xml_content: str, feed_name: str, default_category: str) -> list[FeedEntry]:
    """Parse RSS/Atom XML content and extract entries using BeautifulSoup."""
    soup = BeautifulSoup(xml_content, "html.parser")
    entries: list[FeedEntry] = []

    # Check for RSS items first
    items = soup.find_all("item")
    if items:
        for item in items:
            title_tag = item.find("title")
            title = title_tag.get_text(strip=True) if title_tag else "Untitled"

            link_tag = item.find("link")
            link = ""
            if link_tag:
                link = link_tag.get_text(strip=True).strip()
                if not link:
                    # Sometimes BS parses xml link tags as next sibling or text nodes
                    link = str(link_tag.next_element).strip()

            if not link:
                continue

            pub_date_tag = item.find("pubdate") or item.find("dc:date")
            pub_date = pub_date_tag.get_text(strip=True) if pub_date_tag else ""

            author_tag = item.find("dc:creator") or item.find("author") or item.find("creator")
            author = author_tag.get_text(strip=True) if author_tag else ""

            entries.append(
                FeedEntry(
                    title=title,
                    link=link,
                    pub_date=pub_date,
                    author=author,
                    feed_name=feed_name,
                    category=default_category,
                )
            )
    else:
        # Check for Atom entries
        entry_tags = soup.find_all("entry")
        for entry in entry_tags:
            title_tag = entry.find("title")
            title = title_tag.get_text(strip=True) if title_tag else "Untitled"

            link_tag = entry.find("link")
            link = ""
            if link_tag:
                link = link_tag.get("href", "").strip()
                if not link:
                    link = link_tag.get_text(strip=True).strip()

            if not link:
                continue

            pub_date_tag = entry.find("published") or entry.find("updated")
            pub_date = pub_date_tag.get_text(strip=True) if pub_date_tag else ""

            author_tag = entry.find("author")
            author = ""
            if author_tag:
                name_tag = author_tag.find("name")
                author = name_tag.get_text(strip=True) if name_tag else author_tag.get_text(strip=True)

            entries.append(
                FeedEntry(
                    title=title,
                    link=link,
                    pub_date=pub_date,
                    author=author,
                    feed_name=feed_name,
                    category=default_category,
                )
            )

    return entries


def extract_article_content(html_content: str) -> tuple[str, str]:
    """Identify the main article body, strip boilerplates, and return text + cleaned HTML."""
    soup = BeautifulSoup(html_content, "html.parser")

    # Remove script, style, and other non-content tags
    for tag in soup(["script", "style", "noscript", "iframe", "svg", "form"]):
        tag.decompose()

    # Remove obvious navigation/footer elements
    for tag in soup(["header", "footer", "nav", "aside"]):
        tag.decompose()

    # Target specific selectors representing main content containers
    selectors = [
        "article",
        "main",
        "[role='main']",
        "div.entry-content",
        "div.post-content",
        "div.article-content",
        "div.article-body",
        "div.story-content",
        "div#entry-content",
        "div#post-content",
        "div#main-content",
        "div.main-content",
    ]

    content_container = None
    for selector in selectors:
        container = soup.select_one(selector)
        if container:
            txt = container.get_text(strip=True)
            if len(txt) > 200:
                content_container = container
                break

    if not content_container:
        content_container = soup.body or soup

    # Clean up empty tags inside content_container
    for tag in content_container.find_all(True):
        if not tag.get_text(strip=True) and not tag.find_all():
            tag.decompose()

    # Extract text and format
    text = content_container.get_text("\n")
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    text = re.sub(r"\r\n|\r", "\n", text)
    text = text.strip() + "\n"

    # HTML snippet of container
    cleaned_html = str(content_container)

    return text, cleaned_html


# ---------------------------------------------------------------------------
# Output Orchestration
# ---------------------------------------------------------------------------

def write_article_sidecars(
    entry: FeedEntry,
    html_content: str,
    out_dir: Path,
    source_tag: str,
) -> tuple[Path, Path, Path, int, int]:
    """Writes standardized .html, .txt, and .meta.json files."""
    category_folder = out_dir / sanitize_category(entry.feed_name)
    category_folder.mkdir(parents=True, exist_ok=True)

    safe_title = sanitize_filename(entry.title)
    html_path = category_folder / f"{safe_title}.html"
    txt_path = category_folder / f"{safe_title}.txt"
    meta_path = category_folder / f"{safe_title}.meta.json"

    # Extract content
    plain_text, cleaned_html = extract_article_content(html_content)

    # Write files
    html_path.write_text(cleaned_html, encoding="utf-8")
    txt_path.write_text(plain_text, encoding="utf-8")

    entry_id = make_entry_id(entry.feed_name, entry.link)

    meta = {
        "id": entry_id,
        "source": source_tag,
        "source_url": entry.link,
        "title": entry.title,
        "author": entry.author,
        "release_date": entry.pub_date,
        "language": "",
        "category": entry.category,
        "file": str(html_path.resolve()),
        "text_file": str(txt_path.resolve()),
        "bytes_html": len(cleaned_html.encode("utf-8")),
        "bytes_text": len(plain_text.encode("utf-8")),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }

    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

    return html_path, txt_path, meta_path, len(cleaned_html.encode("utf-8")), len(plain_text.encode("utf-8"))


# ---------------------------------------------------------------------------
# Main Execution Flow
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Live RSS Knowledge Crawler")
    parser.add_argument("--config", required=True, help="Path to feeds.json configuration")
    parser.add_argument("--output-dir", required=True, type=Path, help="Directory to save crawled articles")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY, help="Polite delay between requests")
    parser.add_argument("--source-tag", default=DEFAULT_SOURCE_TAG, help="Tag for the corpus source metadata")
    args = parser.parse_args(argv)

    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Config file not found at {config_path}", file=sys.stderr)
        return 1

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            feeds = json.load(f)
    except Exception as e:
        print(f"Error reading config: {e}", file=sys.stderr)
        return 1

    session = PoliteSession(delay=args.delay)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    # Load existing manifest if present to keep track of historical records
    manifest_path = args.output_dir / "manifest.json"
    manifest_data = {}
    if manifest_path.exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
        except Exception:
            pass

    existing_urls = set()
    historical_works = []
    if "works" in manifest_data:
        historical_works = manifest_data["works"]
        for work in historical_works:
            existing_urls.add(work.get("source_url"))

    all_entries: list[FeedEntry] = []

    # 1. Fetch all RSS XML feeds
    for feed in feeds:
        name = feed.get("name", "Unknown Feed")
        url = feed.get("url")
        category = feed.get("category", "General")
        if not url:
            continue

        print(f"Fetching RSS feed: {name} ({url})")
        try:
            feed_xml = session.fetch_text(url)
            entries = parse_feed_xml(feed_xml, name, category)
            print(f"  Found {len(entries)} entries")
            all_entries.extend(entries)
        except Exception as e:
            print(f"  Error fetching feed {name}: {e}", file=sys.stderr)

    # Deduplicate entries inside this fetch run
    unique_entries = []
    seen_run_urls = set()
    for entry in all_entries:
        if entry.link not in seen_run_urls:
            unique_entries.append(entry)
            seen_run_urls.add(entry.link)

    print(f"\nTotal unique entries identified across feeds: {len(unique_entries)}")

    results: list[CrawlResult] = []

    # 2. Process and crawl each entry
    for i, entry in enumerate(unique_entries, 1):
        entry_id = make_entry_id(entry.feed_name, entry.link)
        print(f"[{i:>3}/{len(unique_entries)}] {entry.title}")

        # Incremental check: check if it was crawled before
        if entry.link in existing_urls:
            print("    skip (already present in manifest)")
            # Find the historical work entry to keep it in the new manifest
            hist_entry = next((w for w in historical_works if w.get("source_url") == entry.link), None)
            if hist_entry:
                results.append(
                    CrawlResult(
                        entry_id=hist_entry.get("entry_id", entry_id),
                        title=hist_entry.get("title", entry.title),
                        category=hist_entry.get("category", entry.category),
                        source_url=entry.link,
                        output_path=hist_entry.get("output_path", ""),
                        bytes_written=hist_entry.get("bytes_written", 0),
                        status="skipped_existing",
                        text_path=hist_entry.get("text_path", ""),
                        meta_path=hist_entry.get("meta_path", ""),
                        bytes_text=hist_entry.get("bytes_text", 0),
                        fetched_at=hist_entry.get("fetched_at", ""),
                    )
                )
                continue

        # Fetch and parse full article
        print(f"    scraping article content from {entry.link}")
        try:
            html_content = session.fetch_text(entry.link)
            html_path, txt_path, meta_path, bytes_html, bytes_text = write_article_sidecars(
                entry=entry,
                html_content=html_content,
                out_dir=args.output_dir,
                source_tag=args.source_tag,
            )
            print(f"    saved: {bytes_text:,}B text, {bytes_html:,}B HTML")
            results.append(
                CrawlResult(
                    entry_id=entry_id,
                    title=entry.title,
                    category=entry.category,
                    source_url=entry.link,
                    output_path=str(html_path.resolve()),
                    bytes_written=bytes_html,
                    status="downloaded",
                    text_path=str(txt_path.resolve()),
                    meta_path=str(meta_path.resolve()),
                    bytes_text=bytes_text,
                    fetched_at=datetime.now(timezone.utc).isoformat(),
                )
            )
        except Exception as e:
            print(f"    FAIL ({e})", file=sys.stderr)
            results.append(
                CrawlResult(
                    entry_id=entry_id,
                    title=entry.title,
                    category=entry.category,
                    source_url=entry.link,
                    output_path="",
                    bytes_written=0,
                    status="failed",
                    error=str(e),
                )
            )

    # 3. Write manifest.json
    manifest = {
        "config_path": str(config_path.resolve()),
        "output_dir": str(args.output_dir.resolve()),
        "source_tag": args.source_tag,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "user_agent": USER_AGENT,
        "delay_seconds": args.delay,
        "works": [asdict(r) for r in results],
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\nCrawl complete. Manifest saved to {manifest_path}")
    downloaded = sum(1 for r in results if r.status == "downloaded")
    skipped = sum(1 for r in results if r.status == "skipped_existing")
    failed = sum(1 for r in results if r.status == "failed")
    print(f"Downloaded: {downloaded}, Skipped: {skipped}, Failed: {failed}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
