import pandas as pd
import random
import os

# Define the exact departments and their priorities to ensure balanced data
departments_issues = {
    "Sanitation Department": {
        "Low": [
            "Dustbin slightly full", "Minor litter on the sidewalk", "Need more trash cans in the park",
            "A few wrappers on the ground", "Garbage collection delayed by an hour", "Leaves piling up"
        ],
        "Medium": [
            "Trash bin overflowing", "Bad smell from waste", "Garbage not collected for a day",
            "Pile of trash near building", "People throwing garbage on street", "Garbage truck missed our street",
            "Group of buses parked next to a pile of trash"
        ],
        "High": [
            "Huge pile of uncollected garbage blocking path", "Dead animal rotting on road", 
            "Garbage burning causing heavy smoke", "Illegal dumping of construction waste",
            "Severe bad odor disrupting the neighborhood", "Medical waste thrown in public bin"
        ],
        "Emergency": [
            "Toxic waste illegally dumped", "Hazardous chemicals found near school",
            "Massive garbage fire spreading quickly", "Raw sewage overflowing into homes"
        ]
    },
    "Traffic Department": {
        "Low": [
            "Faint honking noise", "Minor traffic slowdown", "Need road markings repainted",
            "Speed bump sign missing", "Cars parked slightly badly"
        ],
        "Medium": [
            "Buses parked illegally on the road", "Vehicles blocking the neighborhood",
            "Traffic jam during rush hour", "Street light timing is off",
            "Cars parked on footpath forcing pedestrians on road"
        ],
        "High": [
            "Road completely blocked by illegally parked trucks", "Severe traffic gridlock", 
            "Traffic signals stopped working at major junction", "Vehicle broken down blocking highway"
        ],
        "Emergency": [
            "Ambulance stuck in severe traffic due to protests", "Major accident blocking all lanes",
            "Truck overturned spilling fuel on road", "High-speed chase risk"
        ]
    },
    "Roads Department": {
        "Low": [
            "Small crack on footpath", "Road uneven in some spots", "Paint on zebra crossing fading",
            "Minor patchwork needed"
        ],
        "Medium": [
            "Small pothole forming", "Footpath tiles missing", "Road surface very bumpy",
            "Speed breakers broken", "Muddy road after rain"
        ],
        "High": [
            "Large dangerous pothole on main road", "Road cave-in starting", "Bridge railing damaged",
            "Manhole cover missing causing accidents"
        ],
        "Emergency": [
            "Bridge collapsing", "Massive sinkhole opened up swallowing cars", 
            "Landslide blocking entire mountain road", "Road completely washed away by flood"
        ]
    },
    "Water Department": {
        "Low": [
            "Water pressure slightly low", "Water tasting slightly different", "A slow drip from community tap"
        ],
        "Medium": [
            "No water supply since morning", "Dirty yellow water coming from taps", 
            "Water tank overflowing wasting water", "Minor pipe leak on the street"
        ],
        "High": [
            "Major water pipe burst flooding road", "Contaminated black water in taps", 
            "Entire neighborhood has no water for 3 days", "Sewage mixing with drinking water"
        ],
        "Emergency": [
            "Dam gate broken causing flash flood", "Poison mixed in main water reservoir", 
            "Major flooding entering houses and trapping people"
        ]
    },
    "Power Department": {
        "Low": [
            "Street light flickering", "Voltage fluctuating slightly", "Need connection shift"
        ],
        "Medium": [
            "Street lights not working for days", "Power outage in locality", 
            "Transformer making loud buzzing noise", "Frequent power cuts"
        ],
        "High": [
            "Live wire hanging loose dangerously low", "Transformer sparking heavily", 
            "Entire city sector blacked out", "Electric pole leaning heavily"
        ],
        "Emergency": [
            "Live high tension wire fell on a busy street", "Transformer exploded causing fire", 
            "Person electrocuted and stuck to wire"
        ]
    },
    "Fire Department": {
        "Low": [
            "Need fire extinguisher refill", "Fire safety inspection requested", "Stairwell slightly blocked"
        ],
        "Medium": [
            "Burning garbage pile", "Smell of smoke in the air", "Small brush fire in empty lot",
            "Fire alarm sounding with no visible fire"
        ],
        "High": [
            "Vehicle caught on fire on highway", "Huge smoke coming from warehouse vent", 
            "Gas cylinder leaking loudly", "Electrical fire at meter box"
        ],
        "Emergency": [
            "Building engulfed in massive flames", "People trapped in burning house", 
            "Gas explosion at restaurant", "Forest fire spreading rapidly towards town"
        ]
    },
    "Health Department": {
        "Low": [
            "Need mosquito fogging", "Stray dogs looking sick", "Clinic wait times long"
        ],
        "Medium": [
            "Mosquito breeding in stagnant water", "Many people getting dengue in area", 
            "Street food vendor using dirty water", "Dead birds found"
        ],
        "High": [
            "Severe outbreak of cholera", "Hospital turning away critical patients", 
            "Fake medicine being sold at pharmacy", "Large scale food poisoning at event"
        ],
        "Emergency": [
            "Suspected highly contagious deadly virus outbreak", "Mass casualty medical emergency", 
            "Biological hazard found in public park"
        ]
    },
    "General Administration": {
        "Low": [
            "Need birth certificate copy", "Property tax portal slow", "Public park benches dirty"
        ],
        "Medium": [
            "Noise pollution from late night party", "Illegal hoarding/banner erected", 
            "Public toilet extremely dirty and unusable", "Stray dogs chasing people"
        ],
        "High": [
            "Illegal construction happening at night", "Massive political rally blocking roads without permit", 
            "Rioting or public disturbance", "Govt official demanding bribe"
        ],
        "Emergency": [
            "Armed violence in public square", "Terrorist threat reported", 
            "Bomb threat at government building", "Severe earthquake damage requiring coordination"
        ]
    }
}

