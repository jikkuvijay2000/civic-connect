import cv2
import os
import torch
from flask import Flask, request, jsonify
from transformers import pipeline
from PIL import Image

app = Flask(__name__)

# Determine device
device = 0 if torch.cuda.is_available() else -1
print(f"Using device: {device}")

# Load fake detection model
fake_detector = pipeline("image-classification", model="umm-maybe/AI-image-detector", device=device)

@app.route("/detect_fake_image", methods=["POST"])
def detect_fake_image():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files["image"]
        image = Image.open(image_file).convert("RGB")

        # Detect fake
        results = fake_detector(image)
        
        is_fake = False
        confidence = 0.0
        
        for result in results:
            if result['label'] in ['artificial', 'fake'] and result['score'] > 0.7:
                is_fake = True
                confidence = result['score']
                break

        return jsonify({
            "is_fake": is_fake,
            "confidence": confidence,
            "details": results
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/detect_fake_video", methods=["POST"])
def detect_fake_video():
    video_path = None
    try:
        if "video" not in request.files:
            return jsonify({"error": "No video uploaded"}), 400

        video_file = request.files["video"]
        
        # Save temporary file
        video_path = "temp_video_fake.mp4"
        video_file.save(video_path)

        # process video using opencv
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
             return jsonify({"error": "Could not open video"}), 400

        # Get total frames
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Grab a frame from the middle
        middle_frame_index = total_frames // 2
        cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame_index)
        
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return jsonify({"error": "Could not read frame from video"}), 500

        # Clean up
        if os.path.exists(video_path):
             os.remove(video_path)

        # Convert frame (BGR) to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(rgb_frame)

        # Detect fake
        results = fake_detector(image)
        
        is_fake = False
        confidence = 0.0
        
        for result in results:
            if result['label'] in ['artificial', 'fake'] and result['score'] > 0.7:
                is_fake = True
                confidence = result['score']
                break

        return jsonify({
            "is_fake": is_fake,
            "confidence": confidence,
            "details": results
        })

    except Exception as e:
        print(f"Error: {e}")
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5004, debug=True)
