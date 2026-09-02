"""
stream_to_qdrant.py — Upload vectors.jsonl to Qdrant Cloud.

Reads:  vectors.jsonl (output of embed_corpus.py)
Writes: to the physical Qdrant collection named by QDRANT_COLLECTION env var.
        The value is required so an upload can never accidentally target the
        production alias.

Flags:
    --fresh   Delete and recreate the collection before uploading.
              WARNING: this wipes all existing vectors. Use for a clean
              re-embed after running embed_corpus.py from scratch.

Run:
    python stream_to_qdrant.py           # upsert into existing collection
    python stream_to_qdrant.py --fresh   # wipe + load clean corpus
"""

import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

SCRIPT_DIR   = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent

load_dotenv(PROJECT_ROOT / ".env.local")
load_dotenv(PROJECT_ROOT / ".env")

QDRANT_URL      = os.getenv("QDRANT_URL")
QDRANT_API_KEY  = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION")
INPUT_JSONL     = SCRIPT_DIR / "vectors.jsonl"
BATCH_SIZE      = 50
MAX_RETRIES     = 3
UPSERT_SLEEP    = 0.3   # seconds between every successful upsert (free-tier throttle)


def get_client() -> QdrantClient:
    if not QDRANT_URL:
        raise RuntimeError("QDRANT_URL not set — add it to .env.local")
    if not QDRANT_API_KEY:
        raise RuntimeError("QDRANT_API_KEY not set — add it to .env.local")
    if not COLLECTION_NAME:
        raise RuntimeError(
            "QDRANT_COLLECTION not set — name the physical upload target explicitly"
        )
    if COLLECTION_NAME == "twain_production":
        raise RuntimeError(
            "Refusing to upload through the production alias. "
            "Set QDRANT_COLLECTION to a versioned physical collection name."
        )
    return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)


def ensure_collection(client: QdrantClient, dim: int, fresh: bool) -> None:
    if fresh:
        try:
            client.delete_collection(COLLECTION_NAME)
            print(f"Deleted '{COLLECTION_NAME}'")
        except Exception:
            pass  # didn't exist yet

    try:
        info = client.get_collection(COLLECTION_NAME)
        count = info.points_count
        print(f"Collection '{COLLECTION_NAME}' exists ({count} vectors) — upserting.")
        return
    except Exception:
        pass

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
    )
    print(f"Created collection '{COLLECTION_NAME}' (dim={dim})")


def upsert_batch(
    client: QdrantClient,
    batch: list[PointStruct],
    label: str,
) -> None:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            client.upsert(collection_name=COLLECTION_NAME, points=batch)
            time.sleep(UPSERT_SLEEP)   # throttle: protect free-tier cluster
            return
        except Exception as e:
            wait = 2.0 * attempt       # exponential backoff (space-talks pattern)
            print(f"  [retry {attempt}/{MAX_RETRIES}] {label}: {e} — waiting {wait:.0f}s")
            time.sleep(wait)
    raise RuntimeError(f"Upsert failed {MAX_RETRIES} times for {label}")


def main() -> None:
    fresh = "--fresh" in sys.argv

    if not INPUT_JSONL.exists():
        print(f"Error: {INPUT_JSONL} not found.")
        print("Run embed_corpus.py first to generate it.")
        sys.exit(1)

    client = get_client()

    # Peek at first record for vector dimension
    with INPUT_JSONL.open(encoding="utf-8") as f:
        first = json.loads(f.readline())
        dim = len(first["vector"])

    total_lines = sum(1 for l in INPUT_JSONL.open(encoding="utf-8") if l.strip())

    ensure_collection(client, dim, fresh=fresh)
    print(f"\nUploading {total_lines} vectors from {INPUT_JSONL.name}…\n")

    batch: list[PointStruct] = []
    uploaded = 0
    skipped = 0

    with INPUT_JSONL.open(encoding="utf-8") as f:
        for idx, line in enumerate(f, 1):
            if not line.strip():
                continue   # skip blank lines (e.g. flush boundaries)
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                skipped += 1
                print(f"  [skip] line {idx}: malformed JSON (partial record) — skipping")
                continue

            # Flatten 2-D API responses [[v1, v2, ...]] → [v1, v2, ...]
            vector = data["vector"]
            if vector and isinstance(vector[0], list):
                vector = vector[0]

            batch.append(PointStruct(
                id=data["id"],
                vector=vector,
                payload=data["payload"],
            ))

            if len(batch) == BATCH_SIZE:
                upsert_batch(client, batch, f"rows {idx - BATCH_SIZE + 1}–{idx}")
                uploaded += len(batch)
                pct = 100 * uploaded / total_lines
                print(f"  {uploaded:>6} / {total_lines}  ({pct:.1f}%)")
                batch = []

    if batch:
        upsert_batch(client, batch, "final batch")
        uploaded += len(batch)

    print(f"\n✓ {uploaded} vectors live in '{COLLECTION_NAME}'.")
    if skipped:
        print(f"  {skipped} malformed lines skipped (partial records — negligible data loss).")
    print(f"  Qdrant: {QDRANT_URL}")


if __name__ == "__main__":
    main()
