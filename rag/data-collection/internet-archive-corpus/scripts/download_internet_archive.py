#!/usr/bin/env python3
"""Download a topical slice of Internet Archive's text holdings as a corpus.

For each item matching the query, downloads the best available plain-text
file (preferring DjVuTXT) and optionally the first PDF, plus a JSON metadata
sidecar in the shared corpus schema.

Usage:
    python download_internet_archive.py \
        --query 'subject:"Mark Twain" AND mediatype:texts AND date:[1900-01-01 TO 1928-12-31]' \
        --output-dir ./TwainCorpus/internet-archive \
        --max-items 200 \
        --with-metadata

Always run with --dry-run on a new query first to see how many items will hit
before committing. IA search will happily stream millions of results.

Requires:
    pip install internetarchive
"""

from __future__ import annotations

import argparse
import os
import json
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
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
    from internetarchive import get_item, search_items
except ImportError:
    print(
        "Missing dependency. Install with:\n"
        "    pip install internetarchive",
        file=sys.stderr,
    )
    sys.exit(2)

USER_AGENT = f"internet-archive-corpus/1.0 ({CONTACT_EMAIL})"
DEFAULT_DELAY = 1.0
DEFAULT_SOURCE_TAG = "internet-archive"
DEFAULT_MAX_ITEMS = 100

# Preferred text formats, in order
TEXT_FORMAT_PREFERENCES = ("DjVuTXT", "Plain Text", "Text", "Abbyy GZ")
PDF_FORMAT_PREFERENCES = ("Text PDF", "Image Container PDF", "PDF")


@dataclass
class DownloadResult:
    identifier: str
    title: str
    source_url: str
    output_dir: str
    text_file: str = ""
    pdf_file: str = ""
    meta_file: str = ""
    bytes_text: int = 0
    bytes_pdf: int = 0
    status: str = "downloaded"   # "downloaded" | "skipped_existing" | "skipped_no_text" | "skipped_restricted" | "failed"
    format_used: str = ""
    error: str = ""
    fetched_at: str = ""


def pick_file(files: list[dict], preferences: tuple[str, ...]) -> dict | None:
    """Pick the best file from an item's file list, by format preference."""
    by_format: dict[str, dict] = {}
    for f in files:
        fmt = f.get("format", "")
        if fmt and fmt not in by_format:
            by_format[fmt] = f
    for pref in preferences:
        if pref in by_format:
            return by_format[pref]
    # Fallback: any file whose name suggests it
    if preferences == TEXT_FORMAT_PREFERENCES:
        for f in files:
            name = f.get("name", "").lower()
            if name.endswith(".txt"):
                return f
    elif preferences == PDF_FORMAT_PREFERENCES:
        for f in files:
            name = f.get("name", "").lower()
            if name.endswith(".pdf"):
                return f
    return None


def download_file(item, file_name: str, dest: Path) -> int | None:
    """Download a single file from an IA item to dest. Returns size in bytes or None on failure."""
    try:
        # Use the IA library's download method on a single file
        item.download(
            files=[file_name],
            destdir=str(dest.parent.parent),  # IA library re-creates identifier folder
            ignore_existing=False,
            retries=3,
            no_directory=False,
            verbose=False,
        )
    except Exception as e:
        print(f"    download error: {e}")
        return None
    # The library puts the file at <destdir>/<identifier>/<file_name>
    final = dest.parent / file_name
    if not final.exists():
        return None
    if final != dest:
        final.rename(dest)
    return dest.stat().st_size


