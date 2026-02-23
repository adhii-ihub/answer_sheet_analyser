"""
core/evaluator.py

LLM-based answer evaluator for the EduGrade AI system.

Calls a self-hosted Ollama instance (exposed via Cloudflare / ngrok) to
evaluate each student answer against the rubric criteria.  Processing is
strictly sequential (one question at a time).
"""

import json
import logging
import re
import time
from typing import Any

import requests

from core.exceptions import EvaluationException

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
        text: Raw string that may contain triple-backtick fences.

    Returns:
        Inner JSON string with fences removed, or *text* unchanged.
    """
    stripped = text.strip()
    m = _JSON_FENCE_RE.match(stripped)
    return m.group(1).strip() if m else stripped


def _clamp(value: int | float, lo: int, hi: int) -> int:
    """Clamp *value* to ``[lo, hi]``.

    Args:
        value: The numeric value to clamp.
        lo: Inclusive lower bound.
        hi: Inclusive upper bound.

    Returns:
        Integer within ``[lo, hi]``.
    """
    return max(lo, min(hi, int(round(value))))


def _format_criteria(criteria: list[dict[str, Any]]) -> str:
    """Format rubric criteria as a numbered list string.

    Args:
        criteria: List of dicts with ``text`` and ``marks`` keys.

    Returns:
        Multi-line string of criteria.
    """
    if not criteria:
        return "(No specific criteria provided.)"
    return "\n".join(
        f"  {i}. {c.get('text', '')}  [{c.get('marks', 0)} mark(s)]"
        for i, c in enumerate(criteria, start=1)
    )


def _build_evaluation_prompt(
    q_number: str,
    description: str,
    max_marks: int,
    criteria: list[dict[str, Any]],
    student_answer: str,
) -> str:
    """Build the Anna University examiner prompt for a single question.

    Args:
        q_number: Question identifier, e.g. ``"1"`` or ``"6a"``.
        description: Question description text.
        max_marks: Maximum marks for this question.
        criteria: List of rubric criteria dicts.
        student_answer: The student's extracted answer text.

    Returns:
        Fully formatted prompt string.
    """
    criteria_block = _format_criteria(criteria)
    return (
        "You are a strict college-level examiner for an Anna University affiliated institution "
        "evaluating a 5th semester B.E. Computer Science exam paper.\n\n"
        f"QUESTION Q{q_number}: {description}\n"
        f"MAXIMUM MARKS: {max_marks}\n\n"
        "MARKING SCHEME:\n"
        f"{criteria_block}\n\n"
        "STUDENT'S ANSWER:\n"
        f"{student_answer}\n\n"
        "EVALUATION INSTRUCTIONS:\n"
        "- Award marks strictly based on the marking scheme above\n"
        "- Partial marks are allowed per criteria point\n"
        "- Evaluate at undergraduate college level — be fair but strict\n"
        "- Do not award marks for vague, incorrect, or missing statements\n"
        f"- awarded_marks must be between 0 and {max_marks} inclusive\n"
        "- Return ONLY valid JSON with no markdown, no explanation outside JSON\n\n"
        "JSON format:\n"
        "{\n"
        '  "awarded_marks": <integer>,\n'
        f'  "out_of": {max_marks},\n'
        '  "justification": "<2-3 sentences>",\n'
        '  "key_points_covered": ["point1"],\n'
        '  "missing_points": ["point2"],\n'
        '  "confidence": "high" or "medium" or "low"\n'
        "}"
    )


def _evaluate_single_question(
    q_number: str,
    rubric: dict[str, Any],
    student_answer: str,
    ollama_url: str,
    model: str,
) -> dict[str, Any]:
    """Evaluate one question by calling the Ollama LLM (via Cloudflare URL).

    Args:
        q_number: Question identifier string.
        rubric: Rubric dict for this question.
        student_answer: The student's extracted answer text.
        ollama_url: Base URL of the Ollama server (e.g. Cloudflare tunnel URL).
        model: Ollama model name to use for evaluation.

    Returns:
        Evaluation result dict.

    Raises:
        EvaluationException: On network, timeout, or JSON parsing failure.
    """
    description = rubric.get("description", "")
    max_marks: int = int(rubric.get("max_marks", 0))
    criteria: list[dict[str, Any]] = rubric.get("criteria", [])

    # ---- Short-circuit: empty student answer --------------------------------
    if not student_answer or not student_answer.strip():
        logger.info(
            "evaluator: Q%s — student answer empty, awarding 0/%d.", q_number, max_marks
        )
        return {
            "awarded_marks": 0,
            "out_of": max_marks,
            "justification": "No answer was provided by the student.",
            "key_points_covered": [],
            "missing_points": [c.get("text", "") for c in criteria],
            "confidence": "high",
        }

    prompt = _build_evaluation_prompt(
        q_number, description, max_marks, criteria, student_answer
    )

    endpoint = f"{ollama_url.rstrip('/')}/api/generate"
    payload: dict = {
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": False,
    }

    logger.info("evaluator: POST %s  model=%s  question=Q%s", endpoint, model, q_number)
    start_ts = time.monotonic()
    try:
        response = requests.post(endpoint, json=payload, timeout=180)
        response.raise_for_status()
    except requests.exceptions.Timeout as exc:
        raise EvaluationException(
            f"Evaluation request for Q{q_number} timed out after 180 s.",
            original_error=exc,
        ) from exc
    except requests.exceptions.ConnectionError as exc:
        raise EvaluationException(
            f"Cannot connect to Ollama at '{endpoint}'.",
            original_error=exc,
        ) from exc
    except requests.exceptions.HTTPError as exc:
        raise EvaluationException(
            f"Ollama returned HTTP {response.status_code} for Q{q_number}: {response.text[:200]}",
            original_error=exc,
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise EvaluationException(
            f"Network error evaluating Q{q_number}: {exc}",
            original_error=exc,
        ) from exc
    finally:
        elapsed = time.monotonic() - start_ts
        logger.info("evaluator: Q%s completed in %.2f s", q_number, elapsed)

    # ---- Parse response -----------------------------------------------------
    try:
        resp_json = response.json()
    except ValueError as exc:
        raise EvaluationException(
            f"Ollama response for Q{q_number} is not valid JSON.",
            original_error=exc,
        ) from exc

    raw_text: str = resp_json.get("response", "")
    if not raw_text:
        raise EvaluationException(f"Ollama returned empty 'response' for Q{q_number}.")

    clean_text = _strip_json_fences(raw_text)

    try:
        evaluation: dict = json.loads(clean_text)
    except json.JSONDecodeError as exc:
        raise EvaluationException(
            f"Model response for Q{q_number} is not valid JSON: {clean_text[:200]!r}",
            original_error=exc,
        ) from exc

    if not isinstance(evaluation, dict):
        raise EvaluationException(
            f"Expected a JSON object for Q{q_number}, got {type(evaluation).__name__}."
        )

    # ---- Safe clamping ------------------------------------------------------
    raw_marks = evaluation.get("awarded_marks", 0)
    try:
        awarded = _clamp(raw_marks, 0, max_marks)
    except (TypeError, ValueError):
        logger.warning(
            "evaluator: Q%s — invalid awarded_marks %r, defaulting to 0.", q_number, raw_marks
        )
        awarded = 0

    result: dict[str, Any] = {
        "awarded_marks": awarded,
        "out_of": max_marks,
        "justification": str(evaluation.get("justification", "")),
        "key_points_covered": evaluation.get("key_points_covered", []),
        "missing_points": evaluation.get("missing_points", []),
        "confidence": str(evaluation.get("confidence", "low")),
    }
    for list_key in ("key_points_covered", "missing_points"):
        if not isinstance(result[list_key], list):
            result[list_key] = [str(result[list_key])]

    logger.info(
        "evaluator: Q%s → %d/%d  confidence=%s",
        q_number, awarded, max_marks, result["confidence"],
    )
    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def evaluate_answers(
    ocr_output: dict[str, str],
    parsed_rubrics: dict[str, Any],
    ollama_url: str,
    model: str,
) -> dict[str, dict[str, Any]]:
    """Evaluate all student answers using the self-hosted Ollama LLM.

    Calls the Ollama instance at *ollama_url* (your Cloudflare-tunnelled
    server) sequentially for each question.

    Args:
        ocr_output: ``{question_id: student_answer_text}`` from OCR step.
        parsed_rubrics: ``{question_id: rubric_dict}`` from parser step.
        ollama_url: Base URL of the Ollama server, e.g.
            ``"https://xxxx.trycloudflare.com"`` or ``"https://xxxx.ngrok-free.app"``.
        model: Ollama model name to use, e.g. ``"mistral"``, ``"llama3"``.

    Returns:
        ``{question_id: evaluation_result_dict}``

    Raises:
        EvaluationException: If *any* question evaluation fails.
    """
    if not parsed_rubrics:
        raise EvaluationException("parsed_rubrics is empty — nothing to evaluate.")

    results: dict[str, dict[str, Any]] = {}
    for q_number, rubric in parsed_rubrics.items():
        student_answer = ocr_output.get(q_number, "")
        logger.info(
            "evaluator: evaluating Q%s  max_marks=%s  answer_len=%d",
            q_number, rubric.get("max_marks", "?"), len(student_answer),
        )
        result = _evaluate_single_question(
            q_number=q_number,
            rubric=rubric,
            student_answer=student_answer,
            ollama_url=ollama_url,
            model=model,
        )
        results[q_number] = result

    logger.info("evaluator: completed evaluation of %d question(s).", len(results))
    return results
