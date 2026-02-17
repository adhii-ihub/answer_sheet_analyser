from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UploadView,
    HistoryView,
    SubmissionDetailView,
    AnalyticsView,
    DashboardView,
    ExamViewSet
)

router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exams')

urlpatterns = [
    path('upload/', UploadView.as_view(), name='upload'),
    path('history/', HistoryView.as_view(), name='history'),
    path('submissions/<int:pk>/', SubmissionDetailView.as_view(), name='submission-detail'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('', include(router.urls)),
]