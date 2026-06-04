from sentence_transformers import SentenceTransformer

# 1. Ladda modellen
model = SentenceTransformer('BAAI/bge-m3')

def get_embedding(text: str):
    # .tolist() gör om numpy-arrayen från modellen till en vanlig Python-lista
    return model.encode(text).tolist()

# 2. Test-del
if __name__ == "__main__":
    test_text = "Mark Twain was a great American humorist."
    vector = get_embedding(test_text)
    
    print(f"Text: {test_text}")
    print(f"Vektorns längd (antal dimensioner): {len(vector)}")
    print(f"Första 5 värdena i embeddingen: {vector[:5]}")