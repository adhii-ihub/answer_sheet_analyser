"""
core/ocr.py

Optical Character Recognition (OCR) module for the EduGrade AI system.

Uses a **two-step** approach:

1. **Raw text extraction** — POSTs the image to an external HTTP OCR service
   (e.g. a self-hosted Ollama-vision endpoint exposed via ngrok).  The
   service returns the full handwritten text as a plain string.

2. **Per-question parsing** — Sends the raw OCR text together with the
   expected question IDs to a local Ollama LLM, which returns a structured
   JSON object mapping each question ID to the corresponding answer excerpt.

The two-step design keeps OCR concerns (reading handwriting) separate from
NLP concerns (understanding question structure), making each step independently
replaceable.
"""

import json
import logging
import re
import time
from pathlib import Path

import requests

from core.exceptions import OcrException

# ---------------------------------------------------------------------------
# Module-level logger
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*\n?(.*?)\n?```$", re.DOTALL | re.IGNORECASE)


def _strip_json_fences(text: str) -> str:
    """Remove Markdown JSON code fences from *text* if present.

    Args:
        text: Raw string that may or may not contain triple-backtick fences.

    Returns:
        The inner JSON string with fences removed, or the original string
        unchanged when no fences are detected.
    """
    stripped = text.strip()
    match = _JSON_FENCE_RE.match(stripped)
    if match:
        return match.group(1).strip()
    return stripped


def _call_ocr_service(
    image_path: str,
    ocr_service_url: str,
    ocr_api_key: str,
) -> str:
    """POST the image file to the external OCR service and return raw text.

    The service is expected to accept a multipart ``file`` field and return
    the extracted text as the response body (plain text or JSON with a text
    field).

    Args:
        image_path: Path to the image file on disk.
        ocr_service_url: Full URL of the OCR endpoint,
            e.g. ``"https://xxxx.ngrok-free.app/ocr"``.
        ocr_api_key: API key sent as the ``x-api-key`` header.

    Returns:
        The raw OCR text extracted from the image.

    Raises:
        OcrException: If the file cannot be read or the HTTP call fails.
    """
    path = Path(image_path)
    if not path.exists():
        raise OcrException(f"Image file not found: {image_path}")
    if not path.is_file():
        raise OcrException(f"Path is not a file: {image_path}")

    headers = {"x-api-key": ocr_api_key}
    logger.info("ocr: POST OCR service  url=%s", ocr_service_url)
    start_ts = time.monotonic()

    try:
        with open(path, "rb") as img_fh:
            files = {"file": (path.name, img_fh, "image/jpeg")}
            response = requests.post(
                ocr_service_url,
                headers=headers,
                files=files,
                timeout=120,
            )
        response.raise_for_status()
    except requests.exceptions.Timeout as exc:
        raise OcrException(
            "OCR service request timed out after 120 s.",
            original_error=exc,
        ) from exc
    except requests.exceptions.ConnectionError as exc:
        raise OcrException(
            f"Cannot connect to OCR service at '{ocr_service_url}'.",
            original_error=exc,
        ) from exc
    except requests.exceptions.HTTPError as exc:
        raise OcrException(
            f"OCR service returned HTTP {response.status_code}: {response.text[:200]}",
            original_error=exc,
        ) from exc
    except OSError as exc:
        raise OcrException(
            f"Failed to open image '{image_path}': {exc}",
            original_error=exc,
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise OcrException(
            f"OCR service network error: {exc}",
            original_error=exc,
        ) from exc
    finally:
        elapsed = time.monotonic() - start_ts
        logger.info("ocr: OCR service request completed in %.2f s", elapsed)

    raw = response.text.strip()
    if not raw:
        raise OcrException("OCR service returned an empty response.")

    # If the service returns JSON with a text field, unwrap it gracefully
    try:
        payload = json.loads(raw)
        if isinstance(payload, dict):
            for key in ("text", "result", "output", "data", "response"):
                if key in payload and isinstance(payload[key], str):
                    logger.debug("ocr: unwrapped JSON key '%s' from OCR service response.", key)
                    return payload[key]
    except (json.JSONDecodeError, TypeError):
        pass  # plain-text response — use as-is

    logger.debug("ocr: raw OCR text length=%d chars", len(raw))
    return raw


def _parse_answers_with_llm(
    raw_ocr_text: str,
    question_ids: list[str],
    ollama_url: str,
    model: str,
) -> dict[str, str]:
    """Use an Ollama LLM to extract per-question answers from raw OCR text.

    The raw text from the OCR service is forwarded to a text-based Ollama
    model together with the expected question IDs.  The model is prompted to
    return a JSON object mapping each question ID to its answer excerpt.

    Args:
        raw_ocr_text: Full OCR text extracted from the answer sheet.
        question_ids: List of question identifier strings to extract.
        ollama_url: Base URL of the running Ollama server.
        model: Name of the Ollama text model to use, e.g. ``"mistral"``.

    Returns:
        Dict mapping each question ID to its extracted answer string.

    Raises:
        OcrException: On network, timeout, or JSON parsing failure.
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

    endpoint = f"{ollama_url.rstrip('/')}/api/generate"
    payload: dict = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }

    logger.info("ocr: POST Ollama LLM for answer parsing  url=%s  model=%s", endpoint, model)
    start_ts = time.monotonic()
    try:
        response = requests.post(endpoint, json=payload, timeout=120)
        response.raise_for_status()
    except requests.exceptions.Timeout as exc:
        raise OcrException(
            "Ollama answer-parsing request timed out after 120 s.",
            original_error=exc,
        ) from exc
    except requests.exceptions.ConnectionError as exc:
        raise OcrException(
            f"Cannot connect to Ollama at '{endpoint}'. Is Ollama running?",
            original_error=exc,
        ) from exc
    except requests.exceptions.HTTPError as exc:
        raise OcrException(
            f"Ollama returned HTTP {response.status_code}: {response.text[:200]}",
            original_error=exc,
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise OcrException(f"Ollama network error: {exc}", original_error=exc) from exc
    finally:
        elapsed = time.monotonic() - start_ts
        logger.info("ocr: Ollama parsing request completed in %.2f s", elapsed)

    try:
        resp_json = response.json()
    except ValueError as exc:
        raise OcrException("Ollama response is not valid JSON.", original_error=exc) from exc

    raw_text: str = resp_json.get("response", "")
    if not raw_text:
        raise OcrException("Ollama returned an empty 'response' field.")

    clean_text = _strip_json_fences(raw_text)

    try:
        extracted: dict = json.loads(clean_text)
    except json.JSONDecodeError as exc:
        raise OcrException(
            f"Ollama answer-parsing response is not valid JSON: {clean_text[:200]!r}",
            original_error=exc,
        ) from exc

    if not isinstance(extracted, dict):
        raise OcrException(
            f"Expected a JSON object from Ollama, got {type(extracted).__name__}."
        )

    return extracted


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_answers(
    image_path: str,
    question_ids: list[str],
    ollama_url: str,
    model: str,
    ocr_service_url: str = "",
    ocr_api_key: str = "",
) -> dict[str, str]:
    """Extract handwritten answers from an exam-sheet image.

    **Two-step pipeline:**

    1. If *ocr_service_url* is provided, POST the image to the external OCR
       HTTP service (e.g. your ngrok endpoint) to obtain the full raw text
       of the answer sheet.  A light Ollama LLM call then parses that raw
       text into a per-question JSON dict.

    2. If *ocr_service_url* is **not** provided (empty string / ``None``),
       the image is sent directly to an Ollama multimodal model (e.g.
       ``llava``) which performs both OCR and per-question extraction in one
       shot.  This is the legacy mode.

    Args:
        image_path: Path to the scanned / photographed answer sheet.
        question_ids: Expected question identifiers, e.g. ``["1", "6a"]``.
        ollama_url: Base URL of the running Ollama server,
            e.g. ``"http://localhost:11434"``.
        model: Ollama model name.  In two-step mode this must be a **text**
            model (e.g. ``"mistral"``); in legacy mode it must be a
            **multimodal** model (e.g. ``"llava"``).
        ocr_service_url: *(Optional)* Full URL of the external OCR endpoint.
            When set, the external service is used for image reading (step 1).
            Example: ``"https://xxxx.ngrok-free.app/ocr"``
        ocr_api_key: *(Optional)* API key for the external OCR service,
            sent via the ``x-api-key`` header.

    Returns:
        Dict mapping each question ID to the student's answer text::

            {
                "1": "Form validation is ...",
                "6a": "The OSI model has 7 layers ...",
            }

        Missing answers are represented as empty strings ``""``.

    Raises:
        OcrException: On any I/O, network, or JSON parsing failure.
    """
    if not question_ids:
        raise OcrException("question_ids must be a non-empty list.")

    # ---------------------------------------------------------------------- #
    # Step 1 — Raw text extraction                                             #
    # ---------------------------------------------------------------------- #
    if ocr_service_url:
        # ---- External HTTP OCR service (two-step mode) --------------------
        logger.info(
            "ocr: two-step mode — using external OCR service: %s", ocr_service_url
        )
        raw_ocr_text = _call_ocr_service(
            image_path=image_path,
            ocr_service_url=ocr_service_url,
            ocr_api_key=ocr_api_key,
        )
        logger.info(
            "ocr: raw OCR text received (%d chars) — parsing with LLM …", len(raw_ocr_text)
        )

        # ---- Step 2: Ollama LLM parses raw text into per-question dict ----
        extracted = _parse_answers_with_llm(
            raw_ocr_text=raw_ocr_text,
            question_ids=question_ids,
            ollama_url=ollama_url,
            model=model,
        )

    else:
        # ---- Legacy: Ollama multimodal (single-step mode) -----------------
        import base64

        logger.info(
            "ocr: single-step mode — sending image directly to Ollama multimodal model '%s'",
            model,
        )

        path = Path(image_path)
        if not path.exists():
            raise OcrException(f"Image file not found: {image_path}")
        try:
            with open(path, "rb") as fh:
                b64_image = base64.b64encode(fh.read()).decode("ascii")
        except OSError as exc:
            raise OcrException(
                f"Failed to read image file '{image_path}': {exc}", original_error=exc
            ) from exc

        ids_repr = str(question_ids)
        example = json.dumps(
            {qid: "answer text..." for qid in question_ids[:2]}, ensure_ascii=False
        )
        prompt = (
            "You are an OCR engine for handwritten exam answer sheets.\n"
            f"Extract the handwritten answers for each of these question numbers: {ids_repr}\n"
            "The student has written answers labeled by question number.\n"
            "Return ONLY a valid JSON object with question numbers as keys and the full extracted text as values.\n"
            f"Example: {example}\n"
            "If a question answer is not found, use empty string as value.\n"
            "Do not add any explanation outside the JSON."
        )

        endpoint = f"{ollama_url.rstrip('/')}/api/generate"
        payload: dict = {
            "model": model,
            "prompt": prompt,
            "images": [b64_image],
            "stream": False,
        }

        logger.info("ocr: POST %s  model=%s", endpoint, model)
        start_ts = time.monotonic()
        try:
            response = requests.post(endpoint, json=payload, timeout=120)
            response.raise_for_status()
        except requests.exceptions.Timeout as exc:
            raise OcrException(
                "Ollama multimodal request timed out after 120 s.", original_error=exc
            ) from exc
        except requests.exceptions.ConnectionError as exc:
            raise OcrException(
                f"Cannot connect to Ollama at '{endpoint}'.", original_error=exc
            ) from exc
        except requests.exceptions.HTTPError as exc:
            raise OcrException(
                f"Ollama returned HTTP {response.status_code}: {response.text[:200]}",
                original_error=exc,
            ) from exc
        except requests.exceptions.RequestException as exc:
            raise OcrException(f"OCR network error: {exc}", original_error=exc) from exc
        finally:
            elapsed = time.monotonic() - start_ts
            logger.info("ocr: Ollama request completed in %.2f s", elapsed)

        try:
            resp_json = response.json()
        except ValueError as exc:
            raise OcrException(
                "Ollama response is not valid JSON.", original_error=exc
            ) from exc

        raw_text: str = resp_json.get("response", "")
        if not raw_text:
            raise OcrException("Ollama returned an empty 'response' field.")

        clean_text = _strip_json_fences(raw_text)
        try:
            extracted = json.loads(clean_text)
        except json.JSONDecodeError as exc:
            raise OcrException(
                f"Ollama response is not valid JSON: {clean_text[:200]!r}",
                original_error=exc,
            ) from exc

        if not isinstance(extracted, dict):
            raise OcrException(
                f"Expected a JSON object from Ollama, got {type(extracted).__name__}."
            )

    # ---------------------------------------------------------------------- #
    # Validate / fill missing question IDs                                     #
    # ---------------------------------------------------------------------- #
    result: dict[str, str] = {}
    for qid in question_ids:
        value = extracted.get(qid, "")
        if not isinstance(value, str):
            logger.warning(
                "ocr: Q%s has non-string value %r — converting to str.", qid, value
            )
            value = str(value)
        result[qid] = value

    missing = [qid for qid in question_ids if not result.get(qid)]
    if missing:
        logger.warning("ocr: no answer found for question(s): %s", missing)

    logger.info("ocr: successfully extracted answers for %d question(s).", len(result))
    return result
