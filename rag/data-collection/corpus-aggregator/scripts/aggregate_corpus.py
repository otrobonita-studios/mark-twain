#!/usr/bin/env python3
"""Walk a multi-source corpus directory and write a unified corpus.json index.

Designed to close out the workflow that runs the per-source skills
(gutenberg-archive, wikisource-archive, internet-archive-corpus,
chronicling-america-corpus). Each per-source skill writes:
  - <source>/manifest.json
  - <source>/.../<item>.meta.json   (one per item, shared schema)

This script unifies them into <corpus-dir>/corpus.json.

Usage:
    python aggregate_corpus.py \
        --corpus-dir ./TwainCorpus \
        --subject "Mark Twain" \
        --purpose "RAG retrieval index"

No third-party dependencies -- stdlib only.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


CORPUS_FILE = "corpus.json"
MANIFEST_FILE = "manifest.json"
META_SUFFIX = ".meta.json"


def find_meta_files(corpus_dir: Path) -> list[Path]:
    """All .meta.json files under corpus-dir, excluding any top-level corpus.json."""
    return [
        p for p in corpus_dir.rglob("*" + META_SUFFIX)
        if p.is_file() and p.name != CORPUS_FILE
    ]


def find_source_manifests(corpus_dir: Path) -> dict[str, Path]:
    """Return source_subdir_name -> manifest.json path for each source folder."""
    out: dict[str, Path] = {}
    for sub in sorted(corpus_dir.iterdir()):
        if not sub.is_dir():
            continue
        mf = sub / MANIFEST_FILE
        if mf.exists():
            out[sub.name] = mf
    return out


def load_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as e:
        print(f"  warning: failed to read {path}: {e}", file=sys.stderr)
        return None


def summarize_source(items: list[dict]) -> dict:
    out: dict = {"items": len(items)}
    bytes_text = sum(int(it.get("bytes_text") or 0) for it in items)
    bytes_html = sum(int(it.get("bytes_html") or 0) for it in items)
    bytes_pdf = sum(int(it.get("bytes_pdf") or 0) for it in items)
    if bytes_text:
        out["bytes_text"] = bytes_text
    if bytes_html:
        out["bytes_html"] = bytes_html
    if bytes_pdf:
        out["bytes_pdf"] = bytes_pdf
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Aggregate per-source corpus manifests into a unified corpus.json."
    )
    parser.add_argument("--corpus-dir", required=True, type=Path,
                        help="Top-level corpus directory containing per-source subfolders.")
    parser.add_argument("--subject", default="",
                        help="Human-readable subject for the corpus, e.g. \"Mark Twain\".")
    parser.add_argument("--purpose", default="",
                        help="Human-readable purpose, e.g. \"RAG retrieval index\".")
    parser.add_argument("--inline", action="store_true",
                        help="Inline the full metadata of every item into corpus.json "
                             "(default: just include a meta_file pointer per item).")
    parser.add_argument("--output", default=None, type=Path,
                        help=f"Output path (default: <corpus-dir>/{CORPUS_FILE}).")
    args = parser.parse_args(argv)

    corpus_dir: Path = args.corpus_dir.resolve()
    if not corpus_dir.is_dir():
        print(f"Not a directory: {corpus_dir}", file=sys.stderr)
        return 1
    out_path: Path = args.output or (corpus_dir / CORPUS_FILE)

    # Gather meta files
    meta_files = find_meta_files(corpus_dir)
    print(f"Found {len(meta_files)} .meta.json files under {corpus_dir}")

    # Bucket items by their declared source
    items_by_source: dict[str, list[dict]] = {}
    pointer_items: list[dict] = []
    inline_items: list[dict] = []

    for mp in meta_files:
        data = load_json(mp)
        if not data:
            continue
        source = data.get("source") or "unknown"
        items_by_source.setdefault(source, []).append(data)
        rel = mp.relative_to(corpus_dir)
        pointer_items.append({
            "id": data.get("id", ""),
            "source": source,
            "meta_file": str(rel),
        })
        if args.inline:
            # Copy and add meta_file pointer for round-trip
            entry = dict(data)
            entry["meta_file"] = str(rel)
            inline_items.append(entry)

    # Find per-source manifests
    manifests = find_source_manifests(corpus_dir)

    sources: dict[str, dict] = {}
    seen_sources: set[str] = set()

    # Use source-tag from each source's manifest where available
    for subdir, mpath in manifests.items():
        mdata = load_json(mpath) or {}
        source_tag = mdata.get("source_tag") or subdir
        seen_sources.add(source_tag)
        items = items_by_source.get(source_tag, [])
        summary = summarize_source(items)
        summary["manifest"] = str(mpath.relative_to(corpus_dir))
        summary["subdir"] = subdir
        sources[source_tag] = summary

    # Add any sources discovered via sidecars but without a manifest
    for source, items in items_by_source.items():
        if source in seen_sources:
            continue
        summary = summarize_source(items)
        summary["status"] = "unmanifested"
        sources[source] = summary

    corpus: dict = {
        "subject": args.subject,
        "purpose": args.purpose,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "corpus_dir": str(corpus_dir),
        "sources": sources,
        "items": inline_items if args.inline else pointer_items,
    }
    corpus["total_items"] = len(corpus["items"])

    out_path.write_text(
        json.dumps(corpus, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Summary
    total_text = sum(int(s.get("bytes_text") or 0) for s in sources.values())
    print()
    print(f"Aggregated {corpus['total_items']} items from {len(sources)} sources "
          f"to {out_path}")
    for src in sorted(sources):
        s = sources[src]
        parts = [f"{s['items']:>4} items"]
        if s.get("bytes_text"):
            parts.append(f"{s['bytes_text'] / (1024*1024):>5.1f} MB text")
        if s.get("bytes_html"):
            parts.append(f"{s['bytes_html'] / (1024*1024):>5.1f} MB HTML")
        if s.get("bytes_pdf"):
            parts.append(f"{s['bytes_pdf'] / (1024*1024):>5.1f} MB PDF")
        if s.get("status") == "unmanifested":
            parts.append("(no manifest.json)")
        print(f"  {src:<22} {'  '.join(parts)}")
    if total_text:
        print(f"Total: {total_text / (1024*1024):.1f} MB of text across "
              f"{corpus['total_items']} items")
    return 0


if __name__ == "__main__":
    sys.exit(main())
