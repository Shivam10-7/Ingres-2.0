"""
resolver.py
───────────
Main entry point for location + intent resolution.

Dependencies (all in the same package):
    entity_index.py     — builds lookup tables from db.json
    fuzzy_match.py      — exact token-subsequence + rapidfuzz matching
    intent_extractor.py — keyword / TF-IDF / neural intent detection

Public API:
    resolver = EntityResolver("db.json")
    result   = resolver.resolve("compare extraction in nagpur and pune district")
"""

import re
from typing import Dict, List, Optional, Tuple

try:
    from rapidfuzz import process, fuzz
except Exception:
    from fuzzywuzzy import process, fuzz  # type: ignore

from entity_index import EntityIndex
from fuzzy_match import FuzzyMatcher
from intent_extractor import extract_intent

# ── constants ─────────────────────────────────────────────────────────────────

MAX_SUGGESTION_ENTITIES = 4
MAX_QUERY_TOKENS        = 20


# ── main class ────────────────────────────────────────────────────────────────

class EntityResolver:
    """
    Resolves natural-language queries into structured location + intent dicts.

    Every call to resolve() returns a dict with at minimum:
        status          — "resolved" | "ambiguous" | "suggest" | "not_found"
        intents         — list of detected intent strings (may be empty)
        intent_status   — "resolved" | "ambiguous" | "not_found"

    Additional keys depend on status:
        resolved  → entities: List[Dict]
        ambiguous → options:  List[Dict],  message: str
        suggest   → options:  List[Dict],  message: str
        not_found → message:  str
    """

    def __init__(self, json_path: str):
        self.idx     = EntityIndex(json_path)
        self.matcher = FuzzyMatcher(self.idx)

    # ── public delegation (keeps existing callers working) ────────────────────

    def normalize(self, text: str) -> str:
        return self.idx.normalize(text)

    # ── internal: deduplication ───────────────────────────────────────────────

    def _entity_dedupe_key(self, entity: Dict) -> str:
        return "|".join([
            entity.get("type",     ""),
            entity.get("state",    ""),
            entity.get("district", ""),
            entity.get("block",    ""),
        ]).strip("|")

    def _dedupe_entities(self, entities: List[Dict]) -> List[Dict]:
        seen: set = set()
        out:  List[Dict] = []
        for e in entities:
            k = self._entity_dedupe_key(e)
            if k not in seen:
                seen.add(k)
                out.append(e)
        return out

    # ── internal: intent attachment ───────────────────────────────────────────

    def _attach_intent(self, response: Dict, query: str) -> Dict:
        """
        Calls intent_extractor.extract_intent() and merges its output into
        the resolver response dict.

        Keys added to every response:
            intents        — e.g. ["comparison", "extraction"]
            intent_status  — "resolved" | "ambiguous" | "not_found"

        The old single-string "intent" key ("resolve_location") is gone.
        Resolution status under "status" is never touched.
        """
        result = extract_intent(query)
        response["intents"]       = result["intents"]
        response["intent_status"] = result["intent_status"]
        return response

    # ── internal: lazy type-keyed cache for fuzzy stage ───────────────────────

    def _get_keys_by_type(self) -> Dict[str, List[str]]:
        if not hasattr(self, "_keys_by_type_cache"):
            cache: Dict[str, List[str]] = {"state": [], "district": [], "block": []}
            for key, ents in self.idx.entity_index_flat.items():
                for t in {e.get("type") for e in ents if e.get("type")}:
                    if t in cache:
                        cache[t].append(key)
            self._keys_by_type_cache = cache
        return self._keys_by_type_cache

    # ── main resolve pipeline ─────────────────────────────────────────────────

    def resolve(self, query: str) -> Dict:
        """
        Resolve a natural-language query into location entities + intents.

        Pipeline stages (returns as soon as a stage produces a result):

            Stage 0 — exact token-subsequence match over the full index
            Stage 1 — pattern-based mention extraction ("<name> district" etc.)
            Stage 2 — state-context disambiguation for ambiguous hits
            Stage 3 — fuzzy suggestions for misspellings / unknown mentions
            Stage 4 — clean exact hit (fallthrough from stages 1-2)
        """

        # ── guard + normalise ─────────────────────────────────────────────────
        query      = " ".join(query.split()[:MAX_QUERY_TOKENS])
        query_norm = self.idx.normalize(query)

        # ── infer which admin types the user is asking about ──────────────────
        def infer_types() -> List[str]:
            types: List[str] = []
            if re.search(r"\bdistricts?\b", query_norm): types.append("district")
            if re.search(r"\bblocks?\b",    query_norm): types.append("block")
            if re.search(r"\bstates?\b",    query_norm): types.append("state")
            return types or ["state", "district", "block"]

        mentioned_types = infer_types()
        dedupe          = self._dedupe_entities

        # ══════════════════════════════════════════════════════════════════════
        # STAGE 0 — exact token-subsequence match
        #
        # Uses FuzzyMatcher.extract_entities() which does greedy longest-match
        # over the prebuilt keys_by_first_token index.
        # Handles: "in Punjab", "Nagpur district", multi-location queries.
        # ══════════════════════════════════════════════════════════════════════

        resolved_exact:  List[Dict] = []
        ambiguous_exact: List[Dict] = []

        extracted_keys = self.matcher.extract_entities(query_norm)

        if extracted_keys:
            padded_q = f" {query_norm} "

            for key in extracted_keys:
                candidates = self.idx.entity_index_flat.get(key, [])
                if not candidates:
                    continue

                # single match — unambiguous
                if len(candidates) == 1:
                    resolved_exact.append(candidates[0])
                    continue

                # multiple types share the same name — narrow by nearby keywords
                narrowed = candidates

                if (
                    re.search(rf"{re.escape(key)}\s+districts?\b", query_norm)
                    or re.search(rf"districts?\s+{re.escape(key)}\b", query_norm)
                ):
                    narrowed = [e for e in narrowed if e.get("type") == "district"]

                elif (
                    re.search(rf"{re.escape(key)}\s+blocks?\b", query_norm)
                    or re.search(rf"blocks?\s+{re.escape(key)}\b", query_norm)
                ):
                    narrowed = [e for e in narrowed if e.get("type") == "block"]

                elif (
                    re.search(rf"{re.escape(key)}\s+states?\b", query_norm)
                    or re.search(rf"states?\s+{re.escape(key)}\b", query_norm)
                ):
                    narrowed = [e for e in narrowed if e.get("type") == "state"]

                # "... in <key>" pattern — prefer state interpretation
                if len(narrowed) > 1 and (
                    f" in {key} "  in padded_q
                    or f" for {key} " in padded_q
                    or f" at {key} "  in padded_q
                ):
                    state_only = [e for e in narrowed if e.get("type") == "state"]
                    if len(state_only) == 1:
                        narrowed = state_only

                if len(narrowed) == 1:
                    resolved_exact.append(narrowed[0])
                else:
                    ambiguous_exact.extend(narrowed)

        # stage 0 produced something — handle immediately
        if resolved_exact or ambiguous_exact:

            # try to collapse ambiguity using an already-resolved state
            if ambiguous_exact and resolved_exact:
                inferred_states = {
                    e.get("state") for e in resolved_exact if e.get("state")
                }
                if len(inferred_states) == 1:
                    dis = [
                        e for e in ambiguous_exact
                        if e.get("state") == next(iter(inferred_states))
                    ]
                    if dis:
                        resolved_exact.extend(dis)
                        ambiguous_exact = []

            if ambiguous_exact:
                return self._attach_intent({
                    "status":      "ambiguous",
                    "message":     "Multiple matches found. Please clarify which location you mean.",
                    "options":     dedupe(ambiguous_exact),
                    "description": "Your query matches more than one possible location. "
                                   "Select the correct option(s) to continue.",
                }, query)

            return self._attach_intent({
                "status":      "resolved",
                "entities":    dedupe(resolved_exact),
                "description": f"Resolved {len(resolved_exact)} location(s) from your query.",
            }, query)

        # ══════════════════════════════════════════════════════════════════════
        # STAGE 1 — pattern-based mention extraction
        #
        # Matches "<name tokens> district|block|state" patterns explicitly.
        # Falls back to n-gram exact lookup when no pattern matches.
        # ══════════════════════════════════════════════════════════════════════

        def extract_mentions() -> List[Tuple[str, str]]:
            mentions: List[Tuple[str, str]] = []
            max_name_tokens   = 4
            stopwords_in_name = {
                "and", "or", "of", "the", "a", "an",
                "between", "level", "extraction", "compare", "for",
            }
            for t in mentioned_types:
                pattern = rf"([a-z0-9]+(?:\s+[a-z0-9]+){{0,{max_name_tokens - 1}}})\s+{t}s?\b"
                for m in re.finditer(pattern, query_norm):
                    raw_name = m.group(1).strip()
                    if not raw_name:
                        continue
                    tokens   = raw_name.split()
                    filtered = [tok for tok in tokens if tok not in stopwords_in_name]
                    name     = " ".join((filtered or tokens)[-max_name_tokens:]).strip()
                    mentions.append((t, name))

            # dedupe while preserving order
            seen: set = set()
            out:  List[Tuple[str, str]] = []
            for item in mentions:
                if item not in seen:
                    seen.add(item)
                    out.append(item)
            return out

        mentions            = extract_mentions()
        resolved_entities:  List[Dict] = []
        ambiguous_entities: List[Dict] = []
        unknown_mentions:   List[Tuple[str, str]] = []

        if mentions:
            # exact lookup for each explicit mention
            for ent_type, name in mentions:
                key     = self.idx.normalize(name)
                matches = [
                    e for e in self.idx.entity_index_flat.get(key, [])
                    if e.get("type") == ent_type
                ]
                if len(matches) == 1:
                    resolved_entities.append(matches[0])
                elif len(matches) > 1:
                    ambiguous_entities.extend(matches)
                else:
                    unknown_mentions.append((ent_type, key))

        else:
            # no explicit type keywords — try n-gram exact match across all types
            tokens = query_norm.split()
            stopwords = {
                "compare", "between", "and", "or", "of", "the", "a", "an",
                "level", "extraction", "extracted", "for",
                "district", "block", "state",
            }
            seen_cands: set = set()
            for k in range(3, 0, -1):
                for i in range(len(tokens) - k + 1):
                    cand_tokens = tokens[i:i + k]
                    if any(t in stopwords for t in cand_tokens):
                        continue
                    cand = " ".join(cand_tokens).strip()
                    if len(cand) < 2 or cand in seen_cands:
                        continue
                    seen_cands.add(cand)
                    for ent_type in mentioned_types:
                        matches = [
                            e for e in self.idx.entity_index_flat.get(cand, [])
                            if e.get("type") == ent_type
                        ]
                        if len(matches) == 1:
                            resolved_entities.append(matches[0])
                        elif len(matches) > 1:
                            ambiguous_entities.extend(matches)

        # ══════════════════════════════════════════════════════════════════════
        # STAGE 2 — state-context disambiguation
        #
        # If we have at least one cleanly resolved entity whose state is known,
        # use that state to filter out wrong-state ambiguous candidates.
        # Only applied when exactly one state is implied (safe assumption).
        # ══════════════════════════════════════════════════════════════════════

        if ambiguous_entities and resolved_entities:
            inferred_states = {
                e.get("state") for e in resolved_entities if e.get("state")
            }
            if len(inferred_states) == 1:
                dis = [
                    e for e in ambiguous_entities
                    if e.get("state") == next(iter(inferred_states))
                ]
                if dis:
                    resolved_entities.extend(dis)
                    ambiguous_entities = []

        if ambiguous_entities:
            return self._attach_intent({
                "status":      "ambiguous",
                "message":     "Multiple matches found. Please clarify.",
                "options":     dedupe(ambiguous_entities),
                "description": "Your query matches more than one possible location. "
                               "Select the option that matches your intended state/district/block.",
            }, query)

        # ══════════════════════════════════════════════════════════════════════
        # STAGE 3 — fuzzy suggestions for unknown / misspelled mentions
        #
        # Only reached when stage 1 produced unknown_mentions (names that
        # matched a type keyword but had no exact entry in the index).
        # Uses rapidfuzz WRatio with a 3-char prefix filter for speed.
        # ══════════════════════════════════════════════════════════════════════

        if unknown_mentions:
            FUZZY_SUGGESTION_CUTOFF = 85
            keys_by_type            = self._get_keys_by_type()
            suggestion_entities: List[Dict] = []
            fuzzy_ambiguous:     List[Dict] = []

            for ent_type, mention_key in unknown_mentions:
                keys   = keys_by_type.get(ent_type, [])
                if not keys:
                    continue

                prefix  = mention_key[:3] if len(mention_key) >= 3 else mention_key
                matches = process.extract(
                    mention_key, keys, scorer=fuzz.WRatio, limit=5
                )

                for m in matches:
                    key, score = (m[0], m[1]) if len(m) >= 2 else (None, 0)
                    if not key or score < FUZZY_SUGGESTION_CUTOFF:
                        continue
                    if not str(key).startswith(prefix):
                        continue

                    cands = [
                        e for e in self.idx.entity_index_flat.get(key, [])
                        if e.get("type") == ent_type
                    ]
                    if len(cands) > 1:
                        fuzzy_ambiguous.extend(cands)
                    elif len(cands) == 1:
                        suggestion_entities.append(cands[0])

            # one last disambiguation attempt using resolved context
            if fuzzy_ambiguous and resolved_entities:
                inferred_states = {
                    e.get("state") for e in resolved_entities if e.get("state")
                }
                if len(inferred_states) == 1:
                    dis = [
                        e for e in fuzzy_ambiguous
                        if e.get("state") == next(iter(inferred_states))
                    ]
                    if dis:
                        resolved_entities.extend(dis)
                        fuzzy_ambiguous = []

            if fuzzy_ambiguous:
                return self._attach_intent({
                    "status":      "ambiguous",
                    "message":     "Multiple matches found. Please clarify.",
                    "options":     dedupe(fuzzy_ambiguous),
                    "description": "Some locations are ambiguous due to similar spellings/names. "
                                   "Choose the intended one(s).",
                }, query)

            if suggestion_entities:
                return self._attach_intent({
                    "status":      "suggest",
                    "message":     "Did you mean one of these?",
                    "options":     dedupe(suggestion_entities)[:MAX_SUGGESTION_ENTITIES],
                    "description": "No exact match found, but these look close to what you typed.",
                }, query)

            # mentions existed but nothing matched at all
            if resolved_entities:
                return self._attach_intent({
                    "status":      "not_found",
                    "message":     "Could not match some location names in your query.",
                    "description": "Partial resolution — some location names were unrecognised.",
                }, query)

            return self._attach_intent({
                "status":  "not_found",
                "message": "Could not find any matching location. Please clarify.",
            }, query)

        # ══════════════════════════════════════════════════════════════════════
        # STAGE 4 — clean exact hit
        # ══════════════════════════════════════════════════════════════════════

        if resolved_entities:
            return self._attach_intent({
                "status":   "resolved",
                "entities": dedupe(resolved_entities),
            }, query)

        return self._attach_intent({
            "status":      "not_found",
            "message":     "Could not find any matching location. Please clarify.",
            "description": "No known state/district/block names matched your query. "
                           "Try spelling the location exactly or include more context.",
        }, query)