#!/usr/bin/env python3
"""Download a slice of Project Gutenberg from any index page.

Three kinds of index page are supported:

1. David Widger "Works of X" curated author indexes
   (e.g. https://www.gutenberg.org/files/28803/28803-h/28803-h.htm).
2. PG author bibliography pages
   (e.g. https://www.gutenberg.org/ebooks/author/53).
3. PG subject pages -- great for "works ABOUT X"
   (e.g. https://www.gutenberg.org/ebooks/subject/2982).

The script auto-detects which kind it is and uses the appropriate parser.

Usage:
    python download_pg_archive.py \
        --index-url https://www.gutenberg.org/files/28803/28803-h/28803-h.htm \
        --output-dir ./MarkTwain \
        --delay 1.5 \
        --with-text --with-metadata

Outputs:
    <output-dir>/<Category>/<Title>.html         (always)
    <output-dir>/<Category>/<Title>.txt          (if --with-text)
    <output-dir>/<Category>/<Title>.meta.json    (if --with-metadata)
    <output-dir>/manifest.json                   (always)

The script is deliberately polite (default 1.5s between requests, identifying
User-Agent, exponential backoff on 429/503). Don't lower the delay or strip
the backoff -- Project Gutenberg blocks aggressive crawlers.

Requires:
    pip install requests beautifulsoup4
"""

from __future__ import annotations

import argparse
import json
import re
import os
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup, NavigableString, Tag
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

USER_AGENT = f"gutenberg-archive/1.0 - personal offline library ({CONTACT_EMAIL})"
DEFAULT_DELAY = 1.5
DEFAULT_SOURCE_TAG = "project-gutenberg"
BACKOFF_SCHEDULE = (30, 60, 120)
REQUEST_TIMEOUT = 30

PG_ID_PATTERNS = (
    re.compile(r"/files/(\d+)/"),
    re.compile(r"/ebooks/(\d+)(?:[/?#]|$)"),
    re.compile(r"/cache/epub/(\d+)/"),
)

PG_HEADER_START = re.compile(r"\*\*\*\s*START OF (?:THE |THIS )?PROJECT GUTENBERG EBOOK")
PG_HEADER_END = re.compile(r"\*\*\*\s*END OF (?:THE |THIS )?PROJECT GUTENBERG EBOOK")


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class Work:
    pg_id: str
    title: str
    primary_url: str
    fallback_url: str
    category: str
    filename: str

    def output_path(self, output_dir: Path) -> Path:
        return output_dir / self.category / f"{self.filename}.html"


@dataclass
class DownloadResult:
    pg_id: str
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
# Sanitization helpers
# ---------------------------------------------------------------------------


_TITLE_BAD_CHARS = re.compile(r"[^\w\s\-']", re.UNICODE)
_MULTI_WS = re.compile(r"\s+")
_MD_EMPHASIS = re.compile(r"\*+|_+")


def sanitize_filename(title: str) -> str:
    t = title.strip()
    t = _MD_EMPHASIS.sub("", t)
    t = t.replace("/", "-").replace("\\", "-")
    t = _TITLE_BAD_CHARS.sub("", t)
    t = _MULTI_WS.sub(" ", t).strip()
    t = t.replace(" ", "-")
    t = re.sub(r"-+", "-", t).strip("-")
    return t or "untitled"


def sanitize_category(text: str) -> str:
    t = text.strip()
    t = _MD_EMPHASIS.sub("", t)
    t = _TITLE_BAD_CHARS.sub("", t)
    t = _MULTI_WS.sub(" ", t).strip()
    t = " ".join(word.capitalize() for word in t.split())
    t = t.replace(" ", "-")
    return t or "Uncategorized"


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------


def extract_pg_id(url: str) -> str | None:
    for pat in PG_ID_PATTERNS:
        m = pat.search(url)
        if m:
            return m.group(1)
    return None


def make_primary_url(pg_id: str) -> str:
    return f"https://www.gutenberg.org/files/{pg_id}/{pg_id}-h/{pg_id}-h.htm"


def make_fallback_url(pg_id: str) -> str:
    return f"https://www.gutenberg.org/cache/epub/{pg_id}/pg{pg_id}-images.html"


