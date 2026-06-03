#!/usr/bin/env python3
"""
Illustration -> 1899 Photograph converter
Uses Gemini 2.5 Flash Image ("Nano Banana") image-to-image.
Preserves the exact composition of a 19th-century book illustration and
renders it as an authentic ~1899 sepia studio photograph (16:9).

Simple API key auth (GEMINI_API_KEY) - no OAuth / Vertex needed.
"""

import os
import sys
import json
import base64
import time
import argparse
import requests
from pathlib import Path
from datetime import datetime
import logging

sys.stdout.reconfigure(encoding="utf-8")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------------

BOOK_DIR = r"E:\development\mark-twain\public\images\book-illustrations\Following-The-Equator"
INPUT_DIR = Path(BOOK_DIR) / "images"
OUTPUT_DIR = Path(BOOK_DIR) / "modernized"

# Load GEMINI_API_KEY from .env.local
try:
    from dotenv import load_dotenv
    load_dotenv(Path(r"E:\development\mark-twain") / ".env.local")
except Exception:
    pass

# Prefer the dedicated server key; fall back to others.
API_KEY = (
    os.getenv("GEMINI_CLAUDE_API_KEY", "")
    or os.getenv("GEMINI_SERVER_API_KEY", "")
    or os.getenv("GEMINI_API_KEY", "")
)
MODEL = "gemini-3-pro-image"  # Nano Banana Pro - photoreal; override with --model
KEEP_DIM = False  # set by --keep-dimensions: preserve source proportions (no forced 16:9)
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

# Only process page illustrations (pNNN.jpg), skip cover/spine/title apparatus
def is_illustration(p: Path) -> bool:
    name = p.stem.lower()
    return p.suffix.lower() in (".jpg", ".jpeg", ".png") and name.startswith("p") and name[1:].isdigit()

PROMPT_BODY = (
    "Reproduce this 19th-century book illustration as an authentic photograph "
    "taken around 1899. The result must look like a REAL photograph of REAL people, "
    "animals and places - NOT a drawing, painting, wash, sketch or illustration. "
    "Photographic realism: real skin texture, real fabric and hair, true depth of "
    "field and lens focus, real daylight or studio lighting. Absolutely no visible "
    "ink lines, no cross-hatching, no pencil or brush strokes, no painterly shading. "
    "Render it as a real sepia-toned silver-gelatin print of that era with fine "
    "photographic grain, gentle vignetting and slight age and plate imperfections. "
    "Preserve the EXACT composition, all figures, poses, clothing, animals, landscape "
    "and staging from the original - do not add or remove subjects. Every element "
    "visible in the drawing must be visible in the photograph. If the illustration "
    "contains any printed text, caption, page number or signature, ignore it completely "
    "and photograph ONLY the depicted scene."
)
FRAME_169 = " Frame the result as a 16:9 landscape photograph."
FRAME_KEEP = " Keep the original framing, orientation and proportions of the source image; do not crop or change the aspect ratio."

# ----------------------------------------------------------------------------
# GEMINI CALL
# ----------------------------------------------------------------------------

def photograph_image(src: Path, dst: Path) -> bool:
    img_b64 = base64.b64encode(src.read_bytes()).decode("utf-8")
    mime = "image/png" if src.suffix.lower() == ".png" else "image/jpeg"

    prompt = PROMPT_BODY + (FRAME_KEEP if KEEP_DIM else FRAME_169)
    gen_cfg = {"responseModalities": ["IMAGE"]}
    if not KEEP_DIM:
        gen_cfg["imageConfig"] = {"aspectRatio": "16:9"}

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": mime, "data": img_b64}},
            ]
        }],
        "generationConfig": gen_cfg,
    }

    headers = {"x-goog-api-key": API_KEY, "Content-Type": "application/json"}

    for attempt in range(1, 4):
        try:
            r = requests.post(ENDPOINT, json=payload, headers=headers, timeout=180)
            if r.status_code == 200:
                data = r.json()
                # Find the image part in the response
                for cand in data.get("candidates", []):
                    for part in cand.get("content", {}).get("parts", []):
                        blob = part.get("inlineData") or part.get("inline_data")
                        if blob and blob.get("data"):
                            dst.write_bytes(base64.b64decode(blob["data"]))
                            return True
                logger.error(f"  No image in response: {json.dumps(data)[:300]}")
                return False
            elif r.status_code in (429, 500, 503):
                wait = attempt * 10
                logger.warning(f"  {r.status_code} - retrying in {wait}s (attempt {attempt}/3)")
                time.sleep(wait)
            else:
                logger.error(f"  API error {r.status_code}: {r.text[:300]}")
                return False
        except Exception as e:
            logger.error(f"  Request failed: {e}")
            time.sleep(attempt * 5)
    return False


