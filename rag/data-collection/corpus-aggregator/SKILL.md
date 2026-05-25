---
name: corpus-aggregator
description: Walk a multi-source corpus directory (built by the sibling skills gutenberg-archive, wikisource-archive, internet-archive-corpus, chronicling-america-corpus, or any tool that drops .meta.json sidecars in the shared schema) and produce a unified corpus.json index that lists every item across every source with its source-tagged metadata. Use this skill at the end of a corpus build — after the individual source skills have run — to produce a single index file that a RAG ingester or fine-tuning data loader can iterate without knowing the per-source layout. Also use it whenever the user asks for a corpus summary, item counts by source, or a unified manifest across mixed-source archives.
---

# Corpus aggregator

This skill is the closing step of a multi-source corpus build. Each of the per-source skills writes `.meta.json` sidecars in a shared schema (`id`, `source`, `source_url`, `title`, `category`, `file`, `text_file`, etc.). This skill walks the corpus directory, gathers every sidecar, and produces a single `corpus.json` index that downstream tooling can consume without per-source knowledge.

The shared schema means the per-source skills don't need to know about each other and you don't need to write per-source loaders for your RAG ingester — point it at `corpus.json` and iterate.

## Use the bundled script

The skill ships with `scripts/aggregate_corpus.py`. It's small and dependency-free (stdlib only).

Typical invocation:

```bash
python scripts/aggregate_corpus.py \
    --corpus-dir ./TwainCorpus \
    --subject "Mark Twain" \
    --purpose "RAG retrieval index"
```

The script:
1. Walks `--corpus-dir` recursively looking for `*.meta.json` files (excluding the top-level `corpus.json` it writes).
2. Reads each sidecar.
3. Discovers per-source `manifest.json` files (one per source subfolder) for source-level metadata.
4. Writes `<corpus-dir>/corpus.json` with:
   - Build metadata (subject, purpose, generated_at).
   - Per-source summary (item count, total bytes).
   - Either pointers to each item's sidecar, or (with `--inline`) the full metadata of every item.

Pass `--inline` if your downstream tooling can't easily read individual sidecar files and would rather have everything in one JSON. By default the index just points at sidecars, which keeps `corpus.json` small even for huge corpora.

## Output shape (default — pointers)

```json
{
  "subject": "Mark Twain",
  "purpose": "RAG retrieval index",
  "generated_at": "2026-05-25T12:00:00Z",
  "corpus_dir": "./TwainCorpus",
  "sources": {
    "project-gutenberg": {"items": 12, "bytes_html": 4123456, "bytes_text": 3201234,
                          "manifest": "project-gutenberg/manifest.json"},
    "wikisource":        {"items": 47, "bytes_html": 8200000, "bytes_text": 3100000,
                          "manifest": "wikisource/manifest.json"},
    "internet-archive":  {"items": 87, "bytes_text": 24500000, "bytes_pdf": 0,
                          "manifest": "internet-archive/manifest.json"},
    "chronicling-america": {"items": 500, "bytes_text": 12300000,
                            "manifest": "chronicling-america/manifest.json"}
  },
  "items": [
    {"id": "pg-2987", "source": "project-gutenberg",
     "meta_file": "project-gutenberg/Biography/Mark-Twain-A-Biography.meta.json"},
    {"id": "wikisource-en-Mark_Twain:_A_Biography/Volume_I,_Part_1/Chapter_1",
     "source": "wikisource",
     "meta_file": "wikisource/Works-About-Mark-Twain/Mark-Twain-A-Biography-Volume-I-Part-1-Chapter-1.meta.json"},
    ...
  ]
}
```

With `--inline`, each `items[]` entry contains the full metadata (no `meta_file` pointer needed):

```json
{
  "items": [
    {
      "id": "pg-2987", "source": "project-gutenberg",
      "source_url": "https://www.gutenberg.org/files/2987/...",
      "title": "Mark Twain: A Biography",
      ...
    },
    ...
  ]
}
```

## Workflow

After running the per-source skills:

```bash
# Sources individually
python scripts/download_pg_archive.py ... --output-dir ./TwainCorpus/project-gutenberg ...
python scripts/download_wikisource.py ... --output-dir ./TwainCorpus/wikisource ...
python scripts/download_internet_archive.py ... --output-dir ./TwainCorpus/internet-archive ...
python scripts/download_chronicling_america.py ... --output-dir ./TwainCorpus/chronicling-america ...

# Aggregate
python scripts/aggregate_corpus.py \
    --corpus-dir ./TwainCorpus \
    --subject "Mark Twain" \
    --purpose "RAG retrieval index"
```

That's it. `TwainCorpus/corpus.json` is now the entry point for the entire corpus.

## After aggregation

The script prints a summary you can paste into a README or a project log:

```
Aggregated 646 items from 4 sources to ./TwainCorpus/corpus.json
  project-gutenberg     12 items   3.2 MB text
  wikisource           47 items   3.1 MB text
  internet-archive     87 items  24.5 MB text
  chronicling-america 500 items  12.3 MB text
Total: 43.1 MB of text across 646 items
```

If any source folder doesn't have a `manifest.json` (you ran a per-source script with an unusual setup, or moved files around), the script reports the source as "unmanifested" and still includes its sidecar items in the index.

## Folder layout for this skill

```
corpus-aggregator/
├── SKILL.md
└── scripts/
    └── aggregate_corpus.py
```
