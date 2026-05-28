import sys
import json
import os

# Suppress Hugging Face tokenizers warnings and standard logs
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from sentence_transformers import SentenceTransformer

# Load model (uses Hugging Face hub cache)
model = SentenceTransformer('BAAI/bge-m3')

def main():
    # Read query from command line arguments or standard input
    if len(sys.argv) > 1:
        query = sys.argv[1]
    else:
        query = sys.stdin.read()
    
    if not query.strip():
        print(json.dumps({"error": "Empty query"}))
        return
        
    # Generate embedding vector
    embedding = model.encode(query).tolist()
    print(json.dumps(embedding))

if __name__ == "__main__":
    main()
