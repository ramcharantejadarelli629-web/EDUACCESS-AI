"""Core accessibility API router for EduAccess AI.

Exposes endpoints for:
- Cognitive text simplification (simple, standard, detailed)
- Safe educational URL extraction and simplification
- Multimodal educational diagram and visual chart explanation
- PDF document inspection and page extraction
"""

from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from backend.config import settings
from backend.dependencies import get_gemini_service
from backend.services.gemini_service import GeminiService
from backend.services.image_service import validate_and_process_image
from backend.services.pdf_service import (
    inspect_pdf,
    extract_pdf_page_as_image,
)
from backend.services.url_service import fetch_and_extract_educational_url
from backend.security.validation import (
    read_upload_stream_bounded,
    sanitize_filename,
)
from backend.security.rate_limit import (
    rate_limit_ai,
    rate_limit_standard,
)
from backend.schemas.requests import (
    TextSimplificationRequest,
    UrlSimplificationRequest,
)
from backend.schemas.responses import (
    TextSimplificationResponse,
    DiagramExplanationResponse,
    PdfInspectionResponse,
    UrlExtractionResponse,
)

router = APIRouter(tags=["Accessibility Services"])


@router.post(
    "/simplify-text",
    response_model=TextSimplificationResponse,
    dependencies=[Depends(rate_limit_ai)],
    summary="Simplify dense educational text",
    description="Transforms academic content into structured, accessible learning material while preserving meaning.",
)
async def simplify_text(
    payload: TextSimplificationRequest,
    gemini_svc: GeminiService = Depends(get_gemini_service),
) -> TextSimplificationResponse:
    """Process pasted academic text through cognitive simplification pipeline."""
    return await gemini_svc.simplify_educational_text(
        text=payload.text,
        reading_level=payload.reading_level,
        target_audience=payload.target_audience,
        source_reference=payload.source_reference,
    )


@router.post(
    "/simplify-url",
    response_model=UrlExtractionResponse,
    dependencies=[Depends(rate_limit_ai)],
    summary="Safely fetch and simplify educational webpage",
    description="Fetches a public educational article using SSRF-protected streaming, extracts clean text, and simplifies it.",
)
async def simplify_url(
    payload: UrlSimplificationRequest,
    gemini_svc: GeminiService = Depends(get_gemini_service),
) -> UrlExtractionResponse:
    """Fetch educational article with defense-in-depth SSRF protections and simplify content."""
    extracted = await fetch_and_extract_educational_url(payload.url)
    simplification = await gemini_svc.simplify_educational_text(
        text=extracted["text"],
        reading_level=payload.reading_level,
        source_reference=extracted["title"],
    )
    return UrlExtractionResponse(
        source_url=extracted["source_url"],
        page_title=extracted["title"],
        extracted_text_length=extracted["text_length"],
        simplification=simplification,
    )


@router.post(
    "/explain-diagram",
    response_model=DiagramExplanationResponse,
    dependencies=[Depends(rate_limit_ai)],
    summary="Multimodal visual diagram and chart explanation",
    description="Analyzes educational diagrams, schematics, charts, or selected PDF pages using multimodal vision AI.",
)
async def explain_diagram(
    file: UploadFile = File(..., description="Educational image (JPEG/PNG) or PDF document"),
    detail_level: str = Form("balanced", description="Detail level: concise, balanced, or comprehensive"),
    page_number: Optional[int] = Form(1, description="Page number to inspect if uploading a PDF document"),
    gemini_svc: GeminiService = Depends(get_gemini_service),
) -> DiagramExplanationResponse:
    """Validate uploaded media and produce structured, accessible visual explanation."""
    raw_filename = file.filename or "uploaded_media"
    clean_name = sanitize_filename(raw_filename)

    # 1. Enforce size limit during chunked streaming read
    file_bytes = await read_upload_stream_bounded(file, settings.max_upload_size_bytes)

    # 2. Determine file format and process appropriately
    is_pdf = file_bytes.startswith(b"%PDF-") or clean_name.lower().endswith(".pdf")

    if is_pdf:
        # Multipage PDF handling: render the specified page to PNG for multimodal visual inspection
        selected_page = page_number or 1
        png_bytes, mime_type, page_text = extract_pdf_page_as_image(file_bytes, page_number=selected_page)
        metadata = {
            "filename": clean_name,
            "format": "PDF_PAGE_IMAGE",
            "page_number": selected_page,
            "extracted_text_snippet": page_text[:200] if page_text else None,
        }
        return await gemini_svc.explain_educational_diagram(
            image_bytes=png_bytes,
            mime_type=mime_type,
            image_metadata=metadata,
            detail_level=detail_level,
        )

    # Standard raster image handling
    clean_bytes, mime_type, img_meta = validate_and_process_image(file_bytes)
    img_meta["filename"] = clean_name

    return await gemini_svc.explain_educational_diagram(
        image_bytes=clean_bytes,
        mime_type=mime_type,
        image_metadata=img_meta,
        detail_level=detail_level,
    )


@router.post(
    "/pdf/inspect",
    response_model=PdfInspectionResponse,
    dependencies=[Depends(rate_limit_standard)],
    summary="Inspect PDF structure and page previews",
    description="Safely inspects PDF page count, image presence, and per-page text snippets for user page selection.",
)
async def inspect_pdf_document(
    file: UploadFile = File(..., description="PDF document to inspect"),
) -> PdfInspectionResponse:
    """Inspect PDF structure and return page choices for selective analysis."""
    clean_name = sanitize_filename(file.filename or "document.pdf")
    file_bytes = await read_upload_stream_bounded(file, settings.max_upload_size_bytes)
    return inspect_pdf(file_bytes, filename=clean_name)
