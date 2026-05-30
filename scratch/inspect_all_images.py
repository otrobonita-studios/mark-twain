import os
import glob
from PIL import Image

image_dir = 'e:/development/mark-twain/public/images/eves-diary'
images = glob.glob(os.path.join(image_dir, '*.jpg'))

print(f"Found {len(images)} images.")

results = []
for img_path in sorted(images):
    name = os.path.basename(img_path)
    if name in ['cover.jpg', 'front.jpg', 'title.jpg']:
        continue
    try:
        img = Image.open(img_path)
        width, height = img.size
        
        # Convert to grayscale to check brightness
        gray = img.convert('L')
        
        # Check average pixel value in vertical strips of 5% width starting from the left
        strip_width = int(width * 0.05)
        
        strips_brightness = []
        for i in range(8):  # Check first 8 strips (up to 40% of the image width)
            left = i * strip_width
            right = (i + 1) * strip_width
            box = (left, 0, right, height)
            cropped = gray.crop(box)
            avg_brightness = sum(cropped.getdata()) / (cropped.size[0] * cropped.size[1])
            strips_brightness.append(round(avg_brightness, 1))
            
        results.append((name, width, height, strips_brightness))
    except Exception as e:
        print(f"Error checking {name}: {e}")

# Print results
for name, w, h, strips in results[:15]:
    print(f"{name} ({w}x{h}): Strips average brightness: {strips}")
