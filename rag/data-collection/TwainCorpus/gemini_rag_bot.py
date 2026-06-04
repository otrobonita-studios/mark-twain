import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from google import genai
from google.genai import types
from embedder import get_embedding

load_dotenv()

# 1. Konfiguration för Qdrant Cloud
QDRANT_URL = "https://08ab60e3-e210-44c0-b662-524102fd37c3.europe-west3-0.gcp.cloud.qdrant.io:6333"
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "twain_test"

# 2. Initiera klienter (Söker automatiskt efter GEMINI_API_KEY i din .env)
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
gemini_client = genai.Client()

def get_context_from_qdrant(query_text: str, limit: int = 3) -> str:
    """Hämtar relevanta textstycken från din Qdrant-databas i molnet."""
    query_vector = get_embedding(query_text)
    response = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=limit
    )
    
    context_chunks = []
    for hit in response.points:
        context_chunks.append(f"[Source: {hit.payload.get('filename')}]: {hit.payload.get('text')}")
    
    return "\n\n".join(context_chunks)

def ask_gemini_twain(question: str):
    # 1. Hämta den städa Twain-datan från Qdrant baserat på frågan
    print("📡 Hämtar källmaterial från Qdrant Cloud...")
    context = get_context_from_qdrant(question, limit=3)
    
    # 2. Skapa systeminstruktionen som låser fast Gemini till datan (Vår Read & Guessless-regel)
    system_prompt = (
        "You are an expert literary assistant specializing in Mark Twain. "
        "Answer the user's question accurately using ONLY the provided historical text context. "
        "If the context does not contain the answer, rely on your general knowledge but clearly state what the original documents say."
    )
    
    user_prompt = f"Context from Mark Twain's corpus:\n{context}\n\nQuestion: {question}\nAnswer:"
    
    print("✨ Strömmar svar från Gemini 2.5 Flash...")
    print("\n📝 GEMINI ANSWER:")
    
    # 3. Strömma svaret direkt till terminalen token för token
    response_stream = gemini_client.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.3
        )
    )
    
    for chunk in response_stream:
        print(chunk.text, end="", flush=True)
    print("\n")

if __name__ == "__main__":
    user_query = "What did Mark Twain think about Christian Science?"
    ask_gemini_twain(user_query)