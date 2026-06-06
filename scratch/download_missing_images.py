import os
import re
import shutil
import time
import requests

# Root directory of the repository
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Fallback placeholders on disk
FALLBACK_PNG = os.path.join(ROOT_DIR, "public", "favicon", "apple-touch-icon.png")
FALLBACK_JPG = os.path.join(ROOT_DIR, "public", "images", "O-pic.jpg")
FALLBACK_WEBP = os.path.join(ROOT_DIR, "public", "images", "MarkTwainSoloLogo.webp")
FALLBACK_ICO = os.path.join(ROOT_DIR, "public", "favicon", "favicon.ico")

def get_fallback_path(ext):
    ext = ext.lower()
    if ext in [".png", ".svg"]:
        return FALLBACK_PNG
    elif ext in [".jpg", ".jpeg"]:
        return FALLBACK_JPG
    elif ext == ".webp":
        return FALLBACK_WEBP
    elif ext == ".ico":
        return FALLBACK_ICO
    return FALLBACK_JPG

# Directories to ignore
IGNORE_DIRS = {".git", "node_modules", ".next", "out", ".firebase", ".vercel", "scratch", ".venv", "venv", "env"}
BINARY_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.bmp', '.xcf',
    '.ttf', '.woff', '.woff2', '.otf', '.eot',
    '.mp3', '.wav', '.ogg', '.m4a', '.flac',
    '.zip', '.pdf', '.tar.gz', '.gz', '.db', '.map', '.mp4', '.mov', '.epub'
}
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.bmp', '.xcf', '.ico'}

# Map directories or books to Project Gutenberg IDs
def get_pg_info(resolved_path, ref_file):
    resolved_path_lower = resolved_path.replace("\\", "/").lower()
    ref_file_lower = ref_file.replace("\\", "/").lower()
    
    # Huckleberry Finn
    if "huckleberry_finn" in resolved_path_lower or "huckleberry-finn" in ref_file_lower:
        return "76"
    # Connecticut Yankee
    elif "connecticut_yankee" in resolved_path_lower or "connecticut-yankee" in ref_file_lower:
        return "86"
    # A Tramp Abroad
    elif "a-tramp-abroad" in ref_file_lower or "/books/images/" in resolved_path_lower and "tramp" in ref_file_lower:
        return "119"
    # A Horse's Tale
    elif "a-horse's-tale" in ref_file_lower or "s-tale" in resolved_path_lower:
        return "1047"
    # Captain Stormfield
    elif "captain-stormfield" in ref_file_lower or "stormfield" in resolved_path_lower:
        return "9004"
    # Following The Equator
    elif "following-the-equator" in resolved_path_lower or "following-the-equator" in ref_file_lower:
        return "1830"
    # Eve's Diary
    elif "eves-diary" in resolved_path_lower or "eves-diary" in ref_file_lower:
        return "1892"
    return None

def clean_original_filename(filename):
    if filename.startswith("mdrnzd-"):
        return filename.replace("mdrnzd-", "", 1)
    return filename

def get_all_text_files(dir_path, files_list=None):
    if files_list is None:
        files_list = []
    if not os.path.exists(dir_path):
        return files_list
        
    for entry in os.scandir(dir_path):
        if entry.is_dir():
            if entry.name not in IGNORE_DIRS:
                # If we are at the root level, only descend into target directories
                if dir_path == ROOT_DIR:
                    if entry.name in ["src", "public", "scripts"]:
                        get_all_text_files(entry.path, files_list)
                else:
                    get_all_text_files(entry.path, files_list)
        elif entry.is_file():
            if entry.name == "package-lock.json":
                continue
            ext = os.path.splitext(entry.name)[1].lower()
            if ext not in BINARY_EXTENSIONS:
                files_list.append(entry.path)
    return files_list

# Gather all existing image paths on disk (case-insensitive mapping)
def get_existing_files_case_map():
    case_map = {}
    
    # 1. Gather all scanned text/assets files
    text_files = get_all_text_files(ROOT_DIR)
    for f in text_files:
        case_map[f.lower()] = f
        
    # 2. Gather all public images (even if binary)
    public_dir = os.path.join(ROOT_DIR, "public")
    if os.path.exists(public_dir):
        for root, dirs, files in os.walk(public_dir):
            for file in files:
                full_path = os.path.join(root, file)
                case_map[full_path.lower()] = full_path
                
    return case_map

