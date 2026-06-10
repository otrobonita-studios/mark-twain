import urllib.request
import re

url = "https://www.gutenberg.org/ebooks/9027"
headers = {'User-Agent': 'Mozilla/5.0'}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    print("Downloaded landing page successfully. Links on page:")
    links = re.findall(r'href="([^"]+)"', html)
    for link in links:
        if "9027" in link or "txt" in link or "html" in link:
            print("  ", link)
except Exception as e:
    print("Error:", e)
