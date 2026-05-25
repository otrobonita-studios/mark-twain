#!/usr/bin/env python3
"""Download a slice of Wikisource starting from a category OR an Author page section.

Two entry modes:

1. --category "Category:Works about Mark Twain"
   Walks a Wikisource category (with subcategory recursion up to --max-depth)
   and downloads every page member.

2. --author-page "Author:Mark Twain"
   Wikisource often catalogues works ABOUT an author not in a category but in
   a "Works about <Author>" section on the author's own page. This mode fetches
   the Author page, finds the "Works about ..." section (override the match
   with --section), extracts every internal page link from it, and downloads
   each. This is the right path for most Wikisource "works about" use cases.

Each downloaded page becomes HTML plus optional plain-text and metadata
sidecars in the shared corpus schema. Subpages of multi-chapter works are
followed when --follow-subpages is on (the default).

Usage:
    python download_wikisource.py \
        --author-page "Author:Mark Twain" \
        --output-dir ./TwainCorpus/wikisource \
        --with-text --with-metadata

    python download_wikisource.py \
        --category "Category:Some Category That Exists" \
        --output-dir ./TwainCorpus/wikisource \
        --with-text --with-metadata

CONTACT_EMAIL comes from .env.local (CONTACT_EMAIL=you@example.com).

Requires:
    pip install requests beautifulsoup4
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, unquote

try:
    import requests
    from bs4 import BeautifulSoup
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

USER_AGENT = f"wikisource-archive/1.0 (https://github.com/your-org; +{CONTACT_EMAIL})"

DEFAULT_DELAY = 1.0
DEFAULT_SOURCE_TAG = "wikisource"
DEFAULT_SITE = "en.wikisource.org"
DEFAULT_MAX_DEPTH = 2
BACKOFF_SCHEDULE = (30, 60, 120)
REQUEST_TIMEOUT = 30

# Heuristic for "is this a table-of-contents page that I should recurse into"
TOC_WORD_THRESHOLD = 500
TOC_LINK_THRESHOLD = 20

# Namespaces that are never downloadable "works" — skip when extracting links
# from an Author page section.
_SKIP_NAMESPACE_PREFIXES = (
    "File:", "Image:", "Media:", "Category:", "Special:", "Help:",
    "Wikisource:", "Author:", "Portal:", "Template:", "Talk:",
    "User:", "User talk:", "Page:", "Index:", "Translation:",
)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class DownloadResult:
    title: str
    page_id: int
    source_url: str
    output_path: str
    bytes_html: int
    status: str
    text_path: str = ""
    meta_path: str = ""
    bytes_text: int = 0
    category: str = ""
    is_subpage: bool = False
    error: str = ""
    fetched_at: str = ""


# ---------------------------------------------------------------------------
# Sanitization
# ---------------------------------------------------------------------------


_BAD = re.compile(r"[^\w\s\-']", re.UNICODE)
_WS = re.compile(r"\s+")


def sanitize_filename(title: str) -> str:
    t = title.strip().replace("/", "-").replace("\\", "-")
    t = _BAD.sub("", t)
    t = _WS.sub(" ", t).strip()
    t = t.replace(" ", "-")
    t = re.sub(r"-+", "-", t).strip("-")
    return t or "untitled"


def sanitize_category(text: str) -> str:
    t = text.strip()
    t = re.sub(r"^Category:", "", t, flags=re.IGNORECASE)
    t = _BAD.sub("", t)
    t = _WS.sub(" ", t).strip()
    t = " ".join(w.capitalize() for w in t.split())
    return t.replace(" ", "-") or "Uncategorized"


# ---------------------------------------------------------------------------
# Polite API client
# ---------------------------------------------------------------------------


class PoliteSession:
    def __init__(self, delay: float):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        self._last_request_at = 0.0

    def get_json(self, url: str, params: dict) -> dict:
        elapsed = time.monotonic() - self._last_request_at
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        for attempt, backoff in enumerate([0, *BACKOFF_SCHEDULE]):
            if backoff:
                print(f"    backing off {backoff}s (attempt {attempt + 1})")
                time.sleep(backoff)
            try:
                resp = self.session.get(url, params=params, timeout=REQUEST_TIMEOUT)
            except requests.RequestException as e:
                if attempt == len(BACKOFF_SCHEDULE):
                    raise
                print(f"    request error: {e}")
                continue
            self._last_request_at = time.monotonic()
            if resp.status_code in (429, 503) and attempt < len(BACKOFF_SCHEDULE):
                continue
            resp.raise_for_status()
            return resp.json()
        return {}  # unreachable


def api_url(site: str) -> str:
    return f"https://{site}/w/api.php"


def page_url(site: str, title: str) -> str:
    return f"https://{site}/wiki/{quote(title.replace(' ', '_'), safe='/:')}"


# ---------------------------------------------------------------------------
# Category enumeration (with subcat recursion)
# ---------------------------------------------------------------------------


def enumerate_category(
    session: PoliteSession,
    site: str,
    category: str,
    max_depth: int,
    _depth: int = 0,
    _visited_cats: set | None = None,
) -> list[str]:
    if _visited_cats is None:
        _visited_cats = set()
    if category in _visited_cats:
        return []
    _visited_cats.add(category)

    if not category.startswith("Category:"):
        category = "Category:" + category

    pages: list[str] = []
    cont: dict = {}
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": category,
            "cmtype": "page|subcat",
            "cmlimit": 500,
            "format": "json",
            "formatversion": 2,
        }
        params.update(cont)
        data = session.get_json(api_url(site), params)
        for m in data.get("query", {}).get("categorymembers", []):
            ns = m.get("ns", 0)
            title = m["title"]
            if ns == 14:  # Category namespace
                if _depth + 1 <= max_depth:
                    pages.extend(
                        enumerate_category(
                            session, site, title, max_depth, _depth + 1, _visited_cats
                        )
                    )
            else:
                pages.append(title)
        if "continue" in data:
            cont = data["continue"]
        else:
            break
    return pages


# ---------------------------------------------------------------------------
# Author-page section enumeration (NEW)
# ---------------------------------------------------------------------------


def fetch_sections(session: PoliteSession, site: str, title: str) -> list[dict]:
    """Return the list of section descriptors for a page (via action=parse&prop=sections)."""
    params = {
        "action": "parse",
        "page": title,
        "prop": "sections",
        "format": "json",
        "formatversion": 2,
        "redirects": 1,
    }
    data = session.get_json(api_url(site), params)
    if "error" in data:
        return []
    return data.get("parse", {}).get("sections", [])


def find_about_section(sections: list[dict], hint: str | None) -> dict | None:
    """Pick the section that matches the user's hint (exact, case-insensitive),
    or the first section whose name starts with 'Works about'."""
    if hint:
        h = hint.strip().lower()
        for s in sections:
            if s.get("line", "").strip().lower() == h:
                return s
        for s in sections:
            if h in s.get("line", "").strip().lower():
                return s
    for s in sections:
        line = s.get("line", "").strip().lower()
        if line.startswith("works about") or line.startswith("about "):
            return s
    return None


def fetch_section_html(
    session: PoliteSession, site: str, title: str, section_index: str
) -> str:
    """Fetch the HTML of a single section by its API-reported index."""
    params = {
        "action": "parse",
        "page": title,
        "section": section_index,
        "prop": "text",
        "format": "json",
        "formatversion": 2,
        "redirects": 1,
    }
    data = session.get_json(api_url(site), params)
    parse = data.get("parse", {})
    text = parse.get("text", "")
    if isinstance(text, dict):
        text = text.get("*", "")
    return text


def extract_internal_page_titles(section_html: str) -> list[str]:
    """Pull /wiki/<Title> links from a section's HTML, skipping namespace and
    self/anchor links."""
    soup = BeautifulSoup(section_html, "html.parser")
    titles: list[str] = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not href.startswith("/wiki/"):
            continue
        page = href[len("/wiki/"):]
        page = unquote(page).replace("_", " ")
        if "#" in page:
            page = page.split("#", 1)[0]
        page = page.strip()
        if not page or page in seen:
            continue
        if page.startswith(_SKIP_NAMESPACE_PREFIXES):
            continue
        # Skip "redlinks" — pages that don't exist yet
        if "class" in a.attrs and "new" in a["class"]:
            continue
        titles.append(page)
        seen.add(page)
    return titles


# ---------------------------------------------------------------------------
# Subpage discovery (for multi-chapter works)
# ---------------------------------------------------------------------------


def find_subpages(session: PoliteSession, site: str, title: str) -> list[str]:
    pages: list[str] = []
    cont: dict = {}
    while True:
        params = {
            "action": "query",
            "list": "allpages",
            "apprefix": title + "/",
            "aplimit": 500,
            "apnamespace": 0,
            "format": "json",
            "formatversion": 2,
        }
        params.update(cont)
        data = session.get_json(api_url(site), params)
        for p in data.get("query", {}).get("allpages", []):
            pages.append(p["title"])
        if "continue" in data:
            cont = data["continue"]
        else:
            break
    return pages


# ---------------------------------------------------------------------------
# Page fetch + HTML cleaning
# ---------------------------------------------------------------------------


def fetch_page(session: PoliteSession, site: str, title: str) -> dict | None:
    params = {
        "action": "parse",
        "page": title,
        "prop": "text|displaytitle|categories|revid",
        "format": "json",
        "formatversion": 2,
        "redirects": 1,
    }
    try:
        data = session.get_json(api_url(site), params)
    except Exception as e:
        print(f"    fetch error: {e}")
        return None
    if "error" in data:
        print(f"    API error: {data['error'].get('info', '?')}")
        return None
    return data.get("parse")


def get_html(parse: dict) -> str:
    text_field = parse.get("text", "")
    if isinstance(text_field, dict):
        return text_field.get("*", "")
    return text_field


_CLEAN_CLASSES = ("mw-editsection", "navbar", "toc", "noprint", "mw-redirectedfrom")


def clean_soup(soup: BeautifulSoup) -> BeautifulSoup:
    for cls in _CLEAN_CLASSES:
        for el in soup.find_all(class_=cls):
            el.decompose()
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return soup


def is_toc_page(html: str) -> bool:
    soup = clean_soup(BeautifulSoup(html, "html.parser"))
    text = soup.get_text(" ", strip=True)
    words = len(text.split())
    links = len(soup.find_all("a"))
    return words < TOC_WORD_THRESHOLD and links > TOC_LINK_THRESHOLD


def html_to_text(html: str) -> str:
    soup = clean_soup(BeautifulSoup(html, "html.parser"))
    text = soup.get_text("\n")
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return text.strip() + "\n"


def render_clean_html(html: str, title: str) -> str:
    soup = clean_soup(BeautifulSoup(html, "html.parser"))
    body_html = str(soup)
    return (
        "<!DOCTYPE html>\n"
        "<html><head>"
        f"<meta charset='utf-8'><title>{title}</title>"
        "</head><body>\n"
        f"{body_html}\n"
        "</body></html>\n"
    )


def extract_author(parse: dict) -> str:
    cats = [c.get("*", "") if isinstance(c, dict) else c.get("title", "")
            for c in parse.get("categories", [])]
    for cat in cats:
        m = re.search(r"(?:Works by|Authored by) (.+?)(?:$|/)", cat)
        if m:
            return m.group(1).strip()
    return ""


# ---------------------------------------------------------------------------
# Output writer
# ---------------------------------------------------------------------------


def write_outputs(
    parse: dict,
    title: str,
    out_dir: Path,
    category_folder: str,
    is_subpage: bool,
    site: str,
    source_tag: str,
    with_text: bool,
    with_metadata: bool,
) -> DownloadResult:
    html_raw = get_html(parse)
    if not html_raw:
        return DownloadResult(
            title=title, page_id=parse.get("pageid", 0),
            source_url=page_url(site, title), output_path="",
            bytes_html=0, status="failed", error="empty HTML from API",
            category=category_folder, is_subpage=is_subpage,
        )

    fname = sanitize_filename(title)
    out_path = out_dir / category_folder / f"{fname}.html"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    html_doc = render_clean_html(html_raw, title)
    out_path.write_text(html_doc, encoding="utf-8")
    bytes_html = len(html_doc.encode("utf-8"))

    text_path = ""
    bytes_text = 0
    if with_text:
        text = html_to_text(html_raw)
        text_file = out_path.with_suffix(".txt")
        text_file.write_text(text, encoding="utf-8")
        text_path = str(text_file)
        bytes_text = len(text.encode("utf-8"))

    meta_path = ""
    if with_metadata:
        cats = [(c.get("*", "") if isinstance(c, dict) else c.get("title", ""))
                for c in parse.get("categories", [])]
        meta = {
            "id": f"wikisource-{site.split('.')[0]}-{title.replace(' ', '_')}",
            "source": source_tag,
            "source_url": page_url(site, title),
            "title": parse.get("displaytitle", title),
            "author": extract_author(parse),
            "categories": cats,
            "wiki_site": site,
            "page_id": parse.get("pageid", 0),
            "revision_id": parse.get("revid", 0),
            "language": site.split(".")[0],
            "category": category_folder,
            "file": str(out_path),
            "text_file": text_path,
            "bytes_html": bytes_html,
            "bytes_text": bytes_text,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        meta_file = out_path.with_suffix(".meta.json")
        meta_file.write_text(json.dumps(meta, indent=2, ensure_ascii=False),
                             encoding="utf-8")
        meta_path = str(meta_file)

    return DownloadResult(
        title=title, page_id=parse.get("pageid", 0),
        source_url=page_url(site, title), output_path=str(out_path),
        bytes_html=bytes_html, status="downloaded",
        text_path=text_path, meta_path=meta_path, bytes_text=bytes_text,
        category=category_folder, is_subpage=is_subpage,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Download a slice of Wikisource from a category or an Author page section."
    )
    src_group = parser.add_mutually_exclusive_group(required=True)
    src_group.add_argument(
        "--category",
        help='Category title, e.g. "Category:Works about Mark Twain".',
    )
    src_group.add_argument(
        "--author-page",
        dest="author_page",
        help='Author page title, e.g. "Author:Mark Twain". The script will find a '
             '"Works about ..." section on the page (override with --section).',
    )
    parser.add_argument(
        "--section",
        default=None,
        help='When using --author-page: section name to extract links from '
             '(default: first section starting with "Works about" or "About ").',
    )
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--site", default=DEFAULT_SITE)
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY)
    parser.add_argument("--max-depth", type=int, default=DEFAULT_MAX_DEPTH,
                        help="How deep to recurse into subcategories "
                             "(category mode only).")
    parser.add_argument("--follow-subpages", action=argparse.BooleanOptionalAction,
                        default=None,
                        help="Recurse into subpages of multi-chapter works. "
                             "Default: True in --category mode, False in "
                             "--author-page mode (because the section's link list "
                             "is already item-specific and parent pages on Wikisource "
                             "are often huge TOCs like entire encyclopedias).")
    parser.add_argument("--with-text", action="store_true")
    parser.add_argument("--with-metadata", action="store_true")
    parser.add_argument("--source-tag", default=DEFAULT_SOURCE_TAG)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    # Mode-aware default for follow_subpages: off for author-page mode
    # (the section is already curated; parent pages may be giant TOCs),
    # on for category mode (where multi-chapter works really do want recursion).
    if args.follow_subpages is None:
        args.follow_subpages = not bool(args.author_page)
    print(f"follow_subpages = {args.follow_subpages}")

    session = PoliteSession(delay=args.delay)

    # Resolve the input mode and produce a (pages, category_folder) pair.
    if args.author_page:
        print(f"Fetching sections of: {args.author_page} (site={args.site})")
        sections = fetch_sections(session, args.site, args.author_page)
        if not sections:
            print(f"No sections found on {args.author_page}.", file=sys.stderr)
            print("Page may not exist or may have no headings.", file=sys.stderr)
            return 1
        section = find_about_section(sections, args.section)
        if not section:
            print("No 'Works about' section found.", file=sys.stderr)
            print("Available sections on this page:", file=sys.stderr)
            for s in sections:
                print(f"  [{s.get('index', '?')}] {s.get('line', '')!r}",
                      file=sys.stderr)
            print("Try --section \"<exact section name>\".", file=sys.stderr)
            return 1
        print(f"Using section: {section.get('line', '')!r} "
              f"(index {section.get('index')})")
        section_html = fetch_section_html(
            session, args.site, args.author_page, section["index"]
        )
        pages = extract_internal_page_titles(section_html)
        category_folder = sanitize_category(section.get("line", "Uncategorized"))
        if not pages:
            print(f"No internal page links found in section "
                  f"{section.get('line', '')!r}.", file=sys.stderr)
            return 1
    else:
        print(f"Enumerating category: {args.category} "
              f"(site={args.site}, depth={args.max_depth})")
        pages = enumerate_category(session, args.site, args.category, args.max_depth)
        category_folder = sanitize_category(args.category)

    pages = sorted(set(pages))
    print(f"Found {len(pages)} pages. Category folder: {category_folder!r}")

    if args.dry_run:
        for p in pages:
            print(f"  {p}")
        return 0

    args.output_dir.mkdir(parents=True, exist_ok=True)
    results: list[DownloadResult] = []
    seen_titles: set[str] = set()

    for i, title in enumerate(pages, 1):
        if title in seen_titles:
            continue
        seen_titles.add(title)

        out_path = (args.output_dir / category_folder
                    / f"{sanitize_filename(title)}.html")
        rel = f"{category_folder}/{out_path.name}"
        print(f"[{i:>3}/{len(pages)}] {rel}")
        if out_path.exists():
            print("    skip (already present)")
            results.append(
                DownloadResult(
                    title=title, page_id=0,
                    source_url=page_url(args.site, title),
                    output_path=str(out_path),
                    bytes_html=out_path.stat().st_size,
                    status="skipped_existing", category=category_folder,
                )
            )
            continue

        parse = fetch_page(session, args.site, title)
        if parse is None:
            print("    FAIL")
            results.append(
                DownloadResult(
                    title=title, page_id=0,
                    source_url=page_url(args.site, title),
                    output_path="", bytes_html=0, status="failed",
                    error="fetch failed", category=category_folder,
                )
            )
            continue

        html_raw = get_html(parse)
        if args.follow_subpages and is_toc_page(html_raw):
            subs = find_subpages(session, args.site, title)
            if subs:
                print(f"    TOC -> recursing into {len(subs)} subpages")
                results.append(write_outputs(
                    parse, title, args.output_dir, category_folder, False,
                    args.site, args.source_tag,
                    args.with_text, args.with_metadata,
                ))
                for sub in subs:
                    if sub in seen_titles:
                        continue
                    seen_titles.add(sub)
                    print(f"    sub: {sub}")
                    sub_out = (args.output_dir / category_folder
                               / f"{sanitize_filename(sub)}.html")
                    if sub_out.exists():
                        print("        skip (already present)")
                        results.append(
                            DownloadResult(
                                title=sub, page_id=0,
                                source_url=page_url(args.site, sub),
                                output_path=str(sub_out),
                                bytes_html=sub_out.stat().st_size,
                                status="skipped_existing",
                                category=category_folder, is_subpage=True,
                            )
                        )
                        continue
                    sub_parse = fetch_page(session, args.site, sub)
                    if sub_parse is None:
                        results.append(
                            DownloadResult(
                                title=sub, page_id=0,
                                source_url=page_url(args.site, sub),
                                output_path="", bytes_html=0, status="failed",
                                error="fetch failed", category=category_folder,
                                is_subpage=True,
                            )
                        )
                        continue
                    results.append(write_outputs(
                        sub_parse, sub, args.output_dir, category_folder, True,
                        args.site, args.source_tag,
                        args.with_text, args.with_metadata,
                    ))
                continue

        results.append(write_outputs(
            parse, title, args.output_dir, category_folder, False,
            args.site, args.source_tag,
            args.with_text, args.with_metadata,
        ))

    manifest = {
        "mode": "author-page" if args.author_page else "category",
        "category": args.category,
        "author_page": args.author_page,
        "section": args.section,
        "site": args.site,
        "category_folder": category_folder,
        "output_dir": str(args.output_dir),
        "source_tag": args.source_tag,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "user_agent": USER_AGENT,
        "delay_seconds": args.delay,
        "with_text": args.with_text,
        "with_metadata": args.with_metadata,
        "max_depth": args.max_depth,
        "follow_subpages": args.follow_subpages,
        "items": [asdict(r) for r in results],
    }
    manifest_path = args.output_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    downloaded = sum(1 for r in results if r.status == "downloaded")
    skipped = sum(1 for r in results if r.status == "skipped_existing")
    failed = [r for r in results if r.status == "failed"]
    total_html = sum(r.bytes_html for r in results) / (1024 * 1024)
    total_text = sum(r.bytes_text for r in results) / (1024 * 1024)
    subpages = sum(1 for r in results if r.is_subpage)

    print()
    print(f"Saved {len(results) - len(failed)} pages "
          f"({total_html:.1f} MB HTML, {total_text:.1f} MB text) to {args.output_dir}")
    print(f"  {category_folder}/  ({len(results) - len(failed)} pages, "
          f"{subpages} subpage chapters)")
    print()
    print(f"Newly downloaded: {downloaded}")
    print(f"Skipped (already present): {skipped}")
    if failed:
        print(f"Failed ({len(failed)}):")
        for r in failed:
            print(f"  {r.title} -> {r.error}")
    print(f"Manifest: {manifest_path}")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
