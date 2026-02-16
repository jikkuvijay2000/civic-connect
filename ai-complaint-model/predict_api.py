from flask import Flask, request, jsonify
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
import torch
import json

app = Flask(__name__)

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

    # Rule-based priority correction
    if department == "Public Works Department":
        if "pothole" in text_lower or "broken road" in text_lower:
            priority = "High"

    if department == "Cleaning Department":
        if "not been collected" in text_lower or "five days" in text_lower or "smell" in text_lower:
            if priority == "Low":
                priority = "Medium"

    if department == "Water Department":
        if "no water" in text_lower or "irregular" in text_lower:
            if priority == "Low":
                priority = "Medium"

    return jsonify({
        "department": department,
        "priority": priority,
        "confidence": round(confidence * 100, 2)
    })


if __name__ == "__main__":
    app.run(port=5001, debug=True)
