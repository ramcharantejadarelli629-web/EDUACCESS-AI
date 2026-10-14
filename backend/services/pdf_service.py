"""PDF processing and page extraction service for EduAccess AI.

Uses PyMuPDF (fitz) to safely:
- Inspect document structure and page count limits
- Extract textual content per page
- Render selected educational pages to high-resolution PNG images for multimodal AI visual inspection
- Guard against malicious, corrupt, or excessively large PDF files
"""

from typing import List, Tuple, Dict, Any, Optional
import fitz  # PyMuPDF
from fastapi import HTTPException, status
from backend.config import settings
from backend.schemas.responses import PagePreview, PdfInspectionResponse


def inspect_pdf(raw_bytes: bytes, filename: str = "document.pdf") -> PdfInspectionResponse:
    """Inspect an uploaded PDF file and return page metadata and previews."""
    if not raw_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The file does not have a valid PDF header (%PDF-).",
        )

    try:
        doc = fitz.open(stream=raw_bytes, filetype="pdf")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not open PDF file. The file may be corrupt or encrypted.",
        )

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided PDF contains 0 pages.",
        )

    if total_pages > settings.max_pdf_pages:
        doc.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PDF has {total_pages} pages, which exceeds the maximum limit of {settings.max_pdf_pages} pages for accessible processing. Please upload a smaller excerpt or chapter.",
        )

    pages: List[PagePreview] = []
    for page_idx in range(total_pages):
        page = doc.load_page(page_idx)
        text = page.get_text() or ""
        snippet = text.strip()[:200] if text.strip() else "[No extractable text - likely a scanned or diagram-only page]"
        image_list = page.get_images()
        pages.append(
            PagePreview(
                page_number=page_idx + 1,
                text_length=len(text),
                preview_snippet=snippet,
                has_images=len(image_list) > 0,
            )
        )

    doc.close()

    return PdfInspectionResponse(
        filename=filename,
        total_pages=total_pages,
        pages=pages,
        file_size_bytes=len(raw_bytes),
    )


def extract_pdf_page_as_image(raw_bytes: bytes, page_number: int = 1, dpi: int = 150) -> Tuple[bytes, str, str]:
    """Render a specific PDF page to a PNG image for visual analysis by the multimodal AI.

    Returns:
        Tuple of (png_bytes, mime_type, extracted_page_text)
    """
    if not raw_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF header.",
        )

    try:
        doc = fitz.open(stream=raw_bytes, filetype="pdf")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not open PDF file.",
        )

    total_pages = len(doc)
    if page_number < 1 or page_number > total_pages:
        doc.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested page {page_number} is out of bounds (document has {total_pages} pages).",
        )

    page = doc.load_page(page_number - 1)
    extracted_text = page.get_text() or ""

    # Render page to high-res pixmap (150 DPI provides clear readable labels for multimodal AI)
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    png_bytes = pix.tobytes("png")

    doc.close()

    return png_bytes, "image/png", extracted_text


def extract_all_text_from_pdf(raw_bytes: bytes, max_chars: int = 25000) -> Tuple[str, int]:
    """Extract all text across pages of a PDF within bounded limits.

    Returns:
        Tuple of (combined_text, total_pages)
    """
    try:
        doc = fitz.open(stream=raw_bytes, filetype="pdf")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not open PDF file for text extraction.",
        )

    total_pages = len(doc)
    if total_pages > settings.max_pdf_pages:
        doc.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PDF has {total_pages} pages, which exceeds the maximum limit of {settings.max_pdf_pages} pages.",
        )

    chunks = []
    total_len = 0
    for page_idx in range(total_pages):
        page = doc.load_page(page_idx)
        text = page.get_text()
        if text:
            clean_text = text.strip()
            chunks.append(f"--- Page {page_idx + 1} ---\n{clean_text}")
            total_len += len(clean_text)
            if total_len > max_chars:
                break

    doc.close()
    combined = "\n\n".join(chunks)
    if not combined.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The PDF contains no extractable text. It may be composed entirely of scanned raster images.",
        )

    return combined[:max_chars], total_pages
