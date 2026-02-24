"""
apps/pipeline/urls.py — URL patterns for the EduGrade pipeline app.
"""

from django.urls import path

from .views import (
    HealthView, 
    OcrView, 
    ParseRubricsView, 
    PipelineView,
    ExamCreateView,
    StudentBatchUploadView,
    EvaluateAllView,
    ExamProgressView,
    ExamReportView,
    ExamCsvExportView,
    ExamPdfExportView
)

urlpatterns = [
    # Health check
    path("health/", HealthView.as_view(), name="health"),

    # Phase 1 core endpoints
    path("parse-rubrics/", ParseRubricsView.as_view(), name="parse-rubrics"),
    path("ocr/",           OcrView.as_view(),          name="ocr"),
    path("pipeline/",      PipelineView.as_view(),      name="pipeline"),
    
    # Phase 2 Teacher Dashboard Endpoints
    path("exams/create/",                             ExamCreateView.as_view(),           name="exam-create"),
    path("exams/<int:exam_id>/students/batch/",       StudentBatchUploadView.as_view(),   name="student-batch-upload"),
    path("exams/<int:exam_id>/evaluate-all/",         EvaluateAllView.as_view(),          name="evaluate-all"),
    path("exams/<int:exam_id>/progress/",             ExamProgressView.as_view(),         name="exam-progress"),
    path("exams/<int:exam_id>/report/",               ExamReportView.as_view(),           name="exam-report"),
    path("exams/<int:exam_id>/export/csv/",           ExamCsvExportView.as_view(),        name="exam-csv-export"),
    path("exams/<int:exam_id>/export/pdf/",           ExamPdfExportView.as_view(),        name="exam-pdf-export"),
]
