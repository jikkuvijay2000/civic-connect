from flask import Flask, request, jsonify
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch
import re

app = Flask(__name__)

# Determine device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load model once at startup (using large model for better accuracy)
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large").to(device)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200


def generate_blip_caption(image, prompt_text, max_new_tokens=120, min_new_tokens=10):
    """Run BLIP with a given prompt text and return the decoded caption."""
    inputs = processor(images=image, text=prompt_text, return_tensors="pt").to(device)
    outputs = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        min_new_tokens=min_new_tokens,
        num_beams=5,
        repetition_penalty=1.3,
        length_penalty=1.2,
        early_stopping=True,
    )
    return processor.decode(outputs[0], skip_special_tokens=True)


def clean_caption(raw: str, prompt: str) -> str:
    """Strip the prompt prefix from the BLIP output, normalize whitespace."""
    cleaned = raw.strip()
    # Remove the prompt prefix (case-insensitive)
    prompt_lower = prompt.lower()
    cleaned_lower = cleaned.lower()
    if cleaned_lower.startswith(prompt_lower):
        cleaned = cleaned[len(prompt):].strip()
    # Remove any leading punctuation / articles that BLIP echoes
    cleaned = re.sub(r"^[\s,\-:]+", "", cleaned).strip()
    return cleaned


def detect_issue_domain(caption: str) -> str:
    """Infer the civic issue domain from caption keywords."""
    caption = caption.lower()
    if any(k in caption for k in ["pothole", "crack", "road", "tarmac", "asphalt", "pavement",
                                   "sidewalk", "footpath", "manhole", "curb", "street surface",
                                   "damaged road", "broken road", "road damage"]):
        return "road"
    if any(k in caption for k in ["garbage", "trash", "waste", "litter", "dump", "rubbish",
                                   "debris", "pile", "sewage", "refuse", "filth"]):
        return "waste"
    if any(k in caption for k in ["flood", "water", "drain", "puddle", "waterlog", "overflow",
                                   "pipe", "leak", "inundated", "submerged"]):
        return "water"
    if any(k in caption for k in ["fire", "smoke", "flame", "burn", "blaze", "charred", "ash"]):
        return "fire"
    if any(k in caption for k in ["streetlight", "lamp post", "light pole", "electricity",
                                   "wire", "cable", "transformer", "electric pole", "power line",
                                   "exposed wire"]):
        return "electricity"
    if any(k in caption for k in ["tree", "branch", "fallen", "park", "grass", "vegetation",
                                   "foliage", "overgrown"]):
        return "greenery"
    if any(k in caption for k in ["building", "wall", "structure", "construction", "demolition",
                                   "collapse", "crumbling", "broken wall", "foundation"]):
        return "infrastructure"
    return "general"


def extract_all_details(image) -> dict:
    """
    Run multiple targeted BLIP prompts to extract a rich, multi-faceted
    description of the civic issue in the image.

    Returns a dict with keys:
        scene, condition, subject, severity, location_context, action_needed
    Each value is a cleaned string from the model.
    """
    prompts = {
        "scene":            "a civic complaint photograph showing",
        "condition":        "the physical condition visible in this image is",
        "subject":          "the main problem or damage captured in this photo is",
        "severity":         "the extent of damage or severity of the issue in this image is",
        "location_context": "the surrounding environment and location context of this issue is",
        "action_needed":    "the repair or action needed to fix this issue is",
    }

    results = {}
    for key, prompt in prompts.items():
        raw = generate_blip_caption(image, prompt)
        results[key] = clean_caption(raw, prompt)

    return results


def normalise(text: str) -> str:
    """Ensure text starts with a capital letter and ends with a period."""
    if not text:
        return ""
    text = text.strip().rstrip(".")
    if text:
        text = text[0].upper() + text[1:]
    return text + "."


