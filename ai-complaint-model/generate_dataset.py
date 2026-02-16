import random
import pandas as pd

departments = {
    "Fire Department": [
        "There is a fire in a house",
        "A shop caught fire",
        "Gas cylinder is leaking",
        "Smoke coming from a building",
        "Vehicle is on fire",
        "Electrical fire near a pole"
    ],
    "Electricity Department": [
        "Street light is not working",
        "There is a power outage",
        "Electric pole is damaged",
        "Loose electric wire hanging",
        "Short circuit near transformer",
        "Transformer making loud noise"
    ],
    "Water Department": [
        "Water leakage on the road",
        "Pipe burst near houses",
        "No water supply in area",
        "Dirty water coming from taps",
        "Very low water pressure",
        "Water tank overflowing"
    ],
    "Cleaning Department": [
        "Garbage not collected",
        "Dustbin overflowing",
        "Dead animal on road",
        "Garbage burning",
        "Bad smell from waste",
        "Street is very dirty"
    ],
    "Public Works Department": [
        "Pothole on the road",
        "Road is broken",
        "Footpath damaged",
        "Road blocked by debris",
        "Tree fallen on road",
        "Manhole left open"
    ]
}

locations = [
    "near the bus stop",
    "in our residential area",
    "near the school",
    "on the main road",
    "near the market",
    "in front of our house"
]

time_phrases = [
    "for the past two days",
    "since last week",
    "for more than a month",
    "since yesterday",
    "for several days"
]

danger_phrases = [
    "This is causing inconvenience to residents.",
    "Vehicles are finding it difficult to pass.",
    "Children are playing nearby which is risky.",
    "This is very dangerous and needs urgent attention.",
    "People are complaining about this issue."
]


def get_priority_and_score(text):
    text_lower = text.lower()

    emergency_keywords = [
        "fire", "gas", "short circuit",
        "open", "fallen", "dead", "sparking"
    ]

    if any(word in text_lower for word in emergency_keywords):
        score = random.randint(6, 10)
        return "Emergency", score

    high_keywords = ["leak", "blocked", "damaged", "overflow", "burst"]
    if any(word in text_lower for word in high_keywords):
        return "High", 0

    medium_keywords = ["not working", "dirty", "low", "smell"]
    if any(word in text_lower for word in medium_keywords):
        return "Medium", 0

    return "Low", 0


data = []

for _ in range(1000):
    dept = random.choice(list(departments.keys()))
    base_issue = random.choice(departments[dept])

    sentence1 = f"{base_issue} {random.choice(locations)}."
    sentence2 = f"This has been happening {random.choice(time_phrases)}."
    sentence3 = random.choice(danger_phrases)

    full_text = f"{sentence1} {sentence2} {sentence3}"

    priority, score = get_priority_and_score(full_text)

    data.append([full_text, dept, priority, score])

df = pd.DataFrame(
    data,
    columns=["text", "department", "priority", "emergency_score"]
)

df.to_csv("data/complaints.csv", index=False)

print("1000-sample multi-line dataset created.")
