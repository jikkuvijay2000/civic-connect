import urllib.request
import os

url = "https://images.unsplash.com/photo-1682687218147-9806132dc697?q=80&w=200&auto=format&fit=crop"
save_path = "test_image.jpg"

try:
    urllib.request.urlretrieve(url, save_path)
    print(f"Downloaded OK to {save_path}")
except Exception as e:
    print(f"Failed to download: {e}")
