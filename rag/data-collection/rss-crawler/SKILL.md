---
name: rss-crawler
description: Crawl configured RSS and Atom feeds, scrape full article contents, and output metadata sidecars (.meta.json, .html, .txt) in the unified corpus schema for indexing. Run this skill to keep the memory index updated with recent external articles, blogs, and scholarly entries.
---

# Live RSS Knowledge Crawler

This skill allows incremental fetching of new articles from RSS and Atom feeds, scraping their full content (excluding nav, footer, sidebar boilerplate), and converting them into normalized sidecar files (`.html`, `.txt`, `.meta.json`) conforming to the unified corpus schema.

Downstream tools like the `corpus-aggregator` can then ingest the manifest and sidecars without needing to know that the content was crawled from RSS.

## Folder Structure

```
rss-crawler/
├── SKILL.md
├── feeds.json
└── scripts/
    └── rss_crawler.py
```

## Setup and Configuration

Configure the RSS/Atom feeds to monitor in `feeds.json` in the root of the skill folder.

Example `feeds.json`:
```json
[
  {
    "name": "Mark Twain Studies",
    "url": "https://marktwainstudies.com/feed/",
    "category": "Twain-Scholarship"
  }
]
```

Each feed requires:
- `name`: Used as the category subfolder name for downloaded articles.
- `url`: The link to the RSS or Atom XML feed.
- `category`: Used inside the `.meta.json` sidecar for the corpus category tag.

## Running the Crawler

Run the crawler by executing the Python script. Provide the path to the configuration file and the target output folder within your corpus.

```bash
python rag/data-collection/rss-crawler/scripts/rss_crawler.py \
    --config rag/data-collection/rss-crawler/feeds.json \
    --output-dir rag/data-collection/TwainCorpus/rss \
    --delay 1.5
```

### Script Arguments

- `--config`: (Required) Path to the feeds JSON configuration file.
- `--output-dir`: (Required) Path to the directory where crawled files and the manifest will be written.
- `--delay`: (Optional) Polite request rate-limiting delay in seconds (default: `1.5`s).
- `--source-tag`: (Optional) Tag in `.meta.json` to identify the source (default: `rss-crawler`).

## Outputs

For each fetched article, the crawler writes:
1. `<output-dir>/<Feed-Name>/<Article-Title>.html` (The extracted article container content)
2. `<output-dir>/<Feed-Name>/<Article-Title>.txt` (The extracted plain text content)
3. `<output-dir>/<Feed-Name>/<Article-Title>.meta.json` (The corpus-compatible metadata sidecar)

It also generates a `<output-dir>/manifest.json` file cataloging all crawled articles and their status.

### Sidecar Schema

The `.meta.json` files conform to the unified corpus schema:
```json
{
  "id": "rss-mark-twain-studies-fbc9cfb40b1a",
  "source": "rss-crawler",
  "source_url": "https://marktwainstudies.com/some-article-url/",
  "title": "Article Title",
  "author": "Author Name",
  "release_date": "Thu, 04 Jun 2026 12:00:00 +0000",
  "language": "",
  "category": "Twain-Scholarship",
  "file": "/absolute/path/to/TwainCorpus/rss/Mark-Twain-Studies/Article-Title.html",
  "text_file": "/absolute/path/to/TwainCorpus/rss/Mark-Twain-Studies/Article-Title.txt",
  "bytes_html": 14205,
  "bytes_text": 4501,
  "fetched_at": "2026-06-04T08:58:05.123456Z"
}
```

## Aggregating into the Unified Corpus

Once the RSS crawl has completed, you can run the `corpus-aggregator` at the root corpus directory to build or update the global index `corpus.json`:

```bash
python rag/data-collection/corpus-aggregator/scripts/aggregate_corpus.py \
    --corpus-dir rag/data-collection/TwainCorpus \
    --subject "Mark Twain" \
    --purpose "RAG retrieval index"
```

The aggregator will recursively scan all subfolders (including Gutenberg, Wikisource, and the RSS crawler output) and produce a single index.
