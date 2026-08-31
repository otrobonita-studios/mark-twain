"""
embed_corpus.py — paragraph-aware RAG embedding pipeline for Mark Twain Reappears

Sources (in this order, never rss/ or converted/):
    src/data/books/*.html                         canonical cleaned books
    TwainCorpus/marks-awareness/*.txt             contemporary awareness files
    TwainCorpus/wikisource/Works-About-Twain/*.txt biographical secondary sources
    TwainCorpus/internet-archive/**/*.txt         OCR archive (Google header stripped)

Chunking:
    Paragraph-aware, ~200-word target, 1-paragraph overlap.
    Chunks never split mid-sentence.

Output: vectors.jsonl (one JSON line per chunk — feed into stream_to_qdrant.py)
Resume: embed_corpus.state.json tracks completed files by source:filename key.
        Restart after a crash; already-done files are skipped automatically.

Run:
    python embed_corpus.py
"""

import json
import os
import re
import time
import uuid
from pathlib import Path

from bs4 import BeautifulSoup
from dotenv import load_dotenv

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent   # rag/pipeline/ → rag/ → project root

BOOKS_DIR            = PROJECT_ROOT / "src" / "data" / "books"
CORPUS_DIR           = PROJECT_ROOT / "rag" / "data-collection" / "TwainCorpus"
MARKS_DIR            = CORPUS_DIR / "marks-awareness"
WIKISOURCE_DIR       = CORPUS_DIR / "wikisource" / "Works-About-Twain"
INTERNET_ARCHIVE_DIR = CORPUS_DIR / "internet-archive"

OUTPUT_JSONL = SCRIPT_DIR / "vectors.jsonl"
STATE_FILE   = SCRIPT_DIR / "embed_corpus.state.json"

# ── Config ────────────────────────────────────────────────────────────────────

CHUNK_TARGET_WORDS = 200   # target words per child chunk
# One-paragraph overlap is always on: the last paragraph of each chunk
# seeds the next, so nothing useful gets stranded at a boundary.

# Deterministic chunk IDs — change this UUID and all IDs change, so keep it stable.
ID_NAMESPACE = uuid.UUID("b7e1a2f3-2222-4333-9444-555555555555")

GOOGLE_BOILERPLATE_MARKERS = [
    "google book search",
    "public domain books belong to the public",
    "digitize public domain materials",
    "abuse by commercial parties",
    "do not assume that just",
    "copyright infringement liabili",
    "make non-commercial use of the files",
    "refrain from automated querying",
]

# ── Embedding ─────────────────────────────────────────────────────────────────

load_dotenv(PROJECT_ROOT / ".env.local")


def get_embedding(text: str) -> list[float]:
    """Embed text via HuggingFace Inference API (BAAI/bge-m3); local fallback."""
    import urllib.request

    hf_token = os.getenv("HF_TOKEN") or os.getenv("HF_API_KEY")
    if hf_token:
        try:
            url = (
                "https://router.huggingface.co/hf-inference/pipeline"
                "/feature-extraction/BAAI/bge-m3"
            )
            body = json.dumps(
                {"inputs": text, "options": {"wait_for_model": True}}
            ).encode()
            req = urllib.request.Request(
                url, data=body,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {hf_token}",
                },
            )
            with urllib.request.urlopen(req, timeout=30) as r:
                result = json.loads(r.read())
                if isinstance(result, list):
                    return result
        except Exception as e:
            print(f"  [HF] API failed ({e}) — falling back to local model…")

    try:
        from sentence_transformers import SentenceTransformer
        global _local_model
        if "_local_model" not in globals():
            print("Loading BAAI/bge-m3 locally (first run — may take a moment)…")
            _local_model = SentenceTransformer("BAAI/bge-m3")
        return _local_model.encode(text).tolist()
    except ImportError:
        raise RuntimeError(
            "No HF_TOKEN configured and sentence-transformers is not installed.\n"
            "Add HF_TOKEN to .env.local or run: pip install sentence-transformers"
        )


# ── Text extraction ───────────────────────────────────────────────────────────

