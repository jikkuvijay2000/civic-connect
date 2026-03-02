from transformers import pipeline
import torch
from PIL import Image
import sys

def test_model():
    device = 0 if torch.cuda.is_available() else -1
    print("Loading model dima806/deepfake_vs_real_image_detection...")
    detector = pipeline("image-classification", model="dima806/deepfake_vs_real_image_detection", device=device)
    
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
    else:
        img_path = "test_fake.jpg"
        
    try:
        img = Image.open(img_path).convert("RGB")
        res = detector(img)
        print("Results:", res)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_model()
