import os
import glob
from PIL import Image

image_dir = 'e:/development/mark-twain/public/images/eves-diary'
images = glob.glob(os.path.join(image_dir, '*.jpg'))

print(f"Checking {len(images)} images for dark left borders...")

dark_images = []
for img_path in sorted(images):
    name = os.path.basename(img_path)
    if name in ['cover.jpg', 'front.jpg', 'title.jpg']:
        continue
    try:
        img = Image.open(img_path)
        width, height = img.size
        gray = img.convert('L')
        
        # Check average pixel value in first 5% of the width
        strip_width = max(1, int(width * 0.05))
        box = (0, 0, strip_width, height)
        cropped = gray.crop(box)
        avg_brightness = sum(cropped.getdata()) / (cropped.size[0] * cropped.size[1])
        
        # Also check the first 10%
        strip_width_10 = max(1, int(width * 0.10))
        box_10 = (0, 0, strip_width_10, height)
        cropped_10 = gray.crop(box_10)
        avg_brightness_10 = sum(cropped_10.getdata()) / (cropped_10.size[0] * cropped_10.size[1])
        
        if avg_brightness < 100 or avg_brightness_10 < 100:
            dark_images.append((name, width, height, round(avg_brightness, 1), round(avg_brightness_10, 1)))
    except Exception as e:
        print(f"Error checking {name}: {e}")

print(f"\nFound {len(dark_images)} images with dark left edges:")
for name, w, h, b5, b10 in dark_images:
    print(f"- {name} ({w}x{h}): 5% strip brightness={b5}, 10% strip brightness={b10}")
