import urllib.request
import os

url = "https://www.gutenberg.org/cache/epub/3184/pg3184.txt"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        text = response.read().decode('utf-8')
    lines = text.split('\n')
    output = []
    output.append("Downloaded eBook 3184. First 50 lines:")
    for i in range(min(50, len(lines))):
        output.append(f"{i+1}: {lines[i].strip()}")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(script_dir, "read_3184_start.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(output))
    print(f"Successfully wrote start to {out_path}")
except Exception as e:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(script_dir, "read_3184_start.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(str(e))
    print("Failed and wrote error.")
