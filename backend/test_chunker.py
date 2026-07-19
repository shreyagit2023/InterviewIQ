from app.services.pdf_loader import extract_pdf_text
from app.services.chunker import chunk_pages

pages = extract_pdf_text("app/uploads/ShreyaResume.pdf")

chunks = chunk_pages(pages)

print(f"Pages: {len(pages)}")
print(f"Chunks: {len(chunks)}")

print("\nFirst Chunk:\n")
print(chunks[0])