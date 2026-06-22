import os
import urllib.request
import json
from pathlib import Path

# Helper to load env vars from .env.local up parent directories
def load_env_local():
    current = Path(__file__).resolve().parent
    for _ in range(5):
        env_path = current / ".env.local"
        if env_path.exists():
            with env_path.open("r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip()
            break
        current = current.parent

load_env_local()

def get_embedding(text: str):
    hf_token = os.getenv("HF_TOKEN") or os.getenv("HF_API_KEY")
    if hf_token and hf_token != "your_hugging_face_token_here":
        try:
            url = "https://router.huggingface.co/hf-inference/pipeline/feature-extraction/BAAI/bge-m3"
            req = urllib.request.Request(
                url,
                data=json.dumps({"inputs": text, "options": {"wait_for_model": True}}).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {hf_token}"
                }
            )
            with urllib.request.urlopen(req, timeout=30) as res:
                embedding = json.loads(res.read().decode("utf-8"))
                if isinstance(embedding, list):
                    return embedding
        except Exception as e:
            print(f"HF Inference API failed ({e}). Falling back to local SentenceTransformer...")

    # Fallback to local sentence-transformers
    try:
        from sentence_transformers import SentenceTransformer
        global _local_model
        if '_local_model' not in globals():
            print("Loading BAAI/bge-m3 model locally (this might take a while)...")
            _local_model = SentenceTransformer('BAAI/bge-m3')
        return _local_model.encode(text).tolist()
    except ImportError:
        raise RuntimeError(
            "HF_TOKEN is not configured, and local 'sentence-transformers' package is not installed.\n"
            "Please configure HF_TOKEN in .env.local or run: pip install sentence-transformers"
        )

if __name__ == "__main__":
    test_text = "Mark Twain was a great American humorist."
    vector = get_embedding(test_text)
    
    print(f"Text: {test_text}")
    print(f"Vektorns längd (antal dimensioner): {len(vector)}")
    print(f"Första 5 värdena i embeddingen: {vector[:5]}")