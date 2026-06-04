import os
import time
from dotenv import load_dotenv
from qdrant_client import QdrantClient

print("1. Loading environment variables...")
load_dotenv()

QDRANT_URL = "https://08ab60e3-e210-44c0-b662-524102fd37c3.europe-west3-0.gcp.cloud.qdrant.io:6333"
API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "twain_test"

print("2. Importing local embedder model (BGE-M3)...")
t0 = time.time()
from embedder import get_embedding 
print(f"   -> Model initialized in {time.time() - t0:.1f} seconds.")

print("3. Connecting to Qdrant Cloud Client...")
client = QdrantClient(url=QDRANT_URL, api_key=API_KEY)

def search_twain_corpus(query_text: str, limit: int = 3):
    print(f"\n🔍 Encoding query: '{query_text}'...")
    query_vector = get_embedding(query_text)
    
    print("📡 Sending vector to Qdrant Cloud...")
    # Using query_points instead of search to match your local package version
    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=limit
    )
    
    print(f"\n📚 Found top {limit} matches:")
    for i, hit in enumerate(response.points, 1):
        print(f"\n--- MATCH #{i} (Score: {hit.score:.4f}) | Source: {hit.payload.get('filename')} ---")
        print(f"{hit.payload.get('text')[:400]}...") 
        
    return response.points

if __name__ == "__main__":
    user_question = "What did Mark Twain think about Christian Science?"
    search_twain_corpus(user_question)