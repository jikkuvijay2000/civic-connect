from transformers import pipeline
import torch
import sys
from PIL import Image

def test_models(img_path):
    device = 0 if torch.cuda.is_available() else -1
    models = [
        "prithivMLmods/Deep-Fake-Detector-Model"
    ]
    
    img = Image.open(img_path).convert("RGB")
    out_file = f"results_prithiv_{img_path.replace('.jpg', '')}.txt"
    with open(out_file, "w") as f:
        f.write(f"--- Evaluating {img_path} ---\n")

        for model_name in models:
            try:
                print(f"Loading {model_name}...")
                detector = pipeline("image-classification", model=model_name, device=device)
                res = detector(img)
                f.write(f"\nResults for {model_name}:\n")
                for r in res:
                    f.write(f"  {r['label']}: {r['score']:.4f}\n")
                f.flush()
            except Exception as e:
                f.write(f"Error loading/running {model_name}: {e}\n")

if __name__ == "__main__":
    test_models(sys.argv[1] if len(sys.argv) > 1 else "test_image.jpg")
