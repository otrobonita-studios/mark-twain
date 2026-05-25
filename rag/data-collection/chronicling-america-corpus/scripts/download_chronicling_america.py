#!/usr/bin/env python3
"""Download newspaper-page mentions from Chronicling America (LoC).

For each search result, saves the page's OCR text and a JSON metadata sidecar.
The search API returns OCR text inline, so one HTTP call per ~20 results
covers everything -- no per-item fetch.

Usage:
    python download_chronicling_america.py \
        --query "mark twain" \
        --output-dir ./TwainCorpus/chronicling-america \
        --date1 1865 --date2 1910 \
        --max-items 500 \
        --with-metadata

Always set --max-items. The API will happily stream tens of thousands of hits
for a popular query.

Requires:
    pip install requests
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
import os
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

try:
    import requests
except ImportError:
    print(
        "Missing dependency. Install with:\n    pip install requests",
        file=sys.stderr,
    )
    sys.exit(2)

USER_AGENT = f"chronicling-america-corpus/1.0 ({CONTACT_EMAIL})"
SEARCH_URL = "https://www.loc.gov/collections/chronicling-america/search/"
DEFAULT_DELAY = 0.5
DEFAULT_MAX_ITEMS = 100
DEFAULT_SOURCE_TAG = "chronicling-america"
REQUEST_TIMEOUT = 30


@dataclass
class DownloadResult:
    id: str
    title: str
    date: str
    lccn: str
    page_sequence: int
    source_url: str
    text_file: str
    meta_file: str = ""
    bytes_text: int = 0
    status: str = "downloaded"   # "downloaded" | "skipped_existing" | "failed"
    error: str = ""


def fetch_search_page(
    session: requests.Session,
    query: str,
    page: int,
    date1: str | None,
    date2: str | None,
    state: str | None,
) -> dict:
    params: dict = {
        "andtext": query,
        "format": "json",
        "page": page,
        "rows": 20,
    }
    if date1 or date2:
        params["dateFilterType"] = "yearRange"
        if date1:
            params["date1"] = date1
        if date2:
            params["date2"] = date2
    if state:
        params["state"] = state
    resp = session.get(SEARCH_URL, params=params, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def build_filename(lccn: str, date: str, seq: int) -> str:
    safe_date = date.replace("/", "-")
    return f"{lccn}_{safe_date}_seq{seq}"


def year_from_date(date: str) -> str:
    m = re.match(r"(\d{4})", date)
    return m.group(1) if m else "unknown-year"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Download newspaper-page mentions from Chronicling America."
    )
    parser.add_argument("--query", required=True,
                        help="Search text, e.g. 'mark twain'.")
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--max-items", type=int, default=DEFAULT_MAX_ITEMS)
    parser.add_argument("--date1", default=None,
                        help="Start year (YYYY) or date (YYYY-MM-DD).")
    parser.add_argument("--date2", default=None,
                        help="End year (YYYY) or date (YYYY-MM-DD).")
    parser.add_argument("--state", default=None,
                        help="Full state name, e.g. \"New York\".")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY,
                        help="Seconds between search-result pages (default: 0.5).")
    parser.add_argument("--with-metadata", action="store_true")
    parser.add_argument("--source-tag", default=DEFAULT_SOURCE_TAG)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT

    print(f"Query: {args.query}")
    if args.date1 or args.date2:
        print(f"Date range: {args.date1 or '*'} to {args.date2 or '*'}")
    if args.state:
        print(f"State: {args.state}")
    print(f"Cap: {args.max_items} items")
    print()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    results: list[DownloadResult] = []
    fetched = 0
    page = 1
    total_in_search = 0

    while fetched < args.max_items:
        try:
            data = fetch_search_page(
                session, args.query, page, args.date1, args.date2, args.state
            )
        except Exception as e:
            print(f"Search call failed (page {page}): {e}", file=sys.stderr)
            return 1
        if page == 1:
            total_in_search = data.get("totalItems", 0)
            print(f"API reports {total_in_search:,} total matches.")
            if args.dry_run:
                print("(dry-run: showing identifiers only)")

        items = data.get("items", [])
        if not items:
            break

        for it in items:
            if fetched >= args.max_items:
                break
            lccn = it.get("lccn", "unknown")
            date = it.get("date", "unknown")
            seq = it.get("sequence", 0) or 0
            ocr_text = it.get("ocr_eng", "") or ""
            cleaned_date = date
            if re.match(r"^\d{8}$", date):
                cleaned_date = f"{date[:4]}-{date[4:6]}-{date[6:8]}"
            year = year_from_date(cleaned_date)
            base = build_filename(lccn, cleaned_date, seq)
            url = it.get("url") or it.get("id", "")
            if url and not url.startswith("http"):
                url = f"https://chroniclingamerica.loc.gov{url}"

            if args.dry_run:
                print(f"  {base}  -- {url}")
                fetched += 1
                continue

            year_dir = args.output_dir / year
            year_dir.mkdir(parents=True, exist_ok=True)
            text_path = year_dir / f"{base}.txt"
            meta_path = year_dir / f"{base}.meta.json"
            rel = text_path.relative_to(args.output_dir)

            if text_path.exists():
                results.append(
                    DownloadResult(
                        id=f"chronicling-america-{base}",
                        title=it.get("title", ""),
                        date=cleaned_date,
                        lccn=lccn,
                        page_sequence=seq,
                        source_url=url,
                        text_file=str(rel),
                        bytes_text=text_path.stat().st_size,
                        status="skipped_existing",
                    )
                )
                fetched += 1
                continue

            text_path.write_text(ocr_text, encoding="utf-8")
            bytes_text = len(ocr_text.encode("utf-8"))

            meta_rel = ""
            if args.with_metadata:
                meta = {
                    "id": f"chronicling-america-{base}",
                    "source": args.source_tag,
                    "source_url": url,
                    "title": it.get("title", ""),
                    "place_of_publication": it.get("place_of_publication", ""),
                    "date": cleaned_date,
                    "lccn": lccn,
                    "edition": it.get("edition", None),
                    "page_sequence": seq,
                    "subject": it.get("subject", []),
                    "language": (it.get("language") or ["eng"])[0]
                                if isinstance(it.get("language"), list)
                                else (it.get("language", "eng")),
                    "category": year,
                    "file": str(rel),
                    "bytes_text": bytes_text,
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                }
                meta_path.write_text(
                    json.dumps(meta, indent=2, ensure_ascii=False),
                    encoding="utf-8",
                )
                meta_rel = str(meta_path.relative_to(args.output_dir))

            results.append(
                DownloadResult(
                    id=f"chronicling-america-{base}",
                    title=it.get("title", ""),
                    date=cleaned_date,
                    lccn=lccn,
                    page_sequence=seq,
                    source_url=url,
                    text_file=str(rel),
                    meta_file=meta_rel,
                    bytes_text=bytes_text,
                    status="downloaded",
                )
            )
            fetched += 1
            if fetched % 20 == 0:
                print(f"  fetched {fetched}/{args.max_items}...")

        if args.dry_run and fetched >= args.max_items:
            break

        page += 1
        time.sleep(args.delay)

    if args.dry_run:
        return 0

    manifest = {
        "query": args.query,
        "date1": args.date1,
        "date2": args.date2,
        "state": args.state,
        "max_items": args.max_items,
        "total_in_search": total_in_search,
        "source_tag": args.source_tag,
        "output_dir": str(args.output_dir),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "with_metadata": args.with_metadata,
        "items": [asdict(r) for r in results],
    }
    manifest_path = args.output_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    downloaded = sum(1 for r in results if r.status == "downloaded")
    skipped = sum(1 for r in results if r.status == "skipped_existing")
    failed = [r for r in results if r.status == "failed"]
    total_mb = sum(r.bytes_text for r in results) / (1024 * 1024)

    by_year: dict[str, int] = {}
    for r in results:
        year = year_from_date(r.date)
        by_year[year] = by_year.get(year, 0) + 1

    print()
    print(f"Saved {downloaded} pages ({total_mb:.1f} MB OCR text) to {args.output_dir}")
    for year in sorted(by_year):
        print(f"  {year}/  {by_year[year]} pages")
    print(f"Newly downloaded: {downloaded}")
    print(f"Skipped (already present): {skipped}")
    if failed:
        print(f"Failed: {len(failed)}")
    print(f"Manifest: {manifest_path}")
    print()
    print(f"NOTE: results may include noise (ads, stray mentions, OCR errors).")
    print(f"      The API reported {total_in_search:,} total matches; you got {fetched}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
