import json
from pathlib import Path

# Paths
state_file = Path(r"e:\development\mark-twain\rag\data-collection\TwainCorpus\embed_corpus.state.json")
marks_dir = Path(r"e:\development\mark-twain\rag\data-collection\TwainCorpus\marks-awareness")

if state_file.exists():
    with open(state_file, "r", encoding="utf-8") as f:
        done = json.load(f)
    
    # Get all text files in marks-awareness
    marks_files = {p.name for p in marks_dir.glob("*") if p.suffix.lower() in (".txt", ".html")}
    
    # Filter out marks-awareness files from state
    initial_count = len(done)
    done_filtered = [f for f in done if f not in marks_files]
    final_count = len(done_filtered)
    
    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(done_filtered, f, ensure_ascii=False, indent=2)
        
    print(f"Removed {initial_count - final_count} marks-awareness files from {state_file.name}.")
    print(f"Remaining items in state: {final_count}")
else:
    print("State file does not exist. No action needed.")
