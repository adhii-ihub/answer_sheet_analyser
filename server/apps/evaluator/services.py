import requests
import json
import re
from django.conf import settings

class AIEvaluationService:
    def __init__(self, model="qwen2.5:1.5b", api_url="http://localhost:11434/api/generate"):
        self.model = model
        self.api_url = api_url

    def _normalize_structured_segments(self, structured_data):
        if structured_data is None:
            return None
 
        if isinstance(structured_data, str):
            try:
                structured_data = json.loads(structured_data)
            except json.JSONDecodeError:
                return None
 
        if isinstance(structured_data, dict):
            for key in ("segments", "result", "data", "answers", "items"):
                if key in structured_data:
                    structured_data = structured_data[key]
                    break
 
        if not isinstance(structured_data, list):
            return None
 
        normalized = []
        for item in structured_data:
            if not isinstance(item, dict):
                continue
 
            q_no = item.get("question_no")
            answer = item.get("answer")
            if not q_no or not isinstance(q_no, str):
                continue
            if answer is None:
                answer = ""
            if not isinstance(answer, str):
                answer = str(answer)
 
            normalized.append({"question_no": q_no.strip(), "answer": answer.strip()})
 
        return normalized

    def clean_and_structure_ocr(self, ocr_text):
        """
        Uses LLM to clean OCR errors and structure the text into question-answer pairs.
        """
        prompt = f"""
You are an AI assistant specialized in correcting OCR output from handwritten exam papers and structuring it into JSON.

TASK:
1) Fix OCR errors from handwritten text (spelling, broken words, spacing).
2) Detect question numbers (Q1, Q2, Question 3, etc.).
3) Group the student answers under each question.
4) Return the result in the specified JSON format ONLY.

RULES:
- Fix spelling mistakes caused by OCR errors.
- Correct broken words and spacing issues.
- Keep the original meaning EXACTLY the same.
- Do NOT add new content or summarize.
- Do NOT change technical terms.
- Preserve question numbers.
- Respond ONLY with valid JSON.

OUTPUT JSON FORMAT:
[
  {{
    "question_no": "Q1",
    "answer": "corrected answer text"
  }}
]

OCR TEXT:
\"\"\"
{ocr_text}
\"\"\"
"""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        
        try:
            print(f"DEBUG: Calling Ollama for OCR cleaning/structuring...")
            response = requests.post(self.api_url, json=payload)
            response.raise_for_status()
            
            result = response.json()
            ai_response_text = result.get("response", "[]")
            
            try:
                structured_data = json.loads(ai_response_text)
                normalized = self._normalize_structured_segments(structured_data)
                return normalized
            except json.JSONDecodeError:
                print(f"ERROR: AI returned malformed JSON for structuring. Raw: {ai_response_text}")
                return []
        except Exception as e:
            print(f"ERROR: Communication with AI failed during cleaning: {e}")
            return []

    def evaluate(self, question_text, answer_text, rubric_text, max_marks):
        """
        Evaluates the answer using the local LLM.
        Returns a dictionary with marks_awarded, feedback, and reason.
        """
        prompt = self._construct_prompt(question_text, answer_text, rubric_text, max_marks)
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        
        try:
            print(f"DEBUG: Calling Ollama with prompt length: {len(prompt)}")
            response = requests.post(self.api_url, json=payload)
            response.raise_for_status()
            
            result = response.json()
            # extract the actual response text
            ai_response_text = result.get("response", "{}")
            print(f"DEBUG: Ollama Response raw:\n{ai_response_text[:200]}...") # Print first 200 chars
            
            # Parse JSON from the response text
            try:
                evaluation = json.loads(ai_response_text)
                return evaluation
            except json.JSONDecodeError:
                # Fallback if JSON is malformed
                return {
                    "marks_awarded": 0,
                    "feedback": "AI returned malformed JSON.",
                    "reason": f"Raw output: {ai_response_text}"
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "marks_awarded": 0,
                "feedback": "Error communicating with AI service.",
                "reason": str(e)
            }

    def _construct_prompt(self, question, answer, rubric, max_marks):
        return f"""
You are a strict academic examiner. Evaluate the student's answer based on the provided question and rubric.

Question: {question}
Max Marks: {max_marks}
Rubric: {rubric if rubric else "No specific rubric provided. Evaluate based on relevance and correctness."}

Student Answer:
{answer}

Instructions:
1. Evaluate objectively.
2. Award marks up to {max_marks}.
3. Provide constructive feedback.
4. Output specific JSON format ONLY.

JSON Format:
{{
    "marks_awarded": <float>,
    "reason": "<short explanation>",
    "feedback": "<detailed feedback for student>"
}}
"""
