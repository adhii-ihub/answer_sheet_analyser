"""
AI service for exam evaluation using Ollama models.
- phi3:mini for quick scoring (synchronous)
- llama3:8b for detailed feedback (asynchronous)
"""
import json
import ollama
from django.conf import settings


class AIEvaluationService:
    """Service class for AI-powered exam evaluation."""
    
    def __init__(self):
        self.phi3_model = settings.PHI3_MODEL
        self.llama3_model = settings.LLAMA3_MODEL
        self.client = ollama.Client(host=settings.OLLAMA_HOST)
    
    def quick_evaluate(self, question_text, answer_text, rubric_text):
        """
        Quick evaluation using phi3:mini model.
        Returns: {"score": float, "quick_feedback": str}
        """
        prompt = self._build_quick_prompt(question_text, answer_text, rubric_text)
        
        try:
            response = self.client.generate(
                model=self.phi3_model,
                prompt=prompt,
                format='json'
            )
            
            # Parse response
            result = json.loads(response['response'])
            
            # Validate response structure
            if 'score' not in result or 'quick_feedback' not in result:
                raise ValueError("Invalid response format from AI model")
            
            return {
                'score': float(result['score']),
                'quick_feedback': result['quick_feedback']
            }
        except Exception as e:
            print(f"Error in quick evaluation: {e}")
            return {
                'score': 0.0,
                'quick_feedback': f"Error during evaluation: {str(e)}"
            }
    
    def detailed_evaluate(self, question_text, answer_text, rubric_text):
        """
        Detailed evaluation using llama3:8b model.
        Returns: {
            "final_score": float,
            "strengths": list,
            "mistakes": list,
            "improvement_suggestions": list,
            "detailed_feedback": str
        }
        """
        prompt = self._build_detailed_prompt(question_text, answer_text, rubric_text)
        
        try:
            response = self.client.generate(
                model=self.llama3_model,
                prompt=prompt,
                format='json'
            )
            
            # Parse response
            result = json.loads(response['response'])
            
            # Validate response structure
            required_fields = [
                'final_score', 'strengths', 'mistakes', 
                'improvement_suggestions', 'detailed_feedback'
            ]
            for field in required_fields:
                if field not in result:
                    raise ValueError(f"Missing field '{field}' in AI response")
            
            return {
                'final_score': float(result['final_score']),
                'strengths': result['strengths'],
                'mistakes': result['mistakes'],
                'improvement_suggestions': result['improvement_suggestions'],
                'detailed_feedback': result['detailed_feedback']
            }
        except Exception as e:
            print(f"Error in detailed evaluation: {e}")
            return {
                'final_score': 0.0,
                'strengths': [],
                'mistakes': [],
                'improvement_suggestions': [],
                'detailed_feedback': f"Error during evaluation: {str(e)}"
            }
    
    def _build_quick_prompt(self, question_text, answer_text, rubric_text):
        """Build prompt for quick evaluation."""
        return f"""You are an expert exam evaluator. Analyze the student's answer and provide a quick evaluation.

QUESTION:
{question_text}

RUBRIC/MARKING SCHEME:
{rubric_text}

STUDENT'S ANSWER:
{answer_text}

Provide a quick evaluation in the following JSON format:
{{
    "score": <number between 0-100>,
    "quick_feedback": "<brief feedback in 2-3 sentences>"
}}

Respond ONLY with valid JSON, no additional text."""
    
    def _build_detailed_prompt(self, question_text, answer_text, rubric_text):
        """Build prompt for detailed evaluation."""
        return f"""You are an expert exam evaluator. Provide a comprehensive evaluation of the student's answer.

QUESTION:
{question_text}

RUBRIC/MARKING SCHEME:
{rubric_text}

STUDENT'S ANSWER:
{answer_text}

Provide a detailed evaluation in the following JSON format:
{{
    "final_score": <number between 0-100>,
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "mistakes": ["<mistake 1>", "<mistake 2>", ...],
    "improvement_suggestions": ["<suggestion 1>", "<suggestion 2>", ...],
    "detailed_feedback": "<comprehensive feedback paragraph>"
}}

Respond ONLY with valid JSON, no additional text."""


# Singleton instance
ai_service = AIEvaluationService()
