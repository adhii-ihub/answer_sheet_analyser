import io
import fitz  # PyMuPDF
from PIL import Image
import requests
from django.conf import settings


class OCRService:
    def __init__(self):
        """
        Initialize the OCR service using the external ngrok OCR REST API.
        Configure OCR_API_URL and OCR_API_KEY in Django settings.
        """
        self.api_url = getattr(
            settings,
            "OCR_API_URL",
            "https://32d6-103-196-28-74.ngrok-free.app/ocr",
        )
        self.api_key = getattr(settings, "OCR_API_KEY", "coePf1")
        print(f"DEBUG: OCRService initialised -> {self.api_url}")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _image_to_bytes(self, image: Image.Image) -> bytes:
        """Convert a PIL Image to JPEG bytes."""
        buf = io.BytesIO()
        image.save(buf, format="JPEG")
        return buf.getvalue()

    def _call_ocr_api(self, image: Image.Image) -> str:
        """
        POST a PIL image to the external OCR endpoint and return the
        extracted text string.
        """
        jpeg_bytes = self._image_to_bytes(image)
        headers = {"x-api-key": self.api_key}
        files = {"file": ("image.jpg", jpeg_bytes, "image/jpeg")}

        try:
            response = requests.post(
                self.api_url,
                headers=headers,
                files=files,
                timeout=120,
            )
            response.raise_for_status()
            data = response.json()
            # Accept either {"text": "..."} or a plain string response
            if isinstance(data, dict):
                return (
                    data.get("extracted_text")
                    or data.get("text")
                    or data.get("result")
                    or str(data)
                )
            return str(data)
        except requests.exceptions.HTTPError as e:
            print(f"ERROR: OCR API HTTP error: {e} | body: {response.text}")
            return ""
        except Exception as e:
            print(f"ERROR: OCR API request failed: {e}")
            return ""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def process_file(self, file_path: str, max_pages: int = None) -> list:
        """
        Detect file type and process accordingly.
        Returns a list of dicts: [{"page": N, "text": "..."}]
        """
        lower = file_path.lower()
        if lower.endswith(".pdf"):
            return self.extract_from_pdf(file_path, max_pages=max_pages)
        elif lower.endswith((".png", ".jpg", ".jpeg")):
            return self.extract_from_image(file_path)
        else:
            raise ValueError("Unsupported file format. Please upload a PDF or image.")

    def extract_from_pdf(self, file_path: str, max_pages: int = None) -> list:
        """
        Extract text from every page of a PDF via the OCR API.
        Returns a list of dicts: [{"page": 1, "text": "..."}, ...]
        Each page is sent as a separate request.
        """
        doc = fitz.open(file_path)
        results = []

        for page_num, page in enumerate(doc):
            if max_pages and page_num >= max_pages:
                break

            print(
                f"DEBUG: Processing page {page_num + 1}/{len(doc)} with OCR API...",
                flush=True,
            )

            pix = page.get_pixmap(dpi=150)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            page_text = self._call_ocr_api(img)
            results.append({"page": page_num + 1, "text": page_text.strip()})

        return results

    def extract_from_image(self, file_path: str) -> list:
        """
        Extract text from a single image file via the OCR API.
        Returns a list with one dict: [{"page": 1, "text": "..."}]
        """
        print(f"DEBUG: Processing image {file_path} with OCR API...", flush=True)
        img = Image.open(file_path)
        if img.mode != "RGB":
            img = img.convert("RGB")
        text = self._call_ocr_api(img).strip()
        return [{"page": 1, "text": text}]
