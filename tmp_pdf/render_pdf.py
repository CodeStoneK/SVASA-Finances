import fitz

pdf_path = r"C:\Users\ranga\Code\SvasaFinances\frontend\app\reports\templates\Devotee Spl Ack 2025 - JANGA REDDY.pdf"
doc = fitz.open(pdf_path)
page = doc.load_page(0)
pix = page.get_pixmap(dpi=150)
pix.save("page_0.png")
print("Saved page_0.png")
