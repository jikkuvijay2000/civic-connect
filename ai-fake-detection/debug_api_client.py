import requests
import sys

def analyze_image(image_path):
    url = "http://localhost:5004/detect_fake_image"
    try:
        print(f"Sending {image_path} to {url}...")
        with open(image_path, "rb") as f:
            files = {"image": f}
            response = requests.post(url, files=files)
        
        print("Status Code:", response.status_code)
        print("Response:", response.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        analyze_image(sys.argv[1])
    else:
        print("Usage: python debug_api_client.py <image_path>")
