from rest_framework import serializers
from .models import ExamSession, StudentSubmission, QuestionResult

class QuestionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionResult
        fields = ['question_no', 'question_text', 'answer_text', 'marks_awarded', 'feedback', 'reason']

class StudentSubmissionDetailSerializer(serializers.ModelSerializer):
    question_results = QuestionResultSerializer(many=True, read_only=True)
    
    class Meta:
        model = StudentSubmission
        fields = ['id', 'student_name', 'file', 'processed', 'processed_at', 'total_marks_awarded', 'question_results']

class ExamSessionResultSerializer(serializers.ModelSerializer):
    submissions = StudentSubmissionDetailSerializer(many=True, read_only=True)
    
    class Meta:
        model = ExamSession
        fields = ['id', 'title', 'max_marks', 'submissions']
