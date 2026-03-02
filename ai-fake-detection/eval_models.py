from transformers import pipeline
import torch
from PIL import Image

def evaluate():
    device = 0 if torch.cuda.is_available() else -1
    
    umm = pipeline("image-classification", model="umm-maybe/AI-image-detector", device=device)
    dima = pipeline("image-classification", model="dima806/deepfake_vs_real_image_detection", device=device)
    
    images = ["test_fake.jpg", "test_image.jpg", "picsum.jpg"]
    
    with open("eval_results_clean.txt", "w") as f:
        for img_path in images:
            f.write(f"\n--- Evaluating {img_path} ---\n")
            try:
                img = Image.open(img_path).convert("RGB")
                
                res_umm = umm(img)
                f.write("UMM-MAYBE model:\n")
                for r in res_umm:
                    f.write(f"  {r['label']}: {r['score']:.4f}\n")
                    
                res_dima = dima(img)
                f.write("DIMA806 model:\n")
                for r in res_dima:
                     f.write(f"  {r['label']}: {r['score']:.4f}\n")
                     
            except Exception as e:
                f.write(f"Error evaluating {img_path}: {e}\n")

if __name__ == "__main__":
    evaluate()
