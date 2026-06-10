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
    for idx in matches[:20]:
        snippet = text[max(0, idx-40):min(len(text), idx+40)].strip().replace('\n', ' ')
        print(f"Index {idx}: {snippet}")
except Exception as e:
    print(e)
