from flask import Flask, request, jsonify
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
import torch
import json

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200

# Load model
model = DistilBertForSequenceClassification.from_pretrained("model")
tokenizer = DistilBertTokenizerFast.from_pretrained("model")

with open("model/label_mapping.json") as f:
    label_mapping = json.load(f)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    text = data.get("text", "")

    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    outputs = model(**inputs)

    probs = torch.nn.functional.softmax(outputs.logits, dim=1)
    confidence = torch.max(probs, dim=1).values.item()
    pred = torch.argmax(outputs.logits, dim=1).item()
    label = label_mapping[str(pred)]

    department, priority = label.split(" | ")
    department = department.title()

    text_lower = text.lower()

    # Rename Roads to Public Works as requested
    if department == "Roads Department":
        department = "Public Works Department"

    # Strict non-overlapping severity bands per priority level:
    #   Low       →  1 – 25
    #   Medium    → 26 – 50
    #   High      → 51 – 80
    #   Emergency → 81 – 100
    # Confidence (0–1) slides the score within the band,
    # so a Medium score can NEVER exceed a High score.
    bands = {
        "Low":       (1,  25),
        "Medium":    (26, 50),
        "High":      (51, 80),
        "Emergency": (81, 100),
    }
    band_min, band_max = bands.get(priority, (26, 50))
    severity_score = int(band_min + confidence * (band_max - band_min))

    return jsonify({
        "department": department,
        "priority": priority,
        "confidence": round(confidence * 100, 2),
        "severity_score": severity_score
    })


if __name__ == "__main__":
    app.run(port=5001, debug=True)
