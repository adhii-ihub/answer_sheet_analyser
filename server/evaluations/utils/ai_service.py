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
        print(f"⚡ AI Service initialized with model: {self.llama3_model}")
        self.client = ollama.Client(host=settings.OLLAMA_HOST)

    def evaluate(self, question_text, answer_text, rubric_text):
        """
        Combined evaluation using phi3 model synchronous.
        Since we are using phi3 for everything, we just run the detailed prompt
        to get all necessary fields in one go.
        """
        # Run detailed evaluation with phi3
        detailed_result = self.detailed_evaluate(question_text, answer_text, rubric_text)
        
        # Return results
        return {
            'score': detailed_result.get('final_score', 0),
            'quick_feedback': detailed_result.get('detailed_feedback', '')[:200] + "...", # Truncate for quick feedback
            'final_score': detailed_result.get('final_score', 0),
            'strengths': detailed_result.get('strengths', []),
            'mistakes': detailed_result.get('mistakes', []),
            'improvement_suggestions': detailed_result.get('improvement_suggestions', []),
            'detailed_feedback': detailed_result.get('detailed_feedback', '')
        }
    
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
            try:
                result = json.loads(response['response'])
            except json.JSONDecodeError:
                # Fallback: try to find JSON-like content
                import re
                json_match = re.search(r'\{.*\}', response['response'], re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group(0))
                else:
                    raise ValueError("Could not parse JSON from response")
            
            # Relaxed validation - just try to get fields
            return {
                'final_score': float(result.get('final_score', result.get('score', 0))),
                'strengths': result.get('strengths', []),
                'mistakes': result.get('mistakes', []),
                'improvement_suggestions': result.get('improvement_suggestions', []),
                'detailed_feedback': result.get('detailed_feedback', result.get('quick_feedback', 'No feedback provided'))
            }
        except Exception as e:
            print(f"Error in detailed evaluation: {e}")
            print(f"Response was: {response.get('response', 'No response')}")
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
        return f"""You are an exam evaluator. Evaluate the student's answer based on the question and rubric.

QUESTION:
{question_text}

RUBRIC:
{rubric_text}

STUDENT ANSWER:
{answer_text}

Provide your evaluation in valid JSON format with these fields:
- final_score: (number 0-100)
- detailed_feedback: (string)
- strengths: (list of strings)
- mistakes: (list of strings)
- improvement_suggestions: (list of strings)

Example JSON:
{{
    "final_score": 85,
    "detailed_feedback": "Good answer but missing some details.",
    "strengths": ["Clear writing", "Correct dates"],
    "mistakes": ["Missed one key point"],
    "improvement_suggestions": ["Elaborate more on the impact"]
}}

Respond ONLY with the JSON."""


# Singleton instance
ai_service = AIEvaluationService()
