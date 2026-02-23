from django.urls import path
from .views import ExamResultsView, StudentResultDetailView

urlpatterns = [
    path('results/<int:id>/', ExamResultsView.as_view(), name='exam_results'),
    path('submissions/<int:id>/', StudentResultDetailView.as_view(), name='submission_detail'),
]
