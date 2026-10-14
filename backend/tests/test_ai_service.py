"""Tests for the AI Service abstraction and error mapping."""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi import HTTPException
from backend.services.gemini_service import GeminiService
from backend.schemas.requests import ReadingLevel


@pytest.mark.asyncio
async def test_ai_service_fallback_mode():
    """Verify that without an API key, GeminiService operates in honest fallback mode."""
    svc = GeminiService(api_key="", model_name="gemini-2.5-flash")
    assert svc.is_live_configured is False

    text = "Newton's First Law states that an object at rest remains at rest unless acted upon by an external net force."
    result = await svc.simplify_educational_text(
        text=text,
        reading_level=ReadingLevel.SIMPLE,
    )
    assert result.is_mock is True
    assert "Newton" in result.concise_summary or "First Law" in result.concise_summary or len(result.concise_summary) > 20
    assert len(result.key_concepts) > 0
    assert len(result.study_checklist) > 0
    assert len(result.comprehension_questions) > 0
    assert result.reading_level == "simple"


@pytest.mark.asyncio
async def test_ai_diagram_fallback_mode():
    """Verify diagram explanation fallback produces complete structured visual description."""
    svc = GeminiService(api_key="")
    metadata = {"width": 1200, "height": 800, "format": "PNG"}

    res = await svc.explain_educational_diagram(
        image_bytes=b"dummy",
        mime_type="image/png",
        image_metadata=metadata,
        detail_level="balanced",
    )
    assert res.is_mock is True
    assert "visual_type" in res.model_dump()
    assert "audio_friendly_narration" in res.model_dump()
    assert res.source_metadata["width"] == 1200


@pytest.mark.asyncio
async def test_ai_upstream_rate_limit_mapping():
    """Verify upstream provider 429 errors map to HTTP 429."""
    svc = GeminiService(api_key="fake-key-for-test")
    # Mock client to simulate upstream quota error
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("ResourceExhausted: 429 Quota exceeded for model")
    svc._client = mock_client

    with pytest.raises(HTTPException) as exc:
        await svc.simplify_educational_text(
            text="Valid educational text that exceeds quota upstream.",
            reading_level=ReadingLevel.STANDARD,
        )
    assert exc.value.status_code == 429
    assert "quota or rate limit" in exc.value.detail.lower()
