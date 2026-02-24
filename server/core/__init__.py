"""
core/__init__.py

Public surface of the EduGrade AI core package.
"""

from core.pipeline import run_evaluation_pipeline
from core.ocr import extract_answers
from core.evaluator import evaluate_entire_exam
from core.exceptions import (
    OcrException,
    EvaluationException,
    PipelineException,
)

__all__ = [
    "run_evaluation_pipeline",
    "extract_answers",
    "evaluate_entire_exam",
    "OcrException",
    "EvaluationException",
    "PipelineException",
]
