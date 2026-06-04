"""Phase 1: chunk + embed the corpus locally; write everything to vectors.jsonl.

Doesn't talk to Qdrant at all. Pure local work.

Output: one JSON line per chunk, shape:
    {"id": "<uuid5>", "vector": [...384 floats...], "payload": {...}}

Resume: tracks completed files in embed_corpus.state.json. Crash, restart,
no re-embedding.

IDs are deterministic (UUID5 of filename + chunk index) so re-running this
script overwrites the same lines and the upload phase is idempotent.

Run:
    python embed_corpus.py
"""

import json
import os
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv

from corpus_cleaner import process_file  # Din städare
from embedder import get_embedding       # Din modell

load_dotenv()

CORPUS_DIR = Path(__file__).resolve().parent
OUTPUT_JSONL = Path(__file__).resolve().parent / "vectors.jsonl"
STATE_FILE = Path(__file__).resolve().parent / "embed_corpus.state.json"
CHUNK_WORDS = 500

# Fixed namespace so chunk IDs are deterministic across runs.
# Any constant UUID works; the value doesn't matter as long as it stays the same.
ID_NAMESPACE = uuid.UUID("a1b2c3d4-1111-4222-8333-444444444444")


def chunk_id(filename: str, idx: int) -> str:
    return str(uuid.uuid5(ID_NAMESPACE, f"{filename}:{idx}"))


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


def find_files(root: Path) -> list[Path]:
    return sorted(
        p for p in root.rglob("*")
        if p.suffix.lower() in (".txt", ".html")
        and "bibliography" not in p.name.lower()
    )


def to_list(vec) -> list[float]:
    """Coerce numpy arrays / torch tensors to plain lists for JSON serialization."""
    if hasattr(vec, "tolist"):
        return vec.tolist()
    return list(vec)


def embed_corpus(corpus_path: str) -> None:
    root = Path(corpus_path)
    done = load_state()
    files = find_files(root)
    print(f"Found {len(files)} candidate files. {len(done)} already embedded.")

    # Append mode -- resume safe, won't truncate previous runs.
    with OUTPUT_JSONL.open("a", encoding="utf-8") as out:
        for file_path in files:
            if file_path.name in done:
                print(f"skip: {file_path.name}")
                continue

            t0 = time.time()
            print(f"Embedding: {file_path.name}")

            text = process_file(file_path)
            if not text:
                print("  (empty after cleaning)")
                done.add(file_path.name)
                save_state(done)
                continue

            words = text.split()
            chunks = [
                " ".join(words[i:i + CHUNK_WORDS])
                for i in range(0, len(words), CHUNK_WORDS)
            ]

            for idx, chunk in enumerate(chunks):
                record = {
                    "id": chunk_id(file_path.name, idx),
                    "vector": to_list(get_embedding(chunk)),
                    "payload": {
                        "text": chunk,
                        "filename": file_path.name,
                        "chunk_index": idx,
                    },
                }
                out.write(json.dumps(record, ensure_ascii=False))
                out.write("\n")
            out.flush()  # don't lose work on crash

            done.add(file_path.name)
            save_state(done)

            dt = time.time() - t0
            rate = len(chunks) / dt if dt > 0 else 0
            print(f"  -> {len(chunks)} chunks in {dt:.1f}s ({rate:.1f} chunks/s)")

    print(f"\nDone. Output: {OUTPUT_JSONL.resolve()}")


if __name__ == "__main__":
    embed_corpus(CORPUS_DIR)
