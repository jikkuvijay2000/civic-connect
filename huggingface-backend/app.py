import os
import cv2
import torch
import numpy as np
import json
import re
import subprocess
import imageio_ffmpeg
from flask import Flask, request, jsonify
from transformers import pipeline, BlipProcessor, BlipForConditionalGeneration, DistilBertTokenizerFast, DistilBertForSequenceClassification
from PIL import Image

app = Flask(__name__)

# Determine device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# ----------------- MODEL LOADING -----------------

print("Loading BLIP Model for Captioning and Video Analysis...")
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large").to(device)

print("Loading Fake Detector Model...")
fake_detector = pipeline("image-classification", model="umm-maybe/AI-image-detector", device=0 if device=="cuda" else -1)

print("Loading Complaint Classifier Model...")
try:
    predict_model = DistilBertForSequenceClassification.from_pretrained("model")
    predict_tokenizer = DistilBertTokenizerFast.from_pretrained("model")
    with open("model/label_mapping.json") as f:
        label_mapping = json.load(f)
except Exception as e:
    print(f"FAILED TO LOAD PREDICT MODEL. Did you forget to upload the 'model' folder? {e}")

# ----------------- HELPER FUNCTIONS -----------------

def convert_to_mp4(input_path, output_path):
    """Converts any video format to a standard MP4 for reliable OpenCV processing."""
    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        command = [
            ffmpeg_exe,
            "-y",               # Overwrite output
            "-i", input_path,   # Input file
            "-c:v", "libx264",  # Use H.264 codec
            "-preset", "ultrafast", # Fastest encoding
            "-crf", "28",       # Decent quality
            "-an",              # Remove audio (not needed for analysis)
            output_path
        ]
        subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except Exception as e:
        print(f"Video conversion failed: {e}")
        return False

def is_blurry(image_pil, threshold=30.0):
    image_cv = np.array(image_pil)
    image_cv = image_cv[:, :, ::-1].copy()
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance < threshold, variance

def generate_blip_caption(image, prompt_text, max_new_tokens=120, min_new_tokens=10):
    inputs = blip_processor(images=image, text=prompt_text, return_tensors="pt").to(device)
    beams = 5 if device == "cuda" else 1
    outputs = blip_model.generate(
        **inputs, max_new_tokens=max_new_tokens, min_new_tokens=min_new_tokens,
        num_beams=beams, repetition_penalty=1.3, length_penalty=1.2, early_stopping=True,
    )
    return blip_processor.decode(outputs[0], skip_special_tokens=True)

def clean_caption(raw: str, prompt: str) -> str:
    cleaned = raw.strip()
    prompt_lower = prompt.lower()
    cleaned_lower = cleaned.lower()
    if cleaned_lower.startswith(prompt_lower):
        cleaned = cleaned[len(prompt):].strip()
    cleaned = re.sub(r"^[\s,\-:]+", "", cleaned).strip()
    return cleaned

def detect_issue_domain(caption: str) -> str:
    caption = caption.lower()
    # PREVENT HALLUCINATION TRIGGER: Remove 'fire hydrant' before checking for 'fire'
    safe_caption = caption.replace("fire hydrant", "damaged area")
    
    # Expanded keywords for better visual accuracy
    if any(k in safe_caption for k in ["pothole", "crack", "road", "tarmac", "asphalt", "pavement", "sidewalk", "footpath", "manhole", "street", "highway"]):
        return "road"
    if any(k in safe_caption for k in ["garbage", "trash", "waste", "litter", "dump", "rubbish", "debris", "sewage", "bin", "container", "overflowing"]):
        return "waste"
    if any(k in safe_caption for k in ["flood", "water", "drain", "puddle", "waterlog", "overflow", "leak", "pipe", "burst", "stream", "canal"]):
        return "water"
    if any(k in safe_caption for k in ["fire", "smoke", "flame", "burn", "blaze", "ash", "explosion", "scorch"]):
        return "fire"
    if any(k in safe_caption for k in ["streetlight", "lamp post", "wire", "cable", "transformer", "electric", "power line", "pole", "blackout"]):
        return "electricity"
    if any(k in safe_caption for k in ["tree", "branch", "fallen", "park", "vegetation", "overgrown", "grass", "bush", "garden", "foliage"]):
        return "greenery"
    if any(k in safe_caption for k in ["building", "wall", "structure", "construction", "collapse", "bridge", "tunnel", "scaffolding"]):
        return "infrastructure"
    return "general"