def main():
    print("Scanning codebase for all image references...")
    all_files = get_all_text_files(ROOT_DIR)
    print(f"Found {len(all_files)} text files to scan.")
    
    file_case_map = get_existing_files_case_map()
    
    missing_images = []
    seen_missing_resolved = set()
    
    img_regex1 = re.compile(r'(?:["\']|url\()([a-zA-Z0-9_\-\.\/@]+?\.(?:png|jpg|jpeg|webp|svg|gif|bmp|xcf|ico))(?:\)|["\'])', re.IGNORECASE)
    img_regex2 = re.compile(r'!\[.*?\]\(([^)]+?\.(?:png|jpg|jpeg|webp|svg|gif|bmp|xcf|ico))\)', re.IGNORECASE)
    
    # Scan text files for image paths
    for file_path in all_files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            continue
            
        found_paths = set()
        for m in img_regex1.finditer(text):
            found_paths.add(m.group(1))
        for m in img_regex2.finditer(text):
            found_paths.add(m.group(1))
            
        for img_path in found_paths:
            if img_path.startswith("http://") or img_path.startswith("https://") or img_path.startswith("//"):
                continue
                
            resolved_path = ""
            if img_path.startswith("@/"):
                resolved_path = os.path.join(ROOT_DIR, img_path.replace("@/", "src/", 1))
            elif img_path.startswith("/"):
                resolved_path = os.path.join(ROOT_DIR, "public" + img_path)
            else:
                resolved_path = os.path.abspath(os.path.join(os.path.dirname(file_path), img_path))
                # Fallback relative to public
                if not os.path.exists(resolved_path):
                    public_try = os.path.join(ROOT_DIR, "public", img_path)
                    if os.path.exists(public_try):
                        resolved_path = public_try
                        
            resolved_lower = resolved_path.lower()
            
            # Check if exists in file case map or physically on disk
            exists_in_map = resolved_lower in file_case_map
            exists_on_disk = os.path.exists(resolved_path)
            
            # Exclude code files/false positives based on context
            filename = os.path.basename(resolved_path)
            # Ignore false positives like: enlarge.jpg string matches in JS file, etc.
            if filename in ["enlarge.jpg", "cover.jpg", "front.jpg", "title.jpg", "067.jpg", "093.jpg", "105.jpg", "109.jpg"] and file_path.endswith(".js"):
                continue
            if filename in ["LA2-NSRW-1-0470.jpg", "pageindex_LA2-NSRW-1-0470.jpg"] and "The-New-Student's-Reference-Work" in file_path:
                continue
            if ext := os.path.splitext(filename)[1].lower():
                if ext in [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".ico"]:
                    if not exists_on_disk and not exists_in_map:
                        if resolved_lower not in seen_missing_resolved:
                            seen_missing_resolved.add(resolved_lower)
                            missing_images.append({
                                "ref_file": file_path,
                                "ref_path": img_path,
                                "resolved_path": resolved_path
                            })
                            
    print(f"Found {len(missing_images)} actual unique missing images on disk.")
    if not missing_images:
        print("No missing images to populate!")
        return
        
    downloaded_count = 0
    copied_placeholder_count = 0
    failed_count = 0
    
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    
    gutenberg_blocked = False
    
    for idx, item in enumerate(missing_images, 1):
        resolved_local_path = item["resolved_path"]
        os.makedirs(os.path.dirname(resolved_local_path), exist_ok=True)
        
        filename = os.path.basename(resolved_local_path)
        ext = os.path.splitext(filename)[1]
        
        pg_id = get_pg_info(resolved_local_path, item["ref_file"])
        
        success = False
        
        # Don't try downloading from Gutenberg if we got rate limited/blocked in this run
        if pg_id and not gutenberg_blocked:
            original_filename = clean_original_filename(filename)
            primary_url = f"https://www.gutenberg.org/files/{pg_id}/{pg_id}-h/images/{original_filename}"
            secondary_url = f"https://www.gutenberg.org/cache/epub/{pg_id}/images/{original_filename}"
            
            print(f"[{idx}/{len(missing_images)}] Trying PG download for '{filename}'...")
            
            for url in [primary_url, secondary_url]:
                try:
                    time.sleep(0.15) # Polite delay
                    resp = session.get(url, timeout=5)
                    
                    if resp.status_code == 200:
                        with open(resolved_local_path, "wb") as img_f:
                            img_f.write(resp.content)
                        print(f"    SUCCESS: Downloaded from {url}")
                        downloaded_count += 1
                        success = True
                        break
                    elif resp.status_code in [429, 403]:
                        print(f"    BLOCKED: Gutenberg returned status {resp.status_code}. Switching to local fallback mode.")
                        gutenberg_blocked = True
                        break
                except Exception as e:
                    print(f"    Error requesting {url}: {e}")
                    
        if not success:
            # Copy fallback placeholder
            fallback_source = get_fallback_path(ext)
            if os.path.exists(fallback_source):
                try:
                    shutil.copy2(fallback_source, resolved_local_path)
                    print(f"[{idx}/{len(missing_images)}] Fallback: Copied placeholder to '{os.path.relativepath if hasattr(os, 'relativepath') else resolved_local_path}'")
                    copied_placeholder_count += 1
                    success = True
                except Exception as e:
                    print(f"    Failed to copy fallback to {resolved_local_path}: {e}")
                    failed_count += 1
            else:
                print(f"[{idx}/{len(missing_images)}] Error: No fallback file found for {ext}")
                failed_count += 1
                
    print(f"\nImage processing complete!")
    print(f"Downloaded from Gutenberg: {downloaded_count}")
    print(f"Populated with placeholder: {copied_placeholder_count}")
    print(f"Failed: {failed_count}")

if __name__ == "__main__":
    main()
