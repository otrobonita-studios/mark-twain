import urllib.request
import re

url = "https://www.gutenberg.org/ebooks/search/?query=Alonzo+Fitz+and+Other+Stories"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.urlopen(req) if hasattr(urllib, 'urlopen') else urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    # Look for hrefs matching "/ebooks/[0-9]+"
    matches = re.findall(r'/ebooks/(\d+)', html)
    print("Found eBook IDs in search results:", matches)
except Exception as e:
    print(e)
