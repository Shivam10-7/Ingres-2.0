import json
import re
from typing import Dict, List

from rapidfuzz import process
from sentence_transformers import SentenceTransformer, util

# ── load once at import time ──────────────────────────────────────────────────

with open("intent_db.json") as f:
    INTENT_DB = json.load(f)

_model = SentenceTransformer("all-MiniLM-L6-v2")

# ── flatten grouped intent_db → { intent_name: [phrases] } ───────────────────

INTENTS: Dict[str, List[str]] = {}
for _group_intents in INTENT_DB.values():
    for _intent_name, _phrases in _group_intents.items():
        INTENTS[_intent_name] = _phrases

# ── precompute intent embeddings once ────────────────────────────────────────

_intent_embeddings = {
    intent: _model.encode(phrases, convert_to_tensor=True)
    for intent, phrases in INTENTS.items()
}

# ── hard triggers: keyword → guaranteed intent ────────────────────────────────

HARD_TRIGGERS: Dict[str, List[str]] = {
    "comparison":           ["compare", "vs", "versus", "difference between"],
    "highest":              ["highest", "maximum", "max", "top", "most"],
    "lowest":               ["lowest", "minimum", "min", "least"],
    "trend":                ["trend", "increase", "decrease", "over time",
                             "over the years", "growth", "decline"],
    "forecast":             ["forecast", "predict", "future", "projected", "expected"],
    "ranking":              ["rank", "ranking", "list", "show all",
                             "top districts", "top states", "show me all"],
    "status_overexploited": ["over exploited", "overexploited", "overused",
                             "depleted", "water stressed", "over extracted"],
    "status_critical":      ["critical", "danger zone", "alarming"],
    "status_semi_critical": ["semi critical", "semicritical", "moderate", "warning"],
    "status_safe":          ["safe zone", "normal zone", "sufficient water"],
}

# ── per-group semantic thresholds ─────────────────────────────────────────────

GROUP_THRESHOLDS: Dict[str, float] = {
    "metric":    0.50,
    "operation": 0.50,
    "status":    0.38,   # lower — short status phrases score weakly via embeddings
    "general":   0.55,
}

# ── helpers ───────────────────────────────────────────────────────────────────

def _generate_phrases(tokens: List[str]) -> List[str]:
    bigrams  = [" ".join(tokens[i:i+2]) for i in range(len(tokens) - 1)]
    trigrams = [" ".join(tokens[i:i+3]) for i in range(len(tokens) - 2)]
    return tokens + bigrams + trigrams


def _apply_hard_triggers(
    terms: List[str],
    intent_scores: Dict[str, float],
) -> Dict[str, float]:
    for intent, keywords in HARD_TRIGGERS.items():
        if any(kw in terms for kw in keywords):
            intent_scores[intent] = max(intent_scores.get(intent, 0), 0.95)
    return intent_scores


def _detect_intents_by_group(intent_scores: Dict[str, float]) -> List[str]:
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

        # metric group: allow a secondary metric when scores are close
        # e.g. "compare extraction and recharge" → both intents fire
        if group_name == "metric":
            for intent, score in sorted(
                group_scores.items(), key=lambda x: x[1], reverse=True
            ):
                if (
                    intent != best_intent
                    and score >= threshold
                    and (best_score - score) < 0.12
                ):
                    detected.append(intent)

    return list(dict.fromkeys(detected))   # dedupe, preserve order


# ── public API ────────────────────────────────────────────────────────────────

def extract_intent(query: str) -> Dict:
    """
    Analyse a natural-language query and return intent information.

    Returns
    -------
    {
        "intents":        List[str],   # e.g. ["comparison", "extraction"]
        "intent_status":  str,         # "resolved" | "ambiguous" | "not_found"
        "intent_scores":  Dict[str, float]   # raw scores, useful for debugging
    }
    """
    query_clean = query.lower().strip()
    tokens = re.findall(r"\b\w+\b", query_clean)
    terms  = _generate_phrases(tokens)

    # 1. semantic similarity against every intent
    query_embedding = _model.encode(query, convert_to_tensor=True)
    intent_scores: Dict[str, float] = {}

    for intent, emb in _intent_embeddings.items():
        score = float(util.cos_sim(query_embedding, emb).max())
        if any(term in INTENTS[intent] for term in terms):
            score = min(score + 0.12, 1.0)   # exact-phrase boost
        intent_scores[intent] = round(score, 3)

    # 2. hard keyword overrides
    intent_scores = _apply_hard_triggers(terms, intent_scores)

    # 3. group-aware multi-intent selection
    detected = _detect_intents_by_group(intent_scores)

    if len(detected) == 0:
        status = "not_found"
    elif len(detected) == 1:
        status = "resolved"
    else:
        status = "ambiguous"

    return {
        "intents":       detected,
        "intent_status": status,
        "intent_scores": intent_scores,   # drop this key in production if noisy
    }