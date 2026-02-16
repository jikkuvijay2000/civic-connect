import requests
import json

url = "http://localhost:5001/predict"
data = {"text": "There is a huge pothole on the main road causing traffic"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=data, headers=headers)
    print("Status Code:", response.status_code)
    try:
        json_resp = response.json()
        print("Keys:", list(json_resp.keys()))
        print("Confidence:", json_resp.get("confidence"))
    except Exception as e:
        print("JSON Error:", e)
        print("Raw:", response.text)
except Exception as e:
    print("Error:", e)
