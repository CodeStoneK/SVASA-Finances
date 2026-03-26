import PyPDF2

pdf_path = r"C:\Users\ranga\Code\SvasaFinances\frontend\app\reports\templates\Devotee Spl Ack 2025 - JANGA REDDY.pdf"

try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        print("--- EXTRACTED PDF TEXT ---")
        print(text)
except Exception as e:
    print(f"Error: {e}")
