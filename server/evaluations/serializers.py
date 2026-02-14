from rest_framework import serializers
from .models import Submission, Evaluation


class EvaluationSerializer(serializers.ModelSerializer):
    """Serializer for Evaluation model."""
    strengths = serializers.ReadOnlyField()
    mistakes = serializers.ReadOnlyField()
    improvement_suggestions = serializers.ReadOnlyField()
    detailed_feedback = serializers.ReadOnlyField()
    max_score = serializers.ReadOnlyField()
    confidence = serializers.ReadOnlyField()
    
    class Meta:
        model = Evaluation
        fields = [
            'id', 'quick_score', 'quick_feedback',
            'final_score', 'max_score', 'strengths', 'mistakes',
            'improvement_suggestions', 'detailed_feedback',
            'confidence', 'created_at', 'updated_at'
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
        from django.conf import settings
        import os
        
        allowed_extensions = getattr(settings, 'ALLOWED_EXTENSIONS', ['pdf', 'png', 'jpg', 'jpeg'])
        
        for field in ['question_file', 'answer_file', 'rubric_file']:
            file = attrs.get(field)
            if file:
                ext = os.path.splitext(file.name)[1][1:].lower()
                if ext not in allowed_extensions:
                    raise serializers.ValidationError(
                        f"Invalid file type for {field}. Allowed: {allowed_extensions}"
                    )
                if file.size > getattr(settings, 'MAX_UPLOAD_SIZE', 10485760):
                    raise serializers.ValidationError(
                        f"File {field} is too large. Max size: 10MB"
                    )
        
        return attrs


class SubmissionListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing submissions."""
    file_name = serializers.SerializerMethodField()
    quick_score = serializers.SerializerMethodField()
    final_score = serializers.SerializerMethodField()
    max_score = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()
    strengths = serializers.SerializerMethodField()
    weaknesses = serializers.SerializerMethodField()
    improvement_suggestions = serializers.SerializerMethodField()
    confidence = serializers.SerializerMethodField()
    
    class Meta:
        model = Submission
        fields = [
            'id', 'file_name', 'status', 'quick_score', 'final_score',
            'max_score', 'feedback', 'strengths', 'weaknesses',
            'improvement_suggestions', 'confidence',
            'created_at', 'updated_at'
        ]
    
    def get_file_name(self, obj):
        """Get file name from answer_file."""
        import os
        if obj.answer_file:
            return os.path.basename(obj.answer_file.name)
        return f"Submission #{obj.id}"
    
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
    
    def get_feedback(self, obj):
        """Get detailed feedback from evaluation if exists."""
        try:
            return obj.evaluation.detailed_feedback or obj.evaluation.quick_feedback or None
        except Evaluation.DoesNotExist:
            return None
    
    def get_strengths(self, obj):
        """Get strengths from evaluation if exists."""
        try:
            return obj.evaluation.strengths or []
        except Evaluation.DoesNotExist:
            return []
    
    def get_weaknesses(self, obj):
        """Get weaknesses (mistakes) from evaluation if exists."""
        try:
            return obj.evaluation.mistakes or []
        except Evaluation.DoesNotExist:
            return []
    
    def get_max_score(self, obj):
        """Get max possible score from evaluation if exists."""
        try:
            return obj.evaluation.max_score
        except Evaluation.DoesNotExist:
            return None
    
    def get_improvement_suggestions(self, obj):
        """Get improvement suggestions from evaluation if exists."""
        try:
            return obj.evaluation.improvement_suggestions or []
        except Evaluation.DoesNotExist:
            return []
    
    def get_confidence(self, obj):
        """Get confidence score from evaluation if exists."""
        try:
            return obj.evaluation.confidence
        except Evaluation.DoesNotExist:
            return None
