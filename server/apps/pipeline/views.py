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
        groq_api_key = request.data.get("groq_api_key") or settings.GROQ_API_KEY
        groq_model = request.data.get("groq_model") or settings.GROQ_MODEL

        tmp_path = _save_upload_to_temp(uploaded_file)
        try:
            answers = extract_answers(
                image_path=tmp_path,
                question_ids=question_ids,
                ocr_service_url=ocr_service_url,
                ocr_api_key=ocr_api_key,
                groq_api_key=groq_api_key,
                groq_model=groq_model,
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
        question_paper  (file): The Question Paper PDF.
        answer_sheets   (files): One or more Answer Sheet images/PDFs.
        rubrics_text    (str): Plain-text rubric.
        student_name    (str): Name of the student.
        total_marks     (int): Total max marks for exam.
        groq_api_key    (str, optional)
        groq_model      (str, optional)
        ocr_service_url (str, optional)
        ocr_api_key     (str, optional)
    """

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request) -> Response:
        """Run the full internal EduGrade AI pipeline."""
        
        # 1. Validate inputs
        qp_file = request.FILES.get("question_paper")
        ans_files = request.FILES.getlist("answer_sheets")
        
        if not qp_file:
            return Response({"error": "question_paper file is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not ans_files:
            return Response({"error": "At least one answer_sheets file is required."}, status=status.HTTP_400_BAD_REQUEST)

        rubrics_text: str = request.data.get("rubrics_text", "").strip()
        student_name: str = request.data.get("student_name", "Student").strip()
        
        try:
            total_marks = int(request.data.get("total_marks", 0))
            if total_marks <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({"error": "total_marks must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)

        if not rubrics_text:
            return Response({"error": "rubrics_text is required."}, status=status.HTTP_400_BAD_REQUEST)

        groq_api_key = request.data.get("groq_api_key") or settings.GROQ_API_KEY
        groq_model = request.data.get("groq_model") or settings.GROQ_MODEL
        ocr_service_url = request.data.get("ocr_service_url") or settings.OCR_SERVICE_URL
        ocr_api_key = request.data.get("ocr_api_key") or settings.OCR_API_KEY

        if not groq_api_key:
            return Response({"error": "GROQ_API_KEY not configured."}, status=status.HTTP_400_BAD_REQUEST)
        if not ocr_service_url:
            return Response({"error": "OCR_SERVICE_URL not configured."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Save temporary files
        tmp_files_to_cleanup = []
        image_paths_for_ocr = []
        qp_path = ""
        
        try:
            # Save Question Paper
            qp_path = _save_upload_to_temp(qp_file)
            tmp_files_to_cleanup.append(qp_path)
            
            # Save and process Answer Sheets
            for f in ans_files:
                f_path = _save_upload_to_temp(f)
                tmp_files_to_cleanup.append(f_path)
                
                # If it's a PDF, convert to images first
                if f.name.lower().endswith(".pdf"):
                    logger.info("PipelineView: Answer sheet %s is a PDF. Converting to images...", f.name)
                    from core.pdf_utils import convert_pdf_to_images
                    out_dir = tempfile.gettempdir()
                    converted_imgs = convert_pdf_to_images(f_path, out_dir)
                    tmp_files_to_cleanup.extend(converted_imgs)
                    image_paths_for_ocr.extend(converted_imgs)
                else:
                    image_paths_for_ocr.append(f_path)

            logger.info("PipelineView: Processing %d final image(s) for answer sheets.", len(image_paths_for_ocr))

            # 3. Run Pipeline
            result: dict[str, Any] = run_evaluation_pipeline(
                question_paper_path=qp_path,
                answer_sheet_paths=image_paths_for_ocr,
                rubrics_text=rubrics_text,
                student_name=student_name,
                total_marks=total_marks,
                groq_api_key=groq_api_key,
                groq_model=groq_model,
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
            # Assure aggressive cleanup of all temp files and converted PDF pages
            for t_path in tmp_files_to_cleanup:
                try:
                    if os.path.exists(t_path):
                        os.unlink(t_path)
                except OSError:
                    pass

        return Response(result)

# ---------------------------------------------------------------------------
# PHASE 2: TEACHER DASHBOARD VIEWS
# ---------------------------------------------------------------------------

from apps.pipeline.models import ExamSession, StudentAnswer
from core.background import start_evaluation_for_exam
from django.shortcuts import get_object_or_404
import csv
from django.http import HttpResponse

class ExamCreateView(APIView):
    """POST /api/exams/create/"""
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        qp_file = request.FILES.get("question_paper")
        rubrics = request.data.get("rubrics_text", "").strip()
        marks = int(request.data.get("total_marks", 100))
        limit = int(request.data.get("student_limit", 50))

        if not qp_file or not rubrics:
            return Response({"error": "question_paper and rubrics_text required"}, status=400)

        exam = ExamSession.objects.create(
            question_paper_file=qp_file,
            rubrics_text=rubrics,
            total_marks=marks,
            student_limit=limit
        )

        return Response({
            "success": True,
            "data": {"exam_id": exam.id}
        })

class StudentBatchUploadView(APIView):
    """POST /api/exams/<id>/students/batch/"""
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, exam_id):
        exam = get_object_or_404(ExamSession, id=exam_id)
        files = request.FILES.getlist("files[]")
        names = request.data.getlist("names[]")

        if len(files) != len(names):
            return Response({"error": "Mismatched files and names length"}, status=400)

        created_count = 0
        for idx, f in enumerate(files):
            # Check limit
            if exam.students.count() >= exam.student_limit:
                break
            
            StudentAnswer.objects.create(
                exam=exam,
                student_name=names[idx],
                answer_sheet_file=f
            )
            created_count += 1

        return Response({"success": True, "uploaded": created_count})

class EvaluateAllView(APIView):
    """POST /api/exams/<id>/evaluate-all/"""
    def post(self, request, exam_id):
        exam = get_object_or_404(ExamSession, id=exam_id)
        
        # Fire background daemon thread processing
        start_evaluation_for_exam(exam.id)
        
        return Response({"success": True, "message": "Evaluation started in background."})

class ExamProgressView(APIView):
    """GET /api/exams/<id>/progress/"""
    def get(self, request, exam_id):
        exam = get_object_or_404(ExamSession, id=exam_id)
        students = list(exam.students.all())
        
        total = len(students)
        evaluated = sum(1 for s in students if s.status == StudentAnswer.Status.COMPLETED)
        failed = sum(1 for s in students if s.status == StudentAnswer.Status.FAILED)
        pending = sum(1 for s in students if s.status in [StudentAnswer.Status.PENDING, StudentAnswer.Status.PROCESSING])

        return Response({
            "total": total,
            "evaluated": evaluated,
            "pending": pending,
            "failed": failed
        })

class ExamReportView(APIView):
    """GET /api/exams/<id>/report/"""
    def get(self, request, exam_id):
        exam = get_object_or_404(ExamSession, id=exam_id)
        students = exam.students.filter(status=StudentAnswer.Status.COMPLETED)
        
        data = []
        for s in students:
            data.append({
                "name": s.student_name,
                "total": s.total_score,
                "percentage": s.percentage,
                "grade": s.grade,
                "marks": s.get_parsed_marks()
            })
            
        return Response({"students": data})

class ExamCsvExportView(APIView):
    def get(self, request, exam_id):
        exam = get_object_or_404(ExamSession, id=exam_id)
        students = exam.students.filter(status=StudentAnswer.Status.COMPLETED)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="exam_{exam.id}_results.csv"'

        writer = csv.writer(response)
        writer.writerow(['Student Name', 'Total Score', 'Percentage', 'Grade'])

        for s in students:
            writer.writerow([s.student_name, s.total_score, f"{s.percentage}%", s.grade])

        return response

class ExamPdfExportView(APIView):
    def get(self, request, exam_id):
        return Response({"error": "PDF export not implemented yet. Please use CSV."}, status=501)