locations = [
    "near the bus stop", "in our residential area", "near the government school",
    "on the main highway road", "near the central market", "in front of our apartment building",
    "at the crossroad intersection", "behind the hospital", "in the public park",
    "near the railway station", "at this location", "in the downtown area"
]

time_phrases = [
    "for the past two days", "since last week", "for more than a month",
    "since yesterday morning", "for several days", "just happened now",
    "ongoing for a few hours", "every night for a week"
]

impact_phrases = [
    "This is causing severe inconvenience to residents.",
    "Vehicles are finding it completely impossible to pass.",
    "Children are playing nearby which makes it highly risky.",
    "This is very dangerous and needs absolute urgent attention.",
    "People are complaining non-stop about this issue.",
    "It is disrupting the neighborhood deeply.",
    "Please investigate and resolve this immediately.",
    "This poses a major health hazard to families.",
    "I am worried someone will get seriously hurt."
]

data = []
SAMPLES_PER_CATEGORY = 1000

for dept, priorities in departments_issues.items():
    for priority, issues in priorities.items():
        for _ in range(SAMPLES_PER_CATEGORY):
            base_issue = random.choice(issues)
            loc = random.choice(locations)
            time_p = random.choice(time_phrases)
            impact = random.choice(impact_phrases)

            # Construct varying sentence structures
            formats = [
                f"{base_issue} {loc}. This has been happening {time_p}. {impact}",
                f"There is a problem: {base_issue} {loc}. {impact} It has been going on {time_p}.",
                f"Please investigate. {base_issue} {loc} {time_p}. {impact}",
                f"{impact} For {time_p}, we have seen {base_issue.lower()} {loc}."
            ]
            full_text = random.choice(formats)
            
            # Artificial score matching legacy schema
            if priority == "Emergency": score = random.randint(85, 100)
            elif priority == "High": score = random.randint(60, 84)
            elif priority == "Medium": score = random.randint(30, 59)
            else: score = random.randint(0, 29)

            data.append([full_text, dept, priority, score])

# Shuffle dataset
random.shuffle(data)

df = pd.DataFrame(data, columns=["text", "department", "priority", "emergency_score"])

os.makedirs("data", exist_ok=True)
df.to_csv("data/complaints.csv", index=False)

print(f"Successfully generated {len(df)} diverse multi-line complaint samples.")
