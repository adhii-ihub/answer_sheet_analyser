import os
import time
import fitz  # PyMuPDF
import numpy as np
from PIL import Image
from paddleocr import PaddleOCR

# Initialize the OCR model, setting use_gpu=False to run on CPU
ocr = PaddleOCR(use_angle_cls=True, lang="en", enable_mkldnn=False) 

# Construct the absolute path to the image/pdf
# file_name = 'answer.png'
file_name = '713323TS001_19IT701.pdf' # Example PDF
file_path = os.path.join(os.path.dirname(__file__), 'media', 'answers', file_name)

# Check if file exists
if not os.path.exists(file_path):
    print(f"Error: File not found at {file_path}")
    exit(1)

start_time = time.time()

if file_name.lower().endswith('.pdf'):
    print(f"Processing PDF: {file_name}")
    doc = fitz.open(file_path)
    full_text = ""
    for page_num, page in enumerate(doc):
        print(f"Processing page {page_num + 1}...")
        pix = page.get_pixmap()
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        
        # If the image has an alpha channel, remove it
        if pix.n == 4:
            img = np.ascontiguousarray(img[..., :3])
            
        result = ocr.ocr(img)
        if result[0]:
            for line in result[0]:
                full_text += line[1][0] + " "
        full_text += "\n"
    print("\nExtracted Text:\n")
    print(full_text)
else:
    print(f"Processing Image: {file_name}")
    result = ocr.ocr(file_path)
    if result[0]:
        for line in result[0]:
            print(line[1][0])

end_time = time.time()
print(f"Time taken: {end_time - start_time:.2f} seconds")