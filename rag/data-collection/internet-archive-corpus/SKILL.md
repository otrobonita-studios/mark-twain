---
name: internet-archive-corpus
description: Download a topical slice of Internet Archive's text holdings as a corpus — book-length items (mediatype:texts) matching a query, with their best available plain-text rendition plus optional PDF and metadata sidecars. Designed for "everything Internet Archive has about <X>" or "all 1900–1928 books on <topic>" use cases, with date-range filtering and a hard cap on item count so you don't accidentally download 50,000 newspaper indexes. Use this skill whenever the user wants to pull material from archive.org for a RAG corpus, a research dataset, or an offline reading library — including queries phrased as "all books about Twain", "every public-domain biography of Lincoln on IA", "1890s travel writing from Internet Archive", etc.
---

# Internet Archive corpus

This skill pulls a topical slice of Internet Archive's `texts` mediatype — books, monographs, periodicals — and saves each item's plain text plus optional PDF plus per-item JSON metadata in the shared corpus schema. It's the most volume-prone of the corpus sources, so the script defaults to conservative limits and demands an explicit query.

Internet Archive's content is mixed-quality (OCR'd 19th-century books vary from pristine to incomprehensible), and the catalog has many duplicates (the same book scanned by different libraries). The script defers to IA's preferred text format per item (DjVuTXT when available, plain text otherwise) and writes one folder per identifier so duplicate identifiers don't overwrite each other.

## Use the bundled script and the `internetarchive` library

The skill ships with `scripts/download_internet_archive.py`. It uses the official `internetarchive` Python library, which wraps IA's search and download APIs, handles pagination, and supports resume out of the box. Don't try to drive `archive.org/advancedsearch.php` by hand — the library does it correctly and is the polite client IA expects.

Install requirement is one line:

```bash
pip install internetarchive beautifulsoup4
```

Typical invocations:

```bash
# Pre-1929 books about Twain (a corpus-sized slice)
python scripts/download_internet_archive.py \
    --query 'subject:"Mark Twain" AND mediatype:texts AND date:[1900-01-01 TO 1928-12-31]' \
    --output-dir ./TwainCorpus/internet-archive \
    --max-items 200 \
    --with-metadata

# Same, plus PDFs for archival fidelity
python scripts/download_internet_archive.py \
    --query 'subject:"Mark Twain" AND mediatype:texts AND date:[1900-01-01 TO 1928-12-31]' \
    --output-dir ./TwainCorpus/internet-archive \
    --max-items 200 \
    --with-pdf --with-metadata

# Inspect what would be downloaded first
python scripts/download_internet_archive.py \
    --query '...' --output-dir /tmp/x --max-items 200 --dry-run
```

`--max-items` caps the total downloaded; the default is 100. Run with `--dry-run` first when working a new query — IA queries can return more than you expect.

## How the script works

1. Issues an `internetarchive.search_items` query. Iterates results lazily; stops at `--max-items`.
2. For each result, fetches the item metadata via `get_item(identifier)`.
3. Picks the best text format file: `DjVuTXT` preferred (clean OCR), then plain `Text`, then anything matching `*.txt`. If none exist, the item is logged as "no text available" and skipped.
4. If `--with-pdf`: also downloads the first PDF (preferring "Text PDF" format, falling back to any PDF).
5. Writes outputs to `<output-dir>/<identifier>/` — one folder per IA item to avoid filename collisions across items with the same title.
6. Writes a `.meta.json` next to each item with the shared corpus schema.
7. Pauses `--delay` seconds (default 1.0) between items; the library handles backoff on transient errors internally.
8. Writes a top-level `manifest.json` with everything fetched.

## Output layout

```
<output-dir>/
├── manifest.json
├── markTwainBiography_paine_v1/
│   ├── markTwainBiography_paine_v1.txt
│   ├── markTwainBiography_paine_v1.pdf       (if --with-pdf)
│   └── markTwainBiography_paine_v1.meta.json
├── myMarkTwain_howells/
│   ├── myMarkTwain_howells.txt
│   └── myMarkTwain_howells.meta.json
└── ...
```

