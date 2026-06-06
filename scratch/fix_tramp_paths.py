import os
import re

file_path = r"e:\development\mark-twain\src\data\books\A-Tramp-Abroad.html"

if not os.path.exists(file_path):
    print("File not found:", file_path)
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace src="images/ with src="/images/book-illustrations/A-Tramp-Abroad/images/
# Also handles single quotes and data-zoom-src
fixed_content = content
fixed_content = re.sub(r'src=["\']images/', 'src="/images/book-illustrations/A-Tramp-Abroad/images/', fixed_content)
fixed_content = re.sub(r'href=["\']images/', 'href="/images/book-illustrations/A-Tramp-Abroad/images/', fixed_content)
fixed_content = re.sub(r'data-zoom-src=["\']images/', 'data-zoom-src="/images/book-illustrations/A-Tramp-Abroad/images/', fixed_content)

if fixed_content != content:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(fixed_content)
    print("Successfully updated image paths in A-Tramp-Abroad.html")
else:
    print("No relative image paths found to update in A-Tramp-Abroad.html")
