import cv2
import os
import torch
from flask import Flask, request, jsonify
from transformers import BlipProcessor, BlipForConditionalGeneration, pipeline
from PIL import Image

app = Flask(__name__)

# Determine device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load model (using large model for better accuracy)
# We can share the cache or just download separately if needed.
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large").to(device)



@app.route("/analyze_video", methods=["POST"])
def analyze_video():
    video_path = None
    try:
        if "video" not in request.files:
            return jsonify({"error": "No video uploaded"}), 400

        video_file = request.files["video"]
        
        # Save temporary file
        video_path = "temp_video.mp4"
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

        # Initial clean up of video file
        if os.path.exists(video_path):
             os.remove(video_path)
             video_path = None # Reset so finally block doesn't try to delete again

        # Convert frame (BGR) to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(rgb_frame)

        # Generate caption
        text = "a photograph of"
        inputs = processor(images=image, text=text, return_tensors="pt").to(device)

        outputs = model.generate(
            **inputs,
            max_new_tokens=80,
            min_new_tokens=20,
            num_beams=3,
            repetition_penalty=1.2,
            early_stopping=True
        )

        caption = processor.decode(outputs[0], skip_special_tokens=True)
        
        # Post-process
        clean_caption = caption.lower().replace("a photograph of ", "").replace("an image of ", "").replace("a photo of ", "")

        description = f"Video analysis shows: {clean_caption}. Please investigate."

        return jsonify({
            "description": description,
            "raw_caption": clean_caption
        })

    except Exception as e:
        print(f"Error: {e}")
        # Clean up if error occurred before cleanup
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5003, debug=True)
