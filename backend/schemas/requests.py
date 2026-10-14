"""Request validation schemas for EduAccess AI API."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ReadingLevel(str, Enum):
    """Adjustable reading simplification levels."""
    SIMPLE = "simple"
    STANDARD = "standard"
    DETAILED = "detailed"


class TextSimplificationRequest(BaseModel):
    """Request schema for cognitive text simplification."""
    text: str = Field(
        ...,
        min_length=10,
        max_length=25000,
        description="The educational text to be simplified (10 to 25,000 characters).",
    )
    reading_level: ReadingLevel = Field(
        default=ReadingLevel.STANDARD,
        description="Desired cognitive simplification level: simple, standard, or detailed.",
    )
    target_audience: Optional[str] = Field(
        default="general_learner",
        max_length=100,
        description="Optional learning context (e.g., high_school, university, visual_learner).",
    )
    source_reference: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Optional source attribution or citation title.",
    )

    @field_validator("text")
    @classmethod
    def validate_text_content(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Input text cannot be empty or only whitespace.")
        if len(cleaned) < 10:
            raise ValueError("Educational text must be at least 10 characters long.")
        return cleaned


class UrlSimplificationRequest(BaseModel):
    """Request schema for safe educational URL fetching and simplification."""
    url: str = Field(
        ...,
        max_length=2048,
        description="A public HTTP or HTTPS educational article URL.",
    )
    reading_level: ReadingLevel = Field(
        default=ReadingLevel.STANDARD,
        description="Desired cognitive simplification level.",
    )

    @field_validator("url")
    @classmethod
    def validate_url_syntax(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        if "@" in v:
            raise ValueError("User credentials in URLs are not permitted for security reasons.")
        return v
