# Chunking Strategy — Mark Twain RAG Pipeline

**Last updated:** 2026-08-31
**Pipeline:** `rag/pipeline/embed_corpus.py`
**Supersedes:** `rag/data-collection/TwainCorpus/embed_corpus.py` (500-word blind split, no overlap)

---

## The core problem with fixed-size chunking

A fixed-size sliding window doesn't know what kind of information it is cutting. Feed Twain prose through a 500-word window and the window will regularly:

- End mid-sentence, stranding the punchline in the next chunk
- Merge the closing line of one letter with the salutation of the next
- Split a satirical setup from its payoff three sentences later
- Return a chapter ToC index entry instead of the passage it points to

Zero overlap compounds this: if the useful text happens to straddle a boundary, no single chunk contains it, and retrieval misses it entirely.

---

## What we do instead

### Source selection (before any chunking)

The pipeline reads from specific source directories only — there is no recursive glob over the whole corpus. This is the first and most important decision: the wrong files never reach the chunker.

| Source | Format | Notes |
|--------|--------|-------|
| `src/data/books/*.html` | HTML | Canonical cleaned books — `allbooks.md` rules applied, Gutenberg boilerplate gone, editor forewords stripped, illustrations moved to gallery. 115 files including works not in Project Gutenberg (e.g. The Celebrated Jumping Frog as a standalone publication). |
| `TwainCorpus/marks-awareness/*.txt` | plain text | Contemporary briefing files — what Mark Two knows about 2026. Already clean. Type read from paired `.meta.json`. |
| `TwainCorpus/wikisource/Works-About-Twain/*.txt` | plain text | Secondary biographical sources. |
| `TwainCorpus/internet-archive/**/*.txt` | plain text | OCR'd archive material. Google Books boilerplate stripped before chunking. |

**Never processed:**
- `TwainCorpus/rss/` — ~9,000 tech news articles. Not Twain.
- `TwainCorpus/converted/` — older partial copy (78 files), superseded by `src/data/books/` (115 files).
- `TwainCorpus/project-gutenberg/Works/*.txt` — raw txt versions that still contain the chapter-listing ToC at the top. Superseded by the HTML in `src/data/books/`.

---

## HTML extraction

Books are stored as full site-rendered HTML (with CSS, schema.org JSON-LD, and the Courier Prime / Playfair Display theme). BeautifulSoup extracts only the prose:

1. Strip `<script>`, `<style>`, `<head>`, `<nav>`, `<footer>`, `<meta>`, `<link>` entirely.
2. Find `<div class="book-text-content">` — the content wrapper present in all `allbooks.md`-processed files.
3. Replace every block element (`<p>`, `<h1>`–`<h6>`, `<li>`, `<blockquote>`, `<br>`, `<hr>`) with its text content surrounded by `\n\n`. Because this is done in-place, nested tags don't produce duplicated text.
4. Call `get_text()` on the remaining tree.
5. Normalise whitespace: collapse runs of spaces/tabs to a single space; collapse three or more newlines to two.

Result: clean prose with paragraph structure preserved as double newlines, ready for paragraph-aware splitting.

---

## Chunking: paragraph-aware, 200-word target, one-paragraph overlap

```
text → split on \n\n → list of paragraphs
     → group paragraphs until ~200 words → flush as chunk
     → carry last paragraph into next chunk (overlap)
     → repeat
```

**Target size: 200 words.** Smaller than the old 500-word window. More precise retrieval — a relevant quote lands in a chunk where it's the main content, not buried in a 500-word block with four other topics.

**Boundary rule: paragraph breaks only.** A chunk never ends mid-sentence. The break point is always a `\n\n` — a blank line in the source text, which corresponds to a paragraph end in prose, a stanza end in verse, or a section break in awareness files.

**Overlap: one paragraph.** The last paragraph of each chunk is the first paragraph of the next. This means:

- A satirical setup at the end of chunk N is also the opening of chunk N+1.
- A quote that straddles a natural break is retrievable from either side.
- No useful content is stranded at a boundary.

