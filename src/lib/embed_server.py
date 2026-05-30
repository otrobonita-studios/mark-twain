import sys
import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from sentence_transformers import SentenceTransformer

# Suppress Hugging Face tokenizers warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"

print("Loading BAAI/bge-m3 model into memory...")
model = SentenceTransformer('BAAI/bge-m3')
print("Model loaded successfully!")

class EmbeddingHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(post_data)
            text = data.get('text', '')
            if not text.strip():
                self.send_error_response("Empty text")
                return
            
            # Generate embedding vector
            embedding = model.encode(text).tolist()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(embedding).encode('utf-8'))
        except Exception as e:
            self.send_error_response(str(e))
            
    def send_error_response(self, message):
        self.send_response(400)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))

def run(port=5002):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, EmbeddingHandler)
    print(f"Embedding server running on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping embedding server...")
        httpd.server_close()

if __name__ == "__main__":
    port = 5002
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    run(port)
