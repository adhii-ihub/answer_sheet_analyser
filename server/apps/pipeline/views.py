"""
apps/pipeline/views.py

DRF API views for EduGrade AI — Phase 1.

Stack: LightNeon OCR 2 (Cloudflare endpoint) + Google Gemini.

Endpoints:
    GET  /api/health/           → health check
    POST /api/parse-rubrics/    → parse rubric text
    POST /api/ocr/              → OCR only (LightNeon OCR 2 + Gemini parsing)
    POST /api/pipeline/         → full pipeline (OCR + Gemini evaluation)
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


def _save_upload_to_temp(uploaded_file) -> str:
    """Save a Django UploadedFile to a temp file and return its path.

    Args:
        uploaded_file: InMemoryUploadedFile or TemporaryUploadedFile.

    Returns:
        Absolute path string of the saved temp file.
    """
    suffix = os.path.splitext(uploaded_file.name)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        for chunk in uploaded_file.chunks():
            tmp.write(chunk)
        return tmp.name


# ---------------------------------------------------------------------------

class HealthView(APIView):
    """GET /api/health/"""

    def get(self, request: Request) -> Response:
        """Return service health status."""
        return Response({"status": "ok", "service": "EduGrade AI"})


# ---------------------------------------------------------------------------

class ParseRubricsView(APIView):
    """POST /api/parse-rubrics/

    Form fields:
        rubrics_text (str): Raw rubric text.
    """

    parser_classes = [FormParser, MultiPartParser, JSONParser]

    def post(self, request: Request) -> Response:
        """Parse rubric text and return structured dict."""
        rubrics_text: str = (
            request.data.get("rubrics_text") or request.data.get("rubric_text") or ""
        )
        if not rubrics_text.strip():
            return Response(
                {"error": "rubrics_text is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            return Response({"questions": parse_rubrics(rubrics_text)})
        except RubricParseException as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("ParseRubricsView error")
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------------

class OcrView(APIView):
    """POST /api/ocr/

    Multipart fields:
        file            (file): Answer-sheet image.
        question_ids    (str):  Comma-separated IDs, e.g. ``"1,2,6a"``.
        ocr_service_url (str, optional)
        ocr_api_key     (str, optional)
        gemini_api_key  (str, optional)
        gemini_model    (str, optional)
    """

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request) -> Response:
        """Run LightNeon OCR 2 + Gemini parsing on uploaded image."""
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"error": "Send the answer-sheet image as 'file' field."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        q_ids_raw: str = request.data.get("question_ids", "")
        if not q_ids_raw.strip():
            return Response(
                {"error": "question_ids is required (comma-separated)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        question_ids = [q.strip() for q in q_ids_raw.split(",") if q.strip()]

        ocr_service_url = request.data.get("ocr_service_url") or settings.OCR_SERVICE_URL
        ocr_api_key = request.data.get("ocr_api_key") or settings.OCR_API_KEY
        gemini_api_key = request.data.get("gemini_api_key") or settings.GEMINI_API_KEY
        gemini_model = request.data.get("gemini_model") or settings.GEMINI_MODEL

        tmp_path = _save_upload_to_temp(uploaded_file)
        try:
            answers = extract_answers(
                image_path=tmp_path,
                question_ids=question_ids,
                ocr_service_url=ocr_service_url,
                ocr_api_key=ocr_api_key,
                gemini_api_key=gemini_api_key,
                gemini_model=gemini_model,
            )
        except OcrException as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            logger.exception("OcrView error")
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

        return Response({"answers": answers})


# ---------------------------------------------------------------------------

class PipelineView(APIView):
    """POST /api/pipeline/  →  full OCR + Gemini evaluation.

    Multipart fields:
        file            (file): Answer-sheet image.
        rubrics_text    (str):  Plain-text rubric.
        gemini_api_key  (str, optional)
        gemini_model    (str, optional)
        ocr_service_url (str, optional)
        ocr_api_key     (str, optional)

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
        """Run the full EduGrade AI pipeline."""
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"error": "Send the answer-sheet image as 'file' field."},
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

        gemini_api_key = request.data.get("gemini_api_key") or settings.GEMINI_API_KEY
        gemini_model = request.data.get("gemini_model") or settings.GEMINI_MODEL
        ocr_service_url = request.data.get("ocr_service_url") or settings.OCR_SERVICE_URL
        ocr_api_key = request.data.get("ocr_api_key") or settings.OCR_API_KEY

        if not gemini_api_key:
            return Response(
                {"error": "GEMINI_API_KEY is not configured. Set it in .env."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not ocr_service_url:
            return Response(
                {"error": "OCR_SERVICE_URL is not configured. Set it in .env."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.info(
            "PipelineView: file=%s  model=%s  ocr=%s",
            uploaded_file.name, gemini_model, ocr_service_url,
        )

        tmp_path = _save_upload_to_temp(uploaded_file)
        try:
            result: dict[str, Any] = run_evaluation_pipeline(
                image_path=tmp_path,
                rubrics_text=rubrics_text,
                gemini_api_key=gemini_api_key,
                gemini_model=gemini_model,
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
            logger.exception("PipelineView unexpected error")
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

        return Response(result)
