---
type: Dataset
title: Mark Twain RAG Corpus
description: A reproducible corpus of public-domain material by and about Mark Twain, built to feed a Retrieval-Augmented Generation system.
resource: https://mark.otrobonita.com/complete-works
tags: [corpus, rag, public-domain, dataset]
timestamp: 2026-06-17T00:00:00Z
---

# Mark Twain RAG Corpus

A body of public-domain material by and about Twain, clean and well-attributed enough to ground a RAG system so the model retrieves before it generates ("Read And Guess-less"). Design goals: **diverse** sources, **well-attributed** chunks (every chunk traceable to origin), and a **reproducible** build pipeline.

## Shape

Each source produces a common sidecar shape so the downstream ingester does not need to know how the source was fetched:

- one HTML (or plain-text) file
- a `.txt` sidecar
- a `.meta.json` sidecar with: `id, source, source_url, title, author, date, category, file, text_file, bytes_text, fetched_at`

An aggregator walks the corpus directory, finds every `.meta.json`, and emits one unified `corpus.json` index.

## Numbers (approximate)

| Quantity | Value |
|---|---|
| Source files (deduped) | ~189 |
| From Project Gutenberg canon | ~50 works (~20 MB) |
| From Wikisource | ~30 pages |
| From Internet Archive | ~100–200 items |
| Expected chunks (500 words each) | ~18,000 |
| Vectors on disk | ~300 MB |

## Properties

- **Polite by default** — identifying User-Agent, paced requests (1–1.5s), exponential backoff on 429/503.
- **Resumable** — each downloader writes a small state file; restart picks up where it left off.
- **Idempotent** — chunk IDs are deterministic (UUID5 of `filename:chunk_index`), so re-runs overwrite rather than duplicate.

## Notably absent

Chronicling America (Library of Congress) historic newspapers — the script existed but failed at run time.

## Related
- [Sources](/corpus/sources/index.md) · [Embedding pipeline](/corpus/embedding-pipeline.md) · [Vector store](/corpus/vector-store-qdrant.md)
