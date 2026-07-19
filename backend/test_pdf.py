from app.services.pdf_loader import extract_pdf_text

pages = extract_pdf_text("app/uploads/ShreyaResume.pdf")

print(f"Total pages: {len(pages)}")

print("\nFirst page:")

print(pages[0])