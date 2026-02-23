"""
apps/pipeline/views.py

DRF API views for EduGrade AI — Phase 1.

Endpoints:

    GET  /api/health/            → service health check
    POST /api/parse-rubrics/     → parse rubric text → structured dict
    POST /api/ocr/               → run OCR on an uploaded image
    POST /api/pipeline/          → full end-to-end evaluation (OCR + Gemini)
"""

import logging
import os
import tempfile
from typing import Any

from django.conf import settings
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import (
    EvaluationException,
    OcrException,
    PipelineException,
    RubricParseException,
)
from core.ocr import extract_answers
from core.parser import parse_rubrics
from core.pipeline import run_evaluation_pipeline

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _save_upload_to_temp(uploaded_file) -> str:
    """Save a Django UploadedFile to a named temp file and return its path.

    Args:
        uploaded_file: InMemoryUploadedFile or TemporaryUploadedFile.

    Returns:
        Absolute path of the saved temp file.
    """
    suffix = os.path.splitext(uploaded_file.name)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        for chunk in uploaded_file.chunks():
            tmp.write(chunk)
        return tmp.name


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthView(APIView):
    """GET /api/health/  →  ``{"status": "ok", "service": "EduGrade AI"}``"""

    def get(self, request: Request) -> Response:
        """Return service health status."""
        return Response(
            {"status": "ok", "service": "EduGrade AI"},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Parse Rubrics
# ---------------------------------------------------------------------------

class ParseRubricsView(APIView):
    """POST /api/parse-rubrics/  →  parse rubric text.

    Form fields:
        rubrics_text (str): Raw rubric text.
    """

    parser_classes = [FormParser, MultiPartParser, JSONParser]

    def post(self, request: Request) -> Response:
        """Handle POST — parse rubric text."""
        rubrics_text: str = (
            request.data.get("rubrics_text") or request.data.get("rubric_text") or ""
        )
        if not rubrics_text.strip():
            return Response(
                {"error": "rubrics_text is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            parsed = parse_rubrics(rubrics_text)
        except RubricParseException as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("ParseRubricsView: unexpected error")
            return Response(
                {"error": f"Unexpected error: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response({"questions": parsed}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------

class OcrView(APIView):
    """POST /api/ocr/  →  extract per-question answers from an image.

    Form fields:
        file         (file): The answer-sheet image.
        question_ids (str):  Comma-separated IDs, e.g. ``"1,2,6a"``.
        ollama_url   (str, optional)
        model        (str, optional)
        ocr_service_url (str, optional)
        ocr_api_key  (str, optional)
    """

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request) -> Response:
        """Handle POST — run OCR on uploaded image."""
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"error": "No file uploaded. Send the image as 'file' field."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        q_ids_raw: str = request.data.get("question_ids", "")
        if not q_ids_raw.strip():
            return Response(
                {"error": "question_ids is required (comma-separated, e.g. '1,2,6a')."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        question_ids = [q.strip() for q in q_ids_raw.split(",") if q.strip()]

        ollama_url: str = request.data.get("ollama_url") or settings.OLLAMA_URL
        model: str = request.data.get("model") or settings.OLLAMA_OCR_MODEL
        ocr_service_url: str = request.data.get("ocr_service_url") or settings.OCR_SERVICE_URL
        ocr_api_key: str = request.data.get("ocr_api_key") or settings.OCR_API_KEY

        tmp_path: str = _save_upload_to_temp(uploaded_file)
        try:
            answers = extract_answers(
                image_path=tmp_path,
                question_ids=question_ids,
                ollama_url=ollama_url,
                model=model,
                ocr_service_url=ocr_service_url,
                ocr_api_key=ocr_api_key,
            )
        except OcrException as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            logger.exception("OcrView: unexpected error")
            return Response(
                {"error": f"Unexpected error: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
        return Response({"answers": answers}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Full Pipeline (OCR + Gemini evaluation)
# ---------------------------------------------------------------------------

class PipelineView(APIView):
    """POST /api/pipeline/  →  full OCR + Gemini evaluation.

    Form fields:
        file            (file): The answer-sheet image.
        rubrics_text    (str):  Plain-text rubric.
        gemini_api_key  (str, optional): Override key from settings.
        gemini_model    (str, optional): Override Gemini model name.
        ollama_url      (str, optional): Ollama base URL.
        ocr_model       (str, optional): Ollama OCR parsing model.
        ocr_service_url (str, optional): External OCR endpoint.
        ocr_api_key     (str, optional): External OCR API key.

    Response 200::

        {
            "total_marks": 42,
            "max_total_marks": 50,
            "percentage": 84.0,
            "grade": "A+",
            "question_results": { ... }
        }
    """

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request) -> Response:
        """Handle POST — run full OCR + Gemini evaluation pipeline."""
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"error": "No file uploaded. Send the image as 'file' field."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rubrics_text: str = (
            request.data.get("rubrics_text") or request.data.get("rubric_text") or ""
        )
        if not rubrics_text.strip():
            return Response(
                {"error": "rubrics_text is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Config — request overrides take priority over settings
        gemini_api_key: str = request.data.get("gemini_api_key") or settings.GEMINI_API_KEY
        gemini_model: str = request.data.get("gemini_model") or settings.GEMINI_MODEL
        ollama_url: str = request.data.get("ollama_url") or settings.OLLAMA_URL
        ocr_model: str = request.data.get("ocr_model") or settings.OLLAMA_OCR_MODEL
        ocr_service_url: str = request.data.get("ocr_service_url") or settings.OCR_SERVICE_URL
        ocr_api_key: str = request.data.get("ocr_api_key") or settings.OCR_API_KEY

        if not gemini_api_key:
            return Response(
                {"error": "GEMINI_API_KEY is not set. Add it to your .env file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.info(
            "PipelineView: file=%s  gemini_model=%s  ocr_svc=%s",
            uploaded_file.name, gemini_model,
            ocr_service_url or "(Ollama multimodal fallback)",
        )

        tmp_path: str = _save_upload_to_temp(uploaded_file)
        try:
            result: dict[str, Any] = run_evaluation_pipeline(
                image_path=tmp_path,
                rubrics_text=rubrics_text,
                gemini_api_key=gemini_api_key,
                gemini_model=gemini_model,
                ollama_url=ollama_url,
                ocr_model=ocr_model,
                ocr_service_url=ocr_service_url,
                ocr_api_key=ocr_api_key,
            )
        except RubricParseException as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except (OcrException, EvaluationException) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except PipelineException as exc:
            logger.error("PipelineView: %s", exc)
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as exc:
            logger.exception("PipelineView: unexpected error")
            return Response(
                {"error": f"Unexpected error: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

        return Response(result, status=status.HTTP_200_OK)
