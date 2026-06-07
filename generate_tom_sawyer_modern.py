#!/usr/bin/env python3
"""
Tom Sawyer Illustration Modernizer - FLUX.1
Converts classic 1800s illustrations to colorful modern children's book style
"""

import os
import torch
import json
import shutil
from pathlib import Path
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

INPUT_DIR = r"E:\development\mark-twain\public\images\book-illustrations\Tom_Sawyer\images"
OUTPUT_DIR = r"E:\development\mark-twain\public\images\book-illustrations\Tom_Sawyer\modernized"

# Two style variations
PROMPTS = {
    "modern": """A mischievous boy in 1800s American frontier setting, joyful character illustration,
colorful modern children's book style, warm and vibrant palette.
Expressive face, dynamic pose, detailed clothing with earth tones and jewel accents.
Sunlit scene, painted illustration style, contemporary storybook aesthetic.
High quality digital art, playful mood, character-focused composition.
Soft shadows for depth, masterpiece quality illustration, vibrant colors.""",

    "traditional": """A boy in 1800s American frontier setting, traditional book illustration,
oil painting, watercolor technique, classical illustration art style,
detailed ink line work with color wash, vintage aesthetic.
Expressive character, dynamic pose, warm earthy palette with selective bright accents.
Fine art print quality, storybook illustration, nostalgic yet refined mood,
reminiscent of 19th century classic book illustrations.
Soft atmospheric lighting, detailed fabric textures, masterpiece quality artwork."""
}

# ============================================================================
# FLUX GENERATION
# ============================================================================

def generate_with_flux(original_image_path: str, output_dir: Path, idx: int, style: str = "modern") -> bool:
    """Generate modernized illustration using SDXL img2img"""
    try:
        from diffusers import StableDiffusionXLImg2ImgPipeline
        from PIL import Image

        prompt = PROMPTS.get(style, PROMPTS["modern"])

        logger.info(f"Loading SDXL img2img pipeline...")
        pipe = StableDiffusionXLImg2ImgPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-refiner-1.0",
            torch_dtype=torch.float16,
            use_safetensors=True,
            variant="fp16"
        )
        pipe = pipe.to("cuda")

        # Load original image
        original = Image.open(original_image_path).convert("RGB")
        # Resize to multiple of 64
        original.thumbnail((768, 768), Image.Resampling.LANCZOS)

        logger.info(f"Generating {style} version from original...")

        image = pipe(
            prompt=prompt,
            image=original,
            num_inference_steps=30,
            guidance_scale=7.5,
            strength=0.75,
            generator=torch.Generator(device="cuda").manual_seed(idx)
        ).images[0]

        filename = Path(original_image_path).stem
        output_subdir = "modern" if style == "modern" else "traditional"
        output_path = output_dir / output_subdir / f"{style}_{filename}.png"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(output_path)
        logger.info(f"✓ Saved: {output_path.name}")
        return True

    except Exception as e:
        logger.error(f"Generation error: {e}")
        return False


def generate_with_sdxl_fallback(original_image_path: str, output_dir: Path, idx: int) -> bool:
    """Generate with SDXL as fallback if Flux fails"""
    try:
        from diffusers import StableDiffusionXLPipeline

        logger.info(f"Loading SDXL fallback...")
        pipe = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=torch.float16,
            use_safetensors=True,
            variant="fp16"
        )
        pipe = pipe.to("cuda")

        logger.info(f"Generating with SDXL...")
        image = pipe(
            prompt=FLUX_PROMPT,
            height=768,
            width=768,
            num_inference_steps=30,
            guidance_scale=7.5,
            generator=torch.Generator(device="cuda").manual_seed(idx)
        ).images[0]

        filename = Path(original_image_path).stem
        output_path = output_dir / "modern" / f"modern_{filename}.png"
        image.save(output_path)
        logger.info(f"✓ Saved with SDXL: {output_path.name}")
        return True

    except Exception as e:
        logger.error(f"SDXL fallback error: {e}")
        return False


