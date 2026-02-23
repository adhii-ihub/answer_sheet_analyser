import re

class SegmentationService:
    def segment_answer(self, text):
        """
        Splits the answer text into question-answer pairs using regex.
        Returns a list of dictionaries: [{"question_no": "Q1", "answer": "..."}]
        """
        # Improved regex to handle various question formats like Q1, 1., Question 1
        # Captures the question identifier and the following text
        pattern = re.compile(r'(Q\d+|Question\s*\d+|\d+\.)', re.IGNORECASE)
        
        segments = []
        matches = list(pattern.finditer(text))
        
        if not matches:
            # If no clear segmentation found, return as single block or potentially call AI here
            return [{"question_no": "General", "answer": text}]

        for i in range(len(matches)):
            current_match = matches[i]
            q_no = current_match.group(1).strip()
            start = current_match.end()
            
            if i + 1 < len(matches):
                end = matches[i+1].start()
                answer_text = text[start:end].strip()
            else:
                answer_text = text[start:].strip()
                
            segments.append({
                "question_no": q_no,
                "answer": answer_text
            })
            
        return segments
