"""Quick test to check PaddleOCR-VL v1.5 initialization."""
import traceback
import sys

# Redirect to file to avoid terminal garbling from progress bars
with open("paddle_vl_result.txt", "w", encoding="utf-8") as f:
    sys.stdout = f
    sys.stderr = f
    try:
        from paddleocr import PaddleOCRVL
        print("Import OK", flush=True)
        pipeline = PaddleOCRVL(pipeline_version="v1.5")
        print("Pipeline created successfully!", flush=True)
        
        # Quick test on the answer image
        output = pipeline.predict("answer.png")
        for res in output:
            res.print()
        print("DONE", flush=True)
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}", flush=True)
        traceback.print_exc(file=f)
