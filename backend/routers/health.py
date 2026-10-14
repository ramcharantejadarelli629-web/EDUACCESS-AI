"""Health and readiness monitoring endpoints for EduAccess AI."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from backend.config import Settings
from backend.dependencies import get_settings, get_gemini_service
from backend.services.gemini_service import GeminiService
from backend.schemas.responses import HealthStatusResponse, ReadinessStatusResponse

router = APIRouter(prefix="/health", tags=["Health & Readiness"])


@router.get(
    "/liveness",
    response_model=HealthStatusResponse,
    summary="Liveness check",
    description="Indicates whether the application process is running and able to handle incoming requests.",
)
async def liveness() -> HealthStatusResponse:
    """Liveness probe does not depend on external AI availability."""
    return HealthStatusResponse(
        status="alive",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0.0",
    )


@router.get(
    "/readiness",
    response_model=ReadinessStatusResponse,
    summary="Readiness check",
    description="Reports whether required configurations and AI pipelines are initialized without exposing confidential values.",
)
async def readiness(
    settings: Settings = Depends(get_settings),
    gemini_svc: GeminiService = Depends(get_gemini_service),
) -> ReadinessStatusResponse:
    """Readiness probe reporting AI configuration readiness safely."""
    is_ready = bool(settings.mock_ai_mode or gemini_svc.is_live_configured)
    return ReadinessStatusResponse(
        status="ready" if is_ready else "configuration_needed",
        ai_configured=gemini_svc.is_live_configured,
        mock_ai_mode=settings.mock_ai_mode or not gemini_svc.is_live_configured,
        environment=settings.environment,
        model=settings.gemini_model,
    )