def build_metadata(
    item, identifier: str, source_url: str, source_tag: str,
    text_relpath: str, pdf_relpath: str,
    bytes_text: int, bytes_pdf: int, format_used: str,
) -> dict:
    md = item.metadata or {}

    def as_list(v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        return [v]

    return {
        "id": f"internet-archive-{identifier}",
        "source": source_tag,
        "source_url": source_url,
        "title": md.get("title", ""),
        "author": md.get("creator", ""),
        "publisher": md.get("publisher", ""),
        "date": md.get("date", ""),
        "language": md.get("language", ""),
        "subjects": as_list(md.get("subject")),
        "ia_collection": as_list(md.get("collection")),
        "ia_mediatype": md.get("mediatype", ""),
        "ia_format_used": format_used,
        "category": "internet-archive",
        "file": pdf_relpath,
        "text_file": text_relpath,
        "bytes_text": bytes_text,
        "bytes_pdf": bytes_pdf,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def process_item(
    identifier: str,
    output_dir: Path,
    source_tag: str,
    with_pdf: bool,
    with_metadata: bool,
) -> DownloadResult:
    item_dir = output_dir / identifier
    source_url = f"https://archive.org/details/{identifier}"

    try:
        item = get_item(identifier)
    except Exception as e:
        return DownloadResult(
            identifier=identifier, title="", source_url=source_url,
            output_dir=str(item_dir), status="failed", error=f"get_item: {e}",
        )

    md = item.metadata or {}
    title = md.get("title", "")

    # Restricted-access check
    if md.get("access-restricted") == "true" or md.get("access-restricted-item") == "true":
        return DownloadResult(
            identifier=identifier, title=title, source_url=source_url,
            output_dir=str(item_dir), status="skipped_restricted",
            error="item is access-restricted",
        )

    files = item.files or []
    text_file_info = pick_file(files, TEXT_FORMAT_PREFERENCES)
    if not text_file_info and not with_pdf:
        return DownloadResult(
            identifier=identifier, title=title, source_url=source_url,
            output_dir=str(item_dir), status="skipped_no_text",
            error="no text format available",
        )

    item_dir.mkdir(parents=True, exist_ok=True)

    text_relpath = ""
    bytes_text = 0
    format_used = ""
    if text_file_info:
        text_name = text_file_info["name"]
        text_dest = item_dir / f"{identifier}.txt"
        if text_dest.exists():
            bytes_text = text_dest.stat().st_size
            format_used = text_file_info.get("format", "")
            text_relpath = str(text_dest.relative_to(output_dir))
        else:
            # Download to its native name first, then rename
            try:
                item.download(
                    files=[text_name],
                    destdir=str(output_dir),
                    ignore_existing=False,
                    retries=3,
                    no_directory=False,
                    verbose=False,
                )
            except Exception as e:
                return DownloadResult(
                    identifier=identifier, title=title, source_url=source_url,
                    output_dir=str(item_dir), status="failed",
                    error=f"text download: {e}",
                )
            downloaded = item_dir / text_name
            if downloaded.exists():
                if downloaded != text_dest:
                    downloaded.rename(text_dest)
                bytes_text = text_dest.stat().st_size
                format_used = text_file_info.get("format", "")
                text_relpath = str(text_dest.relative_to(output_dir))

    pdf_relpath = ""
    bytes_pdf = 0
    if with_pdf:
        pdf_file_info = pick_file(files, PDF_FORMAT_PREFERENCES)
        if pdf_file_info:
            pdf_name = pdf_file_info["name"]
            pdf_dest = item_dir / f"{identifier}.pdf"
            if pdf_dest.exists():
                bytes_pdf = pdf_dest.stat().st_size
                pdf_relpath = str(pdf_dest.relative_to(output_dir))
            else:
                try:
                    item.download(
                        files=[pdf_name],
                        destdir=str(output_dir),
                        ignore_existing=False,
                        retries=3,
                        no_directory=False,
                        verbose=False,
                    )
                except Exception as e:
                    print(f"    pdf download error (continuing): {e}")
                else:
                    downloaded = item_dir / pdf_name
                    if downloaded.exists():
                        if downloaded != pdf_dest:
                            downloaded.rename(pdf_dest)
                        bytes_pdf = pdf_dest.stat().st_size
                        pdf_relpath = str(pdf_dest.relative_to(output_dir))

    result = DownloadResult(
        identifier=identifier,
        title=title,
        source_url=source_url,
        output_dir=str(item_dir),
        text_file=text_relpath,
        pdf_file=pdf_relpath,
        bytes_text=bytes_text,
        bytes_pdf=bytes_pdf,
        status="downloaded",
        format_used=format_used,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )

    if with_metadata:
        meta = build_metadata(
            item, identifier, source_url, source_tag,
            text_relpath, pdf_relpath, bytes_text, bytes_pdf, format_used,
        )
        meta_dest = item_dir / f"{identifier}.meta.json"
        meta_dest.write_text(
            json.dumps(meta, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        result.meta_file = str(meta_dest.relative_to(output_dir))

    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Download a topical slice of Internet Archive's text holdings."
    )
    parser.add_argument("--query", required=True,
                        help='IA search query, e.g. \'subject:"Mark Twain" AND mediatype:texts\'')
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--max-items", type=int, default=DEFAULT_MAX_ITEMS,
                        help=f"Hard cap on items downloaded (default: {DEFAULT_MAX_ITEMS}).")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY,
                        help="Seconds between items (default: 1.0).")
    parser.add_argument("--with-pdf", action="store_true",
                        help="Also download the first PDF per item (large).")
    parser.add_argument("--with-metadata", action="store_true",
                        help="Write a .meta.json sidecar per item.")
    parser.add_argument("--source-tag", default=DEFAULT_SOURCE_TAG)
    parser.add_argument("--dry-run", action="store_true",
                        help="Print the identifiers that would be downloaded; don't fetch.")
    args = parser.parse_args(argv)

    print(f"Querying IA: {args.query}")
    print(f"Cap: {args.max_items} items")
    print()

    # Enumerate identifiers
    identifiers: list[str] = []
    try:
        for i, r in enumerate(search_items(args.query, fields=["identifier", "title"])):
            if i >= args.max_items:
                print(f"...stopped at --max-items={args.max_items}")
                break
            identifiers.append(r["identifier"])
    except Exception as e:
        print(f"Search failed: {e}", file=sys.stderr)
        return 1

    print(f"Found {len(identifiers)} items.")
    if args.dry_run:
        for ident in identifiers:
            print(f"  {ident}  -- https://archive.org/details/{ident}")
        return 0

    args.output_dir.mkdir(parents=True, exist_ok=True)
    results: list[DownloadResult] = []

    for i, ident in enumerate(identifiers, 1):
        print(f"[{i:>3}/{len(identifiers)}] {ident}")

        # Pace
        if i > 1:
            time.sleep(args.delay)

        item_dir = args.output_dir / ident
        text_dest = item_dir / f"{ident}.txt"
        if text_dest.exists() and not args.with_pdf:
            print("    skip (already present)")
            results.append(
                DownloadResult(
                    identifier=ident, title="",
                    source_url=f"https://archive.org/details/{ident}",
                    output_dir=str(item_dir),
                    text_file=str(text_dest.relative_to(args.output_dir)),
                    bytes_text=text_dest.stat().st_size,
                    status="skipped_existing",
                )
            )
            continue

        result = process_item(
            ident, args.output_dir, args.source_tag,
            args.with_pdf, args.with_metadata,
        )
        if result.status == "downloaded":
            size_parts = []
            if result.bytes_text:
                size_parts.append(f"{result.bytes_text/1024:.0f}KB txt")
            if result.bytes_pdf:
                size_parts.append(f"{result.bytes_pdf/(1024*1024):.1f}MB pdf")
            print(f"    saved ({', '.join(size_parts) or 'no files'})")
        elif result.status == "skipped_restricted":
            print(f"    skip (restricted)")
        elif result.status == "skipped_no_text":
            print(f"    skip (no text format)")
        elif result.status == "failed":
            print(f"    FAIL ({result.error})")
        results.append(result)

    manifest = {
        "query": args.query,
        "output_dir": str(args.output_dir),
        "source_tag": args.source_tag,
        "max_items": args.max_items,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "with_pdf": args.with_pdf,
        "with_metadata": args.with_metadata,
        "items": [asdict(r) for r in results],
    }
    manifest_path = args.output_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    downloaded = sum(1 for r in results if r.status == "downloaded")
    skipped_existing = sum(1 for r in results if r.status == "skipped_existing")
    skipped_restricted = sum(1 for r in results if r.status == "skipped_restricted")
    skipped_no_text = sum(1 for r in results if r.status == "skipped_no_text")
    failed = [r for r in results if r.status == "failed"]
    total_text_mb = sum(r.bytes_text for r in results) / (1024 * 1024)
    total_pdf_mb = sum(r.bytes_pdf for r in results) / (1024 * 1024)

    print()
    print(f"Downloaded {downloaded} items ({total_text_mb:.1f} MB text, "
          f"{total_pdf_mb:.1f} MB pdf) to {args.output_dir}")
    print(f"  skipped (already present):  {skipped_existing}")
    print(f"  skipped (access restricted): {skipped_restricted}")
    print(f"  skipped (no text format):   {skipped_no_text}")
    if failed:
        print(f"  failed ({len(failed)}):")
        for r in failed:
            print(f"    {r.identifier} -> {r.error}")
    print(f"Manifest: {manifest_path}")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
