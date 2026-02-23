"""
core/pipeline.py

Top-level orchestration pipeline for the EduGrade AI system.

Ties together the parser, OCR extractor (external HTTP service + Ollama),
and Gemini LLM evaluator into a single callable that returns a fully graded
result including per-question breakdowns, total marks, percentage, and an
Anna University letter grade.
"""

import logging
from typing import Any

from core.exceptions import PipelineException
from core.evaluator import evaluate_answers
from core.ocr import extract_answers
from core.parser import parse_rubrics

# ---------------------------------------------------------------------------
# Module-level logger
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Grade scale (Anna University)
# ---------------------------------------------------------------------------

_GRADE_SCALE: list[tuple[float, str]] = [
    (91.0, "O"),
    (81.0, "A+"),
    (71.0, "A"),
    (61.0, "B+"),
    (51.0, "B"),
    (0.0,  "RA"),
]


def _assign_grade(percentage: float) -> str:
    """Return the Anna University letter grade for the given percentage.

    Args:
        percentage: Achieved percentage (0.0 – 100.0).

    Returns:
        Grade string: ``"O"``, ``"A+"``, ``"A"``, ``"B+"``, ``"B"``, or ``"RA"``.
    """
    for threshold, grade in _GRADE_SCALE:
        if percentage >= threshold:
            return grade
    return "RA"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_evaluation_pipeline(
    image_path: str,
    rubrics_text: str,
    gemini_api_key: str,
    gemini_model: str = "gemini-2.0-flash",
    ollama_url: str = "http://localhost:11434",
    ocr_model: str = "mistral",
    ocr_service_url: str = "",
    ocr_api_key: str = "",
) -> dict[str, Any]:
    """Run the full EduGrade AI evaluation pipeline end-to-end.

    Steps (all sequential):

    1. **Parse rubrics** — convert raw rubric text into a structured dict.
    2. **Extract answers via OCR** — POST image to the external OCR service
       (or Ollama multimodal if not set), then parse into per-question JSON.
    3. **Evaluate with Gemini** — send each answer + rubric to Gemini API.
    4. **Compute totals & grade** — sum marks, calculate %, assign letter grade.

    Args:
        image_path: Path to the answer-sheet image.
        rubrics_text: Raw plain-text rubric document.
        gemini_api_key: Google Gemini API key.
        gemini_model: Gemini model name. Defaults to ``"gemini-2.0-flash"``.
        ollama_url: Base Ollama URL (used for OCR answer-parsing step).
        ocr_model: Ollama text model for parsing OCR output into per-question JSON.
        ocr_service_url: External HTTP OCR endpoint (e.g. ngrok URL).
        ocr_api_key: API key for the external OCR service.

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
        PipelineException: If any step fails.
    """
    logger.info("pipeline: starting EduGrade AI evaluation pipeline.")

    try:
        # ------------------------------------------------------------------ #
        # Step 1 — Parse rubrics                                               #
        # ------------------------------------------------------------------ #
        logger.info("pipeline: step 1/4 — parsing rubrics …")
        parsed_rubrics = parse_rubrics(rubrics_text)
        question_ids: list[str] = list(parsed_rubrics.keys())
        logger.info(
            "pipeline: rubrics parsed — %d question(s): %s", len(question_ids), question_ids
        )

        # ------------------------------------------------------------------ #
        # Step 2 — OCR extraction                                              #
        # ------------------------------------------------------------------ #
        logger.info("pipeline: step 2/4 — extracting answers via OCR …")
        ocr_output = extract_answers(
            image_path=image_path,
            question_ids=question_ids,
            ollama_url=ollama_url,
            model=ocr_model,
            ocr_service_url=ocr_service_url,
            ocr_api_key=ocr_api_key,
        )
        logger.info("pipeline: OCR complete — %d answer(s) extracted.", len(ocr_output))

        # ------------------------------------------------------------------ #
        # Step 3 — Gemini LLM evaluation                                       #
        # ------------------------------------------------------------------ #
        logger.info("pipeline: step 3/4 — evaluating answers with Gemini …")
        question_results = evaluate_answers(
            ocr_output=ocr_output,
            parsed_rubrics=parsed_rubrics,
            gemini_api_key=gemini_api_key,
            model=gemini_model,
        )
        logger.info("pipeline: evaluation complete — %d result(s).", len(question_results))

        # ------------------------------------------------------------------ #
        # Step 4 — Compute totals and grade                                    #
        # ------------------------------------------------------------------ #
        logger.info("pipeline: step 4/4 — computing totals and grade …")
        total_marks: int = 0
        max_total_marks: int = 0

        for q_number, rubric in parsed_rubrics.items():
            max_marks: int = int(rubric.get("max_marks", 0))
            q_result: dict = question_results.get(q_number, {})
            awarded: int = int(q_result.get("awarded_marks", 0))
            total_marks += awarded
            max_total_marks += max_marks

        if max_total_marks == 0:
            logger.warning("pipeline: max_total_marks is 0 — percentage set to 0.0.")
            percentage = 0.0
        else:
            percentage = round((total_marks / max_total_marks) * 100, 2)

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
        logger.exception("pipeline: unhandled error — %s: %s", type(exc).__name__, exc)
        raise PipelineException(
            f"Pipeline failed: {type(exc).__name__}: {exc}",
            original_error=exc,
        ) from exc
