"""
edugrade/urls.py — Root URL configuration for EduGrade AI.
"""

from django.urls import include, path

urlpatterns = [
    path("api/", include("apps.pipeline.urls")),
]
