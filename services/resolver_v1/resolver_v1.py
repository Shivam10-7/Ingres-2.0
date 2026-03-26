import json
import re
from typing import List, Dict
from rapidfuzz import process
from sentence_transformers import SentenceTransformer, util

# ================= INIT =================

model = SentenceTransformer("all-MiniLM-L6-v2")

with open("intent_db.json") as f:
    INTENT_DB = json.load(f)

with open("db.json") as f:
    DB = json.load(f)

# ================= BUILD FLAT INTENT MAP =================
# Flatten grouped intent_db into: { intent_name: [phrases] }

INTENTS: Dict[str, List[str]] = {}
for group_intents in INTENT_DB.values():
    for intent_name, phrases in group_intents.items():
        INTENTS[intent_name] = phrases

# ================= HARD TRIGGER KEYWORDS =================
# These keywords guarantee an intent fires regardless of semantic score

HARD_TRIGGERS: Dict[str, List[str]] = {
    "comparison":          ["compare", "vs", "versus", "difference between"],
    "highest":             ["highest", "maximum", "max", "top", "most"],
    "lowest":              ["lowest", "minimum", "min", "least"],
    "trend":               ["trend", "increase", "decrease", "over time", "over the years", "growth", "decline"],
    "forecast":            ["forecast", "predict", "future", "projected", "expected"],
    "ranking":             ["rank", "ranking", "list", "show all", "top districts", "top states", "show me all"],
    # ---- Status hard triggers (semantic alone is unreliable for short status terms) ----
    "status_overexploited": ["over exploited", "overexploited", "overused", "depleted", "water stressed", "over extracted"],
    "status_critical":      ["critical", "danger zone", "alarming"],
    "status_semi_critical": ["semi critical", "semicritical", "moderate", "warning"],
    "status_safe":          ["safe zone", "normal zone", "sufficient water"],
}

# ================= PER-GROUP THRESHOLDS =================
# Status intents use short, specific phrases → lower semantic threshold needed

GROUP_THRESHOLDS: Dict[str, float] = {
    "metric":    0.50,
    "operation": 0.50,
    "status":    0.38,   # lower — status phrases score weakly via embeddings
    "general":   0.55,
}

# ================= BUILD LOCATION INDEX =================

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

STATE_LIST    = list(STATE_SET)
DISTRICT_LIST = list(DISTRICT_SET)
UNIT_LIST     = list(UNIT_SET)

# ================= PRECOMPUTE INTENT EMBEDDINGS =================

intent_embeddings = {
    intent: model.encode(phrases, convert_to_tensor=True)
    for intent, phrases in INTENTS.items()
}

# ================= CONFIG =================

STOPWORDS = {
    "water", "ground", "level", "data", "show", "give", "me",
    "of", "in", "for", "and", "the", "table", "city", "tell",
    "what", "how", "is", "are", "a", "an"
}

# ================= UTIL FUNCTIONS =================

def generate_phrases(tokens: List[str]) -> List[str]:
    """Generate unigrams + bigrams + trigrams from token list."""
    bigrams  = [" ".join(tokens[i:i+2]) for i in range(len(tokens) - 1)]
    trigrams = [" ".join(tokens[i:i+3]) for i in range(len(tokens) - 2)]
    return tokens + bigrams + trigrams


def fuzzy_match(word: str, choices: List[str], threshold: int = 92):
    """Fuzzy match a word against a list of choices. Returns match or None."""
    result = process.extractOne(word, choices)
    if result and result[1] >= threshold:
        return result[0]
    return None


def apply_hard_triggers(terms: List[str], intent_scores: Dict[str, float]) -> Dict[str, float]:
    """
    Boost intent scores to 0.95 if any hard-trigger keyword is found in terms.
    This ensures deterministic intents always fire.
    """
    for intent, keywords in HARD_TRIGGERS.items():
        if any(kw in terms for kw in keywords):
            intent_scores[intent] = max(intent_scores.get(intent, 0), 0.95)
    return intent_scores


