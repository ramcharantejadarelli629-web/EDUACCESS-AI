"""EduAccess AI — Learn Without Barriers.

FastAPI main application entrypoint.
Configures middleware, versioned routers, security headers, and consistent error handling.
"""

import logging
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.config import settings
from backend.routers.health import router as health_router
from backend.routers.accessibility import router as accessibility_router

# Setup structured logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("eduaccess.app")

# Initialize FastAPI application
app = FastAPI(
    title=settings.project_name,
    description=(
        "EduAccess AI transforms difficult learning materials into accessible, "
        "understandable, and actionable learning experiences for inclusive education."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# -----------------------------------------------------------------------------
# Security & Headers Middleware
# -----------------------------------------------------------------------------
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add defensive HTTP security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    return response


# -----------------------------------------------------------------------------
# CORS Configuration & Compression
# NOTE: CORS is a browser security policy, NOT authentication or authorization.
# -----------------------------------------------------------------------------
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,  # Unauthenticated public demo does not use ambient session cookies
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "X-Requested-With", "Authorization"],
    max_age=600,
)


# -----------------------------------------------------------------------------
# Consistent JSON Error Handling (No Leaked Stack Traces)
# -----------------------------------------------------------------------------
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Format HTTP exceptions into consistent, safe JSON responses."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "detail": exc.detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format request validation errors cleanly for client consumption."""
    clean_errors = []
    for err in exc.errors():
        field_loc = " -> ".join(str(loc) for loc in err.get("loc", []))
        clean_errors.append(f"{field_loc}: {err.get('msg')}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "status_code": 422,
            "detail": "Request body validation failed.",
            "validation_errors": clean_errors,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all error handler preventing internal stack trace leaks."""
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "status_code": 500,
            "detail": "An internal server error occurred. Please try again later.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# -----------------------------------------------------------------------------
# Router Registration
# -----------------------------------------------------------------------------
app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(accessibility_router, prefix=settings.api_v1_prefix)

# Mount static frontend build if present (production / containerized deployment)
import os
from fastapi.staticfiles import StaticFiles

dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.isdir(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="frontend-static")
else:
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        """Root redirect to OpenAPI documentation when running backend standalone."""
        return {
            "project": settings.project_name,
            "api_documentation": "/docs",
            "health_liveness": f"{settings.api_v1_prefix}/health/liveness",
            "health_readiness": f"{settings.api_v1_prefix}/health/readiness",
        }

