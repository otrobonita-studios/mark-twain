import urllib.request
import re

url = "https://www.gutenberg.org/ebooks/3433"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    title_match = re.search(r'<title>([\s\S]*?)</title>', html)
    if title_match:
        print("Title:", title_match.group(1).strip())
    else:
        print("Title not found.")
except Exception as e:
    print(e)
