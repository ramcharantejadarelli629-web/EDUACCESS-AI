"""Backend configuration for EduAccess AI.

Loads settings from environment variables and provides safe defaults.
"""

from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings validated with Pydantic Settings."""

    # Project metadata
    project_name: str = "EduAccess AI — Learn Without Barriers"
    api_v1_prefix: str = "/api/v1"
    environment: str = Field(default="development", description="Environment mode: development, test, production")
    debug: bool = False

    # AI Configuration
    # Uses official google-genai SDK
    gemini_api_key: str = Field(default="", description="Google Gemini API Key")
    gemini_model: str = Field(default="gemini-2.5-flash", description="Gemini model identifier")
    ai_request_timeout_seconds: float = Field(default=45.0, description="Max seconds to wait for AI response")
    mock_ai_mode: bool = Field(default=False, description="When true, uses honest local fallback for testing/demo")

    # Security & Limits
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    max_upload_size_bytes: int = Field(default=5 * 1024 * 1024, description="Max upload size in bytes (5 MiB default)")
    max_pdf_pages: int = Field(default=15, description="Maximum allowed pages in uploaded PDF")
    max_input_text_length: int = Field(default=25000, description="Maximum characters allowed in pasted text")
    url_fetch_timeout_seconds: float = Field(default=10.0, description="Timeout for external URL extraction")
    url_max_response_bytes: int = Field(default=2 * 1024 * 1024, description="Max HTML response size (2 MiB)")

    # Rate Limiting (process-local)
    rate_limit_per_minute: int = Field(default=60, description="Standard requests per minute per IP")
    rate_limit_ai_per_minute: int = Field(default=20, description="AI/Expensive requests per minute per IP")

    # Logging
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Singleton instance
settings = Settings()
