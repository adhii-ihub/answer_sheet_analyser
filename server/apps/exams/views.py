from rest_framework import generics, permissions
from .models import ExamSession, StudentSubmission
from .serializers import ExamSessionResultSerializer, StudentSubmissionDetailSerializer

class ExamResultsView(generics.RetrieveAPIView):
    queryset = ExamSession.objects.all()
    serializer_class = ExamSessionResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return ExamSession.objects.filter(teacher=self.request.user)

class StudentResultDetailView(generics.RetrieveAPIView):
    queryset = StudentSubmission.objects.all()
    serializer_class = StudentSubmissionDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        # Ensure modifying only submissions belonging to the teacher's exam sessions
        return StudentSubmission.objects.filter(exam_session__teacher=self.request.user)
