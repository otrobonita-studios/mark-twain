---
type: CLI Tool
title: mark-twain-cli
description: A Rust command-line client for the Research API — semantic search and style analysis against the Twain corpus, from a terminal.
resource: https://github.com/otrobonita-studios/mark-twain-cli
tags: [cli, rust, research-api, semantic-search, style-analysis]
timestamp: 2026-07-25T00:00:00Z
---

# mark-twain-cli

A terminal client for the [Research API](/corpus/rag-corpus.md), talking to the same `/api/research` endpoints documented in `RESEARCH_API.md` at the project root. Built in Rust; ships as a single pre-compiled binary, no runtime dependencies.

## Install

macOS / Linux / Git Bash:

```bash
curl -fsSL https://raw.githubusercontent.com/otrobonita-studios/mark-twain-cli/main/install.sh | bash
```

This installs the `mark-twain-cli` binary onto your `PATH`. No Rust toolchain required to run it.

## Configuration

Reads these environment variables if set:

- `MARK_TWAIN_API_URL` — base URL of the Research API. Default: `https://mark.otrobonita.com`.
- `RESEARCH_API_KEY` — optional Bearer token, if the endpoint is password-protected.

Both can be overridden per-invocation with `--url`/`-u` and `--api-key`/`-k`.

## Usage

**Interactive mode** (default) — run with no arguments for a guided menu:

```bash
mark-twain-cli
```

**Semantic search** — natural-language query against the vector corpus:

```bash
mark-twain-cli search --query "river at night" --limit 5
```

**Style analysis** — compare an arbitrary text snippet's stylistic fingerprint against Twain's linguistic profile:

```bash
mark-twain-cli analyze-style --text "Well, the first week went by, and we didn't do much..."
```

**Help** — every command supports `--help`:

```bash
mark-twain-cli --help
mark-twain-cli search --help
mark-twain-cli analyze-style --help
```

## Related
- [RAG corpus](/corpus/rag-corpus.md) — what the CLI is searching over.
- [Vector store (Qdrant)](/corpus/vector-store-qdrant.md) — where the search actually runs.
