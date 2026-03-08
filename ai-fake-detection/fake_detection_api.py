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

        # Save temporary file with unique name to avoid race conditions
        video_path = f"temp_video_fake_{os.getpid()}.mp4"
        video_file.save(video_path)

        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return jsonify({"error": "Could not open video"}), 400

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        print(f"DEBUG Video: total_frames={total_frames}, fps={fps}")

        # --- Multi-frame sampling ---
        # Sample 8 frames at evenly spaced positions (10%, 20%, ... 90% of the video)
        NUM_SAMPLES = 8
        sample_positions = [int(total_frames * i / (NUM_SAMPLES + 1)) for i in range(1, NUM_SAMPLES + 1)]

        sampled_frames = []
        for pos in sample_positions:
            cap.set(cv2.CAP_PROP_POS_FRAMES, pos)
            ret, frame = cap.read()
            if ret and frame is not None:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                sampled_frames.append(Image.fromarray(rgb_frame))

        cap.release()

        # Clean up temp file
        if os.path.exists(video_path):
            os.remove(video_path)

        if not sampled_frames:
            return jsonify({"error": "Could not extract any frames from video"}), 500

        print(f"DEBUG Successfully sampled {len(sampled_frames)} frames")

        # --- Per-frame analysis ---
        blur_count = 0
        blur_variances = []
        fake_count = 0
        fake_confidences = []
        frame_details = []

        for i, img in enumerate(sampled_frames):
            frame_result = {"frame_index": i + 1}

            # 1. Blur check
            blurry, variance = is_blurry(img)
            frame_result["blur_variance"] = round(variance, 2)
            frame_result["is_blurry"] = blurry
            blur_variances.append(variance)

            if blurry:
                blur_count += 1
                frame_result["ai_result"] = "skipped (blurry)"
                frame_details.append(frame_result)
                continue

            # 2. AI / fake detection on this frame
            results = fake_detector(img)
            print(f"DEBUG Frame {i + 1} Results: {results}")

            frame_is_fake = False
            frame_confidence = 0.0
            for result in results:
                if result['label'].lower() in ['artificial', 'fake', 'ai'] and result['score'] > 0.75:
                    frame_is_fake = True
                    frame_confidence = result['score']
                    break

            frame_result["is_fake"] = frame_is_fake
            frame_result["confidence"] = round(frame_confidence, 4)
            frame_result["ai_result"] = results

            if frame_is_fake:
                fake_count += 1
                fake_confidences.append(frame_confidence)

            frame_details.append(frame_result)

        # --- Ensemble decision via majority voting ---
        total_analyzed = len(sampled_frames)
        valid_frames = total_analyzed - blur_count  # frames that passed blur check

        # Majority blur: if > 50% of all frames are blurry → reject as blurry
        if blur_count > total_analyzed / 2:
            avg_variance = round(sum(blur_variances) / len(blur_variances), 2)
            return jsonify({
                "is_fake": True,
                "error_type": "blur",
                "message": f"Video is too blurry or low clarity. Most frames failed clarity check (avg score: {avg_variance}). Please upload a clear video.",
                "confidence": 1.0,
                "details": {
                    "frames_analyzed": total_analyzed,
                    "blur_frames": blur_count,
                    "fake_frames": fake_count,
                    "avg_blur_variance": avg_variance,
                    "frame_breakdown": frame_details
                }
            })

        # Majority fake: if > 50% of valid (non-blurry) frames are classified as fake → video is fake
        is_fake = False
        avg_confidence = 0.0
        if valid_frames > 0 and fake_count > valid_frames / 2:
            is_fake = True
            avg_confidence = round(sum(fake_confidences) / len(fake_confidences), 4) if fake_confidences else 0.0

        print(f"DEBUG Verdict: is_fake={is_fake}, fake_count={fake_count}/{valid_frames} valid frames, avg_confidence={avg_confidence}")

        return jsonify({
            "is_fake": is_fake,
            "error_type": "ai" if is_fake else None,
            "message": "AI-generated video content detected. Please upload real evidence." if is_fake else "Real video",
            "confidence": round(avg_confidence * 100, 2),
            "details": {
                "frames_analyzed": total_analyzed,
                "valid_frames": valid_frames,
                "blur_frames": blur_count,
                "fake_frames": fake_count,
                "avg_confidence": avg_confidence,
                "frame_breakdown": frame_details
            }
        })

    except Exception as e:
        print(f"Error: {e}")
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5004, debug=True)
