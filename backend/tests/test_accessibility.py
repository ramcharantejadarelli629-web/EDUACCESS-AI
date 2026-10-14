"""Tests for core accessibility endpoints and media handling."""

import io
import pytest
from PIL import Image
import fitz  # PyMuPDF
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.image_service import validate_and_process_image
from backend.services.pdf_service import inspect_pdf, extract_pdf_page_as_image


def create_test_image(format="PNG", width=100, height=100, color=(70, 130, 180)):
    """Generate a clean in-memory test image."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


def create_test_pdf(text_content="Cellular Respiration occurs in mitochondria. It converts glucose into ATP."):
    """Generate a clean in-memory test PDF with PyMuPDF."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 72), "Chapter 4: Energy and Life", fontsize=18)
    page.insert_text((50, 110), text_content, fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


@pytest.mark.asyncio
async def test_text_simplification_valid():
    """Verify text simplification produces complete, structured accessible learning output."""
    sample_text = (
        "Mitochondria are double-membrane-bound organelles found in most eukaryotic organisms. "
        "They generate most of the chemical energy needed to power biochemical reactions via "
        "adenosine triphosphate (ATP). The inner membrane contains folds called cristae that "
        "increase the surface area for oxidative phosphorylation."
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/simplify-text",
            json={
                "text": sample_text,
                "reading_level": "standard",
                "target_audience": "high_school",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "concise_summary" in data
        assert "simplified_explanation" in data
        assert len(data["key_concepts"]) > 0
        assert len(data["essential_facts"]) > 0
        assert len(data["study_checklist"]) > 0
        assert len(data["comprehension_questions"]) > 0
        assert "word_count_original" in data
        assert "word_count_simplified" in data
        # Stable task IDs
        assert data["study_checklist"][0]["id"]


@pytest.mark.asyncio
async def test_text_simplification_empty_rejection():
    """Verify empty or whitespace-only text is rejected with HTTP 422."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/simplify-text",
            json={"text": "      ", "reading_level": "simple"},
        )
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_text_simplification_too_short():
    """Verify input under minimum length is rejected."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/simplify-text",
            json={"text": "Short", "reading_level": "simple"},
        )
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_diagram_explanation_valid_image():
    """Verify diagram analysis handles image upload and returns structured visual description."""
    img_bytes = create_test_image(format="PNG")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/explain-diagram",
            files={"file": ("biology_cell.png", img_bytes, "image/png")},
            data={"detail_level": "balanced"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data
        assert "visual_type" in data
        assert "layout_description" in data
        assert "audio_friendly_narration" in data
        assert "short_summary" in data
        assert len(data["logical_reading_order"]) > 0


@pytest.mark.asyncio
async def test_diagram_explanation_corrupt_image():
    """Verify corrupt image upload is rejected with clear error and no stack trace."""
    corrupt_bytes = b"not an image at all - random byte sequence"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/explain-diagram",
            files={"file": ("broken.png", corrupt_bytes, "image/png")},
        )
        assert response.status_code == 400
        assert "Traceback" not in response.text
        assert "valid or readable image" in response.json()["detail"]


@pytest.mark.asyncio
async def test_pdf_inspection_valid():
    """Verify PDF document inspection extracts page count and previews."""
    pdf_bytes = create_test_pdf()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/pdf/inspect",
            files={"file": ("lecture_energy.pdf", pdf_bytes, "application/pdf")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_pages"] == 1
        assert len(data["pages"]) == 1
        assert data["pages"][0]["page_number"] == 1
        assert "Energy and Life" in data["pages"][0]["preview_snippet"]


@pytest.mark.asyncio
async def test_pdf_diagram_explanation():
    """Verify PDF page rendering and diagram explanation."""
    pdf_bytes = create_test_pdf("A process flow diagram showing glycolysis and Krebs cycle.")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/explain-diagram",
            files={"file": ("lecture_energy.pdf", pdf_bytes, "application/pdf")},
            data={"page_number": 1, "detail_level": "balanced"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data
        assert data["source_metadata"]["format"] == "PDF_PAGE_IMAGE"
        assert data["source_metadata"]["page_number"] == 1
