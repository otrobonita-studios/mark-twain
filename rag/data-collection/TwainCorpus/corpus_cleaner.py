import os
import re
from bs4 import BeautifulSoup
from pathlib import Path

# Sökväg
CORPUS_ROOT = Path(__file__).resolve().parent

def clean_gutenberg(text):
    text = re.sub(r'\*\*\* START OF THIS PROJECT GUTENBERG EBOOK.*?\*\*\*', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'\*\*\* END OF THIS PROJECT GUTENBERG EBOOK.*', '', text, flags=re.DOTALL | re.IGNORECASE)
    return text.strip()

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        if "project-gutenberg" in str(file_path).lower():
            return clean_gutenberg(content)
        
        return content.strip()
        
    except Exception as e:
        print(f"Kunde inte processa {file_path}: {e}")
        return None

if __name__ == "__main__":
    print("Startar städning av hela korpusen...")
    
    # Rglod hämtar alla filer rekursivt
    for file_path in CORPUS_ROOT.rglob("*"):
        
        # 1. Kolla om det är en fil vi vill jobba med
        if file_path.suffix.lower() in ['.txt', '.html']:
            
            # 2. Hoppa över bibliografi-filer
            if "bibliography" in file_path.name.lower():
                print(f"[SKIP] Bibliografi: {file_path.name}")
                continue
            
            # 3. Om vi kommit hit: Försök processa
            print(f"[START] Processar: {file_path.name}")
            cleaned = process_file(file_path)
            
            if cleaned:
                print(f"  [OK] Klar! Textlängd: {len(cleaned)} tecken")
            else:
                print(f"  [FAIL] Något gick fel med: {file_path.name}")
        
        # 4. Om det är en fil som inte är .txt eller .html
        elif file_path.is_file():
            print(f"[SKIP] Format: {file_path.name}")
            
        # 5. Om det är en mapp
        else:
            pass 

    print("\nAlla filer genomgångna!")