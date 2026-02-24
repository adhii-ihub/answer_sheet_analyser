"""
core/pdf_utils.py

Utilities for processing uploaded PDFs.
"""

import os
import pymupdf  # fits
from typing import List

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract raw text from a PDF file.
    
    Args:
        pdf_path: Absolute path to the PDF file.
        
    Returns:
        All extracted text joined by newlines.
    """
    try:
        doc = pymupdf.open(pdf_path)
        text = "\n".join([page.get_text("text") for page in doc])
        doc.close()
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"Failed to read PDF text from {pdf_path}: {e}")

def convert_pdf_to_images(pdf_path: str, output_dir: str) -> List[str]:
    """Render a PDF into JPEG images, one per page.
    
    Args:
        pdf_path: Absolute path to the PDF file.
        output_dir: Directory where the images will be saved.
        
    Returns:
        List of absolute paths to the generated JPEG images.
    """
    try:
        doc = pymupdf.open(pdf_path)
        image_paths = []
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        
        # 150 DPI is usually good enough for OCR of handwritten text
        zoom = 150 / 72 
        mat = pymupdf.Matrix(zoom, zoom)
        
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=mat)
            img_path = os.path.join(output_dir, f"{base_name}_page_{i+1}.jpg")
            pix.save(img_path)
            image_paths.append(img_path)
            
        doc.close()
        return image_paths
    except Exception as e:
        raise RuntimeError(f"Failed to convert PDF to images: {e}")
