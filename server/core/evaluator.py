"""
core/evaluator.py

LLM-based answer evaluator for the EduGrade AI system.

Uses the **Google Gemini API** (via the ``google-generativeai`` SDK) to
evaluate each student answer against the rubric criteria.  Processing is
strictly sequential (one question at a time) to keep Gemini rate limits safe.
"""

import logging
import time
from typing import Any

import google.generativeai as genai

from core.exceptions import EvaluationException

# ---------------------------------------------------------------------------
# Module-level logger
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _clamp(value: int | float, lo: int, hi: int) -> int:
    """Clamp *value* to the closed interval ``[lo, hi]``.

    Args:
        value: The numeric value to clamp.
        lo: Inclusive lower bound.
        hi: Inclusive upper bound.

    Returns:
        An integer within ``[lo, hi]``.
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
    gemini_model: genai.GenerativeModel,
) -> dict[str, Any]:
    """Evaluate one question using the Gemini model.

    Args:
        q_number: Question identifier string.
        rubric: Rubric dict for this question.
        student_answer: The student's extracted answer text.
        gemini_model: Configured ``genai.GenerativeModel`` instance.

    Returns:
        Evaluation result dict with marks, justification, confidence, etc.

    Raises:
        EvaluationException: On any Gemini API or JSON parsing failure.
    """
    import json
    import re

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

    logger.info(
        "evaluator: calling Gemini for Q%s (max_marks=%d, answer_len=%d)",
        q_number, max_marks, len(student_answer),
    )
    start_ts = time.monotonic()
    try:
        response = gemini_model.generate_content(prompt)
    except Exception as exc:
        raise EvaluationException(
            f"Gemini API call failed for Q{q_number}: {exc}",
            original_error=exc,
        ) from exc
    finally:
        elapsed = time.monotonic() - start_ts
        logger.info("evaluator: Q%s Gemini request completed in %.2f s", q_number, elapsed)

    # ---- Extract text from response ----------------------------------------
    try:
        raw_text: str = response.text.strip()
    except (AttributeError, ValueError) as exc:
        raise EvaluationException(
            f"Gemini returned no usable text for Q{q_number}: {exc}",
            original_error=exc,
        ) from exc

    if not raw_text:
        raise EvaluationException(f"Gemini returned empty response for Q{q_number}.")

    # Strip markdown JSON fences if present
    _fence_re = re.compile(r"^```(?:json)?\s*\n?(.*?)\n?```$", re.DOTALL | re.IGNORECASE)
    fence_match = _fence_re.match(raw_text)
    clean_text = fence_match.group(1).strip() if fence_match else raw_text

    # ---- Parse JSON ---------------------------------------------------------
    try:
        evaluation: dict = json.loads(clean_text)
    except json.JSONDecodeError as exc:
        raise EvaluationException(
            f"Gemini response for Q{q_number} is not valid JSON: {clean_text[:200]!r}",
            original_error=exc,
        ) from exc

    if not isinstance(evaluation, dict):
        raise EvaluationException(
            f"Expected JSON object for Q{q_number}, got {type(evaluation).__name__}."
        )

    # ---- Safe extraction and clamping --------------------------------------
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
    gemini_api_key: str,
    model: str = "gemini-2.0-flash",
) -> dict[str, dict[str, Any]]:
    """Evaluate all student answers against the rubric using Google Gemini.

    Each question is processed **sequentially** (no parallelism).

    Args:
        ocr_output: Dict of ``{question_id: student_answer_text}``.
        parsed_rubrics: Dict of ``{question_id: rubric_dict}`` from
            :func:`core.parser.parse_rubrics`.
        gemini_api_key: Google Gemini API key.
        model: Gemini model name. Defaults to ``"gemini-2.0-flash"``.

    Returns:
        Dict of ``{question_id: evaluation_result_dict}``::

            {
                "1": {
                    "awarded_marks": 2,
                    "out_of": 2,
                    "justification": "...",
                    "key_points_covered": [...],
                    "missing_points": [...],
                    "confidence": "high",
                },
                ...
            }

    Raises:
        EvaluationException: If the API key is missing or any question fails.
    """
    if not parsed_rubrics:
        raise EvaluationException("parsed_rubrics is empty — nothing to evaluate.")
    if not gemini_api_key:
        raise EvaluationException(
            "gemini_api_key is required. Set GEMINI_API_KEY in your .env file."
        )

    # Configure Gemini SDK
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel(model_name=model)
    logger.info("evaluator: using Gemini model '%s'", model)

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
            gemini_model=gemini_model,
        )
        results[q_number] = result

    logger.info("evaluator: completed evaluation of %d question(s).", len(results))
    return results
