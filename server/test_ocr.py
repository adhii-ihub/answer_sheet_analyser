"""
Quick standalone test for the ngrok OCR endpoint.
Run from the `server/` directory:

    # Test with a dummy generated image (no file needed):
    python test_ocr.py

    # Test one image or PDF:
    python test_ocr.py path/to/image.jpg

    # Test multiple files separately (each result shown individually):
    python test_ocr.py page1.jpg page2.jpg page3.jpg
    python test_ocr.py answersheet.pdf
"""
import sys
import io
import requests
from PIL import Image

OCR_URL = "https://32d6-103-196-28-74.ngrok-free.app/ocr"
API_KEY  = "coePf1"

SEP = "=" * 60


# ── helpers ───────────────────────────────────────────────────────────

def make_dummy_image() -> bytes:
    img = Image.new("RGB", (400, 100), color=(255, 255, 255))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.text((10, 35), "TEST 123 - OCR Check", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def pil_to_jpeg_bytes(img: Image.Image) -> bytes:
    if img.mode != "RGB":
        img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def call_ocr_api(jpeg_bytes: bytes, label: str) -> str:
    """Send one image to the OCR endpoint and return extracted text."""
    headers = {"x-api-key": API_KEY}
    files   = {"file": ("image.jpg", jpeg_bytes, "image/jpeg")}
    resp = requests.post(OCR_URL, headers=headers, files=files, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, dict):
        return data.get("text") or data.get("result") or str(data)
    return str(data)


# ── per-file processors ────────────────────────────────────────────────

def process_image(path: str):
    print(f"\n{SEP}")
    print(f"FILE : {path}")
    print(SEP)
    with open(path, "rb") as f:
        raw = f.read()
    img = Image.open(io.BytesIO(raw))
    text = call_ocr_api(pil_to_jpeg_bytes(img), label=path)
    print(f"[Page 1]\n{text}\n")


def process_pdf(path: str):
    import fitz  # PyMuPDF — only needed for PDFs
    print(f"\n{SEP}")
    print(f"FILE : {path}")
    doc = fitz.open(path)
    print(f"PAGES: {len(doc)}")
    print(SEP)
    for page_num, page in enumerate(doc):
        label = f"Page {page_num + 1}/{len(doc)}"
        print(f"\n--- Sending {label} to OCR API ---")
        pix = page.get_pixmap(dpi=150)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        text = call_ocr_api(pil_to_jpeg_bytes(img), label=label)
        print(f"[{label}]\n{text}\n")


# ── main ───────────────────────────────────────────────────────────────

def main():
    files = sys.argv[1:]

    if not files:
        print("No file supplied — using synthetic dummy image.")
        print(SEP)
        text = call_ocr_api(make_dummy_image(), label="dummy")
        print(f"[Page 1]\n{text}\n")
        return

    for path in files:
        lower = path.lower()
        if lower.endswith(".pdf"):
            process_pdf(path)
        elif lower.endswith((".jpg", ".jpeg", ".png")):
            process_image(path)
        else:
            print(f"Skipping unsupported file: {path}")


if __name__ == "__main__":
    main()
