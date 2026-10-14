"""Services module for EduAccess AI."""

from backend.services.gemini_service import GeminiService, gemini_service
from backend.services.image_service import validate_and_process_image
from backend.services.pdf_service import inspect_pdf, extract_pdf_page_as_image, extract_all_text_from_pdf
from backend.services.url_service import fetch_and_extract_educational_url

__all__ = [
    "GeminiService",
    "gemini_service",
    "validate_and_process_image",
    "inspect_pdf",
    "extract_pdf_page_as_image",
    "extract_all_text_from_pdf",
    "fetch_and_extract_educational_url",
]
