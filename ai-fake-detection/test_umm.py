from transformers import pipeline
from PIL import Image
import sys

def test_model():
    print("Loading umm-maybe/AI-image-detector...")
    detector = pipeline("image-classification", model="umm-maybe/AI-image-detector")
    
    img_path = sys.argv[1] if len(sys.argv) > 1 else "test_image.jpg"
        
    try:
        img = Image.open(img_path).convert("RGB")
        res = detector(img)
        print("Results:", res)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_model()
