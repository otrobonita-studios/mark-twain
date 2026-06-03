#!/usr/bin/env python3
"""
Eve's Diary Modern Illustration Generator - Google Imagen 3.0
High-quality image generation using Google's Imagen API
"""

import os
import json
import shutil
import re
import requests
import base64
from pathlib import Path
from datetime import datetime
import logging
from html.parser import HTMLParser

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

INPUT_DIR = r"E:\development\mark-twain\public\images\book-illustrations\eves-diary"
OUTPUT_DIR = r"E:\development\mark-twain\public\images\book-illustrations\eves-diary-modern"
HTML_SOURCE = r"E:\development\mark-twain\rag\data-collection\TwainCorpus\HTML\Eves-Diary.html"

# Load from .env.local
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env.local")

# Google Imagen API Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PROJECT_ID = "gen-lang-client-0372198985"  # Your Project ID
IMAGEN_ENDPOINT = "https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict"

# ============================================================================
# HTML PARSER
# ============================================================================

class EvesDiaryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = {}
        self.current_text = []
        self.in_paragraph = False
        self.last_image = None

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            attrs_dict = dict(attrs)
            if 'src' in attrs_dict:
                filename = attrs_dict['src'].split('/')[-1]
                self.last_image = filename
                self.current_text = []
        elif tag == 'p':
            self.in_paragraph = True

    def handle_endtag(self, tag):
        if tag == 'p':
            self.in_paragraph = False
            if self.last_image and self.current_text:
                text = ' '.join(self.current_text).strip()
                if text and len(text) > 50:
                    self.images[self.last_image] = text
                    self.last_image = None
                    self.current_text = []

    def handle_data(self, data):
        if self.in_paragraph:
            text = data.strip()
            if text:
                self.current_text.append(text)


def extract_images_and_text():
    """Extract image filenames and descriptions from HTML"""
    logger.info("Reading Eve's Diary source...")
    with open(HTML_SOURCE, 'r', encoding='utf-8') as f:
        html = f.read()
    parser = EvesDiaryParser()
    parser.feed(html)
    logger.info(f"Found {len(parser.images)} images with descriptions")
    return parser.images


# ============================================================================
# PROMPT GENERATION
# ============================================================================

def create_prompt(image_description: str) -> str:
    """Create Imagen prompt from Eve's original text"""
    text = image_description.replace('&ldquo;', '"').replace('&rdquo;', '"')
    text = re.sub(r'<[^>]+>', '', text)

    nature_keywords = {
        'waterfall': 'cascading waterfall',
        'falls': 'waterfall',
        'mountain': 'majestic mountains',
        'tree': 'ancient trees',
        'flower': 'blooming flowers',
        'fruit': 'abundant fruit',
        'apple': 'apple trees',
        'stars': 'luminous stars',
        'stream': 'flowing streams',
        'pool': 'crystal pool',
        'garden': 'paradise garden',
        'moss': 'soft moss',
        'tiger': 'elegant tiger',
        'animal': 'wild creatures',
        'bird': 'graceful birds',
    }

    present_elements = []
    for keyword, description in nature_keywords.items():
        if keyword.lower() in text.lower():
            present_elements.append(description)

    is_adam_present = 'reptile' in text.lower() or ('he' in text.lower() and 'first saw him' in text.lower())

    prompt = "Eve in the Garden of Eden (Edens Lustgård), "
    if is_adam_present:
        prompt += "with Adam, "

    if present_elements:
        prompt += f"surrounded by {', '.join(present_elements[:3])}, "
    else:
        prompt += "surrounded by pristine nature, "

    prompt += """
    paradise garden landscape, contemporary digital painting, photorealistic,
    soft ethereal light, romantic innocence, classical composition,
    beautiful detailed face, perfect features, elegant proportions,
    lush vegetation, peaceful paradise mood, detailed nature elements,
    no buildings, no architecture, no objects, innocent beauty,
    pristine Eden paradise, modern illustration, high quality, cinematic,
    professional artwork, masterpiece
    """
    return prompt


