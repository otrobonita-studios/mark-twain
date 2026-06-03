#!/usr/bin/env python3
"""
Eve's Diary Modern Illustration Generator - Simplified
Direct generation without vision analysis
"""

import os
import torch
from pathlib import Path
from PIL import Image
import logging
import shutil
import json
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

INPUT_DIR = r"E:\development\mark-twain\public\images\book-illustrations\eves-diary"
OUTPUT_DIR = r"E:\development\mark-twain\public\images\book-illustrations\eves-diary-modern"

# Prompts for Eve's Diary - romantisk tolkning
PROMPTS = [
    "Woman in a lush garden, romantic art nouveau illustration, soft watercolor, ethereal mood, nature elements, classical beauty",
    "Eve in paradise garden, sitting among flowers and trees, romantic illustration, dreamy lighting, detailed fabrics, Victorian aesthetic",
    "Woman with apple in enchanted garden, romantic fantasy art, soft diffused light, botanical elements, classical composition",
    "Figure in nature, romantic garden scene, gentle lighting, detailed vegetation, emotional expression, classic illustration style",
    "Woman contemplating in garden, romantic narrative painting, warm colors, natural elements, vintage aesthetic, fine art quality",
]

# ============================================================================
# FLUX GENERATION (SIMPLIFIED)
# ============================================================================

def generate_with_flux(image_path: str, output_dir: Path, idx: int) -> bool:
    """Generate modern illustration using Flux"""
    try:
        from diffusers import FluxPipeline

        # Use one of our prompts (cycle through them)
        prompt = PROMPTS[idx % len(PROMPTS)]
        prompt += ", high quality digital art, romantic illustration, contemporary fantasy style"

        logger.info(f"Loading Flux model...")
        pipe = FluxPipeline.from_pretrained(
            "black-forest-labs/FLUX.1-dev",
            torch_dtype=torch.bfloat16
        )
        pipe = pipe.to("cuda")

        logger.info(f"Generating: {prompt[:60]}...")
        image = pipe(
            prompt=prompt,
            height=768,
            width=768,
            num_inference_steps=25,
            guidance_scale=7.5,
            generator=torch.Generator(device="cuda").manual_seed(idx)
        ).images[0]

        output_path = output_dir / "modern" / f"modern_{Path(image_path).stem}.png"
        image.save(output_path)
        logger.info(f"✓ Saved: {output_path.name}")
        return True

    except Exception as e:
        logger.error(f"Flux error: {e}")
        return False


def generate_with_sdxl(image_path: str, output_dir: Path, idx: int) -> bool:
    """Generate with SDXL (faster fallback)"""
    try:
        from diffusers import StableDiffusionXLPipeline

        prompt = PROMPTS[idx % len(PROMPTS)]
        prompt += ", high quality illustration, romantic mood, detailed, masterpiece"

        logger.info(f"Loading SDXL...")
        pipe = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=torch.float16,
            use_safetensors=True,
            variant="fp16"
        )
        pipe = pipe.to("cuda")

        logger.info(f"Generating: {prompt[:60]}...")
        image = pipe(
            prompt=prompt,
            height=768,
            width=768,
            num_inference_steps=30,
            guidance_scale=7.5,
            generator=torch.Generator(device="cuda").manual_seed(idx)
        ).images[0]

        output_path = output_dir / "modern" / f"modern_{Path(image_path).stem}.png"
        image.save(output_path)
        logger.info(f"✓ Saved: {output_path.name}")
        return True

    except Exception as e:
        logger.error(f"SDXL error: {e}")
        return False


# ============================================================================
# MAIN
# ============================================================================

def process_eves_diary(use_sdxl: bool = False, test_mode: bool = False, max_images: int = None):
    """Process Eve's Diary illustrations"""

    input_path = Path(INPUT_DIR)
    output_path = Path(OUTPUT_DIR)

    # Create directories
    (output_path / "originals").mkdir(parents=True, exist_ok=True)
    (output_path / "modern").mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        logger.error(f"Input directory not found: {input_path}")
        return

    # Get images
    image_files = sorted([
        f for f in input_path.iterdir()
        if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    ])

    if test_mode:
        image_files = image_files[:1]
    elif max_images:
        image_files = image_files[:max_images]

    logger.info(f"Found {len(image_files)} images")
    logger.info(f"Using: {'SDXL (fast)' if use_sdxl else 'Flux (best quality)'}")

    manifest = {
        "title": "Eve's Diary - Original vs Modern",
        "created": datetime.now().isoformat(),
        "images": []
    }

    for idx, image_file in enumerate(image_files, 1):
        logger.info(f"\n[{idx}/{len(image_files)}] {image_file.name}")

        try:
            # Copy original
            dest = output_path / "originals" / image_file.name
            shutil.copy2(image_file, dest)

            # Generate modern version
            success = False
            if use_sdxl:
                success = generate_with_sdxl(str(image_file), output_path, idx)
            else:
                success = generate_with_flux(str(image_file), output_path, idx)

            if success:
                manifest["images"].append({
                    "id": image_file.stem,
                    "original": f"originals/{image_file.name}",
                    "modern": f"modern/modern_{image_file.stem}.png"
                })

        except Exception as e:
            logger.error(f"Error: {e}")

    # Save manifest
    manifest_path = output_path / "manifest.json"
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    logger.info(f"\n✓ Done! Results in: {output_path}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--sdxl", action="store_true", help="Use SDXL instead of Flux")
    parser.add_argument("--test", action="store_true", help="Test mode: 1 image")
    parser.add_argument("--max", type=int, default=None, help="Max images to process")
    args = parser.parse_args()

    process_eves_diary(use_sdxl=args.sdxl, test_mode=args.test, max_images=args.max)
