import json
from pathlib import Path

OLD_JSONL = Path("vectors.jsonl")
NEW_JSONL = Path("vectors_cleaned.jsonl")

if not OLD_JSONL.exists():
    print("Could not find vectors.jsonl!")
    exit()

print("Filtering out HTML duplicates from your embeddings archive...")
keep_count = 0
drop_count = 0

with open(OLD_JSONL, "r", encoding="utf-8") as infile, \
     open(NEW_JSONL, "w", encoding="utf-8") as outfile:
    
    for line in infile:
        data = json.loads(line)
        # Check if the filename in the payload ends with .html
        filename = data.get("payload", {}).get("filename", "").lower()
        
        if filename.endswith(".html"):
            drop_count += 1
        else:
            outfile.write(json.dumps(data, ensure_ascii=False) + "\n")
            keep_count += 1

print(f"Done! Dropped {drop_count} HTML entries.")
print(f"Saved {keep_count} pure text entries to {NEW_JSONL.name}.")