#!/usr/bin/env python3
"""
Eve's Diary Modern Illustration Generator - FLUX with Authentic Text
Generates contemporary illustrations based on Mark Twain's original descriptions
"""

import os
import torch
import json
import shutil
import re
from pathlib import Path
from PIL import Image
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

# ============================================================================
# HTML PARSER - Extract images and their descriptions
# ============================================================================

class EvesDiaryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = {}  # {filename: description}
        self.current_text = []
        self.in_paragraph = False
        self.last_image = None

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            attrs_dict = dict(attrs)
            if 'src' in attrs_dict:
                filename = attrs_dict['src'].split('/')[-1]
                self.last_image = filename
                self.current_text = []  # Reset for new image
        elif tag == 'p':
            self.in_paragraph = True

    def handle_endtag(self, tag):
        if tag == 'p':
            self.in_paragraph = False
            if self.last_image and self.current_text:
                text = ' '.join(self.current_text).strip()
                if text and len(text) > 50:  # Only store substantial text
                    self.images[self.last_image] = text
                    self.last_image = None
                    self.current_text = []

    def handle_data(self, data):
        if self.in_paragraph:
            text = data.strip()
            if text:
                self.current_text.append(text)


def extract_images_and_text():
    """Extract image filenames and their descriptions from HTML"""
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

def create_flux_prompt(image_description: str, image_filename: str) -> str:
    """
    Create a Flux prompt based on Eve's original text description

    Guidelines:
    🌿 Pure nature focus: mountains, waterfalls, trees, animals, fruit
    👩 Eve in natural setting (sometimes Adam)
    ❌ No buildings, no objects/pryls, minimal clothing focus
    ✨ Pristine, innocent, paradisiac
    """

    # Clean text
    text = image_description.replace('&ldquo;', '"').replace('&rdquo;', '"')
    text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags

    # Key natural elements to look for
    nature_keywords = {
        'waterfall': 'cascading waterfall',
        'falls': 'waterfall',
        'mountain': 'majestic mountains',
        'tree': 'ancient trees',
        'flower': 'blooming flowers',
        'fruit': 'abundant fruit',
        'apple': 'apple trees laden with fruit',
        'stars': 'luminous stars',
        'stream': 'flowing streams',
        'pool': 'crystal pool of water',
        'garden': 'paradise garden',
        'moss': 'soft moss banks',
        'tiger': 'elegant tiger',
        'animal': 'wild creatures',
        'bird': 'graceful birds',
        'nature': 'pristine nature',
    }

    # Find which elements are mentioned
    present_elements = []
    for keyword, description in nature_keywords.items():
        if keyword.lower() in text.lower():
            present_elements.append(description)

    # Check for Adam/Eva
    is_adam_present = 'reptile' in text.lower() or 'he' in text.lower() or 'him' in text.lower()

    # Build the prompt - GARDEN OF EDEN is central
    prompt = "Eve in the Garden of Eden (Edens Lustgård), "

    if is_adam_present and 'first saw him' not in text.lower():
        prompt += "with Adam, "

    if present_elements:
        prompt += f"surrounded by {', '.join(present_elements[:3])}, "
    else:
        prompt += "surrounded by pristine paradise nature, "

    prompt += """
    paradise garden landscape, Eden's garden, lush vegetation,
    contemporary digital painting, photorealistic rendering,
    soft ethereal light, romantic innocence, classical composition,
    peaceful paradisiac mood, detailed nature elements,
    no buildings no architecture no objects, innocent beauty,
    pristine Eden paradise, modern illustration style,
    high quality digital art, cinematic lighting, masterpiece,
    botanical abundance, untouched nature, sacred garden
    """

    return prompt


# ============================================================================
# FLUX GENERATION
# ============================================================================

def generate_with_flux(original_image_path: str, prompt: str, output_dir: Path, idx: int) -> bool:
    """Generate modern illustration using Flux"""
    try:
        from diffusers import FluxPipeline

        logger.info(f"Loading Flux pipeline...")
        pipe = FluxPipeline.from_pretrained(
            "black-forest-labs/FLUX.1-dev",
            torch_dtype=torch.bfloat16
        )
        pipe = pipe.to("cuda")

        logger.info(f"Generating from: {prompt[:80]}...")

        image = pipe(
            prompt=prompt,
            height=540,
            width=960,
            num_inference_steps=20,
            guidance_scale=7.5,
            generator=torch.Generator(device="cuda").manual_seed(idx)
        ).images[0]

        filename = Path(original_image_path).stem
        output_path = output_dir / "modern" / f"modern_{filename}.png"
        image.save(output_path)
        logger.info(f"✓ Saved: {output_path.name}")
        return True

    except Exception as e:
        logger.error(f"Flux generation error: {e}")
        return False


# ============================================================================
# MAIN PIPELINE
# ============================================================================

def process_eves_diary(test_mode: bool = False, max_images: int = None):
    """Main pipeline"""

    input_path = Path(INPUT_DIR)
    output_path = Path(OUTPUT_DIR)

    # Create directories
    (output_path / "originals").mkdir(parents=True, exist_ok=True)
    (output_path / "modern").mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        logger.error(f"Input directory not found: {input_path}")
        return

    # Extract images and descriptions from HTML
    images_text = extract_images_and_text()

    # Get actual image files
    image_files = sorted([
        f for f in input_path.iterdir()
        if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    ])

    if test_mode:
        image_files = image_files[:1]
    elif max_images:
        image_files = image_files[:max_images]

    logger.info(f"Processing {len(image_files)} images with Flux + authentic text")

    manifest = {
        "title": "Eve's Diary - Original vs Modern (Flux)",
        "created": datetime.now().isoformat(),
        "style": "Contemporary digital painting based on Mark Twain's original descriptions",
        "images": []
    }

    for idx, image_file in enumerate(image_files, 1):
        logger.info(f"\n[{idx}/{len(image_files)}] {image_file.name}")

        try:
            # Copy original
            dest = output_path / "originals" / image_file.name
            shutil.copy2(image_file, dest)

            # Find matching description
            description = images_text.get(image_file.name, "")

            if not description:
                logger.warning(f"No description found for {image_file.name}, skipping")
                continue

            # Create Flux prompt from description
            prompt = create_flux_prompt(description, image_file.name)
            logger.info(f"Prompt: {prompt[:100]}...")

            # Generate with Flux
            success = generate_with_flux(str(image_file), prompt, output_path, idx)

            if success:
                manifest["images"].append({
                    "id": image_file.stem,
                    "original": f"originals/{image_file.name}",
                    "modern": f"modern/modern_{image_file.stem}.png",
                    "source_text": description[:150]
                })
                logger.info("✓ Added to manifest")

        except Exception as e:
            logger.error(f"Error: {e}")

    # Save manifest
    manifest_path = output_path / "manifest.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    logger.info(f"\n✓ Done! Results in: {output_path}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Test mode: 1 image")
    parser.add_argument("--max", type=int, default=None, help="Max images")
    args = parser.parse_args()

    logger.info("=" * 70)
    logger.info("Eve's Diary - FLUX Modern Illustration Generator")
    logger.info("with Authentic Text from Mark Twain's Original")
    logger.info("=" * 70)

    process_eves_diary(test_mode=args.test, max_images=args.max)
