import json
import re
from typing import List, Dict
from rapidfuzz import process
from sentence_transformers import SentenceTransformer, util

# ================= INIT =================

model = SentenceTransformer("all-MiniLM-L6-v2")

# Load Intent DB
with open("intent_db.json") as f:
    INTENTS = json.load(f)

# Load Location DB
with open("db.json") as f:
    DB = json.load(f)

# ================= BUILD INDEX =================

STATE_SET, DISTRICT_SET, UNIT_SET = set(), set(), set()
DISTRICT_TO_STATE, UNIT_TO_DISTRICT, UNIT_TO_STATE = {}, {}, {}

for state_obj in DB["states"]:
    state = state_obj["name"].lower()
    STATE_SET.add(state)

    for dist_obj in state_obj["districts"]:
        district = dist_obj["name"].lower()
        DISTRICT_SET.add(district)
        DISTRICT_TO_STATE[district] = state

        for unit in dist_obj["assessmentUnits"]:
            u = unit["name"].lower()
            UNIT_SET.add(u)
            UNIT_TO_DISTRICT[u] = district
            UNIT_TO_STATE[u] = state

STATE_LIST = list(STATE_SET)
DISTRICT_LIST = list(DISTRICT_SET)
UNIT_LIST = list(UNIT_SET)

# ================= INTENT EMBEDDINGS =================

intent_embeddings = {
    intent: model.encode(phrases, convert_to_tensor=True)
    for intent, phrases in INTENTS.items()
}

# ================= CONFIG =================

STOPWORDS = {
    "water", "ground", "level", "data", "show", "give", "me",
    "of", "in", "for", "and", "the", "table","city"
}

INTENT_TYPE = {
    "extraction": "metric",
    "recharge": "metric",
    "water_level": "metric",

    "highest": "operation",
    "lowest": "operation",
    "comparison": "operation",

    "status_safe": "status",
    "status_critical": "status",
    "status_overexploited": "status",

    "forecast": "analysis"
}

# ================= UTIL FUNCTIONS =================

def generate_phrases(tokens: List[str]) -> List[str]:
    """Generate uni + bi + tri grams"""
    bigrams = [" ".join([tokens[i], tokens[i+1]]) for i in range(len(tokens)-1)]
    trigrams = [" ".join([tokens[i], tokens[i+1], tokens[i+2]]) for i in range(len(tokens)-2)]
    return tokens + bigrams + trigrams


def fuzzy_match(word: str, choices: List[str], threshold: int = 92):
    match, score, _ = process.extractOne(word, choices)
    return match if score >= threshold else None


# ================= MAIN FUNCTION =================

def extract_intent_and_location(query: str) -> Dict:

    query_clean = query.lower().strip()

    # -------- TOKENIZATION --------
    tokens = re.findall(r"\b\w+\b", query_clean)
    terms = generate_phrases(tokens)

    # ================= INTENT DETECTION =================
    query_embedding = model.encode(query, convert_to_tensor=True)

    intent_scores = {}

    for intent, emb in intent_embeddings.items():
        score = float(util.cos_sim(query_embedding, emb).max())

        # Phrase boost
        if any(term in INTENTS[intent] for term in terms):
            score += 0.15

        intent_scores[intent] = round(score, 3)

    # -------- SORT INTENTS --------
    sorted_intents = sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)

    # -------- TAKE BEST INTENT --------
    detected_intents = []

    best_intent, best_score = sorted_intents[0]

    # Rule 1: Always take top intent if strong
    if best_score >= 0.5:
        detected_intents.append(best_intent)

    # Rule 2: Take second intent ONLY if very close
    if len(sorted_intents) > 1:
        second_intent, second_score = sorted_intents[1]

        if second_score >= 0.5 and (best_score - second_score) < 0.1:
            detected_intents.append(second_intent)

    # ================= LOCATION EXTRACTION =================
    found = []

    for word in terms:

        # Skip noise
        if word in STOPWORDS or len(word) <= 3:
            continue

        # ---- Exact Match ----
        if word in STATE_SET:
            found.append({"type": "state", "value": word.upper()})
            continue

        if word in DISTRICT_SET:
            found.append({
                "type": "district",
                "value": word.upper(),
                "state": DISTRICT_TO_STATE[word].upper()
            })
            continue

        if word in UNIT_SET:
            found.append({
                "type": "assessment_unit",
                "value": word.upper(),
                "district": UNIT_TO_DISTRICT[word].upper(),
                "state": UNIT_TO_STATE[word].upper()
            })
            continue

        # ---- Fuzzy Match ----
        for typ, dataset in [
            ("state", STATE_LIST),
            ("district", DISTRICT_LIST),
            ("unit", UNIT_LIST)
        ]:
            match = fuzzy_match(word, dataset)

            if match:
                if typ == "state":
                    found.append({"type": "state", "value": match.upper()})

                elif typ == "district":
                    found.append({
                        "type": "district",
                        "value": match.upper(),
                        "state": DISTRICT_TO_STATE[match].upper()
                    })

                else:
                    found.append({
                        "type": "assessment_unit",
                        "value": match.upper(),
                        "district": UNIT_TO_DISTRICT[match].upper(),
                        "state": UNIT_TO_STATE[match].upper()
                    })
                break

    # -------- REMOVE DUPLICATES --------
    unique_locations = [dict(t) for t in {tuple(d.items()) for d in found}]

    # -------- PRIORITY CLEANUP --------
    final_locations = []

    for loc in unique_locations:
        if loc["type"] == "district":
            final_locations = [loc]
            break
    else:
        final_locations = unique_locations

    # ================= FINAL OUTPUT =================
    return {
        "query": query,
        "intents": detected_intents,
        # "intent_scores": intent_scores,   
        "locations": final_locations
    }