def extract_html(path: Path) -> str:
    """
    Extract clean prose from a site-rendered HTML book file.
    Targets the .book-text-content wrapper produced by allbooks.md rules.
    All <script>, <style>, <head>, and navigation tags are stripped first.
    Block elements (p, headings, li…) are replaced with their text + blank
    lines so the paragraph-aware chunker can split correctly.
    """
    soup = BeautifulSoup(
        path.read_text(encoding="utf-8", errors="ignore"), "html.parser"
    )

    for tag in soup(["script", "style", "head", "nav", "footer", "meta", "link"]):
        tag.decompose()

    content = (
        soup.find(class_="book-text-content")
        or soup.body
        or soup
    )

    # Replace block elements with text + surrounding blank lines.
    # Done in-place so nested tags don't produce duplicated content
    # (once a <p> is replaced, its parent <div> only sees plain text).
    for tag in content.find_all([
        "p", "h1", "h2", "h3", "h4", "h5", "h6",
        "li", "blockquote", "br", "hr",
    ]):
        tag.replace_with("\n\n" + tag.get_text(" ", strip=True) + "\n\n")

    return _normalise(content.get_text(" "))


def extract_txt(path: Path) -> str:
    """
    Read a plain-text corpus file; strip Gutenberg header/footer if present.
    """
    text = path.read_text(encoding="utf-8", errors="ignore")

    text = re.sub(
        r"\*\*\* START OF TH(?:IS|E) PROJECT GUTENBERG EBOOK.*?\*\*\*",
        "", text, flags=re.DOTALL | re.IGNORECASE,
    )
    text = re.sub(
        r"\*\*\* END OF TH(?:IS|E) PROJECT GUTENBERG EBOOK.*",
        "", text, flags=re.DOTALL | re.IGNORECASE,
    )
    return _normalise(text)


def strip_google_header(text: str) -> str:
    """
    Remove the standard Google Books boilerplate that prefixes every
    Internet Archive OCR file. The boilerplate is reliably in the
    first ~80 lines; we find the last line containing a known marker
    phrase, then skip to the first non-empty line after it.
    """
    lines = text.split("\n")
    last_boilerplate = -1

    for i, line in enumerate(lines[:100]):
        if any(m in line.lower() for m in GOOGLE_BOILERPLATE_MARKERS):
            last_boilerplate = i

    if last_boilerplate == -1:
        return text  # no Google header found

    for i in range(last_boilerplate + 1, min(last_boilerplate + 30, len(lines))):
        if lines[i].strip():
            return "\n".join(lines[i:])

    return text


def _normalise(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)    # collapse horizontal whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)  # collapse excess blank lines
    return text.strip()


# ── Chunking ──────────────────────────────────────────────────────────────────

def chunk_paragraphs(text: str, target: int = CHUNK_TARGET_WORDS) -> list[str]:
    """
    Split text into retrieval chunks at paragraph boundaries.

    Never cuts mid-sentence. The last paragraph of each chunk is carried
    into the next chunk as overlap, so a quote or joke setup at a boundary
    is always retrievable in context.

    Very short paragraphs (dialogue, chapter headings) are grouped
    together until the target is reached. A single paragraph that
    exceeds the target on its own is kept as one chunk rather than split.
    """
    paras = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]

    chunks: list[str] = []
    current: list[str] = []
    current_words = 0

    for para in paras:
        w = len(para.split())

        if current_words >= target and current:
            chunks.append("\n\n".join(current))
            # Overlap: seed the next chunk with the last paragraph of this one
            current = [current[-1]]
            current_words = len(current[0].split())

        current.append(para)
        current_words += w

    if current:
        chunks.append("\n\n".join(current))

    return chunks


# ── Source collection ─────────────────────────────────────────────────────────

def _work_title(path: Path) -> str:
    return path.stem.replace("-", " ").replace("_", " ")


