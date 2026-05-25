from sentence_transformers import SentenceTransformer

# 1. Ladda BGE-M3 (körs lokalt på din CPU/GPU)
# Denna modell är utmärkt för både sökning och embedding
model = SentenceTransformer('BAAI/bge-m3')

def get_embedding(text: str):
    # Skapar vektorn (värdet)
    return model.encode(text)

# Testa med en mening
test_text = "Mark Twain was a great American humorist."
vector = get_embedding(test_text)

print(f"Text: {test_text}")
print(f"Vektorns längd (antal dimensioner): {len(vector)}")
print(f"Första 5 värdena i embeddingen: {vector[:5]}")