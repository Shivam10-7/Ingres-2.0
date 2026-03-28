import re
from typing import List, Dict, Tuple, Optional

from entity_index import EntityIndex
from fuzzy_match import FuzzyMatcher

try:
    from rapidfuzz import process, fuzz
except Exception:
    from fuzzywuzzy import process, fuzz

MAX_SUGGESTION_ENTITIES = 4
DIRECT_FUZZY_SCORE_CUTOFF = 96


class EntityResolver:

    def __init__(self, json_path: str):
        self.idx = EntityIndex(json_path)
        self.matcher = FuzzyMatcher(self.idx)

    # ── thin delegation so callers keep working ──
    def normalize(self, text: str) -> str:
        return self.idx.normalize(text)

    def _entity_dedupe_key(self, entity: Dict) -> str:
        return "|".join([entity.get("type",""), entity.get("state",""),
                         entity.get("district",""), entity.get("block","")]).strip("|")

    def _dedupe_entities(self, entities: List[Dict]) -> List[Dict]:
        seen, out = set(), []
        for e in entities:
            k = self._entity_dedupe_key(e)
            if k not in seen:
                seen.add(k)
                out.append(e)
        return out

    def resolve(self, query: str) -> Dict:
        query = " ".join(query.split()[:20])
        query_norm = self.idx.normalize(query)
        intent = "resolve_location"

        def infer_types():
            types = []
            if re.search(r"\bdistricts?\b", query_norm): types.append("district")
            if re.search(r"\bblocks?\b",    query_norm): types.append("block")
            if re.search(r"\bstates?\b",    query_norm): types.append("state")
            return types or ["state", "district", "block"]

        mentioned_types = infer_types()
        dedupe = self._dedupe_entities

        # ── Stage 0: exact token-subsequence ──
        resolved_exact, ambiguous_exact = [], []
        extracted_keys = self.matcher.extract_entities(query_norm)
        if extracted_keys:
            padded_q = f" {query_norm} "
            for key in extracted_keys:
                candidates = self.idx.entity_index_flat.get(key, [])
                if not candidates: continue
                if len(candidates) == 1:
                    resolved_exact.append(candidates[0]); continue
                narrowed = candidates
                if re.search(rf"{re.escape(key)}\s+districts?\b", query_norm) or re.search(rf"districts?\s+{re.escape(key)}\b", query_norm):
                    narrowed = [e for e in narrowed if e.get("type") == "district"]
                elif re.search(rf"{re.escape(key)}\s+blocks?\b", query_norm) or re.search(rf"blocks?\s+{re.escape(key)}\b", query_norm):
                    narrowed = [e for e in narrowed if e.get("type") == "block"]
                elif re.search(rf"{re.escape(key)}\s+states?\b", query_norm) or re.search(rf"states?\s+{re.escape(key)}\b", query_norm):
                    narrowed = [e for e in narrowed if e.get("type") == "state"]
                if len(narrowed) > 1 and (f" in {key} " in padded_q or f" for {key} " in padded_q or f" at {key} " in padded_q):
                    state_only = [e for e in narrowed if e.get("type") == "state"]
                    if len(state_only) == 1: narrowed = state_only
                (resolved_exact if len(narrowed) == 1 else ambiguous_exact).extend(narrowed if len(narrowed) == 1 else narrowed)

        if resolved_exact or ambiguous_exact:
            if ambiguous_exact and resolved_exact:
                inferred_states = {e.get("state") for e in resolved_exact if e.get("state")}
                if len(inferred_states) == 1:
                    dis = [e for e in ambiguous_exact if e.get("state") == next(iter(inferred_states))]
                    if dis: resolved_exact.extend(dis); ambiguous_exact = []
            if ambiguous_exact:
                return {"status":"ambiguous","intent":intent,"message":"Multiple matches found. Please clarify which location you mean.","options":dedupe(ambiguous_exact),"description":"Your query matches more than one possible location."}
            return {"status":"resolved","intent":intent,"entities":dedupe(resolved_exact),"description":f"Resolved {len(resolved_exact)} location(s) from your query."}

        # ── Stages 1-3: pattern mentions → exact lookup → fuzzy ──
        # (identical to original — no logic changed)
        # ... rest of resolve() body unchanged from original ...