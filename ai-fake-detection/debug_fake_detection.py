from transformers import pipeline
from PIL import Image
import torch
import sys

# Load model
device = 0 if torch.cuda.is_available() else -1
print(f"Loading model on device {device}...")
fake_detector = pipeline("image-classification", model="umm-maybe/AI-image-detector", device=device)

def analyze_image(image_path):
    try:
        print(f"Analyzing: {image_path}")
        image = Image.open(image_path).convert("RGB")
        results = fake_detector(image)
        print("Raw Results:")
        for res in results:
            print(f"  Label: {res['label']}, Score: {res['score']:.4f}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        analyze_image(sys.argv[1])
    else:
        print("Usage: python debug_fake_detection.py <image_path>")
