---
name: gutenberg-archive
description: Download a slice of Project Gutenberg from any index page — a David Widger "Works of X" curated author index (e.g. https://www.gutenberg.org/files/28803/28803-h/28803-h.htm for Mark Twain), a PG author bibliography (gutenberg.org/ebooks/author/N), or a PG subject page (gutenberg.org/ebooks/subject/N — perfect for "works ABOUT an author"). Follows every linked book/letter/essay and saves HTML + plain text + per-item metadata sidecars, organized by category, with a manifest. Use this skill whenever the user wants to mirror an author or topic from Gutenberg, archive public-domain texts for offline use or for feeding a RAG/training corpus, download all the books from a Gutenberg author or subject index, gather works about an author (biographies, criticism), or anything similar — even if they only name the author/topic ("get me all of Mark Twain", "download every Dickens on Gutenberg", "everything written ABOUT Twain on Gutenberg") rather than pointing at the index URL. The skill knows how to find the right index page if they only give a name or topic.
---

# Project Gutenberg archive

This skill downloads slices of Project Gutenberg — every linked work from an index page — and stores them locally as HTML plus an optional plain-text sidecar plus optional per-item metadata. Three kinds of index page are supported:

1. **Author indexes (Widger-style)** — pages like `gutenberg.org/files/28803/28803-h/28803-h.htm` with headings and grouped links. Used for works **by** an author.
2. **PG author bibliography pages** — `gutenberg.org/ebooks/author/<N>`, the canonical PG list of an author's works.
3. **PG subject pages** — `gutenberg.org/ebooks/subject/<N>`, listing all books on a topic. Used for works **about** an author, or for any topical slice of PG.

Output mirrors the source as HTML, with folders matching the index's own categories. The optional `.txt` sidecar is what you'd feed to an embedding model or NLP pipeline. The optional `.meta.json` sidecar carries the per-item metadata in a shared schema (see "Metadata sidecars" below) — useful when this skill's output is one source among many in a larger corpus.

The skill exists because doing this by hand is tedious and error-prone (indexes have 30–150 links, with internal anchors mixed in among external book links, and subject pages paginate), and because Project Gutenberg explicitly asks robotic clients to be polite — a script that paces itself is the right tool, not a tab loop.

## Use the bundled script — don't crawl by hand

The skill ships with `scripts/download_pg_archive.py`. Run it. Don't try to parse the index by reading it line-by-line, fetching links one at a time with WebFetch, and reasoning about which to follow — that will eat context, be slow, and risk getting the user's IP rate-limited by PG. The script does all of that deterministically and politely in one shot.

Invoke it like:

```bash
# Author index (works BY an author)
python scripts/download_pg_archive.py \
    --index-url https://www.gutenberg.org/files/28803/28803-h/28803-h.htm \
    --output-dir ./MarkTwain \
    --with-text --with-metadata

# Subject index (works ABOUT a topic — biographies, criticism, etc.)
python scripts/download_pg_archive.py \
    --index-url https://www.gutenberg.org/ebooks/subject/2982 \
    --output-dir ./AboutTwain \
    --with-text --with-metadata --source-tag project-gutenberg
```

The script auto-detects the page kind:
- Widger-style author indexes → walks headings + links.
- `/ebooks/author/<N>` and `/ebooks/subject/<N>` → parses the `<li class="booklink">` results, follows pagination via the "Next" link until exhausted, and uses the page's `<h1>` (e.g. "Books: Browse by Subject — Clemens, Samuel Langhorne (Mark Twain)") as the single category.

It then:
1. Fetches with a clear `User-Agent` ("gutenberg-archive/1.0 — personal offline library").
2. Skips the index URL itself, intra-page anchors, non-PG external links, and obvious non-book URLs (license pages, donation pages, image links to the same PG ID).
3. Deduplicates by PG ebook ID.
4. Downloads each book's HTML to `<output-dir>/<Category>/<Title>.html`.
5. If `--with-text`: extracts plain text with BeautifulSoup (stripping PG header/footer boilerplate) and writes `<Title>.txt` alongside.
6. If `--with-metadata`: parses the PG header block (`Title:`, `Author:`, `Release Date:`, `Language:`) and writes `<Title>.meta.json` with the shared corpus schema.
7. Sleeps `--delay` seconds (default 1.5) between requests; exponential backoff on 429/503.
8. Resume support: existing `.html` files are skipped.
9. Writes a `manifest.json` next to the output.

After it finishes, print a short summary: how many works total, how many per category, how many newly downloaded vs already-present, and any URLs that failed (with the reason — 404, 503, parse error).

## Subject pages — finding the right one

PG subject IDs aren't memorable; you usually find them by browsing or searching. For Twain specifically:

- Biographies of Clemens/Twain: search `gutenberg.org/ebooks/search/?query=clemens+biography` and look at the subject facets on the right.
- The PG search URL `gutenberg.org/ebooks/search/?query=mark+twain` exposes subject suggestions in its sidebar.

If the user only gave a name ("works about Twain"), do a quick web search for `site:gutenberg.org/ebooks/subject "Mark Twain"` to find the right subject ID, then pass that to the script. If multiple subject pages are relevant (e.g. one for "Clemens, Samuel L. -- Biography", another for "Clemens, Samuel L. -- Criticism and interpretation"), run the script once per subject ID with the same `--output-dir` — dedup-by-PG-ID prevents double downloads.

## Metadata sidecars — the shared schema

When `--with-metadata` is set, each downloaded item gets a `.meta.json` sidecar with this shape:

```json
{
  "id": "pg-2987",
  "source": "project-gutenberg",
  "source_url": "https://www.gutenberg.org/files/2987/2987-h/2987-h.htm",
  "title": "Mark Twain: A Biography",
  "author": "Albert Bigelow Paine",
  "release_date": "1912-09-01",
  "language": "en",
  "category": "Biography",
  "file": "Biography/Mark-Twain-A-Biography.html",
  "text_file": "Biography/Mark-Twain-A-Biography.txt",
  "bytes_html": 1234567,
  "bytes_text": 980123,
  "fetched_at": "2026-05-25T12:00:00Z"
}
```

`source` is configurable via `--source-tag` (default `project-gutenberg`) so this skill's output can sit alongside output from sibling skills (Wikisource, Internet Archive, Chronicling America) in a unified corpus directory, with a downstream aggregator iterating `**/*.meta.json` regardless of which source produced each item.

## If the user only gave a name or topic, not an index URL

For an author ("Mark Twain", "Dickens"):
1. Search `"works of <author>" widger site:gutenberg.org` via WebSearch — a hit at `gutenberg.org/files/<ID>/<ID>-h/<ID>-h.htm` is almost certainly the Widger index.
2. Otherwise fall back to `gutenberg.org/ebooks/author/<NNN>`. The script handles both shapes.
3. If neither exists, point the user at the PG search page and let them pick.

For a topic or "works about an author" ("works about Twain", "anything on Lincoln"):
1. Find the right subject ID: search `site:gutenberg.org/ebooks/subject "<topic>"` via WebSearch, or hit `gutenberg.org/ebooks/search/?query=<topic>` and read the subject facets off the results page.
2. Pass the subject URL (`gutenberg.org/ebooks/subject/<N>`) to the script.
3. If several subject IDs are relevant (e.g. "X — Biography" plus "X — Criticism and interpretation"), run once per ID into the same output dir; dedup-by-PG-ID prevents double downloads.

## Heuristics the script uses for "is this a book, chapter, or letter?"

- A link to `gutenberg.org/files/<ID>/<ID>-h/<ID>-h.htm` is a **book** (or a "Letters Volume N" or "Essays Volume N" — same shape). Download it. The book's HTML contains chapters as in-page anchors, so chapters don't need a separate request.
- A link with `#anchor` in it that points within the same index page is **internal navigation** (Widger's indexes use these as a TOC to deeper sub-listings further down the same page). Skip as a download target — the section it points to will be visited in document order anyway.
- A link to `gutenberg.org/ebooks/<ID>` is the **book's catalog page**, not the book itself. The script rewrites it to the `/files/<ID>/<ID>-h/<ID>-h.htm` HTML URL.
- A link to `gutenberg.org/cache/epub/<ID>/pg<ID>-images.html` is a newer-format HTML edition. Some books only exist in this form; the script tries `/files/<ID>/<ID>-h/<ID>-h.htm` first, then this as a fallback.
- Anything pointing outside `gutenberg.org` is **out of scope** for an author archive — log it, don't download it.

## Category folders

The script uses the nearest preceding heading (h1 → h2 → h3 → h4) as the category for a link, with these rules:

- The very top-level page title (e.g. "THE WORKS OF MARK TWAIN") is ignored as a category — it's the page identity, not a section.
- Heading text is sanitized to a folder-safe name: keep letters, digits, spaces, and dashes; collapse multiple spaces; strip everything else; trim. Title-case it.
  - `VOLUMES` → `Volumes/`
  - `Letters` → `Letters/`
  - `Autobiography` → `Autobiography/`
- Links that appear before any category heading go into `Uncategorized/`. Mention this in the final summary so the user can spot oddly-structured indexes.

## Filenames

For each downloaded book, derive the filename from the link text on the index page (which is usually the proper title), not the book's own `<title>` tag inside the HTML (which often includes "The Project Gutenberg eBook of …, by …" boilerplate).

Sanitize the title: trim whitespace, strip Markdown bold/italic markers (`**`, `*`, `_`), drop punctuation other than dashes/apostrophes, collapse spaces to single spaces, then replace remaining spaces with dashes. Examples:

- `**The American Claimant**` → `The-American-Claimant.html`
- `Tragedy of Pudd'nhead Wilson` → `Tragedy-of-Puddnhead-Wilson.html`
- `Volume 1.` → `Volume-1.html` (inside `Letters/`, so the final path is `Letters/Volume-1.html`)

If two distinct PG IDs sanitize to the same filename (rare but possible), suffix `-<PG-ID>` to disambiguate.

## Politeness — non-negotiable

Project Gutenberg's stance on bulk downloads: they prefer rsync mirrors for genuinely large-scale needs (the whole catalog), but a polite paced scrape of one author (typically 30–150 files) is acceptable. The script's defaults are tuned for this:

- `--delay 1.5` between requests (≈40 requests per minute).
- A clear `User-Agent` identifying the script and purpose, so PG's admins can see it's not a hostile crawl.
- HTTP errors (429, 503) trigger an exponential backoff (sleep 30s, then 60s, then 120s); after three failures on the same URL the script gives up on that URL and continues.

Do not lower the delay or remove the backoff. If the user asks for a faster download, the right answer is to point them at PG's rsync mirror (`rsync.mirrorservice.org::gutenberg.org/`), not to hammer the HTTP server.

## After the download

Tell the user where the archive landed and the headline counts:

```
Saved 47 works (12.3 MB) to /path/to/output/MarkTwain
  Volumes/        15 works
  Letters/         7 works
  Autobiography/   3 works
  Speeches/        4 works
  Essays/          8 works

Skipped 2 already-present files. 1 URL failed (gutenberg.org/files/99999/... → 404).
Manifest: /path/to/output/MarkTwain/manifest.json
```

If anything failed, mention it briefly — usually it's a stale link in the index that PG has since renumbered, or a network blip worth a retry.

## Edge cases worth flagging

- **Multi-volume works** (Letters Vol 1–7, Autobiography Vol 1–3) — each volume is a separate PG ID and a separate file. Don't try to concatenate them; the user can do that if they want.
- **Illustrated editions** of works that also exist as plain editions — both download. Different PG IDs, different files, both legitimate.
- **Audio or scanned-image PG entries** — these don't have an `-h.htm` URL. The script logs them as "no HTML available" and moves on. If the user wants those, they need a different tool.
- **Pages that have moved to the "cache/epub" layout** — the script tries `/files/<ID>/<ID>-h/<ID>-h.htm` first, then `/cache/epub/<ID>/pg<ID>-images.html` as a fallback.
- **An index that points to non-PG sites** (rare; some older Widger indexes link to archive.org) — out of scope, logged in the summary.

## Folder layout for this skill

```
gutenberg-archive/
├── SKILL.md
└── scripts/
    └── download_pg_archive.py
```