**Edge cases handled:**
- A single paragraph that exceeds 200 words on its own is kept as one chunk rather than split (no mid-sentence breaks).
- Very short paragraphs (chapter headings, single-line dialogue) are grouped with the following paragraph rather than emitted alone.

---

## Payload fields in Qdrant

Every chunk is stored with these fields, enabling filtered retrieval:

| Field | Example | Use |
|-------|---------|-----|
| `text` | `"Man is the only animal that blushes..."` | The chunk text passed to the LLM |
| `filename` | `Adventures-of-Tom-Sawyer.html` | Source file |
| `source` | `books` / `marks-awareness` / `wikisource` / `internet-archive` | Filter by source type |
| `work` | `Adventures of Tom Sawyer` | Human-readable work title |
| `type` | `literary` / `awareness` / `biographical` / `archival` | Filter by document category |
| `chunk_index` | `14` | Position within the source file |

Example filtered query: retrieve only from `source: books` (primary Twain works) when answering a literary question; include `source: marks-awareness` when answering about 2026 events.

---

## What this replaces

| Old pipeline | New pipeline |
|---|---|
| `embed_corpus.py` + `corpus_cleaner.py` + `purge_html_vectors.py` | `embed_corpus.py` only |
| `rglob("*")` — found ~9,280 files including all of `rss/` | Explicit source list — finds ~200 files |
| Raw HTML tags embedded as text, then post-filtered out | BeautifulSoup extracts clean prose |
| 500-word blind word-count split | 200-word paragraph-aligned split |
| Zero overlap | One-paragraph overlap |
| `filename` + `chunk_index` only | + `source`, `work`, `type` |

---

## Running

```bash
cd rag/pipeline

# First time or after adding new files:
python embed_corpus.py

# Upload to Qdrant (upsert, keeps existing):
python stream_to_qdrant.py

# Full clean re-embed (wipes collection):
rm -f embed_corpus.state.json vectors.jsonl
python embed_corpus.py
python stream_to_qdrant.py --fresh
```

The state file (`embed_corpus.state.json`) is keyed by `source:filename`. A crash mid-run is safe to resume — completed files are skipped.

---

## Further improvements (not yet done)

### Parent-child retrieval — decided against for now

**What it is:** embed small child chunks (e.g. 50-word sentences) for precise retrieval; when a child is retrieved, fetch its larger parent (e.g. the full paragraph or chapter section) to pass to the LLM for generation.

**Why we're not doing it yet:**

1. **The problem it solves doesn't exist here yet.** Parent-child is a fix for when retrieval chunks are too small to give the LLM enough context. Our 200-word paragraph-aligned chunks already land Twain's setup-and-punchline structure in one piece. The 1-paragraph overlap handles the boundary cases.

2. **The corpus is small.** ~32k chunks with bge-m3 (1024-dim, strong embedder). Retrieval precision is high. There is no evidence yet of the model finding the right passage but failing to generate from it.

3. **It adds real plumbing.** You'd need: parent chunks stored separately (second collection or `parent_id` payload field), child chunks with a pointer back, and the `/api/chat` route modified to do a second Qdrant fetch after retrieval. Two storage layers, two query hops, more failure surface.

**When to add it:** if evals show the model is consistently retrieving the right material but generating thin answers — it knows the passage exists but 200 words isn't enough context for a full Twain-quality response. That's the data-driven trigger.

**Where it makes the most sense if added later:** the `marks-awareness` briefing files, if they grow into long documents split into fine-grained fact chunks. A parent window covering surrounding facts would give the model enough context to answer questions about 2026 events without losing precision on retrieval.

---

- **Hybrid retrieval:** BGE-M3 natively supports dense + sparse vectors. Wiring up sparse retrieval alongside dense would improve keyword-exact quote lookups.
- **Chapter-level metadata:** extract chapter headings from HTML and attach them to each chunk's payload. Enables "retrieve from Chapter X" queries.
- **Marks-awareness versioning:** add `date_added` from meta.json to the payload so stale briefing files can be filtered by recency.
