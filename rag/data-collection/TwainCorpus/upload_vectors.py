"""Phase 2: read vectors.jsonl and bulk-upload to Qdrant.

Reads the JSONL produced by embed_corpus.py and pushes to Qdrant in large
batches (default 250 vectors per upsert). Retries on transient errors.

Resume: tracks the number of lines already uploaded in
upload_vectors.state.json. Crash or Ctrl-C, restart, picks up at the next
unsent line. Combined with deterministic IDs from embed_corpus.py, the whole
pipeline is idempotent -- you can re-run any phase without creating duplicates.

Auto-creates the Qdrant collection on first run using the embedding dimension
from the first JSONL record.

Run:
    python upload_vectors.py
"""

import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from qdrant_client.http.exceptions import UnexpectedResponse

load_dotenv()

QDRANT_URL = "https://08ab60e3-e210-44c0-b662-524102fd37c3.europe-west3-0.gcp.cloud.qdrant.io:6333"
API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "twain_test"
INPUT_JSONL = Path(__file__).resolve().parent / "vectors.jsonl"
STATE_FILE = Path(__file__).resolve().parent / "upload_vectors.state.json"
BATCH_SIZE = 250
MAX_RETRIES = 3

client = QdrantClient(url=QDRANT_URL, api_key=API_KEY, timeout=60)


def ensure_collection(vector_size: int) -> None:
    try:
        client.get_collection(COLLECTION_NAME)
        return
    except (UnexpectedResponse, Exception):
        pass
    client.recreate_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )
    print(f"Created collection {COLLECTION_NAME} (dim={vector_size})")


def load_state() -> int:
    if STATE_FILE.exists():
        try:
            return int(json.loads(STATE_FILE.read_text(encoding="utf-8")).get("lines_uploaded", 0))
        except Exception:
            return 0
    return 0


def save_state(n: int) -> None:
    STATE_FILE.write_text(
        json.dumps({"lines_uploaded": n}, indent=2),
        encoding="utf-8",
    )


def upsert_with_retry(points: list[PointStruct], label: str) -> None:
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            client.upsert(collection_name=COLLECTION_NAME, points=points)
            return
        except Exception as e:
            last_err = e
            wait = 5 * attempt
            print(f"  retry {attempt}/{MAX_RETRIES} for {label}: {e}")
            print(f"  sleeping {wait}s...")
            time.sleep(wait)
    raise RuntimeError(f"upsert failed {MAX_RETRIES} times for {label}: {last_err}")


def count_lines(path: Path) -> int:
    with path.open("rb") as f:
        return sum(1 for _ in f)


def upload() -> None:
    if not INPUT_JSONL.exists():
        print(f"Missing {INPUT_JSONL}. Run embed_corpus.py first.")
        return

    total = count_lines(INPUT_JSONL)
    already = load_state()
    remaining = total - already
    print(f"vectors.jsonl: {total:,} lines, {already:,} already uploaded, {remaining:,} to go.")

    if already >= total:
        print("Nothing to upload.")
        return

    # Peek first line to learn the vector dimension; create collection if needed.
    with INPUT_JSONL.open("r", encoding="utf-8") as f:
        first = json.loads(f.readline())
    ensure_collection(len(first["vector"]))

    t0 = time.time()
    batch: list[PointStruct] = []
    n = already  # cumulative line counter, including the skip portion

    with INPUT_JSONL.open("r", encoding="utf-8") as f:
        # Skip already-uploaded lines
        for _ in range(already):
            f.readline()

        for line in f:
            rec = json.loads(line)
            batch.append(PointStruct(
                id=rec["id"],
                vector=rec["vector"],
                payload=rec.get("payload", {}),
            ))
            if len(batch) >= BATCH_SIZE:
                label = f"lines {n + 1:,}..{n + len(batch):,}"
                upsert_with_retry(batch, label)
                n += len(batch)
                save_state(n)
                elapsed = time.time() - t0
                rate = (n - already) / elapsed if elapsed > 0 else 0
                eta_s = (total - n) / rate if rate > 0 else 0
                print(f"  uploaded {n:,}/{total:,}  ({rate:.0f} vec/s, ETA {eta_s:.0f}s)")
                batch = []

    if batch:
        label = f"final batch ({len(batch)} vectors)"
        upsert_with_retry(batch, label)
        n += len(batch)
        save_state(n)

    dt = time.time() - t0
    uploaded_this_run = n - already
    rate = uploaded_this_run / dt if dt > 0 else 0
    print(f"\nDone. Uploaded {uploaded_this_run:,} vectors in {dt:.1f}s ({rate:.0f} vec/s).")
    print(f"Collection {COLLECTION_NAME} now contains {n:,} vectors total.")


if __name__ == "__main__":
    upload()
