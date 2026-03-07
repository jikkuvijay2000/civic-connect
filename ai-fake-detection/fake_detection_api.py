import cv2
import os
import torch
import numpy as np
from flask import Flask, request, jsonify
from transformers import pipeline
from PIL import Image

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200

# Determine device
device = 0 if torch.cuda.is_available() else -1
print(f"Using device: {device}")

# Load general AI image detection model (covers Midjourney/DALL-E etc.)
print("Loading model umm-maybe/AI-image-detector...")
fake_detector = pipeline("image-classification", model="umm-maybe/AI-image-detector", device=device)

def is_blurry(image_pil, threshold=50.0):
    # Convert PIL Image to cv2 format (numpy array)
    image_cv = np.array(image_pil)
    # Convert RGB to BGR
    image_cv = image_cv[:, :, ::-1].copy()
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance < threshold, variance

@app.route("/detect_fake_image", methods=["POST"])
def detect_fake_image():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files["image"]
        image = Image.open(image_file).convert("RGB")

        # 1. Check for Blur/Low Clarity first
        blurry, variance = is_blurry(image)
        if blurry:
            return jsonify({
                "is_fake": True,
                "error_type": "blur",
                "message": f"Image is too blurry or has low clarity (score: {variance:.1f}). Please capture a clear photo.",
                "confidence": 1.0,
                "details": {"variance": variance}
            })

        # 2. Detect Deepfake/AI
        results = fake_detector(image)
        print(f"DEBUG Image Results: {results}")
        
        is_fake = False
        confidence = 0.0
        
        for result in results:
            # umm-maybe model returns 'artificial', 'fake', etc.
            if result['label'].lower() in ['artificial', 'fake', 'ai'] and result['score'] > 0.75:
                is_fake = True
                confidence = result['score']
                break

        return jsonify({
            "is_fake": is_fake,
            "error_type": "ai" if is_fake else None,
            "message": "AI-generated or heavily manipulated content detected. Please upload real evidence." if is_fake else "Real image",
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

        # 1. Check for Blur/Low Clarity first
        blurry, variance = is_blurry(image)
        if blurry:
            return jsonify({
                "is_fake": True,
                "error_type": "blur",
                "message": f"Video frame is too blurry or low clarity (score: {variance:.1f}). Please upload clear video.",
                "confidence": 1.0,
                "details": {"variance": variance}
            })

        # 2. Detect Deepfake/AI
        results = fake_detector(image)
        print(f"DEBUG Video Results: {results}")
        
        is_fake = False
        confidence = 0.0
        
        for result in results:
            if result['label'].lower() in ['artificial', 'fake', 'ai'] and result['score'] > 0.75:
                is_fake = True
                confidence = result['score']
                break

        return jsonify({
            "is_fake": is_fake,
            "error_type": "ai" if is_fake else None,
            "message": "AI-generated video content detected. Please upload real evidence." if is_fake else "Real video",
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
