#!/usr/bin/env python3
"""
Eve's Diary Modern Illustration Generator
Analyzes original illustrations with LLaVA, generates modern versions with Flux
"""

import os
import torch
import json
import shutil
from pathlib import Path
from PIL import Image
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

INPUT_DIR = r"E:\development\mark-twain\public\images\book-illustrations\eves-diary"
OUTPUT_DIR = r"E:\development\mark-twain\public\images\book-illustrations\eves-diary-modern"
MODELS_DIR = r"E:\development\the-factory\models"

# Model choices
LLAVA_MODEL = "llava-hf/llava-1.5-7b-hf"  # eller "llava-hf/llava-onevision-qwen-max-2b-ov"
FLUX_MODEL = "black-forest-labs/FLUX.1-dev"  # eller "stabilityai/stable-diffusion-xl-base-1.0"

# Style prompt for Eve's Diary
EVE_STYLE_PROMPT = """
Romantic illustration in the style of contemporary fantasy art,
soft diffused lighting, lush garden setting with nature elements,
ethereal and dreamy atmosphere, detailed fabric textures,
classical beauty with modern artistic sensibility,
high quality digital illustration, romantic mood
"""

# ============================================================================
# LLAVA IMAGE ANALYSIS
# ============================================================================

def analyze_image_with_llava(image_path: str) -> str:
    """
    Analyze an image with LLaVA to understand its content
    """
    try:
        from transformers import AutoProcessor, LlavaForConditionalGeneration

        logger.info(f"Loading LLaVA model: {LLAVA_MODEL}")
        processor = AutoProcessor.from_pretrained(LLAVA_MODEL)
        model = LlavaForConditionalGeneration.from_pretrained(
            LLAVA_MODEL,
            torch_dtype=torch.float16,
            device_map="auto"
        )

        image = Image.open(image_path).convert("RGB")

        # Detailed prompt for LLaVA
        prompt = """Describe this illustration in detail.
        Focus on: what characters are present (pose, clothing, expression),
        setting (garden, nature elements, architecture),
        objects (flowers, trees, apples, etc),
        lighting and mood, overall composition."""

        inputs = processor(text=prompt, images=image, return_tensors="pt").to(model.device)

        with torch.no_grad():
            output = model.generate(**inputs, max_new_tokens=300, do_sample=False)

        description = processor.decode(output[0], skip_special_tokens=True)
        logger.info(f"LLaVA analysis: {description[:100]}...")

        return description

    except Exception as e:
        logger.error(f"Error analyzing image with LLaVA: {e}")
        return "romantic garden scene with female figure"


def create_generation_prompt(llava_analysis: str) -> str:
    """
    Create a detailed prompt for Flux based on LLaVA analysis
    """
    prompt = f"""Create a modern, romantic illustration based on this scene:

{llava_analysis}

Style: {EVE_STYLE_PROMPT}

Generate a high-quality, contemporary illustration that captures the essence
of the original while updating it with modern artistic techniques."""

    return prompt


# ============================================================================
# FLUX IMAGE GENERATION
# ============================================================================

def generate_image_with_flux(prompt: str, output_path: str, use_sdxl: bool = False) -> bool:
    """
    Generate an image using Flux or SDXL
    use_sdxl=True for faster generation with SDXL instead of Flux
    """
    try:
        if use_sdxl:
            logger.info("Using Stable Diffusion XL for faster generation...")
            from diffusers import StableDiffusionXLPipeline

            pipe = StableDiffusionXLPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                torch_dtype=torch.float16,
                use_safetensors=True,
                variant="fp16"
            )
            pipe = pipe.to("cuda")

        else:
            logger.info("Using Flux for high-quality generation...")
            from diffusers import FluxPipeline

            pipe = FluxPipeline.from_pretrained(
                FLUX_MODEL,
                torch_dtype=torch.bfloat16
            )
            pipe = pipe.to("cuda")

        logger.info(f"Generating image with prompt: {prompt[:80]}...")

        image = pipe(
            prompt=prompt,
            height=768,
            width=768,
            guidance_scale=7.5,
            num_inference_steps=50 if use_sdxl else 25,
            generator=torch.Generator(device="cuda").manual_seed(42)
        ).images[0]

        image.save(output_path)
        logger.info(f"✓ Image saved: {output_path}")

        return True

    except Exception as e:
        logger.error(f"Error generating image with Flux/SDXL: {e}")
        return False