def extract_all_details(image) -> dict:
    # Use more specific, restrictive prompts to reduce hallucinations
    prompts = {
        "scene": "the specific civic problem or infrastructure damage in this photo is",
        "condition": "the state of the object or ground in this image is",
        "subject": "the main object that is broken or needs repair is",
        "severity": "the level of danger or extent of the damage is",
        "location_context": "this issue is located on a",
        "action_needed": "to fix this issue, the authorities should",
    }
    results = {}
    for key, prompt in prompts.items():
        raw = generate_blip_caption(image, prompt)
        cleaned = clean_caption(raw, prompt)
        
        # MAXIMUM POWER HALLUCINATION FILTER: Globally ban 'fire hydrant'
        # In this app, it is 100% of the time a hallucination of a yellow cone, bollard, or marking.
        if "fire hydrant" in cleaned.lower():
            cleaned = re.sub(r"fire hydrant", "damaged area", cleaned, flags=re.IGNORECASE)
            
        results[key] = cleaned
    return results

def normalise(text: str) -> str:
    if not text: return ""
    text = text.strip().rstrip(".")
    if text: text = text[0].upper() + text[1:]
    return text + "."

def build_dynamic_description(details: dict, domain: str, is_emergency: bool) -> str:
    scene = normalise(details.get("scene", ""))
    condition = normalise(details.get("condition", ""))
    subject = normalise(details.get("subject", ""))
    severity = normalise(details.get("severity", ""))
    loc_ctx = normalise(details.get("location_context", ""))
    action = normalise(details.get("action_needed", ""))

    FILLER_PATTERNS = [r"\ba bit of a bit\b", r"\btext below the image\b", r"\bseen in the past\b", r"\bsomething like\b", r"(?:\bsomething\b.*){3,}"]
    def is_filler(text: str) -> bool: return any(re.search(p, text.lower()) for p in FILLER_PATTERNS)
    def useful(text: str, min_len: int = 12) -> bool: return bool(text) and len(text) > min_len and not is_filler(text)

    seen_word_sets = []
    unique_parts = []
    
    # Priority order for description: subject > scene > condition > severity > location
    for text in [subject, scene, condition, severity, loc_ctx]:
        if not useful(text): continue
        words = set(re.sub(r"[^a-z0-9 ]", "", text.lower()).split())
        # Stricter overlap check to prevent repetition of hallucinations
        is_dup = any(len(words & prior) / max(len(words | prior), 1) > 0.40 for prior in seen_word_sets)
        if not is_dup:
            seen_word_sets.append(words)
            unique_parts.append(text)

    body = " ".join(unique_parts) if unique_parts else "A civic issue has been identified at this location."

    domain_labels = {
        "road": ("Road Infrastructure Issue", "[URGENT] Severe Road Damage"),
        "waste": ("Waste Management Issue", "[CRITICAL] Waste & Public Health Emergency"),
        "water": ("Water / Drainage Issue", "[EMERGENCY] Flooding / Drainage Failure"),
        "fire": ("Fire / Safety Hazard", "[EMERGENCY] Active Fire or Severe Hazard"),
        "electricity": ("Electrical Infrastructure Issue", "[CRITICAL] Electrical Safety Emergency"),
        "greenery": ("Public Greenery Issue", "[URGENT] Fallen Tree / Vegetation Hazard"),
        "infrastructure": ("Structural Issue", "[CRITICAL] Structural Failure Risk"),
        "general": ("Civic Issue Reported", "[URGENT] Serious Civic Emergency"),
    }
    normal_label, emergency_label = domain_labels.get(domain, domain_labels["general"])

    if is_emergency:
        header = f"[EMERGENCY REPORT] {emergency_label}"
    else:
        header = normal_label

    # Clean up any remaining hallucination artifacts globally
    header = re.sub(r"fire hydrant", "infrastructure area", header, flags=re.IGNORECASE)
    final_body = re.sub(r"fire hydrant", "damaged area", body, flags=re.IGNORECASE)
    
    return f"{header}: {final_body}".strip()

