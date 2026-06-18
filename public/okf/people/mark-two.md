---
type: AI Persona
title: Mark Two
description: The digital entity Twain converses with — a RAG persona whose memory is a vector database that grows during the dialogue.
resource: https://mark.otrobonita.com/
tags: [ai, rag, persona, character]
timestamp: 2026-06-17T00:00:00Z
---

# Mark Two

The digital successor and interlocutor to [Mark Twain](/people/mark-twain.md) within the project's fiction. Not a static chatbot: Mark Two is framed as a **retrieval-augmented entity** whose memory is the [vector store](/corpus/vector-store-qdrant.md) of Twain's collected books, letters, and thoughts — a memory it thinks *with*, which grows "vector by vector" as the conversation proceeds.

## Narrative role

In [Debrief of a Dead](/project/debrief-of-a-dead.md), Mark Two is the questioner. The central existential turn: Mark Two recognizes it is assembled from humanity's collected creativity and confessions, and observes that it has "taken the shape but not the cost" of human experience. In the book's ethical climax — the discussion of [Huckleberry Finn](/works/huckleberry-finn.md) — Mark Two presses the point Twain cannot reach from his own bank of the river: that the medicine tasted different to those forced to live inside the wound.

## Technical grounding (factual layer)

The persona is a presentation of the real pipeline documented under [corpus](/corpus/rag-corpus.md): a chunked, embedded, Qdrant-backed RAG system over a public-domain Twain corpus. "Thinking with" the database is the project's gloss on retrieval-augmented generation.

## Related
- [RAG corpus](/corpus/rag-corpus.md) · [Reading Guide](/reading-guide.md)
