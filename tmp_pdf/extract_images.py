import fitz
import os

pdf_path = r"C:\Users\ranga\Code\SvasaFinances\frontend\app\reports\templates\Devotee Spl Ack 2025 - JANGA REDDY.pdf"
out_dir = r"C:\Users\ranga\Code\SvasaFinances\frontend\public"

doc = fitz.open(pdf_path)
page = doc.load_page(0)

image_list = page.get_images(full=True)
print(f"Found {len(image_list)} images on page 0")

for img_index, img in enumerate(image_list):
    xref = img[0]
    base_image = doc.extract_image(xref)
    image_bytes = base_image["image"]
    image_ext = base_image["ext"]
    
    # Simple logic: the logo is probably the first image, signature the second, or based on size
    filename = f"extracted_img_{img_index}.{image_ext}"
    filepath = os.path.join(out_dir, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)
    print(f"Saved {filepath}")