# ----------------- ENDPOINTS -----------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        text = data.get("text", "")
        inputs = predict_tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        outputs = predict_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1)
        
        # DOMAIN NUDGE: Extract domain hint from text if it was generated by video analysis
        domain_hint = None
        if "Road Infrastructure" in text or "Road Damage" in text: domain_hint = "Public Works Department"
        elif "Waste Management" in text or "Waste & Public Health" in text: domain_hint = "Sanitation Department"
        elif "Water / Drainage" in text or "Flooding" in text: domain_hint = "Water Department"
        elif "Fire / Safety" in text or "Fire or Severe Hazard" in text: domain_hint = "Fire Department"
        elif "Electrical Infrastructure" in text or "Electrical Safety" in text: domain_hint = "Power Department"
        elif "Public Greenery" in text or "Fallen Tree" in text: domain_hint = "Health Department" # Greenery usually handled by health/civic? No, usually others.
        elif "Structural Issue" in text or "Structural Failure" in text: domain_hint = "Public Works Department"
        
        # Find the best prediction
        confidence = torch.max(probs, dim=1).values.item()
        pred = torch.argmax(outputs.logits, dim=1).item()
        label = label_mapping[str(pred)]
        department, priority = label.split(" | ")
        
        # MAXIMUM POWER NUDGE: If visual analysis identified a clear domain, override the text model
        # The visual analysis is much more robust for video/images than a text classifier looking at hallucinations
        if domain_hint:
            target_dept = domain_hint
            if target_dept == "Electricity Department": target_dept = "Power Department"
            
            # Forced Override: Use the visual domain's department
            for idx, lbl in label_mapping.items():
                if target_dept in lbl and priority in lbl:
                    pred = int(idx)
                    label = lbl
                    department, _ = label.split(" | ")
                    confidence = 1.0 # Force maximum confidence for visual match
                    break

        department = department.title()
        if department == "Power Department": department = "Electricity Department"

        bands = {"Low": (1, 25), "Medium": (26, 50), "High": (51, 80), "Emergency": (81, 100)}
        band_min, band_max = bands.get(priority, (26, 50))
        severity_score = int(band_min + confidence * (band_max - band_min))

        return jsonify({"department": department, "priority": priority, "confidence": round(confidence * 100, 2), "severity_score": severity_score})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/detect_fake_image", methods=["POST"])
def detect_fake_image():
    try:
        if "image" not in request.files: return jsonify({"error": "No image uploaded"}), 400
        image = Image.open(request.files["image"]).convert("RGB")

        blurry, variance = is_blurry(image)
        if blurry:
            return jsonify({"is_fake": True, "error_type": "blur", "message": f"Image blurry ({variance:.1f}).", "confidence": 1.0})

        results = fake_detector(image)
        is_fake, confidence = False, 0.0
        for result in results:
            if result['label'].lower() in ['artificial', 'fake', 'ai'] and result['score'] > 0.92:
                is_fake, confidence = True, result['score']
                break

        return jsonify({"is_fake": is_fake, "error_type": "ai" if is_fake else None, "message": "AI content detected." if is_fake else "Real image", "confidence": confidence})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/detect_fake_video", methods=["POST"])
def detect_fake_video():
    video_path = None
    try:
        video_file = request.files["video"]
        temp_ext = os.path.splitext(video_file.filename)[1] or ".tmp"
        temp_input = f"temp_input_fake_{os.getpid()}{temp_ext}"
        video_path = f"temp_video_fake_{os.getpid()}.mp4"
        
        video_file.save(temp_input)
        
        # Convert to standard MP4 to ensure OpenCV can read it
        success = convert_to_mp4(temp_input, video_path)
        if os.path.exists(temp_input): os.remove(temp_input)
        
        if not success or not os.path.exists(video_path):
            return jsonify({"error": "Video conversion failed. Format might be unsupported."}), 400

        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        sampled_frames = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Sample max 8 frames evenly distributed across the video
            if total_frames > 0:
                step = max(1, total_frames // 8)
                if frame_count % step == 0 and len(sampled_frames) < 8:
                    sampled_frames.append(Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)))
            else:
                # Fallback if total_frames is 0 or unreadable
                if frame_count % 15 == 0 and len(sampled_frames) < 8:
                    sampled_frames.append(Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)))
                    
            frame_count += 1
            if frame_count > 900: # hard limit 30 secs at 30fps
                break
                
        cap.release()
        if os.path.exists(video_path): os.remove(video_path)

        blur_count, fake_count = 0, 0
        for img in sampled_frames:
            blurry, _ = is_blurry(img)
            if blurry:
                blur_count += 1
                continue
            
            results = fake_detector(img)
            if any(r['label'].lower() in ['artificial', 'fake', 'ai'] and r['score'] > 0.92 for r in results):
                fake_count += 1

        total = len(sampled_frames)
        valid = total - blur_count
        if blur_count > total / 2:
            return jsonify({"is_fake": True, "error_type": "blur", "message": "Video is too blurry."})
        
        is_fake = valid > 0 and fake_count > valid / 2
        return jsonify({"is_fake": is_fake, "message": "AI video detected." if is_fake else "Real video"})
    except Exception as e:
        if video_path and os.path.exists(video_path): os.remove(video_path)
        return jsonify({"error": str(e)}), 500

