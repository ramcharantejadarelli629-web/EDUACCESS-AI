"""Dependency injection for EduAccess AI backend."""

from typing import Generator
from backend.config import Settings, settings
from backend.services.gemini_service import GeminiService, gemini_service


def get_settings() -> Settings:
    """Return application configuration settings."""
    return settings


def get_gemini_service() -> GeminiService:
    """Return configured GeminiService instance.

    Can be overridden in tests via app.dependency_overrides[get_gemini_service].
    """
    return gemini_service
