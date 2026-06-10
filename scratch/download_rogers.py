import urllib.request
import re
import os

urls = [
    "https://www.gutenberg.org/ebooks/3184.txt.utf-8",
    "https://www.gutenberg.org/cache/epub/3184/pg3184.txt"
]

headers = {'User-Agent': 'Mozilla/5.0'}
text = None

for url in urls:
    print(f"Trying to fetch from {url}...")
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            text = response.read().decode('utf-8')
        print(f"Successfully downloaded text of length: {len(text)}")
        break
    except Exception as e:
        print(f"Failed: {e}")

if text:
    # Look for "This man Rogers happened upon me"
    start_idx = text.find("This man Rogers happened upon me")
    if start_idx == -1:
        start_idx = text.find("This Man Rogers happened upon me")
        
    if start_idx != -1:
        print("Found opening at index:", start_idx)
        # Search backwards for "ROGERS" (likely the title of the chapter)
        search_range = text[max(0, start_idx - 1000):start_idx]
        title_match = list(re.finditer(r'\bROGERS\b', search_range))
        if title_match:
            title_offset = title_match[-1].start()
            title_idx = max(0, start_idx - 1000) + title_offset
            print("Found title 'ROGERS' at index:", title_idx)
        else:
            title_idx = start_idx
            
        # The next text might be the gutenberg end marker: "*** END OF THE PROJECT GUTENBERG"
        end_idx = text.find("*** END OF THE PROJECT GUTENBERG", start_idx)
        if end_idx == -1:
            end_idx = len(text)
        
        story_text = text[title_idx:end_idx].strip()
        # Save to scratch/rogers_extracted.txt
        script_dir = os.path.dirname(os.path.abspath(__file__))
        out_path = os.path.join(script_dir, "rogers_extracted.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(story_text)
        print(f"Successfully extracted Rogers text and saved to {out_path}")
    else:
        print("Could not find opening of Rogers in downloaded text.")
else:
    print("Could not download text from any URL.")
