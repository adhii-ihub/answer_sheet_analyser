from rest_framework import serializers
from .models import Submission, Evaluation


class EvaluationSerializer(serializers.ModelSerializer):
    """Serializer for Evaluation model."""
    strengths = serializers.ReadOnlyField()
    mistakes = serializers.ReadOnlyField()
    improvement_suggestions = serializers.ReadOnlyField()
    detailed_feedback = serializers.ReadOnlyField()
    
    class Meta:
        model = Evaluation
        fields = [
            'id', 'quick_score', 'quick_feedback',
            'final_score', 'strengths', 'mistakes',
            'improvement_suggestions', 'detailed_feedback',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for Submission model."""
    evaluation = EvaluationSerializer(read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            'id', 'question_file', 'answer_file', 'rubric_file',
            'status', 'created_at', 'updated_at', 'evaluation'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'evaluation']


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new submissions."""
    
    class Meta:
        model = Submission
        fields = ['question_file', 'answer_file', 'rubric_file']
    
    def validate(self, attrs):
        """Validate file uploads."""
        from .utils.ocr import validate_file_upload
        
        try:
            validate_file_upload(attrs['question_file'])
            validate_file_upload(attrs['answer_file'])
            validate_file_upload(attrs['rubric_file'])
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        
        return attrs


class SubmissionListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing submissions."""
    quick_score = serializers.SerializerMethodField()
    final_score = serializers.SerializerMethodField()
    
    class Meta:
        model = Submission
        fields = [
            'id', 'status', 'quick_score', 'final_score',
            'created_at', 'updated_at'
        ]
    
    def get_quick_score(self, obj):
        """Get quick score from evaluation if exists."""
        try:
            return obj.evaluation.quick_score
        except Evaluation.DoesNotExist:
            return None
    
    def get_final_score(self, obj):
        """Get final score from evaluation if exists."""
        try:
            return obj.evaluation.final_score
        except Evaluation.DoesNotExist:
            return None