def is_gutenberg(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return host == "gutenberg.org" or host.endswith(".gutenberg.org")


def is_listing_url(url: str) -> bool:
    """True if the URL is a PG author or subject listing page."""
    path = urlparse(url).path
    return path.startswith("/ebooks/author/") or path.startswith("/ebooks/subject/")


# ---------------------------------------------------------------------------
# Parsing: Widger-style author index (h1..h4 + links)
# ---------------------------------------------------------------------------


_NOISE_TITLES = {"##", "[##]", "top", "back", "next", "previous", ""}


def parse_widger_index(html: str, base_url: str) -> list[Work]:
    soup = BeautifulSoup(html, "html.parser")
    root = soup.body or soup
    base_pg_id = extract_pg_id(base_url)

    current_category = "Uncategorized"
    seen_first_heading = False
    seen_ids: set[str] = set()
    works: list[Work] = []

    for element in root.descendants:
        if not isinstance(element, Tag):
            continue

        if element.name in ("h1", "h2", "h3", "h4"):
            heading_text = element.get_text(" ", strip=True)
            if not heading_text:
                continue
            if not seen_first_heading:
                seen_first_heading = True
                continue
            current_category = sanitize_category(heading_text)

        elif element.name == "a":
            href = (element.get("href") or "").strip()
            if not href or href.startswith("#"):
                continue
            abs_url = urljoin(base_url, href)
            if not is_gutenberg(abs_url):
                continue
            pg_id = extract_pg_id(abs_url)
            if not pg_id or pg_id == base_pg_id:
                continue
            if pg_id in seen_ids:
                continue
            title = element.get_text(" ", strip=True)
            if title.lower() in _NOISE_TITLES:
                continue
            works.append(
                Work(
                    pg_id=pg_id,
                    title=title,
                    primary_url=make_primary_url(pg_id),
                    fallback_url=make_fallback_url(pg_id),
                    category=current_category,
                    filename=sanitize_filename(title),
                )
            )
            seen_ids.add(pg_id)

    return _disambiguate(works)


# ---------------------------------------------------------------------------
# Parsing: PG author/subject listing pages (<li class="booklink"> + pagination)
# ---------------------------------------------------------------------------


def parse_listing_page(
    session: "PoliteSession", start_url: str
) -> list[Work]:
    """Walk a /ebooks/subject/<N> or /ebooks/author/<N> listing, following
    pagination. Returns all works across all pages."""
    seen_ids: set[str] = set()
    works: list[Work] = []
    url = start_url
    category = "Uncategorized"
    page_num = 0

    while url:
        page_num += 1
        if page_num > 1:
            print(f"    fetching listing page {page_num}: {url}")
        html = session.fetch_text(url)
        soup = BeautifulSoup(html, "html.parser")

        if page_num == 1:
            h1 = soup.find("h1")
            if h1:
                heading = h1.get_text(" ", strip=True)
                # Strip common prefixes like "Browse By Subject: " or "Books by ..."
                heading = re.sub(
                    r"^(books?|browse)( by)?( author| subject)?:?\s*",
                    "",
                    heading,
                    flags=re.IGNORECASE,
                )
                category = sanitize_category(heading)

        for li in soup.find_all("li", class_="booklink"):
            a = li.find("a", class_="link")
            if not a:
                continue
            href = (a.get("href") or "").strip()
            if not href:
                continue
            abs_url = urljoin(url, href)
            pg_id = extract_pg_id(abs_url)
            if not pg_id or pg_id in seen_ids:
                continue
            title_span = li.find("span", class_="title")
            title = (
                title_span.get_text(" ", strip=True)
                if title_span
                else a.get_text(" ", strip=True)
            )
            if not title:
                continue
            works.append(
                Work(
                    pg_id=pg_id,
                    title=title,
                    primary_url=make_primary_url(pg_id),
                    fallback_url=make_fallback_url(pg_id),
                    category=category,
                    filename=sanitize_filename(title),
                )
            )
            seen_ids.add(pg_id)

        # Find the "Next" pagination link. PG uses <a> with text "Next" or
        # rel="next" inside a navigation div.
        next_link = soup.find("a", attrs={"rel": "next"})
        if not next_link:
            for a in soup.find_all("a"):
                txt = a.get_text(" ", strip=True).lower()
                if txt in ("next", "next page", "next >") or txt.startswith("next "):
                    next_link = a
                    break
        if next_link and next_link.get("href"):
            url = urljoin(url, next_link["href"])
        else:
            url = None

    return _disambiguate(works)


def _disambiguate(works: list[Work]) -> list[Work]:
    """Append PG ID to filenames that would otherwise collide in the same category."""
    by_path: dict[tuple[str, str], list[Work]] = {}
    for w in works:
        by_path.setdefault((w.category, w.filename), []).append(w)
    for group in by_path.values():
        if len(group) > 1:
            for w in group:
                w.filename = f"{w.filename}-{w.pg_id}"
    return works


# ---------------------------------------------------------------------------
# HTML -> text + metadata extraction
# ---------------------------------------------------------------------------


def html_to_plain_text(html: str) -> str:
    """Extract readable text from a PG book HTML, dropping PG boilerplate."""
    soup = BeautifulSoup(html, "html.parser")
    # Remove script and style nodes
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text("\n")
    # Collapse runs of blank lines
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    # Strip the PG license header/footer if present
    start = PG_HEADER_START.search(text)
    end = PG_HEADER_END.search(text)
    if start and end and end.start() > start.end():
        text = text[start.end() : end.start()]
    return text.strip() + "\n"


def parse_pg_header(html_text: str) -> dict[str, str]:
    """Pull Title/Author/Language/Release Date from the PG header block."""
    info: dict[str, str] = {}
    # The header is in the first ~3 KB; only look at the prefix.
    prefix = html_text[:8000]
    for key in ("Title", "Author", "Release Date", "Language", "Editor", "Translator"):
        m = re.search(
            rf"^\s*{key}\s*:\s*(.+)$", prefix, flags=re.MULTILINE | re.IGNORECASE
        )
        if m:
            info[key.lower().replace(" ", "_")] = m.group(1).strip()
    return info


# ---------------------------------------------------------------------------
# Polite fetching
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

    def fetch_bytes(self, url: str) -> tuple[bytes | None, str]:
        try:
            resp = self.get(url)
        except requests.RequestException as e:
            return None, str(e)
        if resp.status_code == 200:
            return resp.content, ""
        return None, f"HTTP {resp.status_code}"


# ---------------------------------------------------------------------------
# Download orchestration
# ---------------------------------------------------------------------------


def fetch_work(session: PoliteSession, work: Work) -> tuple[bytes | None, str, str]:
    body, err = session.fetch_bytes(work.primary_url)
    if body is not None:
        return body, work.primary_url, ""
    primary_err = err
    body, err = session.fetch_bytes(work.fallback_url)
    if body is not None:
        return body, work.fallback_url, ""
    return None, work.primary_url, f"primary: {primary_err}; fallback: {err}"


def write_sidecars(
    body: bytes,
    work: Work,
    out_path: Path,
    source_tag: str,
    source_url: str,
    with_text: bool,
    with_metadata: bool,
) -> tuple[str, int, str]:
    """Returns (text_path, bytes_text, meta_path)."""
    text_path = ""
    meta_path = ""
    bytes_text = 0
    html_text = body.decode("utf-8", errors="replace")

    plain_text = ""
    if with_text:
        plain_text = html_to_plain_text(html_text)
        text_file = out_path.with_suffix(".txt")
        text_file.write_text(plain_text, encoding="utf-8")
        text_path = str(text_file)
        bytes_text = len(plain_text.encode("utf-8"))

    if with_metadata:
        header = parse_pg_header(html_text)
        meta = {
            "id": f"pg-{work.pg_id}",
            "source": source_tag,
            "source_url": source_url,
            "title": header.get("title") or work.title,
            "author": header.get("author", ""),
            "release_date": header.get("release_date", ""),
            "language": header.get("language", ""),
            "category": work.category,
            "file": str(out_path),
            "text_file": text_path,
            "bytes_html": len(body),
            "bytes_text": bytes_text,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        meta_file = out_path.with_suffix(".meta.json")
        meta_file.write_text(
            json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        meta_path = str(meta_file)

    return text_path, bytes_text, meta_path


def print_plan(works: Iterable[Work]) -> None:
    print()
    by_cat: dict[str, list[Work]] = {}
    for w in works:
        by_cat.setdefault(w.category, []).append(w)
    for cat in sorted(by_cat):
        print(f"  {cat}/")
        for w in by_cat[cat]:
            print(f"    {w.filename}.html  (PG #{w.pg_id})")
    print()


def print_summary(results: list[DownloadResult], manifest_path: Path) -> None:
    by_cat: dict[str, list[DownloadResult]] = {}
    total_bytes = 0
    for r in results:
        by_cat.setdefault(r.category, []).append(r)
        total_bytes += r.bytes_written
    downloaded = sum(1 for r in results if r.status == "downloaded")
    skipped = sum(1 for r in results if r.status == "skipped_existing")
    failed = [r for r in results if r.status == "failed"]

    print()
    print(
        f"Saved {len(results) - len(failed)} works "
        f"({total_bytes / (1024 * 1024):.1f} MB)"
    )
    for cat in sorted(by_cat):
        ok = sum(1 for r in by_cat[cat] if r.status != "failed")
        print(f"  {cat:<28} {ok} works")
    print()
    print(f"Newly downloaded: {downloaded}")
    print(f"Skipped (already present): {skipped}")
    if failed:
        print(f"Failed ({len(failed)}):")
        for r in failed:
            print(f"  {r.source_url} -> {r.error}")
    print(f"Manifest: {manifest_path}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Download a slice of Project Gutenberg from any index page."
    )
    parser.add_argument("--index-url", required=True)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--with-text",
        action="store_true",
        help="Also write a .txt sidecar with plain text extracted from each HTML.",
    )
    parser.add_argument(
        "--with-metadata",
        action="store_true",
        help="Also write a .meta.json sidecar per item with the shared corpus schema.",
    )
    parser.add_argument(
        "--source-tag",
        default=DEFAULT_SOURCE_TAG,
        help=(
            f"Tag used in metadata sidecars to identify the source "
            f"(default: {DEFAULT_SOURCE_TAG})."
        ),
    )
    args = parser.parse_args(argv)

    session = PoliteSession(delay=args.delay)

    print(f"Fetching index: {args.index_url}")
    if is_listing_url(args.index_url):
        works = parse_listing_page(session, args.index_url)
    else:
        try:
            index_html = session.fetch_text(args.index_url)
        except Exception as e:
            print(f"Failed to fetch index: {e}", file=sys.stderr)
            return 1
        works = parse_widger_index(index_html, args.index_url)

    categories = sorted({w.category for w in works})
    print(
        f"Parsed {len(works)} works across {len(categories)} categories: {categories}"
    )

    if args.dry_run:
        print_plan(works)
        return 0

    args.output_dir.mkdir(parents=True, exist_ok=True)

    results: list[DownloadResult] = []
    for i, work in enumerate(works, 1):
        rel = f"{work.category}/{work.filename}.html"
        print(f"[{i:>3}/{len(works)}] {rel}")
        out_path = work.output_path(args.output_dir)
        if out_path.exists():
            print("    skip (already present)")
            text_path = ""
            meta_path = ""
            if args.with_text and out_path.with_suffix(".txt").exists():
                text_path = str(out_path.with_suffix(".txt"))
            if args.with_metadata and out_path.with_suffix(".meta.json").exists():
                meta_path = str(out_path.with_suffix(".meta.json"))
            results.append(
                DownloadResult(
                    pg_id=work.pg_id,
                    title=work.title,
                    category=work.category,
                    source_url=work.primary_url,
                    output_path=str(out_path),
                    bytes_written=out_path.stat().st_size,
                    status="skipped_existing",
                    text_path=text_path,
                    meta_path=meta_path,
                )
            )
            continue

        body, used_url, err = fetch_work(session, work)
        if body is None:
            print(f"    FAIL ({err})")
            results.append(
                DownloadResult(
                    pg_id=work.pg_id,
                    title=work.title,
                    category=work.category,
                    source_url=used_url,
                    output_path=str(out_path),
                    bytes_written=0,
                    status="failed",
                    error=err,
                )
            )
            continue

        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(body)
        text_path, bytes_text, meta_path = write_sidecars(
            body=body,
            work=work,
            out_path=out_path,
            source_tag=args.source_tag,
            source_url=used_url,
            with_text=args.with_text,
            with_metadata=args.with_metadata,
        )
        extras = []
        if text_path:
            extras.append(f"{bytes_text:,}B txt")
        if meta_path:
            extras.append("meta")
        suffix = f" [+{', '.join(extras)}]" if extras else ""
        print(f"    saved ({len(body):,} bytes from {used_url}){suffix}")
        results.append(
            DownloadResult(
                pg_id=work.pg_id,
                title=work.title,
                category=work.category,
                source_url=used_url,
                output_path=str(out_path),
                bytes_written=len(body),
                bytes_text=bytes_text,
                status="downloaded",
                text_path=text_path,
                meta_path=meta_path,
                fetched_at=datetime.now(timezone.utc).isoformat(),
            )
        )

    manifest = {
        "index_url": args.index_url,
        "output_dir": str(args.output_dir),
        "source_tag": args.source_tag,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "user_agent": USER_AGENT,
        "delay_seconds": args.delay,
        "with_text": args.with_text,
        "with_metadata": args.with_metadata,
        "works": [asdict(r) for r in results],
    }
    manifest_path = args.output_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print_summary(results, manifest_path)
    return 0 if not any(r.status == "failed" for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
