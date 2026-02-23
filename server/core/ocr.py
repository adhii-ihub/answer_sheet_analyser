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


def _parse_answers_with_gemini(
    raw_ocr_text: str,
    question_ids: list[str],
    gemini_api_key: str,
    gemini_model: str,
) -> dict[str, str]:
    """Use Gemini to extract per-question answers from raw OCR text.

    Args:
        raw_ocr_text: Full text from LightNeon OCR.
        question_ids: List of expected question IDs.
        gemini_api_key: Google Gemini API key.
        gemini_model: Gemini model name, e.g. ``"gemini-2.0-flash"``.

    Returns:
        ``{question_id: answer_text}`` dict.

    Raises:
        OcrException: On Gemini API or JSON parsing failure.
    """
    ids_repr = str(question_ids)
    example = json.dumps(
        {qid: "answer text..." for qid in question_ids[:2]}, ensure_ascii=False
    )

    prompt = (
        "You are an intelligent text parser for handwritten exam answer sheets.\n"
        "The following is the full OCR-extracted text from a student's answer sheet:\n\n"
        f"--- BEGIN OCR TEXT ---\n{raw_ocr_text}\n--- END OCR TEXT ---\n\n"
        f"Extract the student's answer for each of these question numbers: {ids_repr}\n"
        "The student has written answers labeled by question number (e.g. '1.', 'Q1', '6a.', etc.).\n"
        "Return ONLY a valid JSON object with question numbers as keys and the full extracted answer text as values.\n"
        f"Example: {example}\n"
        "If a question's answer is not found, use an empty string as the value.\n"
        "Do not add any explanation outside the JSON."
    )

    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel(model_name=gemini_model)

    logger.info("ocr: calling Gemini (%s) to parse OCR text into per-question answers.", gemini_model)
    start_ts = time.monotonic()
    try:
        response = model.generate_content(prompt)
        raw_text: str = response.text.strip()
    except Exception as exc:
        raise OcrException(
            f"Gemini answer-parsing call failed: {exc}", original_error=exc
        ) from exc
    finally:
        elapsed = time.monotonic() - start_ts
        logger.info("ocr: Gemini parsing completed in %.2f s", elapsed)

    if not raw_text:
        raise OcrException("Gemini returned empty response during answer parsing.")

    clean_text = _strip_json_fences(raw_text)
    try:
        extracted: dict = json.loads(clean_text)
    except json.JSONDecodeError as exc:
        raise OcrException(
            f"Gemini answer-parsing response is not valid JSON: {clean_text[:200]!r}",
            original_error=exc,
        ) from exc

    if not isinstance(extracted, dict):
        raise OcrException(f"Expected JSON object from Gemini, got {type(extracted).__name__}.")

    return extracted


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_answers(
    image_path: str,
    question_ids: list[str],
    ocr_service_url: str,
    ocr_api_key: str,
    gemini_api_key: str,
    gemini_model: str = "gemini-2.0-flash",
) -> dict[str, str]:
    """Extract handwritten answers using LightNeon OCR 2 + Gemini.

    **Step 1** — POST image to LightNeon OCR 2 via the Cloudflare/ngrok
    endpoint → raw full-page OCR text.

    **Step 2** — Send raw text + question IDs to Gemini → structured
    ``{question_id: answer_text}`` JSON.

    Args:
        image_path: Path to the answer-sheet image.
        question_ids: Expected question IDs, e.g. ``["1", "2", "6a"]``.
        ocr_service_url: Full URL of the LightNeon OCR endpoint.
        ocr_api_key: API key for the OCR service (``x-api-key`` header).
        gemini_api_key: Google Gemini API key.
        gemini_model: Gemini model name. Defaults to ``"gemini-2.0-flash"``.

    Returns:
        ``{question_id: answer_text}`` — missing answers default to ``""``.

    Raises:
        OcrException: On any failure in either step.
    """
    if not question_ids:
        raise OcrException("question_ids must be a non-empty list.")

    # Step 1 — LightNeon OCR 2
    raw_ocr_text = _call_lightneon_ocr(
        image_path=image_path,
        ocr_service_url=ocr_service_url,
        ocr_api_key=ocr_api_key,
    )
    logger.info("ocr: raw OCR text received (%d chars) — parsing with Gemini …", len(raw_ocr_text))

    # Step 2 — Gemini parses raw text into per-question dict
    extracted = _parse_answers_with_gemini(
        raw_ocr_text=raw_ocr_text,
        question_ids=question_ids,
        gemini_api_key=gemini_api_key,
        gemini_model=gemini_model,
    )

    # Validate / fill missing question IDs
    result: dict[str, str] = {}
    for qid in question_ids:
        value = extracted.get(qid, "")
        if not isinstance(value, str):
            value = str(value)
        result[qid] = value

    missing = [qid for qid in question_ids if not result.get(qid)]
    if missing:
        logger.warning("ocr: no answer found for question(s): %s", missing)

    logger.info("ocr: successfully extracted answers for %d question(s).", len(result))
    return result
