---
type: Vector Store
title: Qdrant Vector Store
description: The vector database holding the corpus embeddings, queried by the on-site chat.
resource: https://qdrant.tech/
tags: [qdrant, vectors, retrieval, infrastructure]
timestamp: 2026-06-17T00:00:00Z
---

# Qdrant Vector Store

Holds the embedded chunks of the [RAG corpus](/corpus/rag-corpus.md) and serves nearest-neighbour retrieval to the chat. In the project's fiction this database is [Mark Two](/people/mark-two.md)'s memory — the thing the persona "thinks with," growing vector by vector.

## Upload characteristics

Populated by a network-bound step separate from embedding (see [pipeline](/corpus/embedding-pipeline.md)): reads `vectors.jsonl`, batches into 250-vector upserts, retries on failure. Upload takes minutes; embedding takes hours.

## Related
- [Embedding pipeline](/corpus/embedding-pipeline.md)
