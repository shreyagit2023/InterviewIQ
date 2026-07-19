import fitz
import os

def extract_pdf_text(pdf_path: str):
    """
    Extract text from every page of a PDF.

    Returns:
        [
            {
                "page": 1,
                "text": "..."
            },
            ...
        ]
    """

    document = fitz.open(pdf_path)

    filename = os.path.basename(pdf_path)

    pages = []

    for page_number in range(len(document)):
        page = document.load_page(page_number)

        pages.append(
            {
                "filename": filename,
                "page": page_number + 1,
                "text": page.get_text()
            }
        )

    document.close()

    return pages