def collect_sources() -> list[dict]:
    """
    Return all source descriptors in processing order.
    Each descriptor:
        path      Path object to the file
        source    short label ("books", "marks-awareness", …)
        type      semantic type for Qdrant payload filtering
        work      human-readable work title
        extractor callable(Path) → str
    """
    sources: list[dict] = []

    # 1. Canonical cleaned books — the HTML in src/data/books/ is the
    #    most thoroughly curated version: allbooks.md rules applied,
    #    Gutenberg boilerplate gone, editor forewords stripped,
    #    illustrations moved to gallery. Use these, not converted/ or
    #    project-gutenberg/Works/ txt files.
    if BOOKS_DIR.exists():
        for p in sorted(BOOKS_DIR.glob("*.html")):
            sources.append({
                "path": p, "source": "books", "type": "literary",
                "work": _work_title(p), "extractor": extract_html,
            })
    else:
        print(f"WARNING: books dir not found: {BOOKS_DIR}")

    # 2. marks-awareness — contemporary briefing files (plain txt).
    #    Read the paired .meta.json for the document type when available.
    if MARKS_DIR.exists():
        for p in sorted(MARKS_DIR.glob("*.txt")):
            doc_type = "awareness"
            meta_path = p.with_suffix(".meta.json")
            if meta_path.exists():
                try:
                    meta = json.loads(meta_path.read_text(encoding="utf-8"))
                    doc_type = meta.get("type", "awareness")
                except Exception:
                    pass
            sources.append({
                "path": p, "source": "marks-awareness", "type": doc_type,
                "work": _work_title(p), "extractor": extract_txt,
            })

    # 3. Wikisource — Works About Twain (secondary biographical sources).
    if WIKISOURCE_DIR.exists():
        for p in sorted(WIKISOURCE_DIR.glob("*.txt")):
            sources.append({
                "path": p, "source": "wikisource", "type": "biographical",
                "work": _work_title(p), "extractor": extract_txt,
            })

    # 4. Internet Archive — OCR'd archive material. Google Books header
    #    stripped before chunking. Quality varies; kept for coverage.
    if INTERNET_ARCHIVE_DIR.exists():
        def ia_extract(path: Path) -> str:
            return strip_google_header(extract_txt(path))

        for p in sorted(INTERNET_ARCHIVE_DIR.rglob("*.txt")):
            sources.append({
                "path": p, "source": "internet-archive", "type": "archival",
                "work": _work_title(p), "extractor": ia_extract,
            })

    return sources


# ── State / resume ────────────────────────────────────────────────────────────

def load_state() -> set[str]:
    if STATE_FILE.exists():
        try:
            return set(json.loads(STATE_FILE.read_text(encoding="utf-8")))
        except Exception:
            return set()
    return set()


def save_state(done: set[str]) -> None:
    STATE_FILE.write_text(
        json.dumps(sorted(done), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def chunk_id(file_key: str, idx: int) -> str:
    """Deterministic UUID5 so re-runs produce the same IDs (idempotent upserts)."""
    return str(uuid.uuid5(ID_NAMESPACE, f"{file_key}:{idx}"))


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    done = load_state()
    sources = collect_sources()

    remaining = [s for s in sources if f"{s['source']}:{s['path'].name}" not in done]

    print(f"Sources discovered : {len(sources)}")
    print(f"Already embedded   : {len(done)}")
    print(f"To process         : {len(remaining)}")
    print()

    total_chunks = 0

    with OUTPUT_JSONL.open("a", encoding="utf-8") as out:
        for src in sources:
            path: Path = src["path"]
            file_key = f"{src['source']}:{path.name}"

            if file_key in done:
                continue

            t0 = time.time()
            print(f"  [{src['source']}]  {path.name}")

            try:
                text = src["extractor"](path)
            except Exception as e:
                print(f"    ✗ extraction failed: {e}")
                done.add(file_key)
                save_state(done)
                continue

            if not text:
                print("    ✗ empty after extraction — skipped")
                done.add(file_key)
                save_state(done)
                continue

            chunks = chunk_paragraphs(text)

            for idx, chunk in enumerate(chunks):
                try:
                    vector = get_embedding(chunk)
                except Exception as e:
                    print(f"    ✗ embedding failed at chunk {idx}: {e}")
                    break

                record = {
                    "id": chunk_id(file_key, idx),
                    "vector": vector if isinstance(vector, list) else list(vector),
                    "payload": {
                        "text":        chunk,
                        "filename":    path.name,
                        "source":      src["source"],
                        "work":        src["work"],
                        "type":        src["type"],
                        "chunk_index": idx,
                    },
                }
                out.write(json.dumps(record, ensure_ascii=False) + "\n")

            out.flush()
            done.add(file_key)
            save_state(done)

            dt = time.time() - t0
            total_chunks += len(chunks)
            print(f"    → {len(chunks)} chunks  ({dt:.1f}s)")

    print(f"\nDone. {total_chunks} chunks written to {OUTPUT_JSONL}")


if __name__ == "__main__":
    main()
