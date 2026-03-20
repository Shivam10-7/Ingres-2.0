import json
import logging
import re
from functools import lru_cache
from typing import List, Dict, Tuple, Optional

try:
    from rapidfuzz import process, fuzz  # pyright: ignore[reportMissingImports]
except Exception:
    from fuzzywuzzy import process, fuzz

logger = logging.getLogger(__name__)

MAX_QUERY_TOKENS = 20
FUZZY_SCORE_CUTOFF = 90
DIRECT_FUZZY_SCORE_CUTOFF = 96
MAX_NGRAM_SIZE = 3
MAX_FUZZY_KEYS_TO_CONSIDER = 4
MAX_SUGGESTION_ENTITIES = 4


class EntityResolver:

    def __init__(self, json_path: str):
        with open(json_path, "r") as f:
            self.data = json.load(f)

        # Multi-level index
        self.entity_index = {
            "state": {},
            "district": {},
            "block": {}
        }

        self.entity_index_flat = {}  # for global lookup
        self._build_index()
        self.all_keys = list(self.entity_index_flat.keys())

        # Used for exact matching by first token.
        self.keys_by_first_token: Dict[str, List[str]] = {}
        for key in self.all_keys:
            parts = key.split()
            if not parts:
                continue
            self.keys_by_first_token.setdefault(parts[0], []).append(key)

    # ─────────────────────────────
    # TEXT PROCESSING
    # ─────────────────────────────
    def normalize(self, text: str) -> str:
        s = (text or "").lower().strip()
        s = s.replace("&", " and ")
        s = re.sub(r"[^a-z0-9\s]", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def _tokenize(self, text: str) -> List[str]:
        return self.normalize(text).split()

    def _ngrams(self, tokens: List[str]) -> List[str]:
        # Keep n-gram generation bounded, but do not truncate too aggressively.
        tokens = tokens[:MAX_QUERY_TOKENS]
        n = len(tokens)
        out = []
        for k in range(1, min(MAX_NGRAM_SIZE, n) + 1):
            for i in range(n - k + 1):
                out.append(" ".join(tokens[i:i + k]))
        return out

    def _guard_input(self, query: str) -> str:
        tokens = query.split()
        return " ".join(tokens[:MAX_QUERY_TOKENS])

    # ─────────────────────────────
    # INDEX BUILDING
    # ─────────────────────────────
    def _add_to_index(self, key: str, entity: Dict):
        self.entity_index_flat.setdefault(key, []).append(entity)

    def _build_index(self):
        for state in self.data["states"]:
            s_name = self.normalize(state["name"])

            state_obj = {"type": "state", "state": state["name"]}
            self.entity_index["state"].setdefault(s_name, []).append(state_obj)
            self._add_to_index(s_name, state_obj)

            for district in state["districts"]:
                d_name = self.normalize(district["name"])

                district_obj = {
                    "type": "district",
                    "district": district["name"],
                    "state": state["name"]
                }

                self.entity_index["district"].setdefault(d_name, []).append(district_obj)
                self._add_to_index(d_name, district_obj)

                for block in district["assessmentUnits"]:
                    b_name = self.normalize(block["name"])

                    block_obj = {
                        "type": "block",
                        "block": block["name"],
                        "district": district["name"],
                        "state": state["name"]
                    }

                    self.entity_index["block"].setdefault(b_name, []).append(block_obj)
                    self._add_to_index(b_name, block_obj)

    # ─────────────────────────────
    # ENTITY EXTRACTION
    # ─────────────────────────────
    def extract_entities(self, query: str) -> List[str]:
        """
        Exact entity extraction by token subsequence matching.

        This fixes issues where exact mentions were missed due to aggressive
        token/ngram truncation, causing the resolver to incorrectly fall back
        to fuzzy "suggest" mode.
        """
        query = self.normalize(query)
        q_tokens = query.split()
        if not q_tokens:
            return []

        first_tokens = set(q_tokens)

        # Candidate keys share the same first token as some token in the query.
        candidate_keys = set()
        for ft in first_tokens:
            for k in self.keys_by_first_token.get(ft, []):
                candidate_keys.add(k)

        spans: List[Tuple[int, int, int, str]] = []
        for key in candidate_keys:
            k_tokens = key.split()
            if not k_tokens or len(k_tokens) > len(q_tokens):
                continue

            for i in range(0, len(q_tokens) - len(k_tokens) + 1):
                if q_tokens[i:i + len(k_tokens)] == k_tokens:
                    spans.append((i, i + len(k_tokens), len(k_tokens), key))
                    break

        # Greedy longest non-overlapping match selection.
        # This prevents cases like extracting `NICOBAR` from inside
        # `ANDAMAN AND NICOBAR ISLANDS` when the longer match exists.
        spans.sort(key=lambda s: (-s[2], s[0]))  # length desc, then start asc
        occupied = [False] * len(q_tokens)
        selected: List[Tuple[int, int, int, str]] = []
        for start, end, length, key in spans:
            if any(occupied[idx] for idx in range(start, end)):
                continue
            for idx in range(start, end):
                occupied[idx] = True
            selected.append((start, end, length, key))

        # Order selected keys by first appearance.
        selected.sort(key=lambda s: s[0])
        return [s[3] for s in selected]

    def _entity_dedupe_key(self, entity: Dict) -> str:
        return "|".join([
            entity.get("type", ""),
            entity.get("state", ""),
            entity.get("district", ""),
            entity.get("block", ""),
        ]).strip("|")

    def _dedupe_entities(self, entities: List[Dict]) -> List[Dict]:
        seen = set()
        out = []
        for e in entities:
            k = self._entity_dedupe_key(e)
            if k in seen:
                continue
            seen.add(k)
            out.append(e)
        return out

    def _filter_entities_by_state(self, entities: List[Dict], state_context: Optional[str]) -> List[Dict]:
        if not state_context:
            return entities
        filtered = [e for e in entities if e.get("state") == state_context]
        return filtered if filtered else entities

    # ─────────────────────────────
    # CONTEXT DETECTION
    # ─────────────────────────────
    def extract_state_context(self, query: str):
        query = self.normalize(query)
        for state in self.entity_index["state"]:
            if state in query:
                return state
        return None

    # ─────────────────────────────
    # FUZZY MATCH (CACHED)
    # ─────────────────────────────
    @lru_cache(maxsize=1000)
    def fuzzy_match(self, query: str) -> List[Tuple[str, int]]:
        """
        Returns top candidate entity keys with confidence (0-100).
        """
        tokens = self._tokenize(query)

        # Light stopword removal to reduce irrelevant matches.
        # Note: we keep "and" because many locations contain the token "and".
        stopwords = {
            "tell", "me", "about", "please", "show", "find", "where", "which",
            "location", "loc", "entity", "resolver", "resolve", "name",
            "state", "district", "block",
            # Generic words that commonly appear in non-location questions.
            "city", "cities", "town", "village", "place", "places",
        }
        tokens = [t for t in tokens if t not in stopwords and not t.isdigit()]

        candidates: List[str] = []
        if tokens:
            candidates.extend(self._ngrams(tokens))
            candidates.extend(tokens)  # single-token matches

        candidates = [c for c in set(candidates) if c]
        if not candidates:
            candidates = [self.normalize(query)]

        results: Dict[str, int] = {}
        for cand in candidates:
            if len(cand) < 2:
                continue

            cand_tokens = set(cand.split())

            # prefix filter (huge speed boost)
            prefix = cand[:2]
            filtered = [k for k in self.all_keys if prefix and k.startswith(prefix)]

            matches = process.extract(
                cand,
                filtered if filtered else self.all_keys,
                scorer=fuzz.WRatio,
                limit=5
            )

            for match in matches:
                # rapidfuzz returns (name, score, idx) while fuzzywuzzy returns (name, score)
                if len(match) == 3:
                    name, score, _ = match
                elif len(match) == 2:
                    name, score = match
                else:
                    continue

                if score < FUZZY_SCORE_CUTOFF:
                    continue

                # Prevent unrelated suggestions when there is zero token overlap.
                name_tokens = set(str(name).split())
                overlap = cand_tokens & name_tokens
                if not overlap:
                    continue

                # If the only common token is a weak conjunction, it's likely not a real match.
                # This reduces irrelevant suggestions for generic queries containing "and".
                if overlap and all(t == "and" for t in overlap):
                    continue

                results[name] = max(results.get(name, 0), int(score))

        return sorted(results.items(), key=lambda x: x[1], reverse=True)[:MAX_FUZZY_KEYS_TO_CONSIDER]

    # ─────────────────────────────
    # MULTI-LOCATION RESOLUTION
    # ─────────────────────────────
    def resolve(self, query: str) -> Dict:
        query = self._guard_input(query)
        query_norm = self.normalize(query)

        intent = "resolve_location"

        def infer_types() -> List[str]:
            types: List[str] = []
            if re.search(r"\bdistricts?\b", query_norm):
                types.append("district")
            if re.search(r"\bblocks?\b", query_norm):
                types.append("block")
            if re.search(r"\bstates?\b", query_norm):
                types.append("state")
            return types if types else ["state", "district", "block"]

        mentioned_types = infer_types()

        # ─────────────────────────────
        # STAGE 0: Exact multi-location extraction
        # ─────────────────────────────
        # This handles queries that specify locations without explicit type keywords,
        # e.g. "in Punjab", as well as queries that contain multiple locations.
        # It uses token-subsequence matching over the prebuilt index.
        resolved_entities_exact: List[Dict] = []
        ambiguous_entities_exact: List[Dict] = []

        extracted_keys = self.extract_entities(query_norm)
        if extracted_keys:
            padded_q = f" {query_norm} "

            for key in extracted_keys:
                # entity_index_flat maps normalized key -> list of entity dicts
                # IMPORTANT: do not filter by `mentioned_types` here.
                # Example: "districts in Punjab" still needs `Punjab` to resolve as a state.
                candidates = self.entity_index_flat.get(key, [])
                if not candidates:
                    continue

                # If the same name maps to multiple types, try to pick the right one
                # based on nearby keywords. Otherwise, surface as ambiguity.
                if len(candidates) == 1:
                    resolved_entities_exact.append(candidates[0])
                    continue

                # Prefer type indicated directly near the entity name.
                # Note: entity names are already normalized, so spaces/punctuation
                # in the regex are expected to match normalized tokens.
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

                # If still ambiguous, prefer "state" when the query pattern is like
                # "... in <state>" / "... for <state>".
                if len(narrowed) > 1 and (
                    f" in {key} " in padded_q or f" for {key} " in padded_q or f" at {key} " in padded_q
                ):
                    state_only = [e for e in narrowed if e.get("type") == "state"]
                    if len(state_only) == 1:
                        narrowed = state_only

                if len(narrowed) == 1:
                    resolved_entities_exact.append(narrowed[0])
                else:
                    ambiguous_entities_exact.extend(narrowed)

        # If stage 0 produced any result, handle it immediately.
        # This keeps responses consistent for single/multi-location queries.
        if resolved_entities_exact or ambiguous_entities_exact:
            # Disambiguate using already-resolved states (only safe when exactly one state is known).
            if ambiguous_entities_exact and resolved_entities_exact:
                inferred_states = {e.get("state") for e in resolved_entities_exact if e.get("state")}
                if len(inferred_states) == 1:
                    inferred_state = next(iter(inferred_states))
                    disambiguated = [
                        e for e in ambiguous_entities_exact
                        if e.get("state") == inferred_state
                    ]
                    if disambiguated:
                        resolved_entities_exact.extend(disambiguated)
                        ambiguous_entities_exact = []

            if ambiguous_entities_exact:
                return {
                    "status": "ambiguous",
                    "intent": intent,
                    "message": "Multiple matches found. Please clarify which location you mean.",
                    "options": self._dedupe_entities(ambiguous_entities_exact),
                    "description": "Your query matches more than one possible location. Select the correct option(s) to continue."
                }

            return {
                "status": "resolved",
                "intent": intent,
                "entities": self._dedupe_entities(resolved_entities_exact),
                "description": f"Resolved {len(resolved_entities_exact)} location(s) from your query."
            }

        def dedupe_entities(entities: List[Dict]) -> List[Dict]:
            return self._dedupe_entities(entities)

        # Extract patterns like: "<name> district", "<name> block", "<name> state"
        def extract_mentions() -> List[Tuple[str, str]]:
            mentions: List[Tuple[str, str]] = []
            # Allow up to 4 tokens in the name (e.g. "andaman and nicobar" up to 4)
            max_name_tokens = 4
            stopwords_in_name = {
                "and", "or", "of", "the", "a", "an",
                "between", "between", "level", "extraction",
                "compare", "for",
            }
            for t in mentioned_types:
                kw = t
                # Capture: group(1) name tokens immediately before the type keyword
                # Example: "nagpur district" => name="nagpur", type="district"
                pattern = rf"([a-z0-9]+(?:\s+[a-z0-9]+){{0,{max_name_tokens - 1}}})\s+{kw}s?\b"
                for m in re.finditer(pattern, query_norm):
                    raw_name = m.group(1).strip()
                    if not raw_name:
                        continue
                    # Remove common non-name tokens from the capture.
                    # This turns e.g. "of extraction between nagpur" -> "nagpur".
                    tokens = [tok for tok in raw_name.split() if tok]
                    filtered = [tok for tok in tokens if tok not in stopwords_in_name]
                    if filtered:
                        filtered = filtered[-max_name_tokens:]
                        name = " ".join(filtered).strip()
                    else:
                        name = raw_name
                    mentions.append((t, name))

            # Dedupe while preserving order
            seen = set()
            out: List[Tuple[str, str]] = []
            for t, name in mentions:
                key = (t, name)
                if key in seen:
                    continue
                seen.add(key)
                out.append((t, name))
            return out

        mentions = extract_mentions()

        resolved_entities: List[Dict] = []
        ambiguous_entities: List[Dict] = []
        unknown_mentions: List[Tuple[str, str]] = []  # (type, normalized_name)

        # 1) Exact lookup for extracted mentions
        if mentions:
            for ent_type, name in mentions:
                key = self.normalize(name)
                matches = [
                    e for e in self.entity_index_flat.get(key, [])
                    if e.get("type") == ent_type
                ]
                if len(matches) == 1:
                    resolved_entities.append(matches[0])
                elif len(matches) > 1:
                    ambiguous_entities.extend(matches)
                else:
                    unknown_mentions.append((ent_type, key))
        else:
            # Fallback: try exact match by n-grams (when query does not follow
            # the "<name> district" pattern).
            tokens = query_norm.split()
            stopwords = {
                "compare", "between", "and", "or", "of", "the", "a", "an",
                "level", "extraction", "extracted", "for",
                "district", "block", "state",
            }
            candidates: List[str] = []
            max_ngram = 3
            for k in range(max_ngram, 0, -1):
                for i in range(0, len(tokens) - k + 1):
                    cand_tokens = tokens[i:i + k]
                    if any(t in stopwords for t in cand_tokens):
                        continue
                    cand = " ".join(cand_tokens).strip()
                    if len(cand) >= 2:
                        candidates.append(cand)

            seen = set()
            for cand in candidates:
                if cand in seen:
                    continue
                seen.add(cand)
                for ent_type in mentioned_types:
                    matches = [
                        e for e in self.entity_index_flat.get(cand, [])
                        if e.get("type") == ent_type
                    ]
                    if len(matches) == 1:
                        resolved_entities.append(matches[0])
                    elif len(matches) > 1:
                        ambiguous_entities.extend(matches)
                    # If no exact matches for this candidate/type, ignore.

        # 2) If ambiguous, try to disambiguate using already-resolved states
        if ambiguous_entities and resolved_entities:
            inferred_states = {e.get("state") for e in resolved_entities if e.get("state")}
            if len(inferred_states) == 1:
                inferred_state = next(iter(inferred_states))
                disambiguated = [e for e in ambiguous_entities if e.get("state") == inferred_state]
                if disambiguated:
                    resolved_entities.extend(disambiguated)
                    ambiguous_entities = []

        if ambiguous_entities:
            return {
                "status": "ambiguous",
                "intent": intent,
                "message": "Multiple matches found. Please clarify.",
                "options": dedupe_entities(ambiguous_entities),
                "description": "Your query matches more than one possible location. Select the option that matches your intended state/district/block."
            }

        # 3) Fuzzy suggestions for unknown mentions (misspellings)
        if unknown_mentions:
            # Build keys per type (cached) for fuzzy search
            if not hasattr(self, "_keys_by_type_cache"):
                self._keys_by_type_cache = {"state": [], "district": [], "block": []}
                for key, ents in self.entity_index_flat.items():
                    ent_types = {e.get("type") for e in ents if e.get("type")}
                    for t in ent_types:
                        if t in self._keys_by_type_cache:
                            self._keys_by_type_cache[t].append(key)

            FUZZY_SUGGESTION_CUTOFF = 85  # allow common misspellings

            suggestion_entities: List[Dict] = []
            fuzzy_ambiguous: List[Dict] = []

            for ent_type, mention_key in unknown_mentions:
                keys = self._keys_by_type_cache.get(ent_type, [])
                if not keys:
                    continue

                # Simple prefix filter reduces unrelated fuzzy hits (e.g. "nagpurr" -> "pune").
                mention_prefix = mention_key[:3] if len(mention_key) >= 3 else mention_key

                # Pick top fuzzy keys for this mention
                matches = process.extract(
                    mention_key,
                    keys,
                    scorer=fuzz.WRatio,
                    limit=5,
                )

                for m in matches:
                    if len(m) == 3:
                        key, score, _ = m
                    else:
                        key, score = m

                    if score < FUZZY_SUGGESTION_CUTOFF:
                        continue
                    if mention_prefix and not str(key).startswith(mention_prefix):
                        continue

                    cand_entities = [
                        e for e in self.entity_index_flat.get(key, [])
                        if e.get("type") == ent_type
                    ]
                    if len(cand_entities) > 1:
                        fuzzy_ambiguous.extend(cand_entities)
                    elif len(cand_entities) == 1:
                        suggestion_entities.append(cand_entities[0])

            # If fuzzy also introduces ambiguity, try context disambiguation once
            if fuzzy_ambiguous and resolved_entities:
                inferred_states = {e.get("state") for e in resolved_entities if e.get("state")}
                if len(inferred_states) == 1:
                    inferred_state = next(iter(inferred_states))
                    disambiguated = [e for e in fuzzy_ambiguous if e.get("state") == inferred_state]
                    if disambiguated:
                        resolved_entities.extend(disambiguated)
                        fuzzy_ambiguous = []

            if fuzzy_ambiguous:
                return {
                    "status": "ambiguous",
                    "intent": intent,
                    "message": "Multiple matches found. Please clarify.",
                    "options": dedupe_entities(fuzzy_ambiguous),
                    "description": "Some locations are ambiguous due to similar spellings/names. Choose the intended one(s)."
                }

            if suggestion_entities:
                return {
                    "status": "suggest",
                    "intent": intent,
                    "message": "Did you mean one of these?",
                    "options": dedupe_entities(suggestion_entities)[:MAX_SUGGESTION_ENTITIES],
                    "description": "I couldn't find an exact match, but these options look close to what you typed."
                }

            # Mentions were present in query but couldn't be matched at all.
            if resolved_entities:
                return {
                    "status": "not_found",
                    "intent": intent,
                    "message": "Could not find matching locations for some entries in your query.",
                    "description": "I resolved some parts of your query, but other location names could not be matched."
                }

            return {
                "status": "not_found",
                "intent": intent,
                "message": "Could not find any matching location. Please clarify.",
            }

        # 4) If we got exact hits only
        if resolved_entities:
            return {
                "status": "resolved",
                "intent": intent,
                "entities": dedupe_entities(resolved_entities),
            }

        return {
            "status": "not_found",
            "intent": intent,
            "message": "Could not find any matching location. Please clarify.",
            "description": "No known state/district/block names matched your query. Try spelling the location exactly or include more context."
        }