"""
core/__init__.py

Public surface of the EduGrade AI core package.

Import the four most-used symbols so callers can write::

    from core import run_evaluation_pipeline, parse_rubrics
"""

from core.pipeline import run_evaluation_pipeline
from core.parser import parse_rubrics
from core.ocr import extract_answers
from core.evaluator import evaluate_answers
from core.exceptions import (
    OcrException,
    EvaluationException,
    RubricParseException,
    PipelineException,
)

__all__ = [
    "run_evaluation_pipeline",
    "parse_rubrics",
    "extract_answers",
    "evaluate_answers",
    "OcrException",
    "EvaluationException",
    "RubricParseException",
    "PipelineException",
]