# ============================================================================
# MAIN PIPELINE
# ============================================================================

def process_eves_diary(use_sdxl: bool = False, test_mode: bool = False, max_images: int = None):
    """
    Main pipeline to process Eve's Diary illustrations

    Args:
        use_sdxl: Use SDXL instead of Flux (faster)
        test_mode: Only process first image for testing
        max_images: Maximum number of images to process
    """

    # Setup directories
    input_path = Path(INPUT_DIR)
    output_path = Path(OUTPUT_DIR)
    originals_path = output_path / "originals"
    modern_path = output_path / "modern"

    output_path.mkdir(parents=True, exist_ok=True)
    originals_path.mkdir(parents=True, exist_ok=True)
    modern_path.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        logger.error(f"Input directory not found: {input_path}")
        return

    # Get all images
    image_files = sorted([
        f for f in input_path.iterdir()
        if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    ])

    if test_mode:
        image_files = image_files[:1]
    elif max_images:
        image_files = image_files[:max_images]

    logger.info(f"Found {len(image_files)} images to process")

    # Manifest for UI flipper
    manifest = {
        "title": "Eve's Diary - Original vs Modern Illustrations",
        "created": datetime.now().isoformat(),
        "images": []
    }

    for idx, image_file in enumerate(image_files, 1):
        logger.info(f"\n[{idx}/{len(image_files)}] Processing: {image_file.name}")

        try:
            # Copy original to originals/ folder
            original_output = originals_path / image_file.name
            shutil.copy2(image_file, original_output)
            logger.info(f"✓ Copied original: {original_output.name}")

            # Step 1: Analyze with LLaVA
            analysis = analyze_image_with_llava(str(image_file))

            # Step 2: Create prompt
            prompt = create_generation_prompt(analysis)

            # Step 3: Generate with Flux/SDXL
            modern_output = modern_path / f"modern_{image_file.stem}.png"
            success = generate_image_with_flux(prompt, str(modern_output), use_sdxl=use_sdxl)

            if success:
                # Add to manifest
                manifest["images"].append({
                    "id": image_file.stem,
                    "original": f"originals/{image_file.name}",
                    "modern": f"modern/{modern_output.name}",
                    "analysis": analysis[:200]  # First 200 chars for reference
                })
                logger.info(f"✓ Added to manifest")
            else:
                logger.warning(f"✗ Failed to generate image for {image_file.name}")

        except Exception as e:
            logger.error(f"Error processing {image_file.name}: {e}")
            continue

    # Save manifest
    manifest_path = output_path / "manifest.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    logger.info(f"✓ Manifest saved: {manifest_path}")

    logger.info(f"\n✓ Processing complete! Results saved to: {output_path}")
    logger.info(f"  - Originals: {originals_path}")
    logger.info(f"  - Modern: {modern_path}")
    logger.info(f"  - Manifest: {manifest_path}")


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate modern Eve's Diary illustrations")
    parser.add_argument("--sdxl", action="store_true", help="Use SDXL instead of Flux (faster)")
    parser.add_argument("--test", action="store_true", help="Test mode: process only first image")
    parser.add_argument("--max", type=int, default=None, help="Maximum number of images to process")

    args = parser.parse_args()

    logger.info("=" * 70)
    logger.info("Eve's Diary Modern Illustration Generator")
    logger.info("=" * 70)
    logger.info(f"Using model: {'SDXL' if args.sdxl else 'Flux'}")
    logger.info(f"Input: {INPUT_DIR}")
    logger.info(f"Output: {OUTPUT_DIR}")
    logger.info("=" * 70)

    process_eves_diary(
        use_sdxl=args.sdxl,
        test_mode=args.test,
        max_images=args.max
    )
