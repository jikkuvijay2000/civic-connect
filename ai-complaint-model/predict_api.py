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

    # Rename Roads to Public Works as requested
    if department == "Roads Department":
        department = "Public Works Department"

    # Calculate a distinct Severity Score
    # Base severity ranges: Low (10-40), Medium (41-70), High (71-90), Emergency (91-100)
    base_score = 50
    if priority == "Low":
        base_score = 25
    elif priority == "Medium":
        base_score = 55
    elif priority == "High":
        base_score = 80
    elif priority == "Emergency":
        base_score = 95
        
    # Gently adjust severity using the confidence so it varies a bit
    # If it's highly confident it's an emergency, it stays near 95. 
    # If it's weakly confident it's an emergency, maybe it drops slightly.
    severity_score = base_score * (0.8 + (confidence * 0.2))
    
    # Cap between 1 and 100
    severity_score = max(1, min(100, int(severity_score)))

    return jsonify({
        "department": department,
        "priority": priority,
        "confidence": round(confidence * 100, 2),
        "severity_score": severity_score
    })


if __name__ == "__main__":
    app.run(port=5001, debug=True)
