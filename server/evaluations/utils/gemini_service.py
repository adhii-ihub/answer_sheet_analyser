
import os
import json
import google.generativeai as genai
from django.conf import settings
from PIL import Image

class GeminiService:
    """Service class for AI-powered exam evaluation using Google Gemini."""
    
    def __init__(self):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            print("❌ GEMINI_API_KEY is not set in environment or settings!")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        print(f"⚡ Gemini Service initialized using gemini-2.5-flash")

    def evaluate(self, question_path, answer_path, rubric_path):
        """
        Evaluate exam using Gemini multimodal capabilities.
        Accepts file paths for question, answer, and rubric.
        """
        try:
            # Load images
            # Gemini 1.5 flash handles images well. We don't need to read text purely.
            question_img = Image.open(question_path)
            answer_img = Image.open(answer_path)
            rubric_img = Image.open(rubric_path)
            
            prompt = self._build_evaluation_prompt()
            
            # Send to Gemini: [prompt, question_image, rubric_image, answer_image]
            # Order matters: Context (Question/Rubric) -> Target (Answer) -> Instructions
            print("📤 Sending request to Gemini...")
            
            response = self.model.generate_content([
                "Here is the Question Paper:", question_img,
                "Here is the Marking Rubric:", rubric_img,
                "Here is the Student's Answer Sheet:", answer_img,
                prompt
            ])
            
            # Parse JSON from response
            return self._parse_sresponse(response.text)
            
        except Exception as e:
            print(f"❌ Error in Gemini evaluation: {e}")
            return {
                'score': 0.0,
                'max_score': 100,
                'strengths': [],
                'mistakes': [],
                'improvement_suggestions': [],
                'feedback': f"Error during evaluation: {str(e)}",
                'confidence': 0.0
            }

    def _build_evaluation_prompt(self):
        return """
        You are an expert academic examiner. Your task is to evaluate the student's answer sheet against the provided question paper and marking rubric.

        **Instructions:**
        1. Read the Question Paper to understand what was asked.
        2. Read the Marking Rubric to understand how marks are assigned.
        3. Evaluate the Student's Answer Sheet carefully.
        4. Assign a score based STRICTLY on the rubric.
        5. Provide constructive feedback.

        **Output Format:**
        Provide the result in valid JSON format ONLY, with the following structure:
        {
            "score": <number, marks obtained>,
            "max_score": <number, total marks possible for these questions>,
            "strengths": ["<point 1>", "<point 2>", ...],
            "mistakes": ["<point 1>", "<point 2>", ...],
            "improvement_suggestions": ["<point 1>", ...],
            "feedback": "<detailed feedback paragraph>",
            "confidence": <number between 0 and 1, indicating your confidence in reading the handwriting>
        }
        
        IMPORTANT: Respond ONLY with VALID JSON. Do not add markdown formatting ```json ... ```.
        """

    def _parse_sresponse(self, text):
        """Parse JSON response from Gemini, handling potential markdown fencing."""
        try:
            cleaned_text = text.strip()
            # Remove markdown code blocks if present
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            cleaned_text = cleaned_text.strip()
            
            data = json.loads(cleaned_text)
            
            # Normalize fields to match application expectations
            return {
                'score': float(data.get('score', 0)),
                'max_score': float(data.get('max_score', 100)),
                'strengths': data.get('strengths', []),
                'mistakes': data.get('mistakes', []),
                'improvement_suggestions': data.get('improvement_suggestions', []),
                'feedback': data.get('feedback', 'No feedback provided'),
                'confidence': float(data.get('confidence', 0))
            }
        except Exception as e:
            print(f"❌ Failed to parse Gemini response: {text}")
            raise e

# Singleton instance
gemini_service = GeminiService()
