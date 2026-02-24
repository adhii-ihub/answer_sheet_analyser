"""
core/ocr.py

OCR module for the EduGrade AI system.

Two-step pipeline:

1. POST the answer-sheet image to the **LightNeon OCR 2** service
   (hosted on your Cloudflare / ngrok server at ``<base_url>/ocr``).
   Returns the full handwritten text as a plain string.

2. Send the raw OCR text + expected question IDs to **Google Gemini**,
   which parses and returns a structured JSON mapping each question ID
   to its answer excerpt.
"""


import json
import logging
import re
import time
from pathlib import Path

import requests
import google.generativeai as genai

from core.exceptions import OcrException

# ---------------------------------------------------------------------------
# Module-level logger
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*\n?(.*?)\n?```$", re.DOTALL | re.IGNORECASE)


def _strip_json_fences(text: str) -> str:
    """Remove Markdown JSON code fences from *text* if present.

    Args:
        text: Raw string that may contain triple-backtick fences.

    Returns:
        Inner JSON string, or *text* unchanged.
    """
    stripped = text.strip()
    m = _JSON_FENCE_RE.match(stripped)
    return m.group(1).strip() if m else stripped


def _call_lightneon_ocr(
    image_path: str,
    ocr_service_url: str,
    ocr_api_key: str,
) -> str:
    """POST the image to the LightNeon OCR 2 service and return raw text.

    Args:
        image_path: Path to the answer-sheet image.
        ocr_service_url: Full URL, e.g. ``"https://xxxx.ngrok-free.app/ocr"``.
        ocr_api_key: API key sent as ``x-api-key`` header.

    Returns:
        Raw OCR text extracted from the image.

    Raises:
        OcrException: On file or network errors.
    """
    path = Path(image_path)
    if not path.exists() or not path.is_file():
        raise OcrException(f"Image file not found or not a file: {image_path}")

    headers = {"x-api-key": ocr_api_key}
    logger.info("ocr: POST LightNeon OCR 2  url=%s", ocr_service_url)
    start_ts = time.monotonic()

    try:
        with open(path, "rb") as img_fh:
            response = requests.post(
                ocr_service_url,
                headers=headers,
                files={"file": (path.name, img_fh, "image/jpeg")},
                timeout=120,
            )
        response.raise_for_status()
    except requests.exceptions.Timeout as exc:
        raise OcrException("LightNeon OCR request timed out after 120 s.", original_error=exc) from exc
    except requests.exceptions.ConnectionError as exc:
        raise OcrException(f"Cannot connect to OCR service at '{ocr_service_url}'.", original_error=exc) from exc
    except requests.exceptions.HTTPError as exc:
        raise OcrException(
            f"OCR service returned HTTP {response.status_code}: {response.text[:200]}", original_error=exc
        ) from exc
    except OSError as exc:
        raise OcrException(f"Failed to open image '{image_path}': {exc}", original_error=exc) from exc
    except requests.exceptions.RequestException as exc:
        raise OcrException(f"OCR service network error: {exc}", original_error=exc) from exc
    finally:
        elapsed = time.monotonic() - start_ts
        logger.info("ocr: LightNeon OCR completed in %.2f s", elapsed)

    raw = response.text.strip()
    if not raw:
        raise OcrException("LightNeon OCR service returned an empty response.")

    # Unwrap JSON envelope if service wraps text in a dict
    try:
        payload = json.loads(raw)
        if isinstance(payload, dict):
            for key in ("text", "result", "output", "data", "response"):
                if key in payload and isinstance(payload[key], str):
                    logger.debug("ocr: unwrapped JSON key '%s' from OCR response.", key)
                    return payload[key]
    except (json.JSONDecodeError, TypeError):
        pass  # plain-text response — use as-is

    logger.debug("ocr: raw OCR text length=%d chars", len(raw))
    return raw


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_answers(
    image_paths: list[str],
    ocr_service_url: str,
    ocr_api_key: str,
) -> str:
    """Extract handwritten answers from multiple images using LightNeon OCR 2.

    **Step 1** — POST each image sequentially to LightNeon OCR 2 via the 
    Cloudflare/ngrok endpoint → raw full-page OCR text.

    Args:
        image_paths: List of paths to the answer-sheet images (or converted PDF pages).
        ocr_service_url: Full URL of the LightNeon OCR endpoint.
        ocr_api_key: API key for the OCR service (``x-api-key`` header).

    Returns:
        One massive string containing all extracted text across all pages, 
        delimited by `--- PAGE X ---` lines for clarity.

    Raises:
        OcrException: On any LightNeon extraction failure.
    """
    if not image_paths:
        raise OcrException("No answer-sheet images provided.")

    logger.info("ocr: Starting LightNeon extraction of %d answer sheets...", len(image_paths))

    all_text = []
    
    for i, path in enumerate(image_paths, start=1):
        logger.info("ocr: Processing image %d of %d: %s", i, len(image_paths), path)
        raw_page_text = _call_lightneon_ocr(
            image_path=path,
            ocr_service_url=ocr_service_url,
            ocr_api_key=ocr_api_key,
        )
        
        page_header = f"\n\n--- PAGE {i} -----------------------------------------------------\n\n"
        all_text.append(page_header + raw_page_text)

    final_text = "".join(all_text).strip()
    logger.info("ocr: successfully extracted %d chars across %d page(s).", len(final_text), len(image_paths))
    return final_text