def build_dynamic_description(details: dict, domain: str, is_emergency: bool) -> str:
    """
    Build a rich complaint description *entirely* from the BLIP-generated
    details — no hardcoded context paragraphs.

    The emergency flag changes the sentence framing and urgency markers,
    but all factual content comes from the model's analysis of the image.
    """

    scene      = normalise(details.get("scene", ""))
    condition  = normalise(details.get("condition", ""))
    subject    = normalise(details.get("subject", ""))
    severity   = normalise(details.get("severity", ""))
    loc_ctx    = normalise(details.get("location_context", ""))
    action     = normalise(details.get("action_needed", ""))

    # Filler / hallucination patterns BLIP often produces on unhelpful inputs
    FILLER_PATTERNS = [
        r"\ba bit of a bit\b",
        r"\btext below the image\b",
        r"\bseen in the past\b",
        r"\bsomething like\b",
        r"(?:\bsomething\b.*){3,}",   # "something something something"
    ]

    def is_filler(text: str) -> bool:
        t = text.lower()
        return any(re.search(p, t) for p in FILLER_PATTERNS)

    # Filter out very short / uninformative / hallucinated fragments
    def useful(text: str, min_len: int = 12) -> bool:
        return bool(text) and len(text) > min_len and not is_filler(text)

    # --- Fuzzy deduplicate: drop captions with >60% word overlap with a prior one ---
    seen_word_sets: list = []
    unique_parts = []
    for text in [scene, condition, subject, severity, loc_ctx]:
        if not useful(text):
            continue
        words = set(re.sub(r"[^a-z0-9 ]", "", text.lower()).split())
        is_dup = any(
            len(words & prior) / max(len(words | prior), 1) > 0.60
            for prior in seen_word_sets
        )
        if not is_dup:
            seen_word_sets.append(words)
            unique_parts.append(text)

    # --- Compose the core body from deduplicated AI observations ---
    body = " ".join(unique_parts) if unique_parts else "A civic issue has been identified at this location."

    # --- Urgency prefix based on domain + emergency flag ---
    # NOTE: ASCII-safe labels only — avoids Windows cp1252 encoding errors on the server console.
    domain_labels = {
        "road":           ("Road Infrastructure Issue",        "[URGENT] Severe Road Damage"),
        "waste":          ("Waste Management Issue",           "[CRITICAL] Waste & Public Health Emergency"),
        "water":          ("Water / Drainage Issue",           "[EMERGENCY] Flooding / Drainage Failure"),
        "fire":           ("Fire / Safety Hazard",             "[EMERGENCY] Active Fire or Severe Hazard"),
        "electricity":    ("Electrical Infrastructure Issue",  "[CRITICAL] Electrical Safety Emergency"),
        "greenery":       ("Public Greenery Issue",            "[URGENT] Fallen Tree / Vegetation Hazard"),
        "infrastructure": ("Structural Issue",                 "[CRITICAL] Structural Failure Risk"),
        "general":        ("Civic Issue Reported",             "[URGENT] Serious Civic Emergency"),
    }

    normal_label, emergency_label = domain_labels.get(domain, domain_labels["general"])

    if is_emergency:
        header = f"[EMERGENCY REPORT] {emergency_label}"
        closing_parts = []
        if useful(action):
            closing_parts.append(
                f"Immediate action required: {action[0].lower() + action[1:]}"
            )
        closing_parts.append(
            "This incident demands the highest priority response. "
            "Emergency intervention must be dispatched without delay to prevent harm to citizens "
            "and further damage to public infrastructure."
        )
        closing = " ".join(closing_parts)
    else:
        header = normal_label
        closing_parts = []
        if useful(action):
            closing_parts.append(
                f"Recommended action: {action[0].lower() + action[1:]}"
            )
        closing_parts.append(
            "Kindly arrange for an inspection and the necessary repairs at the earliest convenience."
        )
        closing = " ".join(closing_parts)

    description = f"{header}: {body} {closing}".strip()
    return description


@app.route("/caption", methods=["POST"])
def caption():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        # Read the optional emergency / priority flag
        is_emergency = request.form.get("emergency", "false").lower() in ("true", "1", "yes")
        # Also accept priority string (High / Emergency) from the frontend
        priority_str = request.form.get("priority", "").strip().lower()
        if priority_str in ("high", "emergency"):
            is_emergency = True

        image_file = request.files["image"]
        image = Image.open(image_file).convert("RGB")

        # --- Run all targeted BLIP passes ---
        details = extract_all_details(image)

        # --- Infer domain from combined captions ---
        combined = " ".join(details.values())
        domain = detect_issue_domain(combined)

        # --- Build the fully dynamic description ---
        description = build_dynamic_description(details, domain, is_emergency)

        return jsonify({
            "description": description,
            "raw_caption": details.get("scene", ""),
            "domain": domain,
            "details": details          # expose for debugging / future use
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5002, debug=True)
