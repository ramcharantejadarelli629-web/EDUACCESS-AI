"""Schemas package for EduAccess AI."""

from backend.schemas.requests import (
    ReadingLevel,
    TextSimplificationRequest,
    UrlSimplificationRequest,
)
from backend.schemas.responses import (
    GlossaryItem,
    ChecklistItem,
    ComprehensionQuestion,
    TextSimplificationResponse,
    ChartTrendData,
    DiagramExplanationResponse,
    PagePreview,
    PdfInspectionResponse,
    UrlExtractionResponse,
    HealthStatusResponse,
    ReadinessStatusResponse,
)

__all__ = [
    "ReadingLevel",
    "TextSimplificationRequest",
    "UrlSimplificationRequest",
    "GlossaryItem",
    "ChecklistItem",
    "ComprehensionQuestion",
    "TextSimplificationResponse",
    "ChartTrendData",
    "DiagramExplanationResponse",
    "PagePreview",
    "PdfInspectionResponse",
    "UrlExtractionResponse",
    "HealthStatusResponse",
    "ReadinessStatusResponse",
]
