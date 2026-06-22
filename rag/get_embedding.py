import sys
import json
import os
from pathlib import Path

# Suppress Hugging Face tokenizers warnings and standard logs
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Add TwainCorpus path to import the shared, API-enabled get_embedding
corpus_dir = Path(__file__).resolve().parent / "data-collection" / "TwainCorpus"
sys.path.append(str(corpus_dir))

try:
    from embedder import get_embedding
except ImportError as e:
    print(json.dumps({"error": f"Failed to import embedder: {str(e)}"}))
    sys.exit(1)

def main():
    # Read query from command line arguments or standard input
    if len(sys.argv) > 1:
        query = sys.argv[1]
    else:
        query = sys.stdin.read()
    
    if not query.strip():
        print(json.dumps({"error": "Empty query"}))
        return
        
    try:
        # Generate embedding vector (will use HF API if HF_TOKEN is set)
        embedding = get_embedding(query)
        print(json.dumps(embedding))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()