def detect_intents_by_group(intent_scores: Dict[str, float]) -> List[str]:
    """
    For each group in INTENT_DB, pick the best-scoring intent if it
    exceeds that group's threshold. Uses GROUP_THRESHOLDS for per-group
    sensitivity (status group has lower threshold since its phrases are short).
    """
    detected = []

    for group_name, group_intents in INTENT_DB.items():
        group_scores = {
            intent: intent_scores.get(intent, 0.0)
            for intent in group_intents
        }

        if not group_scores:
            continue

        threshold   = GROUP_THRESHOLDS.get(group_name, 0.50)
        best_intent = max(group_scores, key=group_scores.get)
        best_score  = group_scores[best_intent]

        if best_score >= threshold:
            detected.append(best_intent)

        # For metric group: also allow a secondary metric if it's strong enough
        # e.g. "compare extraction and recharge" → both extraction + recharge fire
        if group_name == "metric":
            for intent, score in sorted(group_scores.items(), key=lambda x: x[1], reverse=True):
                if intent != best_intent and score >= threshold and (best_score - score) < 0.12:
                    detected.append(intent)

    return list(dict.fromkeys(detected))  # preserve order, remove duplicates


# ================= MAIN FUNCTION =================

def extract_intent_and_location(query: str) -> Dict:

    query_clean = query.lower().strip()

    # -------- TOKENIZATION --------
    tokens = re.findall(r"\b\w+\b", query_clean)
    terms  = generate_phrases(tokens)

    # ================= INTENT DETECTION =================

    query_embedding = model.encode(query, convert_to_tensor=True)

    # Step 1: Compute semantic similarity scores
    intent_scores: Dict[str, float] = {}

    for intent, emb in intent_embeddings.items():
        score = float(util.cos_sim(query_embedding, emb).max())

        # Exact phrase boost (tighter than before — only full phrase matches)
        if any(term in INTENTS[intent] for term in terms):
            score = min(score + 0.12, 1.0)

        intent_scores[intent] = round(score, 3)

    # Step 2: Apply hard keyword triggers (deterministic override)
    intent_scores = apply_hard_triggers(terms, intent_scores)

    # Step 3: Group-aware multi-intent selection
    detected_intents = detect_intents_by_group(intent_scores)

    # ================= LOCATION EXTRACTION =================

    found = []

    for word in terms:

        if word in STOPWORDS or len(word) <= 3:
            continue

        # ---- Exact Match (fastest path) ----
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

        # ---- Fuzzy Match (fallback for typos) ----
        for typ, dataset in [
            ("state",    STATE_LIST),
            ("district", DISTRICT_LIST),
            ("unit",     UNIT_LIST)
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

    # -------- DEDUPLICATION --------
    unique_locations = list({tuple(sorted(d.items())): d for d in found}.values())

    # -------- PRIORITY: prefer districts over states --------
    # If any district found, drop plain state entries whose state matches
    district_states = {
        loc["state"] for loc in unique_locations if loc["type"] == "district"
    }

    final_locations = [
        loc for loc in unique_locations
        if not (loc["type"] == "state" and loc["value"] in district_states)
    ]

    # ================= FINAL OUTPUT =================
    # Status rules:
    # - `resolved`: exactly one match found
    # - `ambigous`: more than one match found
    # - `not found`: no matches found
    intent_status: str
    if len(detected_intents) == 0:
        intent_status = "not found"
    elif len(detected_intents) == 1:
        intent_status = "resolved"
    else:
        intent_status = "ambigous"

    resolution_status: str
    if len(final_locations) == 0:
        resolution_status = "not found"
    elif len(final_locations) == 1:
        resolution_status = "resolved"
    else:
        resolution_status = "ambigous"

    return {
        "query":             query,
        "intent_status":     intent_status,
        "status":           resolution_status,
        "intents":          detected_intents,
        "locations":        final_locations
    }