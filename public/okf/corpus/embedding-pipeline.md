---
type: Pipeline
title: Two-Phase Embedding & Upload
description: The split local-then-network ingestion that turns corpus text into searchable vectors.
resource: https://mark.otrobonita.com/
tags: [embeddings, pipeline, ingestion, rag]
timestamp: 2026-06-17T00:00:00Z
---

# Two-Phase Embedding & Upload

Embedding is CPU-bound and local; uploading is network-bound and cloud. Mixing them means one timeout kills both, so the ingestion is split into two scripts.

## Phase 1 — `embed_corpus.py` (local)

Chunks each text into ~500-word pieces, embeds each chunk with a sentence-transformer model, writes one JSON line per chunk to `vectors.jsonl`. Chunk IDs are deterministic (UUID5 of `filename:chunk_index`) so the phase is idempotent.

## Phase 2 — `upload_vectors.py` (network)

Reads `vectors.jsonl`, batches into 250-vector upserts, pushes to the [Qdrant vector store](/corpus/vector-store-qdrant.md) with retries.

## Runtime

Hours for embedding; minutes for upload.

## Related
- [RAG corpus](/corpus/rag-corpus.md) · [Vector store](/corpus/vector-store-qdrant.md)
