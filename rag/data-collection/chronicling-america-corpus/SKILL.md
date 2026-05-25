---
name: chronicling-america-corpus
description: Download newspaper-page mentions from the Library of Congress's Chronicling America corpus — every historic US newspaper page matching a search query, with full OCR text and a per-page metadata sidecar. Designed for "every newspaper mention of <X>" use cases where reception, contemporary reaction, and cultural context matter. Heavy on volume by nature, so the script demands an explicit --max-items cap and supports date-range and state filters. Use this skill whenever the user wants newspaper coverage, contemporary press reception, or historic American press mentions of an author or topic — including phrasings like "what did newspapers say about Lincoln in 1865?", "all Twain mentions in the press during his lifetime", "newspaper reviews of his books from the 1880s".
---

# Chronicling America corpus

This skill pulls matches from the Library of Congress's Chronicling America newspaper archive — a freely-accessible corpus of US newspapers, mostly 1789–1963, all OCR'd. The API is straightforward JSON and returns full OCR text inline with each search result, so one HTTP call per result page (~20 items) gets us everything.

Use this when reception or cultural context is what you're after. *Not* great for primary biographical material (use Wikisource or PG for that), *very* good for: how a city's papers covered an author's lecture stop, what reviewers said about a book at release, what hagiographies or obituaries appeared on the day of death. For a Twain corpus, this is the chatter around him — useful background for a RAG index, less useful as training text.

## Use the bundled script

The skill ships with `scripts/download_chronicling_america.py`. Run it. It uses the search API directly (no library needed beyond `requests`).

Typical invocations:

```bash
# Twain mentions during his lifetime, capped at 500 pages
python scripts/download_chronicling_america.py \
    --query "mark twain" \
    --output-dir ./TwainCorpus/chronicling-america \
    --date1 1865 --date2 1910 \
    --max-items 500 \
    --with-metadata

# Just the obituary surge: April-May 1910
python scripts/download_chronicling_america.py \
    --query "mark twain" \
    --output-dir ./TwainCorpus/chronicling-america-obituaries \
    --date1 1910-04-01 --date2 1910-05-31 \
    --max-items 200 \
    --with-metadata

# Restrict to one state
python scripts/download_chronicling_america.py \
    --query "mark twain" \
    --output-dir ./TwainCorpus/chronicling-america-ny \
    --state "New York" \
    --max-items 200 \
    --with-metadata

# Inspect first
python scripts/download_chronicling_america.py \
    --query "mark twain" --output-dir /tmp/x --max-items 200 --dry-run
```

`--max-items` is required-in-spirit (default 100). Without a cap, a popular query can stream tens of thousands of results.

## How the script works

1. Issues `https://chroniclingamerica.loc.gov/search/pages/results/?andtext=<query>&format=json` with pagination (`&page=N`, 20 results per page).
2. Optional filters applied as query params: `--date1`/`--date2` (year or YYYY-MM-DD), `--state` (full state name).
3. Each search result already contains the OCR text in `ocr_eng` — no per-item fetch needed.
4. Saves each result as `<output-dir>/<Year>/<LCCN>_<YYYY-MM-DD>_seq<N>.txt`. Organizing by year keeps the folder navigable for casual browsing.
5. Writes a `.meta.json` sidecar per item (when `--with-metadata`).
6. Top-level `manifest.json` lists everything.
7. Sleeps `--delay` seconds (default 0.5; LoC is permissive) between search-result pages.

## Output layout

```
<output-dir>/
├── manifest.json
├── 1910/
│   ├── sn83030214_1910-04-22_seq1.txt
│   ├── sn83030214_1910-04-22_seq1.meta.json
│   ├── sn84026749_1910-04-22_seq3.txt
│   └── ...
├── 1885/
│   └── ...
└── ...
```

Filenames combine the newspaper's LCCN (Library of Congress Control Number — uniquely identifies the title), the issue date, and the page sequence number, so you can always reconstruct the source from the filename alone.

## Metadata sidecar (shared schema)

```json
{
  "id": "chronicling-america-sn83030214-1910-04-22-1",
  "source": "chronicling-america",
  "source_url": "https://chroniclingamerica.loc.gov/lccn/sn83030214/1910-04-22/ed-1/seq-1/",
  "title": "The New York tribune. [volume]",
  "place_of_publication": "New York [N.Y.]",
  "date": "1910-04-22",
  "lccn": "sn83030214",
  "edition": 1,
  "page_sequence": 1,
  "subject": ["Twain, Mark, 1835-1910"],
  "language": "eng",
  "category": "1910",
  "file": "1910/sn83030214_1910-04-22_seq1.txt",
  "bytes_text": 12345,
  "fetched_at": "2026-05-25T12:00:00Z"
}
```

`source` is configurable via `--source-tag` (default `chronicling-america`).

## Noise warning

The query `mark twain` returns matches anywhere the words "mark" and "twain" appear near each other on a newspaper page. That includes:

- Real Twain coverage (lectures, reviews, interviews) — what you want.
- Advertisements for books and lecture tours — useful, mostly.
- Stray mentions ("Mark Twain once said..." in unrelated articles) — noise.
- OCR errors that happen to produce "mark twain" out of unrelated text — pure noise.

For a RAG index this noise is usually tolerable (the retriever's relevance scoring filters it). For training data, you probably want a post-process step that filters by snippet length, by date proximity to known Twain events, or by per-result LLM relevance scoring. The script doesn't try to do that filtering — it gives you the raw stream with per-item metadata, and you decide what to keep.

## Politeness

Chronicling America's API is generous but not unlimited. The script:

- Sends an explicit `User-Agent` — edit `USER_AGENT` in the script with real contact info before any large run.
- Sleeps `--delay` seconds (default 0.5) between search-result pages.
- Honors `--max-items` strictly. There's no way to download "everything" without an explicit cap, by design.
- Each search-result-page call returns 20 items, so 500 items is 25 HTTP calls — small load.

## Edge cases worth flagging

- **OCR quality** varies wildly. 19th-century papers are often near-illegible; some text files will look like word salad. That's the data.
- **Same article on multiple pages.** Front-page article continued on page 5 → two matches, two files. The metadata's `lccn` + `date` lets you cluster them downstream.
- **Wire-service duplication.** Twain obituaries from April 1910 ran nearly identically in dozens of papers (AP wire). Expect heavy duplication around major events.
- **Date format.** The API accepts both `YYYY` and `YYYY-MM-DD`. The script passes through whatever you give it.

## Folder layout for this skill

```
chronicling-america-corpus/
├── SKILL.md
└── scripts/
    └── download_chronicling_america.py
```
