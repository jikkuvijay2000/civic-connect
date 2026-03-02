from transformers import pipeline
import urllib.request
from PIL import Image

detector = pipeline("image-classification", model="umm-maybe/AI-image-detector")

url = "https://picsum.photos/400/300" 
urllib.request.urlretrieve(url, "picsum.jpg")

try:
    img = Image.open("picsum.jpg").convert("RGB")
    res = detector(img)
    print("IMG (Picsum):")
    for r in res:
        print(f"  {r['label']}: {r['score']:.4f}")
except Exception as e:
    print("Error:", e)
