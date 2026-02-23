from rest_framework import serializers
from apps.exams.models import ExamSession, StudentSubmission

class StudentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSubmission
        fields = ['id', 'student_name', 'file', 'processed', 'total_marks_awarded']
        read_only_fields = ['processed', 'total_marks_awarded']

class ExamSessionSerializer(serializers.ModelSerializer):
    submissions = StudentSubmissionSerializer(many=True, read_only=True)
    
    # Custom fields for file uploads
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=True
    )

    class Meta:
        model = ExamSession
        fields = ['id', 'teacher', 'title', 'description', 'created_at', 'question_paper', 'rubric', 'max_marks', 'files', 'submissions']
        read_only_fields = ['teacher', 'created_at', 'submissions']

    def create(self, validated_data):
        files = validated_data.pop('files')
        question_paper = validated_data.pop('question_paper', None)
        
        exam_session = ExamSession.objects.create(**validated_data)
        
        if question_paper:
            exam_session.question_paper = question_paper
            exam_session.save()
        
        submissions = []
        for file in files:
            # Basic student name extraction from filename
            student_name = file.name.split('.')[0]
            submission = StudentSubmission(
                exam_session=exam_session,
                file=file,
                student_name=student_name
            )
            submission.save()
            submissions.append(submission)
        
        # StudentSubmission.objects.bulk_create(submissions)
        return exam_session
