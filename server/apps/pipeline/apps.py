"""
apps/pipeline/apps.py — Django AppConfig for the pipeline app.
"""

from django.apps import AppConfig


class PipelineConfig(AppConfig):
    """AppConfig for the EduGrade pipeline app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.pipeline"
    label = "pipeline"
    verbose_name = "EduGrade Pipeline"
