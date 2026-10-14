"""Routers package for EduAccess AI."""

from backend.routers.health import router as health_router
from backend.routers.accessibility import router as accessibility_router

__all__ = ["health_router", "accessibility_router"]
