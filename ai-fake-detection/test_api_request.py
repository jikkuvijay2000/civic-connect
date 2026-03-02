import requests
import json

def test_api():
    url = "http://127.0.0.1:5004/detect_fake_image"
    with open("test_fake.jpg", "rb") as f:
        files = {"image": ("test_fake.jpg", f, "image/jpeg")}
        response = requests.post(url, files=files)
        with open("api_response.txt", "w") as out:
             out.write("test_fake.jpg response:\n" + json.dumps(response.json(), indent=2) + "\n")

    with open("test_image.jpg", "rb") as f:
        files = {"image": ("test_image.jpg", f, "image/jpeg")}
        response = requests.post(url, files=files)
        with open("api_response.txt", "a") as out:
             out.write("test_image.jpg response:\n" + json.dumps(response.json(), indent=2) + "\n")

if __name__ == "__main__":
    test_api()
