"""
resolver.py
───────────
Main entry point for location + intent resolution.

Dependencies (all in the same package):
    entity_index.py     — builds lookup tables from db.json
    fuzzy_match.py      — exact token-subsequence + rapidfuzz matching
    intent_extractor.py — keyword / TF-IDF / neural intent detection
    response.py         — deduplication, intent attachment, response builders

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
from response import ResponseBuilder

# ── constants ─────────────────────────────────────────────────────────────────

MAX_SUGGESTION_ENTITIES = 4
MAX_QUERY_TOKENS        = 20

# Stripped from clause fragments before fuzzy matching (noise around place names).
LOCATION_NOISE_TOKENS = {
    "compare", "between", "and", "or", "of", "the", "a", "an",
    "in", "for", "at", "to", "from", "with",
    "level", "levels", "gournd", "ground", "water", "levle",
    "extraction", "extract", "extracted", "data", "show", "give", "me",
    "tell", "what", "how", "is", "are", "please", "this", "that",
    "ok",           # common ASR/typo for "of"
    "groundwater",
    "table",
}

# Split multi-location queries written with commas and/or conjunctions.
# Examples: "pune, nagpur and delhi", "pune or nagpur".
_CLAUSE_SPLIT = re.compile(r"\s*(?:,|\band\b|\bor\b)\s*", re.I)


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

    All response construction is delegated to ResponseBuilder (response.py).
    This class contains only location-finding logic.
    """

    def __init__(self, json_path: str):
        self.idx      = EntityIndex(json_path)
        self.matcher  = FuzzyMatcher(self.idx)
        self.response = ResponseBuilder()

    # ── public delegation (keeps existing callers working) ────────────────────

    def normalize(self, text: str) -> str:
        return self.idx.normalize(text)

    # ── internal: lazy type-keyed cache for stage 3 fuzzy ────────────────────

    def _get_keys_by_type(self) -> Dict[str, List[str]]:
        if not hasattr(self, "_keys_by_type_cache"):
            cache: Dict[str, List[str]] = {"state": [], "district": [], "block": []}
            for key, ents in self.idx.entity_index_flat.items():
                for t in {e.get("type") for e in ents if e.get("type")}:
                    if t in cache:
                        cache[t].append(key)
            self._keys_by_type_cache = cache
        return self._keys_by_type_cache

    # ── internal: clause splitting + noise stripping ──────────────────────────

    def _location_clauses(self, query_norm: str) -> List[str]:
        parts = _CLAUSE_SPLIT.split(query_norm)
        return [p.strip() for p in parts if p.strip()]

    def _strip_location_noise(self, clause: str) -> str:
        toks = self.idx.normalize(clause).split()
        while toks and toks[0] in LOCATION_NOISE_TOKENS:
            toks.pop(0)
        while toks and toks[-1] in LOCATION_NOISE_TOKENS:
            toks.pop()
        return " ".join(toks)

    # ── internal: pick the best representative entity for a matched key ───────

    def _representative_entity_for_key(self, key: str) -> Optional[Dict]:
        ents = self.idx.entity_index_flat.get(key, [])
        if not ents:
            return None
        pref = {"district": 0, "state": 1, "block": 2}
        return sorted(ents, key=lambda e: pref.get(e.get("type"), 9))[0]

    # ── internal: resolve a list of already-extracted exact keys ─────────────

    def _resolve_extracted_keys(
        self,
        extracted_keys: List[str],
        query_norm:     str,
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Given keys confirmed to exist in the index, classify each as
        resolved (single unambiguous entity) or ambiguous (multiple candidates).

        Returns (resolved_list, ambiguous_list).
        Does NOT call ResponseBuilder — classification only.
        """
        resolved:  List[Dict] = []
        ambiguous: List[Dict] = []

        if not extracted_keys:
            return resolved, ambiguous

        padded_q = f" {query_norm} "

        for key in extracted_keys:
            candidates = self.idx.entity_index_flat.get(key, [])
            if not candidates:
                continue

            # single candidate — unambiguous
            if len(candidates) == 1:
                resolved.append(candidates[0])
                continue

            # multiple types share the same normalised name:
            # try to narrow using adjacent type keywords
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

            # "in / for / at <key>" pattern — prefer state interpretation
            if len(narrowed) > 1 and (
                f" in {key} "  in padded_q
                or f" for {key} " in padded_q
                or f" at {key} "  in padded_q
            ):
                state_only = [e for e in narrowed if e.get("type") == "state"]
                if len(state_only) == 1:
                    narrowed = state_only

            if len(narrowed) == 1:
                resolved.append(narrowed[0])
            else:
                ambiguous.extend(narrowed)

        return resolved, ambiguous

    # ── internal: try state-context disambiguation ────────────────────────────

    @staticmethod
    def _disambiguate_by_state(
        resolved:  List[Dict],
        ambiguous: List[Dict],
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        If exactly one state is implied by the resolved set, filter the
        ambiguous list to entries that belong to that state.

        Returns updated (resolved, ambiguous).
        Pure logic — does NOT call ResponseBuilder.
        """
        if not (ambiguous and resolved):
            return resolved, ambiguous

        inferred_states = {e.get("state") for e in resolved if e.get("state")}
        if len(inferred_states) != 1:
            return resolved, ambiguous

        state = next(iter(inferred_states))
        dis   = [e for e in ambiguous if e.get("state") == state]
        if dis:
            return resolved + dis, []
        return resolved, ambiguous

    # ── internal: collect fuzzy suggestion entities from noisy clauses ────────

    def _fuzzy_option_entities_from_clauses(
        self,
        clauses_needing_fuzzy: List[str],
        exclude:               List[Dict],
    ) -> List[Dict]:
        """
        Strip noise tokens from each clause, then run fuzzy_match() to find
        close db.json entries. Returns up to MAX_SUGGESTION_ENTITIES entities,
        excluding any already in `exclude`.
        """
        exclude_k = {
            ResponseBuilder._entity_dedupe_key(e) for e in exclude
        }
        out:       List[Dict] = []
        seen_keys: set        = set()

        for clause in clauses_needing_fuzzy:
            trimmed = self._strip_location_noise(clause)
            if len(trimmed) < 2:
                continue

            pairs = self.matcher.fuzzy_match(trimmed)
            if not pairs:
                continue

            # keep only matches within 1 point of the best score
            best_score = pairs[0][1]
            for key, score in pairs:
                if score < best_score - 1:
                    break
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                ent = self._representative_entity_for_key(key)
                if ent and ResponseBuilder._entity_dedupe_key(ent) not in exclude_k:
                    out.append(ent)
                if len(out) >= MAX_SUGGESTION_ENTITIES:
                    return out

        return out

    # ── internal: last-resort single-clause fuzzy fallback ───────────────────

    def _try_fuzzy_fallback_whole_query(
        self,
        query_norm: str,
        query_raw:  str,
    ) -> Optional[Dict]:
        """
        Called when the main pipeline fully exhausted and found nothing.
        Strips template words from the whole query, then tries exact + fuzzy.

        Returns a response dict or None if still no match.
        """
        trimmed = self._strip_location_noise(query_norm).strip()
        if len(trimmed) < 2:
            return None

        rb     = self.response
        dedupe = rb.dedupe

        # try exact match on the stripped string first
        extracted = self.matcher.extract_entities(trimmed)
        if extracted:
            resolved, ambig = self._resolve_extracted_keys(extracted, query_norm)
            resolved, ambig = dedupe(resolved), dedupe(ambig)
            resolved, ambig = self._disambiguate_by_state(resolved, ambig)

            if ambig:
                return rb.ambiguous(ambig, query_raw)
            if resolved:
                return rb.resolved(resolved, query_raw)

        # fall through to fuzzy
        options = self._fuzzy_option_entities_from_clauses([trimmed], [])
        if options:
            return rb.suggest(dedupe(options)[:MAX_SUGGESTION_ENTITIES], query_raw)

        return None

    # ── internal: multi-clause resolution (queries with "and" / "or") ─────────

    def _try_resolve_multi_clause(
        self,
        query_norm: str,
        query_raw:  str,
    ) -> Optional[Dict]:
        """
        When the query lists multiple places joined by and/or, split into
        clauses and resolve each independently. Exact hits are merged;
        clauses with no exact match get fuzzy suggestions.

        Returns a response dict, or None when there is only one clause
        (caller falls through to the main single-clause pipeline).
        """
        clauses = self._location_clauses(query_norm)
        if len(clauses) < 2:
            return None

        rb     = self.response
        dedupe = rb.dedupe

        resolved_all:  List[Dict] = []
        ambiguous_all: List[Dict] = []
        fuzzy_clauses: List[str]  = []

        for clause in clauses:
            keys = self.matcher.extract_entities(clause)
            if not keys:
                fuzzy_clauses.append(clause)
                continue
            r, a = self._resolve_extracted_keys(keys, query_norm)
            resolved_all.extend(r)
            ambiguous_all.extend(a)

        resolved_all  = dedupe(resolved_all)
        ambiguous_all = dedupe(ambiguous_all)

        # try to collapse ambiguity using resolved state context
        resolved_all, ambiguous_all = self._disambiguate_by_state(
            resolved_all, ambiguous_all
        )

        if ambiguous_all:
            # Keep any already-resolved locations (e.g. Delhi) even when another
            # location is ambiguous (e.g. Nagpur), and still provide fuzzy
            # suggestions for other unmatched clauses (e.g. punee).
            resp = rb.ambiguous(ambiguous_all, query_raw)
            if resolved_all:
                resp["entities"] = resolved_all
            suggestions = self._fuzzy_option_entities_from_clauses(
                fuzzy_clauses, resolved_all
            )
            if suggestions:
                resp["suggestions"] = dedupe(suggestions)[:MAX_SUGGESTION_ENTITIES]
            return resp

        options = self._fuzzy_option_entities_from_clauses(fuzzy_clauses, resolved_all)

        if options and resolved_all:
            return rb.suggest_with_resolved(resolved_all, options, query_raw)

        if options and not resolved_all:
            return rb.suggest(dedupe(options)[:MAX_SUGGESTION_ENTITIES], query_raw)

        if resolved_all and fuzzy_clauses:
            return rb.partial(resolved_all, query_raw)

        if resolved_all:
            return rb.resolved(resolved_all, query_raw)

        return None

    # ── main resolve pipeline ─────────────────────────────────────────────────

    def resolve(self, query: str) -> Dict:
        """
        Resolve a natural-language query into location entities + intents.

        Pipeline (returns at first stage that produces a result):

            Pre-check  — multi-clause split  (and/or queries)
            Stage 0    — exact token-subsequence match over the full index
            Stage 1    — pattern-based mention extraction ("<n> district" etc.)
            Stage 2    — state-context disambiguation
            Stage 3    — fuzzy suggestions for misspelled / unknown mentions
            Stage 4    — clean exact hit (stage 1-2 fallthrough)
            Fallback   — whole-query noise-stripped fuzzy attempt
        """

        # ── guard + normalise ─────────────────────────────────────────────────
        query      = " ".join(query.split()[:MAX_QUERY_TOKENS])
        query_norm = self.idx.normalize(query)

        rb     = self.response
        dedupe = rb.dedupe

        # ── infer which admin types the user is asking about ──────────────────
        def infer_types() -> List[str]:
            types: List[str] = []
            if re.search(r"\bdistricts?\b", query_norm): types.append("district")
            if re.search(r"\bblocks?\b",    query_norm): types.append("block")
            if re.search(r"\bstates?\b",    query_norm): types.append("state")
            return types or ["state", "district", "block"]

        mentioned_types = infer_types()

        # ── pre-check: multi-clause (and / or) queries ────────────────────────
        multi = self._try_resolve_multi_clause(query_norm, query)
        if multi is not None:
            return multi

        # ══════════════════════════════════════════════════════════════════════
        # STAGE 0 — exact token-subsequence match
        #
        # Uses FuzzyMatcher.extract_entities() which does greedy longest-match
        # over the prebuilt keys_by_first_token index.
        # Handles: "in Punjab", "Nagpur district", plain location names.
        # ══════════════════════════════════════════════════════════════════════

        extracted_keys = self.matcher.extract_entities(query_norm)

        if extracted_keys:
            resolved_exact, ambiguous_exact = self._resolve_extracted_keys(
                extracted_keys, query_norm
            )
            resolved_exact, ambiguous_exact = self._disambiguate_by_state(
                resolved_exact, ambiguous_exact
            )

            if ambiguous_exact:
                return rb.ambiguous(ambiguous_exact, query)

            if resolved_exact:
                return rb.resolved(resolved_exact, query)

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

            seen: set = set()
            out:  List[Tuple[str, str]] = []
            for item in mentions:
                if item not in seen:
                    seen.add(item)
                    out.append(item)
            return out

        mentions:           List[Tuple[str, str]] = extract_mentions()
        resolved_entities:  List[Dict]            = []
        ambiguous_entities: List[Dict]            = []
        unknown_mentions:   List[Tuple[str, str]] = []

        if mentions:
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
            # no explicit type keywords — n-gram exact match across all types
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
        # ══════════════════════════════════════════════════════════════════════

        resolved_entities, ambiguous_entities = self._disambiguate_by_state(
            resolved_entities, ambiguous_entities
        )

        if ambiguous_entities:
            return rb.ambiguous(ambiguous_entities, query)

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
                keys = keys_by_type.get(ent_type, [])
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
            _, fuzzy_ambiguous = self._disambiguate_by_state(
                resolved_entities, fuzzy_ambiguous
            )

            if fuzzy_ambiguous:
                return rb.ambiguous(fuzzy_ambiguous, query)

            if suggestion_entities:
                return rb.suggest(
                    dedupe(suggestion_entities)[:MAX_SUGGESTION_ENTITIES], query
                )

            if resolved_entities:
                return rb.partial_with_known(resolved_entities, query)

            return rb.not_found(query, with_context=True)

        # ══════════════════════════════════════════════════════════════════════
        # STAGE 4 — clean exact hit (fallthrough from stages 1-2)
        # ══════════════════════════════════════════════════════════════════════

        if resolved_entities:
            return rb.resolved(resolved_entities, query)

        # ── whole-query fuzzy fallback ────────────────────────────────────────
        fb = self._try_fuzzy_fallback_whole_query(query_norm, query)
        if fb is not None:
            return fb

        return rb.not_found(query)