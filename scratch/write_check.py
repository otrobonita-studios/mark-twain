with open("scratch/download_rogers.py", "r") as f:
    code = f.read()

# Let's write check_text.py
check_code = """
import urllib.request
import re

url = "https://www.gutenberg.org/ebooks/3433.txt.utf-8"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        text = response.read().decode('utf-8')
    print("Length:", len(text))
    # Find all occurrences of the word Rogers
    matches = [m.start() for m in re.finditer(r'(?i)rogers', text)]
    print("Found", len(matches), "occurrences of 'rogers'")
    for idx in matches[:10]:
        print(f"Index {idx}: {text[max(0, idx-40):min(len(text), idx+40)].strip().replace('\\n', ' ')}")
except Exception as e:
    print(e)
"""

with open("e:/development/mark-twain/scratch/check_text.py", "w", encoding="utf-8") as f:
    f.write(check_code)
print("Wrote check_text.py")
