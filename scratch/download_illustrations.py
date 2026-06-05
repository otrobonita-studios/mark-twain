import os
import urllib.request
import time
from pathlib import Path

# List of missing image filenames provided by the user
images = [
    "07-077.jpg", "07-078.jpg", "08-079.jpg", "08-081.jpg", "08-083.jpg",
    "08-084.jpg", "09-085.jpg", "09-086.jpg", "09-088.jpg", "09-091.jpg",
    "09-092.jpg", "10-093.jpg", "10-095.jpg", "10-098.jpg", "10-100.jpg",
    "11-101.jpg", "11-102.jpg", "11-103.jpg", "11-106.jpg", "12-107.jpg",
    "12-108.jpg", "12-110.jpg", "12-112.jpg", "13-113.jpg", "13-117.jpg",
    "13-118.jpg", "14-121.jpg", "14-123.jpg", "14-124.jpg", "14-125.jpg",
    "14-127.jpg", "15-128.jpg", "15-130.jpg", "15-133.jpg", "16-134.jpg",
    "16-135.jpg", "16-139.jpg", "16-141.jpg", "16-143.jpg", "17-144.jpg",
    "17-147.jpg", "18-148.jpg", "18-150.jpg", "18-152.jpg", "18-154.jpg",
    "18-155.jpg", "18-156.jpg", "18-157.jpg", "19-158.jpg", "19-160.jpg",
    "20-161.jpg", "20-163.jpg", "20-165.jpg", "20-166.jpg", "21-167.jpg",
    "21-168.jpg", "21-170.jpg", "21-173.jpg", "21-174.jpg", "21-175.jpg",
    "22-176.jpg", "22-177.jpg", "22-178.jpg", "22-180.jpg", "23-181.jpg",
    "23-184.jpg", "23-186.jpg", "23-188.jpg", "24-189.jpg", "24-190.jpg",
    "25-191.jpg", "25-192.jpg", "25-194.jpg", "25-195.jpg", "25-198.jpg",
    "26-199.jpg", "26-200.jpg", "26-205.jpg", "26-207.jpg", "27-208.jpg",
    "27-209.jpg", "27-211.jpg", "28-212.jpg", "28-213.jpg", "28-214.jpg",
    "28-216.jpg", "29-217.jpg", "29-220.jpg", "29-221.jpg", "29-224.jpg",
    "29-225.jpg", "30-226.jpg", "30-227.jpg", "30-229.jpg", "30-232.jpg",
    "30-233.jpg", "30-234.jpg", "30-235.jpg", "31-236.jpg", "31-237.jpg",
    "31-238.jpg", "31-240.jpg", "31-242.jpg", "31-245.jpg", "32-247.jpg",
    "32-248.jpg", "32-249.jpg", "32-251.jpg", "33-252.jpg", "33-253.jpg",
    "33-254.jpg", "33-255.jpg", "33-257.jpg", "33-261.jpg", "33-263.jpg",
    "34-264.jpg", "34-266.jpg", "34-267.jpg", "35-268.jpg", "35-271.jpg",
    "35-273.jpg", "35-274.jpg"
]

TARGET_DIR = Path("E:/development/mark-twain/public/images/book-illustrations/Tom_Sawyer/images")
TARGET_DIR.mkdir(parents=True, exist_ok=True)

base_url = "https://www.gutenberg.org/files/74/74-h/images/"

print(f"Starting download of {len(images)} images to {TARGET_DIR}...")

success_count = 0
failed_count = 0

# Set a user-agent to avoid Gutenberg blocking request
opener = urllib.request.build_opener()
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')]
urllib.request.install_opener(opener)

for idx, img in enumerate(images, 1):
    dest_path = TARGET_DIR / img
    if dest_path.exists():
        print(f"[{idx}/{len(images)}] {img} already exists. Skipping.")
        continue
    
    url = base_url + img
    print(f"[{idx}/{len(images)}] Downloading {img} from {url}...")
    try:
        urllib.request.urlretrieve(url, str(dest_path))
        print(f"  Saved to {dest_path}")
        success_count += 1
        time.sleep(1.0) # sleep 1 second to respect Gutenberg rate limits
    except Exception as e:
        print(f"  Error downloading {img}: {e}")
        failed_count += 1

print(f"\nDownload finished. Success: {success_count}, Failed: {failed_count}.")