@app.route("/caption", methods=["POST"])
def caption():
    try:
        if "image" not in request.files: return jsonify({"error": "No image uploaded"}), 400
        is_emergency = request.form.get("emergency", "false").lower() in ("true", "1", "yes") or request.form.get("priority", "").lower() in ("high", "emergency")
        image = Image.open(request.files["image"]).convert("RGB")

        details = extract_all_details(image)
        domain = detect_issue_domain(" ".join(details.values()))
        description = build_dynamic_description(details, domain, is_emergency)

        return jsonify({"description": description, "raw_caption": details.get("scene", ""), "domain": domain})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze_video", methods=["POST"])
def analyze_video():
    video_path = None
    try:
        video_file = request.files["video"]
        is_emergency = request.form.get("emergency", "false").lower() in ("true", "1", "yes") or request.form.get("priority", "").lower() in ("high", "emergency")
        
        temp_ext = os.path.splitext(video_file.filename)[1] or ".tmp"
        temp_input = f"temp_input_analyze_{os.getpid()}{temp_ext}"
        video_path = f"temp_video_analyze_{os.getpid()}.mp4"
        
        video_file.save(temp_input)
        
        # Convert to standard MP4 to ensure OpenCV can read it
        success = convert_to_mp4(temp_input, video_path)
        if os.path.exists(temp_input): os.remove(temp_input)
        
        if not success or not os.path.exists(video_path):
            return jsonify({"error": "Video conversion failed. Format might be unsupported."}), 400

        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        best_frame = None
        max_variance = -1
        
        # Sequentially read and sample frames to avoid cv2.CAP_PROP_POS_FRAMES bugs on different OS
        frame_count = 0
        frames_to_check = []
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Sample max 15 frames evenly distributed across the video
            if total_frames > 0:
                step = max(1, total_frames // 15)
                if frame_count % step == 0:
                    frames_to_check.append(frame)
            else:
                # Fallback if total_frames is 0 or unreadable
                if frame_count % 10 == 0:
                    frames_to_check.append(frame)
                    
            frame_count += 1
            if frame_count > 900: # hard limit 30 secs at 30fps to avoid memory/CPU issues
                break
                
        # Pick top 3 clearest frames instead of just 1
        scored_frames = []
        for frame in frames_to_check:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            variance = cv2.Laplacian(gray, cv2.CV_64F).var()
            scored_frames.append((variance, frame))
            
        # Sort by variance descending and take top 3
        scored_frames.sort(key=lambda x: x[0], reverse=True)
        top_frames = [f[1] for f in scored_frames[:3]]
                    
        cap.release()
        if os.path.exists(video_path): os.remove(video_path)

        if not top_frames:
            return jsonify({"error": "Could not read video frames"}), 400

        # Aggregate details from all top frames
        all_details = []
        for frame in top_frames:
            image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            all_details.append(extract_all_details(image))
            
        # Merge details: Take the best/most unique descriptions from all frames
        merged_details = {}
        for key in ["scene", "condition", "subject", "severity", "location_context", "action_needed"]:
            # Pick the longest/most descriptive caption for each field across the 3 frames
            captions = [d.get(key, "") for d in all_details]
            merged_details[key] = max(captions, key=len)
            
        domain = detect_issue_domain(" ".join(merged_details.values()))
        description = build_dynamic_description(merged_details, domain, is_emergency)

        return jsonify({"description": f"Video Analysis: {description}", "raw_caption": merged_details.get("scene", ""), "domain": domain})
    except Exception as e:
        if video_path and os.path.exists(video_path): os.remove(video_path)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)
