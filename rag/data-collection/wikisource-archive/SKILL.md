---
name: wikisource-archive
description: Download a slice of Wikisource (the Wikimedia free-text library) starting from a category — typically "Works about <Person>" or "Works by <Person>" — and save each page's rendered HTML plus optional plain-text and metadata sidecars. Handles subcategories, follows subpages of multi-chapter works, deduplicates, and uses the MediaWiki API politely. Use this skill whenever the user wants to gather a Wikisource corpus on a topic or author — works about Mark Twain, the complete writings of Lincoln, every essay in a Wikisource category, public-domain primary sources for a research project — even if they only name the topic ("everything Wikisource has about Mark Twain") rather than pointing at the category page. The skill knows how to find the right category if they only give a name.
---

# Wikisource archive

This skill walks a Wikisource category and downloads every page it contains as clean HTML, with optional plain-text and JSON-metadata sidecars in the same shared schema as the sibling `gutenberg-archive` skill. The goal is a uniform corpus directory that a RAG ingester (or a fine-tuning pipeline, or just a curious human) can scan with one walk.

Wikisource is well-suited to this work: pages are transcribed by humans (not OCR'd like Internet Archive), the texts are public domain, and the MediaWiki API exposes structured access — no HTML scraping required to enumerate or fetch content. The skill uses the API for both, which is faster and more reliable than parsing rendered pages, and friendlier to the Wikimedia servers.

## Use the bundled script — and use the API, not HTML scraping

The skill ships with `scripts/download_wikisource.py`. Run it. Don't fetch and parse Wikisource HTML manually — the API is the right tool. The script handles all of the following for you: category enumeration with pagination, subcategory recursion, subpage handling for multi-chapter works, plain-text extraction, metadata sidecars, dedup, resume, and polite pacing.

Typical invocations:

```bash
# Works ABOUT Mark Twain
python scripts/download_wikisource.py \
    --category "Category:Works about Mark Twain" \
    --output-dir ./TwainCorpus/wikisource \
    --with-text --with-metadata

# Works BY Mark Twain (separate category)
python scripts/download_wikisource.py \
    --category "Category:Works by Mark Twain" \
    --output-dir ./TwainCorpus/wikisource \
    --with-text --with-metadata

# Restrict to top-level pages, no recursion into chapters
python scripts/download_wikisource.py \
    --category "Category:Works about Mark Twain" \
    --output-dir ./TwainCorpus/wikisource \
    --no-follow-subpages
```

The default Wikisource wiki is `en.wikisource.org`; pass `--site` (e.g. `de.wikisource.org`) for another language.

## How the script walks the category

1. Calls `action=query&list=categorymembers` to enumerate the category. Recurses into subcategories up to `--max-depth` (default 2).
2. For each page member, calls `action=parse&prop=text|displaytitle|categories|revisions` to fetch rendered HTML + metadata.
3. If the page is mostly a table of contents (lots of subpage links, very little prose) and `--follow-subpages` is on (the default), the script enumerates subpages (`prefixsearch` for `<PageTitle>/`) and downloads each as an item — letting multi-chapter works like *Mark Twain: A Biography* land as one file per chapter, which is what a RAG ingester actually wants.
4. Deduplicates by canonical page title.
5. Writes each item as `<output-dir>/<CategoryFolder>/<Page-Title>.html`. The category folder is derived from the source category name (`Works-About-Mark-Twain`).

## Sidecars (same shared schema)

When `--with-text` is set, the script extracts plain text from the rendered HTML — dropping nav chrome, edit links, and section-edit buttons — and writes `<Page-Title>.txt`.

When `--with-metadata` is set, each item gets a `<Page-Title>.meta.json` with:

```json
{
  "id": "wikisource-en-Mark_Twain:_A_Biography/Volume_I,_Part_1/Chapter_1",
  "source": "wikisource",
  "source_url": "https://en.wikisource.org/wiki/Mark_Twain:_A_Biography/Volume_I,_Part_1/Chapter_1",
  "title": "Mark Twain: A Biography/Volume I, Part 1/Chapter 1",
  "author": "Albert Bigelow Paine",
  "categories": ["Works about Mark Twain", "Biographies"],
  "wiki_site": "en.wikisource.org",
  "page_id": 123456,
  "last_revised": "2024-03-12T14:22:08Z",
  "language": "en",
  "category": "Works-About-Mark-Twain",
  "file": "Works-About-Mark-Twain/Mark-Twain-A-Biography-Volume-I-Part-1-Chapter-1.html",
  "text_file": "Works-About-Mark-Twain/Mark-Twain-A-Biography-Volume-I-Part-1-Chapter-1.txt",
  "bytes_html": 81234,
  "bytes_text": 65000,
  "fetched_at": "2026-05-25T12:00:00Z"
}
```

Configure the `source` field via `--source-tag` (default `wikisource`) when mixing this skill's output with others.

## If the user only gave a name, not a category

Wikisource's naming follows predictable patterns:

- Works by: `Category:Works by <First> <Last>` (e.g. `Category:Works by Mark Twain`).
- Works about: `Category:Works about <First> <Last>`.

Try the predicted name first. If the API returns no members, use the Wikisource search endpoint (`action=opensearch`) to find candidates, or just fetch the author page (`en.wikisource.org/wiki/Author:<First>_<Last>`) and look at the "See also" / "Works about" links — most author pages link directly to the right category.

## Politeness

The MediaWiki API doesn't throttle aggressively, but the [Wikimedia User-Agent policy](https://meta.wikimedia.org/wiki/User-Agent_policy) requires a meaningful User-Agent with contact info. The script's default `User-Agent` is `wikisource-archive/1.0 (https://github.com/your-org; +your-email)` — edit it to include actual contact info before any large run, or the API may rate-limit you. The default pacing is 1 second between requests, which is well below Wikimedia's limits.

## After the download

Tell the user where the archive landed and the headline counts:

```
Saved 47 pages (8.2 MB HTML, 3.1 MB text) to ./TwainCorpus/wikisource
  Works-About-Mark-Twain/      47 pages
    of which 38 chapters of multi-page works
    of which 9 single-page works

Newly downloaded: 47
Skipped (already present): 0
Failed: 0
Manifest: ./TwainCorpus/wikisource/manifest.json
```

If anything failed, list the API error per page — usually it's a missing/redirected page (the category had a stale entry) or a transient network blip.

## Edge cases worth flagging

- **Author pages** (e.g. `Author:Mark_Twain`) are not categories — pass a `Category:` title instead. If the user gives an author page URL, do a single API call to fetch the page and look for category links, then re-run with the right category.
- **Disambiguation pages and redirects** — the API resolves redirects transparently; disambig pages will look like very short pages with many links, and the script downloads them as-is (they're often useful context anyway).
- **Embedded transclusions** — Wikisource pages often transclude from `Page:` namespace (the OCR'd source images). The script fetches the rendered HTML, which already has the transclusions resolved, so you get the final text.
- **Tables and footnotes** — render fine in HTML; the plain-text extractor collapses them to readable form but loses some structure. Fine for embedding; if you need structured footnotes, keep the HTML.
- **Subpages with weird titles** — chapter subpages sometimes have spaces, slashes, and Roman numerals. The filename sanitizer handles them; check the manifest if you suspect a collision.

## Folder layout for this skill

```
wikisource-archive/
├── SKILL.md
└── scripts/
    └── download_wikisource.py
```
