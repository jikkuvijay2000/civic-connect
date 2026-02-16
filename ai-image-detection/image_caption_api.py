from flask import Flask, request, jsonify
from transformers import BlipProcessor, BlipForConditionalGeneration, pipeline
from PIL import Image
import torch
import random

app = Flask(__name__)

# Determine device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load model once at startup (using large model for better accuracy)
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large").to(device)





@app.route("/caption", methods=["POST"])
def caption():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files["image"]
        image = Image.open(image_file).convert("RGB")

        # Conditional generation with a prompt
        text = "a photograph of"
        inputs = processor(images=image, text=text, return_tensors="pt").to(device)

        # Generate caption
        outputs = model.generate(
            **inputs,
            max_new_tokens=80,       
            min_new_tokens=20,       
            num_beams=3,
            repetition_penalty=1.2,  
            early_stopping=True
        )

        caption = processor.decode(outputs[0], skip_special_tokens=True)
        
        # Post-process: Clean the caption
        clean_caption = caption.lower().replace("a photograph of ", "").replace("an image of ", "").replace("a photo of ", "")
        
        # Dynamic Complaint Templates for Variety
        templates = [
            f"I would like to report {clean_caption} in this area. This issue is causing inconvenience to the public. Please take necessary action.",
            f"I noticed {clean_caption} here. It looks like a hazard and needs immediate attention from the authorities.",
            f"Reporting a case of {clean_caption}. This has been persistent for a while and requires a fix.",
            f"There is {clean_caption} at this location. It is disrupting the neighborhood. Please investigate.",
            f"Urgent attention required for {clean_caption}. Residents are facing difficulties due to this.",
             f"I am writing to bring to your attention {clean_caption}. Please resolve this matter as soon as possible."
        ]
        
        # Select a random template
        complaint_text = random.choice(templates)

        return jsonify({
            "description": complaint_text
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5002, debug=True)
