import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from openai import OpenAI
from embedder import get_embedding

load_dotenv()

# Qdrant Config
QDRANT_URL = "https://08ab60e3-e210-44c0-b662-524102fd37c3.europe-west3-0.gcp.cloud.qdrant.io:6333"
API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "twain_test"

# Local LLM Config (Pointed to your running local server)
LOCAL_LLM_URL = "http://localhost:1234/v1" 

qdrant_client = QdrantClient(url=QDRANT_URL, api_key=API_KEY)
llm_client = OpenAI(base_url=LOCAL_LLM_URL, api_key="lm-studio-local-fake-key")

def get_context(query_text: str, limit: int = 3) -> str:
    """Retrieves relevant text chunks from Qdrant."""
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

def ask_twain_bot(question: str):
    # 1. Fetch historical data matching the question
    print("📡 Gathering historical reference material from Qdrant Cloud...")
    context = get_context(question, limit=3)
    
    # 2. Build the augmented prompt
    system_prompt = (
        "You are an expert literary assistant specializing in Mark Twain. "
        "Answer the user's question accurately using ONLY the provided historical text context. "
        "If the context does not contain the answer, rely on your general knowledge but clearly state what the original documents say."
    )
    
    user_prompt = f"Context from Mark Twain's corpus:\n{context}\n\nQuestion: {question}\nAnswer:"
    
    print(f"🤖 Sending data to your local LLM on {LOCAL_LLM_URL}...")
    
    # 3. Stream the answer from your local model
    response = llm_client.chat.completions.create(
        model="local-model", # The server automatically routes to whichever model you loaded
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
    )
    
    print("\n📝 ANSWER:")
    print(response.choices[0].message.content)

if __name__ == "__main__":
    user_query = "What did Mark Twain think about Christian Science?"
    ask_twain_bot(user_query)