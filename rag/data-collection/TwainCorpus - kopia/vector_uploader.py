import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
import uuid

my_new_id = str(uuid.uuid4())

# 1. Ladda konfiguration
load_dotenv()
QDRANT_URL = "https://08ab60e3-e210-44c0-b662-524102fd37c3.europe-west3-0.gcp.cloud.qdrant.io:6333"
API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "twain_test"

# 2. Skapa klienten
print(API_KEY)
client = QdrantClient(url=QDRANT_URL, api_key=API_KEY)

def test_connection():
    print("Testar anslutning till Qdrant...")
    
    # Skapa en samling för testet (1024 dimensioner matchar många populära modeller)
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
        )
        print(f"Samlingen '{COLLECTION_NAME}' skapad.")
    
    # Skapa en dummy-vektor (en lista med 1024 stycken 0.1)
    dummy_vector = [0.1] * 1024
    
    # Ladda upp en testpunkt
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=my_new_id,
                vector=dummy_vector, 
                payload={"title": "Test Twain", "source": "manual_test"}
            )
        ]
    )
    print("Testpunkt uppladdad!")
    
    # Hämta tillbaka den för att bekräfta
    point = client.retrieve(collection_name=COLLECTION_NAME, ids=[my_new_id])
    print(f"Lyckades hämta tillbaka: {point[0].payload}")

if __name__ == "__main__":
    try:
        test_connection()
    except Exception as e:
        print(f"Något gick fel: {e}")