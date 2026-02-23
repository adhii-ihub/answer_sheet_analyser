"""
core/exceptions.py

Custom exception classes used throughout the EduGrade AI backend.
Each exception optionally stores the original underlying error.
"""


class BaseEdugradeException(Exception):
    """
    Base exception class for EduGrade AI.

    Attributes:
        message (str): Human-readable error message.
        original_error (Exception | None): Optional original exception.
    """

    def __init__(self, message: str, original_error: Exception | None = None):
        super().__init__(message)
        self.message = message
        self.original_error = original_error

    def __str__(self) -> str:
        if self.original_error:
            return f"{self.message} | Caused by: {repr(self.original_error)}"
        return self.message


class OcrException(BaseEdugradeException):
    """
    Raised when OCR extraction fails.
    """
    pass


class EvaluationException(BaseEdugradeException):
    """
    Raised when LLM-based evaluation fails.
    """
    pass


class RubricParseException(ValueError, BaseEdugradeException):
    """
    Raised when rubric parsing fails.

    Inherits from ValueError because invalid rubrics are input errors.
    """

    def __init__(self, message: str, original_error: Exception | None = None):
        ValueError.__init__(self, message)
        BaseEdugradeException.__init__(self, message, original_error)


class PipelineException(BaseEdugradeException):
    """
    Raised when the top-level evaluation pipeline fails.

    Wraps any uncaught error that escapes the OCR, parser, or evaluator
    stages so that callers receive a single, consistent exception type.
    """
    pass


class ExportException(BaseEdugradeException):
    """
    Raised when CSV or PDF export fails.
    """
    pass