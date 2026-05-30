from PIL import Image
import os

image_path = 'e:/development/mark-twain/public/images/eves-diary/005.jpg'
if os.path.exists(image_path):
    img = Image.open(image_path)
    width, height = img.size
    mid_y = height // 2
    
    # Read the pixel values of the first 50 pixels horizontally at middle Y
    pixels = [img.getpixel((x, mid_y)) for x in range(min(50, width))]
    print(f"Image width: {width}, height: {height}")
    print(f"Pixels at y={mid_y} for x from 0 to 49:")
    print(pixels)
else:
    print("Image not found")