# ============================================================================
# MAIN PIPELINE
# ============================================================================

def process_tom_sawyer(test_mode: bool = False, max_images: int = None, use_sdxl: bool = False, style: str = "modern"):
    """Main pipeline"""

    input_path = Path(INPUT_DIR)
    output_path = Path(OUTPUT_DIR)

    # Create directories
    (output_path / "originals").mkdir(parents=True, exist_ok=True)
    (output_path / "modern").mkdir(parents=True, exist_ok=True)
    (output_path / "traditional").mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        logger.error(f"Input directory not found: {input_path}")
        return

    # Get image files
    image_files = sorted([
        f for f in input_path.iterdir()
        if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    ])

    if test_mode:
        image_files = image_files[:1]
    elif max_images:
        image_files = image_files[:max_images]

    logger.info(f"Processing {len(image_files)} Tom Sawyer illustrations")
    logger.info(f"Using: {'SDXL (faster)' if use_sdxl else 'Flux (best quality)'}")
    logger.info(f"Style: {style}")

    manifest = {
        "title": f"Tom Sawyer - {style.capitalize()} Style",
        "created": datetime.now().isoformat(),
        "total_images": len(image_files),
        "model": "SDXL" if use_sdxl else "FLUX.1-dev",
        "style": style,
        "style_description": PROMPTS.get(style, ""),
        "images": []
    }

    successful = 0
    failed = 0

    for idx, image_file in enumerate(image_files, 1):
        logger.info(f"\n[{idx}/{len(image_files)}] {image_file.name}")

        try:
            # Determine output paths
            style_subdir = "modern" if style == "modern" else "traditional"
            if use_sdxl:
                target_output_file = output_path / "modern" / f"modern_{image_file.stem}.png"
            else:
                target_output_file = output_path / style_subdir / f"{style}_{image_file.stem}.png"

            # Copy original
            dest = output_path / "originals" / image_file.name
            if not dest.exists():
                shutil.copy2(image_file, dest)

            # Resume support: check if output file already exists
            if target_output_file.exists():
                logger.info(f"→ Skipping (already exists): {target_output_file.name}")
                manifest["images"].append({
                    "id": image_file.stem,
                    "original": f"originals/{image_file.name}",
                    "generated": f"{style_subdir}/{target_output_file.name}"
                })
                successful += 1
                continue

            # Generate version
            success = False
            if use_sdxl:
                success = generate_with_sdxl_fallback(str(image_file), output_path, idx)
            else:
                success = generate_with_flux(str(image_file), output_path, idx, style=style)

            if success:
                manifest["images"].append({
                    "id": image_file.stem,
                    "original": f"originals/{image_file.name}",
                    "generated": f"{style_subdir}/{target_output_file.name}"
                })
                successful += 1
            else:
                failed += 1
                logger.warning(f"✗ Generation failed for {image_file.name}")

        except Exception as e:
            logger.error(f"Processing error: {e}")
            failed += 1

    # Save manifest
    manifest_path = output_path / "manifest.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    logger.info(f"\n" + "=" * 70)
    logger.info(f"✓ Done! Successful: {successful}, Failed: {failed}")
    logger.info(f"Results in: {output_path}")
    logger.info("=" * 70)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Test mode: 1 image")
    parser.add_argument("--sdxl", action="store_true", help="Use SDXL instead of Flux")
    parser.add_argument("--max", type=int, default=None, help="Max images to process")
    parser.add_argument("--style", choices=["modern", "traditional"], default="modern", help="Illustration style")
    args = parser.parse_args()

    logger.info("=" * 70)
    logger.info("Tom Sawyer - Illustration Converter")
    logger.info(f"Style: {args.style.capitalize()}")
    logger.info("=" * 70)

    process_tom_sawyer(test_mode=args.test, use_sdxl=args.sdxl, max_images=args.max, style=args.style)
