import os
import json
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from qdrant_client.http.exceptions import UnexpectedResponse

from corpus_cleaner import process_file  # Din städare
from embedder import get_embedding       # Din modell

load_dotenv()

QDRANT_URL = "https://08ab60e3-e210-44c0-b662-524102fd37c3.europe-west3-0.gcp.cloud.qdrant.io:6333"
API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "twain_test"
BATCH_SIZE = 50
MAX_RETRIES = 3
STATE_FILE = Path("vector_uploader.state.json")

client = QdrantClient(url=QDRANT_URL, api_key=API_KEY, timeout=60)


def ensure_collection():
    """Create the Qdrant collection on first run, using the embedding dimension."""
    try:
        client.get_collection(COLLECTION_NAME)
        return
    except (UnexpectedResponse, Exception):
        pass
    sample_vec = get_embedding("dimensionality probe")
    client.recreate_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=len(sample_vec), distance=Distance.COSINE),
    )
    print(f"Created collection {COLLECTION_NAME} (dim={len(sample_vec)})")


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


def upsert_with_retry(batch: list[PointStruct], label: str) -> None:
    """Upsert one batch, retrying on transient errors with backoff."""
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            client.upsert(collection_name=COLLECTION_NAME, points=batch)
            return
        except Exception as e:
            last_err = e
            wait = 5 * attempt
            print(f"  retry {attempt}/{MAX_RETRIES} for {label} after error: {e}")
            print(f"  sleeping {wait}s...")
            time.sleep(wait)
    raise RuntimeError(f"upsert failed {MAX_RETRIES} times for {label}: {last_err}")


def index_corpus(corpus_path: str) -> None:
    corpus_root = Path(corpus_path)
    ensure_collection()

    done = load_state()
    if done:
        print(f"Resume: {len(done)} files already indexed; will skip them.")

    files = sorted(
        p for p in corpus_root.rglob("*")
        if p.suffix.lower() in ('.txt', '.html')
        and "bibliography" not in p.name.lower()
    )
    print(f"Found {len(files)} candidate files.")

    for file_path in files:
        if file_path.name in done:
            print(f"skip (already indexed): {file_path.name}")
            continue

        t0 = time.time()
        print(f"Indexerar: {file_path.name}")

        text = process_file(file_path)
        if not text:
            print("  (empty after cleaning, skipping)")
            done.add(file_path.name)
            save_state(done)
            continue

        words = text.split()
        chunks = [' '.join(words[i:i + 500]) for i in range(0, len(words), 500)]
        t_after_chunks = time.time()

        # Skapa alla poäng
        points = [PointStruct(
            id=str(uuid.uuid4()),
            vector=get_embedding(chunk),
            payload={"text": chunk, "filename": file_path.name}
        ) for chunk in chunks]
        t_after_embed = time.time()

        # Ladda upp i batchar om 50 för att undvika timeout
        for i in range(0, len(points), BATCH_SIZE):
            batch = points[i:i + BATCH_SIZE]
            label = f"{file_path.name} batch {i // BATCH_SIZE + 1}"
            upsert_with_retry(batch, label)
            print(f"  -> Uppladdat batch: {i + len(batch)}/{len(points)} vektorer.")
        t_after_upload = time.time()

        # Persist progress only after a file is fully indexed
        done.add(file_path.name)
        save_state(done)

        embed_s = t_after_embed - t_after_chunks
        upload_s = t_after_upload - t_after_embed
        total_s = t_after_upload - t0
        print(
            f"Klar med {file_path.name}!  "
            f"({len(chunks)} chunks, embed {embed_s:.1f}s, upload {upload_s:.1f}s, "
            f"total {total_s:.1f}s)"
        )


if __name__ == "__main__":
    index_corpus(r"E:\development\mark-twain\rag\data-collection\TwainCorpus")