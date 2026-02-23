"""
core/pipeline.py

Top-level orchestration pipeline for EduGrade AI.

Stack:
  OCR  → LightNeon OCR 2 (Cloudflare/ngrok endpoint) + Gemini for parsing
  LLM  → Gemini (evaluation)
"""

import logging
from typing import Any

from core.exceptions import PipelineException
from core.evaluator import evaluate_answers
from core.ocr import extract_answers
from core.parser import parse_rubrics

logger = logging.getLogger(__name__)

_GRADE_SCALE: list[tuple[float, str]] = [
    (91.0, "O"),
    (81.0, "A+"),
    (71.0, "A"),
    (61.0, "B+"),
    (51.0, "B"),
    (0.0,  "RA"),
]


def _assign_grade(percentage: float) -> str:
    """Map a percentage to an Anna University letter grade.

    Args:
        percentage: Score percentage (0–100).

    Returns:
        Grade string such as ``"O"``, ``"A+"``, or ``"RA"``.
    """
    for threshold, grade in _GRADE_SCALE:
        if percentage >= threshold:
            return grade
    return "RA"


def run_evaluation_pipeline(
    image_path: str,
    rubrics_text: str,
    gemini_api_key: str,
    ocr_service_url: str,
    ocr_api_key: str,
    gemini_model: str = "gemini-2.0-flash",
) -> dict[str, Any]:
    """Run the full EduGrade AI evaluation pipeline.

    Steps (all sequential):

    1. Parse rubrics.
    2. LightNeon OCR 2 → raw text, then Gemini → per-question answers.
    3. Gemini evaluates each answer against rubric.
    4. Compute totals, percentage, and Anna University grade.

    Args:
        image_path: Path to the answer-sheet image.
        rubrics_text: Raw rubric document text.
        gemini_api_key: Google Gemini API key (used for both OCR parsing
            and evaluation).
        ocr_service_url: URL of the LightNeon OCR 2 endpoint,
            e.g. ``"https://xxxx.ngrok-free.app/ocr"``.
        ocr_api_key: API key for the OCR service.
        gemini_model: Gemini model name. Defaults to ``"gemini-2.0-flash"``.

    Returns:
        ::

            {
                "total_marks": 42,
                "max_total_marks": 50,
                "percentage": 84.0,
                "grade": "A+",
                "question_results": { ... }
            }

    Raises:
        PipelineException: On any failure in any step.
    """
    logger.info("pipeline: starting EduGrade AI pipeline.")
    try:
        # Step 1 — Parse rubrics
        logger.info("pipeline: step 1/4 — parsing rubrics …")
        parsed_rubrics = parse_rubrics(rubrics_text)
        question_ids = list(parsed_rubrics.keys())
        logger.info("pipeline: %d question(s): %s", len(question_ids), question_ids)

        # Step 2 — LightNeon OCR 2 + Gemini answer parsing
        logger.info("pipeline: step 2/4 — OCR + Gemini answer extraction …")
        ocr_output = extract_answers(
            image_path=image_path,
            question_ids=question_ids,
            ocr_service_url=ocr_service_url,
            ocr_api_key=ocr_api_key,
            gemini_api_key=gemini_api_key,
            gemini_model=gemini_model,
        )
        logger.info("pipeline: %d answer(s) extracted.", len(ocr_output))

        # Step 3 — Gemini evaluation
        logger.info("pipeline: step 3/4 — Gemini evaluation …")
        question_results = evaluate_answers(
            ocr_output=ocr_output,
            parsed_rubrics=parsed_rubrics,
            gemini_api_key=gemini_api_key,
            model=gemini_model,
        )
        logger.info("pipeline: %d question(s) evaluated.", len(question_results))

        # Step 4 — Totals + grade
        logger.info("pipeline: step 4/4 — computing totals …")
        total_marks = 0
        max_total_marks = 0
        for q_number, rubric in parsed_rubrics.items():
            max_marks = int(rubric.get("max_marks", 0))
            awarded = int(question_results.get(q_number, {}).get("awarded_marks", 0))
            total_marks += awarded
            max_total_marks += max_marks

        percentage = (
            round((total_marks / max_total_marks) * 100, 2)
            if max_total_marks > 0 else 0.0
        )
        grade = _assign_grade(percentage)

        logger.info(
            "pipeline: RESULT — %d/%d (%.2f%%)  grade=%s",
            total_marks, max_total_marks, percentage, grade,
        )
        return {
            "total_marks": total_marks,
            "max_total_marks": max_total_marks,
            "percentage": percentage,
            "grade": grade,
            "question_results": question_results,
        }

    except PipelineException:
        raise
    except Exception as exc:
        logger.exception("pipeline: unhandled error — %s", exc)
        raise PipelineException(
            f"Pipeline failed: {type(exc).__name__}: {exc}", original_error=exc
        ) from exc
