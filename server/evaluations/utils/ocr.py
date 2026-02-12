"""
OCR and text extraction utilities.
Supports PDF and image formats.
"""
import os
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
from PyPDF2 import PdfReader
from django.conf import settings


def extract_text_from_pdf(pdf_path):
    """
    Extract text from PDF file.
    First tries PyPDF2, falls back to OCR if needed.
    """
    try:
        # Try text extraction first
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        # If text is empty or too short, use OCR
        if len(text.strip()) < 50:
            return extract_text_from_pdf_ocr(pdf_path)
        
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return extract_text_from_pdf_ocr(pdf_path)


def extract_text_from_pdf_ocr(pdf_path):
    """
    Extract text from PDF using OCR.
    Converts PDF pages to images and applies OCR.
    """
    try:
        # Convert PDF to images
        images = convert_from_path(pdf_path)
        
        text = ""
        for i, image in enumerate(images):
            # Apply OCR to each page
            page_text = pytesseract.image_to_string(image)
            text += f"\n--- Page {i+1} ---\n{page_text}\n"
        
        return text.strip()
    except Exception as e:
        print(f"Error in PDF OCR: {e}")
        return ""


def extract_text_from_image(image_path):
    """
    Extract text from image file using OCR.
    """
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from image: {e}")
        return ""


def extract_text_from_file(file_path):
    """
    Main function to extract text from any supported file format.
    Automatically detects file type and uses appropriate extraction method.
    """
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.png', '.jpg', '.jpeg']:
        return extract_text_from_image(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")


def validate_file_upload(file):
    """
    Validate uploaded file.
    Checks file size and extension.
    """
    # Check file size
    if file.size > settings.MAX_UPLOAD_SIZE:
        raise ValueError(
            f"File size exceeds maximum allowed size of "
            f"{settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
        )
    
    # Check file extension
    ext = os.path.splitext(file.name)[1].lower().replace('.', '')
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise ValueError(
            f"File type '{ext}' not allowed. "
            f"Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    return True
