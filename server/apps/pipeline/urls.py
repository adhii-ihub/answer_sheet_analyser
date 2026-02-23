"""
apps/pipeline/urls.py — URL patterns for the EduGrade pipeline app.
"""

from django.urls import path

from .views import HealthView, OcrView, ParseRubricsView, PipelineView

urlpatterns = [
    # Health check
    path("health/", HealthView.as_view(), name="health"),

    # Phase 1 core endpoints
    path("parse-rubrics/", ParseRubricsView.as_view(), name="parse-rubrics"),
    path("ocr/",           OcrView.as_view(),          name="ocr"),
    path("pipeline/",      PipelineView.as_view(),      name="pipeline"),
]
