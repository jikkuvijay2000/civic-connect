import urllib.request
from transformers import pipeline
from PIL import Image

print("Loading umm-maybe/AI-image-detector...")
detector = pipeline("image-classification", model="umm-maybe/AI-image-detector")

urls = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Garbage_on_the_street_in_India.jpg/500px-Garbage_on_the_street_in_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Cow_in_street.jpg/500px-Cow_in_street.jpg",
    "https://images.unsplash.com/photo-1682687218147-9806132dc697?q=80&w=200&auto=format&fit=crop"
]

for i, url in enumerate(urls):
    path = f"test_img_{i}.jpg"
    try:
        urllib.request.urlretrieve(url, path)
        img = Image.open(path).convert("RGB")
        res = detector(img)
        print(f"Image {i} results:", res)
    except Exception as e:
        print(f"Error {i}:", e)
