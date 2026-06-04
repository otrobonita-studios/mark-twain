import os
import json
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
BATCH_SIZE = 50
MAX_RETRIES = 3
INPUT_JSONL = Path("vectors_cleaned.jsonl")

client = QdrantClient(url=QDRANT_URL, api_key=API_KEY, timeout=60)

def ensure_collection(dim):
    """Ensure the collection exists in Qdrant before uploading."""
    try:
        client.get_collection(COLLECTION_NAME)
        print(f"Collection '{COLLECTION_NAME}' already exists.")
        return
    except (UnexpectedResponse, Exception):
        pass
    
    client.recreate_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
    )
    print(f"Created fresh collection '{COLLECTION_NAME}' (dim={dim})")

def upsert_with_retry(batch, label):
    """Upload one batch with retry log logic on transient network issues."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            client.upsert(collection_name=COLLECTION_NAME, points=batch)
            return
        except Exception as e:
            wait = 5 * attempt
            print(f"  [RETRY] Attempt {attempt}/{MAX_RETRIES} for {label} failed: {e}")
            print(f"  [SLEEP] Waiting {wait}s before retrying...")
            time.sleep(wait)
    raise RuntimeError(f"Upsert critically failed {MAX_RETRIES} times for {label}")

def main():
    if not INPUT_JSONL.exists():
        print(f"Error: {INPUT_JSONL.name} not found!")
        return

    print(f"Starting cloud stream from {INPUT_JSONL.name} to Qdrant...")
    
    points = []
    total_uploaded = 0
    
    # Open file and count total lines for progress logging
    with open(INPUT_JSONL, "r", encoding="utf-8") as f:
        total_lines = sum(1 for _ in f)
    
    # Read first line dynamically to determine vector size
    with open(INPUT_JSONL, "r", encoding="utf-8") as f:
        first_line = json.loads(f.readline())
        vector_dim = len(first_line["vector"])
    
    ensure_collection(vector_dim)

    # Stream file line by line
    with open(INPUT_JSONL, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, 1):
            data = json.loads(line)
            
            # Reconstruct the PointStruct from the JSON cache
            point = PointStruct(
                id=data["id"],
                vector=data["vector"],
                payload=data["payload"]
            )
            points.append(point)
            
            # Once the batch is full, push it up
            if len(points) == BATCH_SIZE:
                label = f"Points {idx - BATCH_SIZE + 1} to {idx}"
                upsert_with_retry(points, label)
                total_uploaded += len(points)
                print(f"  -> Uploaded {total_uploaded}/{total_lines} vectors...")
                points = [] # Clear the batch
        
        # Catch any remaining points at the end of the file
        if points:
            label = f"Final remaining points"
            upsert_with_retry(points, label)
            total_uploaded += len(points)
            print(f"  -> Uploaded final batch! Total: {total_uploaded}/{total_lines} vectors.")

    print("\n🎉 Success! Your clean Twain corpus is fully live in Qdrant Cloud!")

if __name__ == "__main__":
    main()