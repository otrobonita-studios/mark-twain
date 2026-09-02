# RAG Embedding Pipeline

Replaces `TwainCorpus/embed_corpus.py` + `corpus_cleaner.py` + `purge_html_vectors.py`.

## What changed

| Old | New |
|---|---|
| `rglob("*")` over all of `TwainCorpus/` — includes `rss/` | Explicit source list — `rss/` never touched |
| Raw HTML tags embedded as text | BeautifulSoup extracts clean prose |
| `converted/` as book source | `src/data/books/` — canonical, more complete (115 vs 78 files) |
| 500-word blind split, zero overlap | 200-word paragraph-aligned chunks, 1-paragraph overlap |
| `filename` only in payload | `source`, `work`, `type` added — supports Qdrant filtered search |
| Required `purge_html_vectors.py` post-step | No post-processing — pipeline output is upload-ready |

## Sources embedded

| Directory | Payload `source` | Payload `type` |
|---|---|---|
| `src/data/books/*.html` | `books` | `literary` |
| `TwainCorpus/marks-awareness/*.txt` | `marks-awareness` | from meta.json |
| `TwainCorpus/wikisource/Works-About-Twain/*.txt` | `wikisource` | `biographical` |
| `TwainCorpus/internet-archive/**/*.txt` | `internet-archive` | `archival` |

Never: `rss/`, `converted/`, `project-gutenberg/Works/` (superseded by `src/data/books/`).

## Running

```bash
cd rag/pipeline

# Embed all sources (resume-safe — skips already-done files):
python embed_corpus.py

# Upload to an explicitly named physical Qdrant collection:
$env:QDRANT_COLLECTION="twain_2026_09_02"
python stream_to_qdrant.py

# Full clean re-embed from scratch:
rm -f embed_corpus.state.json vectors.jsonl
python embed_corpus.py
python stream_to_qdrant.py --fresh
```

## Environment variables

All read from `.env.local` at the project root:

```
HF_TOKEN=           # HuggingFace token for BAAI/bge-m3 via Inference API
QDRANT_URL=         # e.g. https://xxxx.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=     # Qdrant API key
QDRANT_COLLECTION=  # required physical target, e.g. twain_2026_09_02
```

The uploader refuses `QDRANT_COLLECTION=twain_production`. Production uses that
stable alias for reads; embedding runs must target a versioned physical collection.
After evaluation, move the alias atomically to the approved collection.

If `HF_TOKEN` is absent, embedding falls back to loading `BAAI/bge-m3` locally
via `sentence-transformers` (slower, requires the package installed).

## Resuming after a crash

`embed_corpus.state.json` records completed files as `source:filename` keys.
The output file is opened in append mode — safe to restart mid-run.
To re-embed a specific file: remove its entry from the state JSON and re-run.

## Chunking details

- **Target:** 200 words per chunk (smaller than the old 500 → better retrieval precision)
- **Boundaries:** paragraph breaks (`\n\n`) only — never mid-sentence
- **Overlap:** the last paragraph of each chunk seeds the next, so a joke setup
  or quote at a boundary is always retrievable with its context intact
- **Metadata in payload:** `source`, `work`, `type`, `filename`, `chunk_index`
  — enables Qdrant filtered queries like "retrieve only from `books` source"
  or "retrieve only `literary` type"
