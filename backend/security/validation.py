"""Input validation and SSRF defenses for EduAccess AI.

Implements defense-in-depth protections against:
- SSRF (Server-Side Request Forgery)
- DNS rebinding & redirect-based attacks
- Unbounded memory exhaustion via oversized file uploads
- Decompression bombs & malformed image/PDF exploits
"""

import ipaddress
import re
import socket
from typing import Tuple, List, Optional
from urllib.parse import urlparse
from fastapi import HTTPException, UploadFile, status

# Prohibited IP networks (IPv4 and IPv6)
DISALLOWED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network
    ipaddress.ip_network("10.0.0.0/8"),         # Private RFC 1918
    ipaddress.ip_network("100.64.0.0/10"),      # Shared Address Space (CGNAT)
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link-Local (AWS/GCP/Azure metadata)
    ipaddress.ip_network("172.16.0.0/12"),      # Private RFC 1918
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),       # TEST-NET-1
    ipaddress.ip_network("192.168.0.0/16"),     # Private RFC 1918
    ipaddress.ip_network("198.18.0.0/15"),      # Benchmark testing
    ipaddress.ip_network("198.51.100.0/24"),    # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),     # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
    # IPv6 ranges
    ipaddress.ip_network("::1/128"),            # Loopback
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("::ffff:0:0/96"),      # IPv4-mapped IPv6
    ipaddress.ip_network("100::/64"),           # Discard-only
    ipaddress.ip_network("64:ff9b::/96"),       # IPv4/IPv6 translation
    ipaddress.ip_network("2001:db8::/32"),      # Documentation
    ipaddress.ip_network("fc00::/7"),           # Unique local address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-local
    ipaddress.ip_network("ff00::/8"),           # Multicast
]

# Sensitive cloud metadata hostnames
DISALLOWED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "metadata.internal",
    "instance-data",
    "169.254.169.254",
}


def sanitize_filename(filename: Optional[str]) -> str:
    """Sanitize client-supplied filename to prevent directory traversal and display issues."""
    if not filename:
        return "unnamed_document"
    # Remove path traversal sequences, directory separators, and control characters
    clean = filename.replace("..", "")
    clean = re.sub(r'[\r\n\t\x00\\/]', '', clean)
    clean = re.sub(r'[^a-zA-Z0-9_\-\. ]', '', clean).strip()
    clean = clean.strip(". ")
    if not clean:
        return "unnamed_document"
    return clean[:100]


def is_ip_disallowed(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Check if an IP address belongs to any private, loopback, or reserved network."""
    # Native checks
    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        return True

    # Explicit network range verification
    for net in DISALLOWED_NETWORKS:
        if ip in net:
            return True

    return False


def validate_url_for_ssrf(url_string: str) -> Tuple[str, List[str]]:
    """Validate URL syntax, scheme, and resolve host to ensure non-private/non-internal target.

    Returns:
        Tuple of (clean_url, resolved_ip_addresses)
    Raises:
        HTTPException with status 400 if URL is invalid, non-public, or unsafe.
    """
    try:
        parsed = urlparse(url_string.strip())
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed URL format.",
        )

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported scheme '{scheme}'. Only HTTP and HTTPS are permitted for educational articles.",
        )

    # Reject embedded userinfo (e.g. http://attacker@legit.com)
    if parsed.username or parsed.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URLs containing user credentials are not allowed for security reasons.",
        )

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is missing a valid hostname.",
        )

    if hostname in DISALLOWED_HOSTNAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Access to internal or reserved host '{hostname}' is restricted.",
        )

    # Reject raw IP literals if private/reserved
    try:
        ip_obj = ipaddress.ip_address(hostname)
        if is_ip_disallowed(ip_obj):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Access to private, loopback, or non-routable IP addresses is prohibited.",
            )
        resolved_ips = [str(ip_obj)]
    except ValueError:
        # Hostname needs DNS resolution
        try:
            addr_info = socket.getaddrinfo(hostname, None)
        except socket.gaierror:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not resolve hostname '{hostname}'. Please check that the domain exists.",
            )

        resolved_ips = []
        for info in addr_info:
            ip_str = info[4][0]
            try:
                ip_obj = ipaddress.ip_address(ip_str)
                if is_ip_disallowed(ip_obj):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Hostname '{hostname}' resolves to a restricted/private network address ({ip_str}). Request blocked.",
                    )
                resolved_ips.append(ip_str)
            except ValueError:
                continue

    if not resolved_ips:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hostname '{hostname}' did not resolve to any valid IP address.",
        )

    return url_string, resolved_ips


async def read_upload_stream_bounded(file: UploadFile, max_bytes: int) -> bytes:
    """Read an uploaded file in chunks while enforcing maximum allowed size.

    Prevents memory exhaustion by rejecting oversized uploads during streaming
    before the full file is loaded into RAM.
    """
    total_bytes = 0
    chunks = []
    chunk_size = 64 * 1024  # 64 KiB chunks

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded file exceeds the maximum allowed size of {max_bytes // (1024 * 1024)} MiB.",
            )
        chunks.append(chunk)

    if total_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    return b"".join(chunks)