One folder per IA identifier (`item.identifier`) — these are unique. The `.txt` filename matches the identifier so it's easy to cross-reference back to archive.org/details/<identifier>.

## Metadata sidecar (shared schema)

```json
{
  "id": "internet-archive-markTwainBiography_paine_v1",
  "source": "internet-archive",
  "source_url": "https://archive.org/details/markTwainBiography_paine_v1",
  "title": "Mark Twain, a biography ...",
  "author": "Paine, Albert Bigelow, 1861-1937",
  "publisher": "New York, Harper & Bros.",
  "date": "1912",
  "language": "eng",
  "subjects": ["Twain, Mark, 1835-1910"],
  "ia_collection": ["americana", "library_of_congress"],
  "ia_mediatype": "texts",
  "ia_format_used": "DjVuTXT",
  "category": "internet-archive",
  "file": "markTwainBiography_paine_v1/markTwainBiography_paine_v1.pdf",
  "text_file": "markTwainBiography_paine_v1/markTwainBiography_paine_v1.txt",
  "bytes_text": 1234567,
  "bytes_pdf": 9876543,
  "fetched_at": "2026-05-25T12:00:00Z"
}
```

`source` is configurable via `--source-tag` (default `internet-archive`).

## Building useful queries

Internet Archive's query syntax is Lucene-style. A few patterns that work well for corpus-building:

- **Subject-driven** (most reliable for a person): `subject:"Mark Twain" AND mediatype:texts`. IA's subject classifications are surprisingly clean for major historical figures.
- **Creator-driven** (good when you know the authors writing about your subject): `creator:"Paine, Albert Bigelow" AND mediatype:texts`.
- **Title-driven** (use sparingly): `title:"Mark Twain" AND mediatype:texts` — very noisy because his name appears in many titles tangentially.
- **Date range**: `date:[YYYY-MM-DD TO YYYY-MM-DD]`. For pre-1929 PD-in-the-US works, use `date:[* TO 1928-12-31]`. For the modern public-domain window in countries with life+50, adjust accordingly.
- **Collection filter** (when you want academic-only): `collection:(americana OR opensource_textbooks OR library_of_congress)`.

Always include `mediatype:texts` — without it you'll get audio, video, and software entries mixed in.

## Politeness and rate limits

Internet Archive is permissive but they ask clients to identify themselves and avoid hammering. The script:

- Sends an explicit `User-Agent` (set in `internet_archive_corpus.py`; edit it to include real contact info before any large run).
- Sleeps `--delay` seconds (default 1.0) between items.
- Lets the `internetarchive` library handle retries on transient API errors.
- Honors `--max-items` strictly — there's no way to "just see how many" without setting a cap, because the search API will happily stream millions of hits.

If you need genuinely large-scale (>10k items), use IA's S3-compatible bulk-download API or their data dumps instead — and contact info@archive.org first.

## Edge cases worth flagging

- **Restricted-access items.** Some IA items are restricted (in-copyright books available only via Controlled Digital Lending). The script detects these (`access_restricted` in metadata) and skips, noting them in the report.
- **Items with no text.** Image-only scans without OCR — logged as "no text" and skipped. With `--with-pdf` they'd still get the PDF.
- **Duplicate scans of the same book.** Three libraries' OCR of the same edition. The script does NOT dedupe; you'll get multiple copies. If that's a problem, post-process the manifest grouping by `title + date + creator`.
- **OCR quality.** Pre-1900 books are often very rough. Worth a manual spot-check before committing the corpus to a training run.
- **Per-item file size.** A single IA PDF can be hundreds of MB. The `--with-pdf` flag is opt-in for a reason.

## Folder layout for this skill

```
internet-archive-corpus/
├── SKILL.md
└── scripts/
    └── download_internet_archive.py
```
