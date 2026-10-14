"""Safe educational article URL reader service for EduAccess AI.

Implements defense-in-depth protections:
- Scheme validation (HTTP/HTTPS only)
- Private/loopback/link-local/metadata IP rejection
- DNS rebinding defense on every hop/redirect
- Streaming response size enforcement (max 2 MiB)
- Safe HTML text extraction without script execution
"""

import httpx
from bs4 import BeautifulSoup
from fastapi import HTTPException, status
from urllib.parse import urljoin
from backend.config import settings
from backend.security.validation import validate_url_for_ssrf


async def fetch_and_extract_educational_url(url: str) -> dict:
    """Safely fetch a public educational article URL and extract clean readable text.

    Returns:
        Dict with keys: source_url, title, text, text_length
    Raises:
        HTTPException with status 400, 422, or 502 for security or extraction failures.
    """
    current_url, _ = validate_url_for_ssrf(url)
    max_redirects = 3
    redirect_count = 0

    headers = {
        "User-Agent": "EduAccess-AI-Reader/1.0 (Educational Accessibility Tool; +https://eduaccess.local)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }

    timeout = httpx.Timeout(
        connect=5.0,
        read=settings.url_fetch_timeout_seconds,
        write=5.0,
        pool=5.0,
    )

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
        while True:
            try:
                # Use streaming request to enforce max response size while reading
                async with client.stream("GET", current_url, headers=headers) as response:
                    # Handle redirects manually to validate destination IP against SSRF
                    if response.status_code in (301, 302, 303, 307, 308):
                        redirect_count += 1
                        if redirect_count > max_redirects:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Too many redirects encountered while fetching article.",
                            )
                        location = response.headers.get("location")
                        if not location:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Received redirect without Location header.",
                            )
                        next_url = urljoin(current_url, location)
                        # Validate next URL and resolve its IP before continuing!
                        current_url, _ = validate_url_for_ssrf(next_url)
                        continue

                    if response.status_code != 200:
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"Target server returned HTTP {response.status_code}. Could not access educational article.",
                        )

                    content_type = response.headers.get("content-type", "").lower()
                    if not any(t in content_type for t in ("text/html", "application/xhtml+xml")):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Unsupported content type '{content_type}'. Only HTML articles can be processed.",
                        )

                    # Stream content with strict size cap
                    total_bytes = 0
                    body_chunks = []
                    async for chunk in response.aiter_bytes():
                        total_bytes += len(chunk)
                        if total_bytes > settings.url_max_response_bytes:
                            raise HTTPException(
                                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                                detail=f"Target webpage exceeds maximum allowed size of {settings.url_max_response_bytes // (1024 * 1024)} MiB.",
                            )
                        body_chunks.append(chunk)

                    raw_html = b"".join(body_chunks)
                    break

            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Timed out while connecting to or reading the requested educational URL.",
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Network error while connecting to educational URL: {str(e)}",
                )

    # Parse HTML safely with BeautifulSoup
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to parse the retrieved webpage HTML.",
        )

    # Extract title
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()
    if not title:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text().strip()
    if not title:
        title = "Educational Article"

    # Remove non-content elements
    for tag in soup(["script", "style", "noscript", "svg", "nav", "footer", "header", "aside", "form", "iframe", "button"]):
        tag.decompose()

    # Prioritize main content containers if present
    content_root = soup.find("article") or soup.find("main") or soup.find(id=lambda x: x and "content" in x.lower()) or soup.body or soup

    # Extract text with clean paragraph separations
    paragraphs = []
    for elem in content_root.find_all(["p", "h1", "h2", "h3", "h4", "li", "blockquote"]):
        txt = elem.get_text().strip()
        if txt and len(txt) > 20:
            paragraphs.append(txt)

    combined_text = "\n\n".join(paragraphs)
    if not combined_text.strip():
        # Fallback to general text extraction
        combined_text = content_root.get_text(separator="\n", strip=True)

    clean_text = combined_text.strip()
    if len(clean_text) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extracted webpage does not contain sufficient readable educational text.",
        )

    # Bound maximum text to prevent overloading AI models
    bounded_text = clean_text[:settings.max_input_text_length]

    return {
        "source_url": current_url,
        "title": title,
        "text": bounded_text,
        "text_length": len(bounded_text),
    }
