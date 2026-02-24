"""
core/pipeline.py

Top-level orchestration pipeline for EduGrade AI.

Stack:
  OCR  → LightNeon OCR 2 (Cloudflare/ngrok endpoint)
  PDF  → PyMuPDF (question paper extraction, answer sheet conversion)
  LLM  → Google Gemini (single monolithic examiner prompt)
"""

import logging
from typing import Any

from core.exceptions import PipelineException
from core.evaluator import evaluate_entire_exam
from core.ocr import extract_answers
from core.pdf_utils import extract_text_from_pdf, convert_pdf_to_images

logger = logging.getLogger(__name__)


def run_evaluation_pipeline(
    question_paper_path: str,
    answer_sheet_paths: list[str],
    rubrics_text: str,
    student_name: str,
    total_marks: int,
    groq_api_key: str,
    ocr_service_url: str,
    ocr_api_key: str,
    groq_model: str = "llama-3.3-70b-versatile",
) -> dict[str, Any]:
    """Run the simplified EduGrade AI evaluation pipeline.

    Steps (all sequential):
    1. PyMuPDF → Extract raw text from Question Paper PDF.
    2. LightNeon OCR 2 → Extract raw text from Answer Sheet images.
    3. Groq → Evaluate everything via strict college-examiner prompt.

    Args:
        question_paper_path: Path to the question paper PDF.
        answer_sheet_paths: List of paths to answer sheet images (already converted).
        rubrics_text: Raw rubric document text.
        student_name: Name of the student.
        total_marks: Expected max marks for the exam.
        groq_api_key: Groq API key for evaluation.
        ocr_service_url: URL of the LightNeon OCR 2 endpoint.
        ocr_api_key: API key for the OCR service.
        groq_model: Groq model name. Defaults to ``"llama-3.3-70b-versatile"``.

    Returns:
        The exact JSON struct specified by the strict examiner prompt.

    Raises:
        PipelineException: On any failure in any step.
    """
    logger.info("pipeline: starting unified EduGrade AI pipeline.")
    try:
        # Step 1 — Parse question paper PDF
        logger.info("pipeline: step 1/3 — extracting question paper text …")
        qp_text = extract_text_from_pdf(question_paper_path)
        logger.info("pipeline: question paper %d chars.", len(qp_text))

        # Step 2 — Handle PDF vs Image conversion and LightNeon OCR
        processed_images = []
        for path in answer_sheet_paths:
            if str(path).lower().endswith('.pdf'):
                logger.info("pipeline: formatting PDF answer sheet to images: %s", path)
                import tempfile
                import os
                temp_dir = tempfile.gettempdir()
                converted = convert_pdf_to_images(path, temp_dir)
                processed_images.extend(converted)
            else:
                processed_images.append(path)

        logger.info("pipeline: step 2/3 — LightNeon OCR text extraction on %d pages …", len(processed_images))
        student_answers_text = extract_answers(
            image_paths=processed_images,
            ocr_service_url=ocr_service_url,
            ocr_api_key=ocr_api_key,
        )

        # Step 3 — Groq complete evaluation
        logger.info("pipeline: step 3/3 — Groq monolithic evaluation …")
        final_result = evaluate_entire_exam(
            question_paper_text=qp_text,
            rubrics_text=rubrics_text,
            total_marks=total_marks,
            student_answers_text=student_answers_text,
            student_name=student_name,
            groq_api_key=groq_api_key,
            model_name=groq_model,
        )

        logger.info("pipeline: DONE.")
        return final_result

    except PipelineException:
        raise
    except Exception as exc:
        logger.exception("pipeline: unhandled error — %s", exc)
        raise PipelineException(
            f"Pipeline failed: {type(exc).__name__}: {exc}", original_error=exc
        ) from exc