# ============================================================================
# IMAGEN GENERATION
# ============================================================================

def generate_with_imagen(original_image_path: str, prompt: str, output_dir: Path, idx: int) -> bool:
    """Generate with Google Imagen 3.0"""
    try:
        if not GEMINI_API_KEY:
            logger.error("Missing GEMINI_API_KEY in .env.local")
            return False

        endpoint = IMAGEN_ENDPOINT.format(project_id=PROJECT_ID)
        headers = {
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json"
        }

        payload = {
            "instances": [
                {
                    "prompt": prompt
                }
            ],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": "16:9",
                "outputMimeType": "image/png"
            }
        }

        logger.info(f"Calling Imagen API: {prompt[:80]}...")
        response = requests.post(endpoint, json=payload, headers=headers, timeout=60)

        if response.status_code != 200:
            logger.error(f"Imagen API error: {response.status_code} - {response.text}")
            return False

        result = response.json()

        # Extract image from response
        if 'predictions' not in result or not result['predictions']:
            logger.error(f"No image in Imagen response: {result}")
            return False

        image_data = result['predictions'][0]['bytesBase64Encoded']
        image_bytes = base64.b64decode(image_data)

        filename = Path(original_image_path).stem
        output_path = output_dir / "modern" / f"modern_{filename}.png"
        with open(output_path, 'wb') as f:
            f.write(image_bytes)

        logger.info(f"✓ Saved: {output_path.name}")
        return True

    except Exception as e:
        logger.error(f"Imagen error: {e}")
        return False


# ============================================================================
# MAIN
# ============================================================================

def process_eves_diary(test_mode: bool = False, max_images: int = None):
    """Main pipeline"""
    input_path = Path(INPUT_DIR)
    output_path = Path(OUTPUT_DIR)

    (output_path / "originals").mkdir(parents=True, exist_ok=True)
    (output_path / "modern").mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        logger.error(f"Input directory not found: {input_path}")
        return

    images_text = extract_images_and_text()

    image_files = sorted([
        f for f in input_path.iterdir()
        if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    ])

    if test_mode:
        image_files = image_files[:1]
    elif max_images:
        image_files = image_files[:max_images]

    logger.info(f"Processing {len(image_files)} images with Imagen 3.0 + authentic text")

    manifest = {
        "title": "Eve's Diary - Original vs Modern (Google Imagen 3.0)",
        "created": datetime.now().isoformat(),
        "style": "Contemporary illustration based on Mark Twain's authentic descriptions",
        "images": []
    }

    for idx, image_file in enumerate(image_files, 1):
        logger.info(f"\n[{idx}/{len(image_files)}] {image_file.name}")

        try:
            dest = output_path / "originals" / image_file.name
            shutil.copy2(image_file, dest)

            description = images_text.get(image_file.name, "")
            if not description:
                logger.warning(f"No description for {image_file.name}")
                continue

            logger.info(f"Source text: {description[:120]}...")

            prompt = create_prompt(description)
            logger.info(f"Generated prompt: {prompt[:100]}...")

            success = generate_with_imagen(str(image_file), prompt, output_path, idx)

            if success:
                manifest["images"].append({
                    "id": image_file.stem,
                    "original": f"originals/{image_file.name}",
                    "modern": f"modern/modern_{image_file.stem}.png",
                    "source_text": description[:150]
                })

        except Exception as e:
            logger.error(f"Error: {e}")

    manifest_path = output_path / "manifest.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    logger.info(f"\n✓ Done! Results in: {output_path}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Test: 1 image")
    parser.add_argument("--max", type=int, default=None, help="Max images")
    args = parser.parse_args()

    logger.info("=" * 70)
    logger.info("Eve's Diary - Google Imagen 3.0 Modern Illustration Generator")
    logger.info("with Authentic Text from Mark Twain")
    logger.info("=" * 70)

    process_eves_diary(test_mode=args.test, max_images=args.max)
