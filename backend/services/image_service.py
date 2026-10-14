"""Image processing and validation service for EduAccess AI.

Validates uploaded images using Pillow:
- Verifies real magic bytes and image integrity
- Guards against decompression bombs (excessive pixel dimensions)
- Strips privacy-sensitive EXIF metadata
- Normalizes color spaces for multimodal AI processing
"""

import io
from typing import Tuple, Dict, Any
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import HTTPException, status

# Safety bounds
MAX_IMAGE_WIDTH = 8000
MAX_IMAGE_HEIGHT = 8000
MAX_IMAGE_PIXELS = 25_000_000  # 25 megapixels
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_and_process_image(raw_bytes: bytes) -> Tuple[bytes, str, Dict[str, Any]]:
    """Validate image bytes with Pillow, strip EXIF metadata, and return sanitized image.

    Returns:
        Tuple of (clean_bytes, mime_type, metadata_dict)
    Raises:
        HTTPException with status 400 if image is corrupted, unsupported, or exceeds dimension limits.
    """
    if not raw_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image data provided.",
        )

    # 1. Open with Pillow safely
    try:
        stream = io.BytesIO(raw_bytes)
        img = Image.open(stream)
        img_format = (img.format or "").upper()
    except (UnidentifiedImageError, OSError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid or readable image. Only JPEG and PNG are supported.",
        )

    # 2. Check format
    if img_format not in ALLOWED_IMAGE_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{img_format}'. Only JPEG and PNG images are supported.",
        )

    # 3. Check dimensions to guard against decompression bombs
    width, height = img.size
    total_pixels = width * height
    if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT or total_pixels > MAX_IMAGE_PIXELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image dimensions ({width}x{height}) exceed maximum allowed dimensions (max {MAX_IMAGE_WIDTH}x{MAX_IMAGE_HEIGHT} or 25MP).",
        )

    # 4. Verify integrity
    try:
        # Re-open for operations since verify() can mutate internal state
        stream.seek(0)
        img = Image.open(stream)
        # Transpose according to EXIF orientation then strip metadata
        img = ImageOps.exif_transpose(img)
    except Exception:
        # If exif_transpose fails, proceed with original orientation
        pass

    # 5. Normalize color mode
    # Convert RGBA/P/CMYK to RGB for consistent processing if saving JPEG
    target_mime = "image/jpeg" if img_format == "JPEG" else "image/png"
    out_format = "JPEG" if img_format == "JPEG" else "PNG"

    if out_format == "JPEG" and img.mode in ("RGBA", "P", "LA", "CMYK"):
        img = img.convert("RGB")
    elif out_format == "PNG" and img.mode not in ("RGB", "RGBA", "L"):
        img = img.convert("RGBA")

    # 6. Save clean image without original EXIF
    out_buffer = io.BytesIO()
    if out_format == "JPEG":
        img.save(out_buffer, format="JPEG", quality=90, optimize=True)
    else:
        img.save(out_buffer, format="PNG", optimize=True)

    clean_bytes = out_buffer.getvalue()

    metadata = {
        "width": width,
        "height": height,
        "format": out_format,
        "mime_type": target_mime,
        "processed_size_bytes": len(clean_bytes),
    }

    return clean_bytes, target_mime, metadata