# ----------------------------------------------------------------------------
# MAIN
# ----------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", action="store_true", help="Process only the first illustration")
    ap.add_argument("--max", type=int, default=None, help="Max images to process")
    ap.add_argument("--overwrite", action="store_true", help="Re-do images already in modernized/")
    ap.add_argument("--input", default=None, help="Override input folder (process ALL images in it)")
    ap.add_argument("--only", default=None, help="Process only files whose name contains this string (e.g. p166)")
    ap.add_argument("--model", default=None, help="Override image model (e.g. gemini-3-pro-image)")
    ap.add_argument("--exclude-dir", default=None, help="Skip a source if mdrnzd-<name> already exists in this folder")
    ap.add_argument("--exclude-original-dir", default=None, help="Skip a source if <name> exists in this folder (originals)")
    ap.add_argument("--keep-dimensions", action="store_true", help="Preserve source proportions (no forced 16:9)")
    args = ap.parse_args()

    global MODEL, ENDPOINT, KEEP_DIM
    KEEP_DIM = args.keep_dimensions
    if args.model:
        MODEL = args.model
        ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

    if not API_KEY:
        logger.error("GEMINI_API_KEY not found in .env.local")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.input:
        in_dir = Path(args.input)
        illustrations = sorted([p for p in in_dir.iterdir()
                                if p.suffix.lower() in (".jpg", ".jpeg", ".png")])
    else:
        illustrations = sorted([p for p in INPUT_DIR.iterdir() if is_illustration(p)])

    # folder-level exclusions (applied before --max so we get the first N *eligible*)
    if args.exclude_original_dir:
        exo = Path(args.exclude_original_dir)
        illustrations = [p for p in illustrations if not (exo / p.name).exists()]
    if args.exclude_dir:
        exd = Path(args.exclude_dir)
        illustrations = [p for p in illustrations if not (exd / f"mdrnzd-{p.name}").exists()]

    if args.only:
        illustrations = [p for p in illustrations if args.only in p.name]
    if args.test:
        illustrations = illustrations[:1]
    elif args.max:
        illustrations = illustrations[:args.max]

    logger.info("=" * 70)
    logger.info(f"Following the Equator - Illustration -> 1899 Photograph")
    logger.info(f"Model: {MODEL} (Nano Banana) | Output: 16:9")
    logger.info(f"To process: {len(illustrations)} illustrations")
    logger.info("=" * 70)

    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest = {"title": "Following the Equator - Illustrations as 1899 Photographs",
                "created": datetime.now().isoformat(), "model": MODEL, "images": []}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    done = 0
    for idx, src in enumerate(illustrations, 1):
        dst = OUTPUT_DIR / f"mdrnzd-{src.name}"  # e.g. mdrnzd-p025.jpg

        if args.exclude_dir:
            approved = Path(args.exclude_dir) / f"mdrnzd-{src.name}"
            if approved.exists():
                logger.info(f"[{idx}/{len(illustrations)}] {src.name} - redan godkänd, hoppar")
                continue

        if dst.exists() and not args.overwrite:
            logger.info(f"[{idx}/{len(illustrations)}] {src.name} - already done, skipping")
            continue

        logger.info(f"[{idx}/{len(illustrations)}] {src.name} - photographing...")
        ok = photograph_image(src, dst)
        if ok:
            logger.info(f"  OK -> {dst.relative_to(BOOK_DIR)}")
            done += 1
            entry = {"id": src.stem, "original": f"images/{src.name}",
                     "photograph": f"modernized/{dst.name}"}
            manifest["images"] = [e for e in manifest["images"] if e.get("id") != src.stem]
            manifest["images"].append(entry)
            manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        else:
            logger.error(f"  FAILED: {src.name}")

    logger.info("=" * 70)
    logger.info(f"Done. Newly photographed: {done}. Output in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
