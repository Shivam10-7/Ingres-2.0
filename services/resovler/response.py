"""
response.py
───────────
Owns everything that *constructs* a resolver response dict.

Responsibilities:
    - Entity deduplication
    - Intent attachment (calls intent_extractor.extract_intent)
    - One named builder method per response shape so resolver.py
      never constructs a raw dict itself

Public API:
    builder = ResponseBuilder()
    result  = builder.resolved(entities, query)
    result  = builder.ambiguous(options, query)
    result  = builder.suggest(options, query)
    result  = builder.not_found(query)
    result  = builder.partial(entities, query)
    result  = builder.suggest_with_resolved(entities, options, query)
    result  = builder.partial_with_known(entities, query)
"""

from typing import Dict, List
from intent_extractor import extract_intent


# ── ResponseBuilder ───────────────────────────────────────────────────────────

class ResponseBuilder:
    """
    Builds every response dict that EntityResolver returns.

    All public methods:
        - accept the raw entity lists produced by the resolution pipeline
        - attach intent fields via extract_intent()
        - return a fully-formed response dict

    No resolution logic lives here — this class only shapes and enriches output.
    """

    # ── deduplication ─────────────────────────────────────────────────────────

    @staticmethod
    def _entity_dedupe_key(entity: Dict) -> str:
        return "|".join([
            entity.get("type",     ""),
            entity.get("state",    ""),
            entity.get("district", ""),
            entity.get("block",    ""),
        ]).strip("|")

    @staticmethod
    def dedupe(entities: List[Dict]) -> List[Dict]:
        """Remove duplicate entity dicts, preserving first-seen order."""
        seen: set = set()
        out:  List[Dict] = []
        for e in entities:
            k = ResponseBuilder._entity_dedupe_key(e)
            if k not in seen:
                seen.add(k)
                out.append(e)
        return out

    # ── intent attachment ─────────────────────────────────────────────────────

    @staticmethod
    def _attach_intent(response: Dict, query: str) -> Dict:
        """
        Call intent_extractor.extract_intent() and merge its fields into
        the response dict.

        Fields added:
            intents        — e.g. ["comparison", "extraction"]
            intent_status  — "resolved" | "ambiguous" | "not_found"

        The resolution value under "status" is never modified here.
        """
        result = extract_intent(query)
        response["intents"]       = result["intents"]
        response["intent_status"] = result["intent_status"]
        # Always provide a stable array of already-resolved entities when present.
        # API layer can also project this field, but keeping it here makes the
        # resolver output self-contained.
        if "resolved_entities" not in response:
            response["resolved_entities"] = response.get("entities", [])
        return response

    # ── named response builders ───────────────────────────────────────────────

    def resolved(self, entities: List[Dict], query: str) -> Dict:
        """
        One or more locations matched exactly.

        Shape:
            status        → "resolved"
            entities      → deduplicated list of matched entity dicts
            description   → human-readable summary
            intents       → from intent extractor
            intent_status → from intent extractor
        """
        clean = self.dedupe(entities)
        return self._attach_intent(
            {
                "status":      "resolved",
                "entities":    clean,
                "description": f"Resolved {len(clean)} location(s) from your query.",
            },
            query,
        )

    def ambiguous(self, options: List[Dict], query: str) -> Dict:
        """
        A location name matched more than one entry in the index and could
        not be disambiguated automatically.

        Shape:
            status        → "ambiguous"
            message       → user-facing clarification prompt
            options       → deduplicated list of candidate entity dicts
            description   → explanation
            intents       → from intent extractor
            intent_status → from intent extractor
        """
        return self._attach_intent(
            {
                "status":      "ambiguous",
                "message":     "Multiple matches found. Please clarify which location you mean.",
                "options":     self.dedupe(options),
                "description": "Your query matches more than one possible location. "
                               "Select the correct option(s) to continue.",
            },
            query,
        )

    def suggest(self, options: List[Dict], query: str) -> Dict:
        """
        No exact match, but fuzzy matching found close candidates
        (typically a misspelling).

        Shape:
            status        → "suggest"
            message       → user-facing "did you mean" prompt
            options       → deduplicated list of close-match entity dicts
            description   → explanation
            intents       → from intent extractor
            intent_status → from intent extractor
        """
        return self._attach_intent(
            {
                "status":      "suggest",
                "message":     "Did you mean one of these?",
                "options":     self.dedupe(options),
                "description": "No exact match found, but these look close to what you typed.",
            },
            query,
        )

    def suggest_with_resolved(
        self,
        entities: List[Dict],
        options:  List[Dict],
        query:    str,
    ) -> Dict:
        """
        Multi-clause query where some clauses resolved exactly and others
        only have fuzzy candidates.

        Shape:
            status        → "suggest"
            message       → user-facing prompt asking to confirm unmatched names
            entities      → exactly-resolved locations
            options       → fuzzy candidates for unresolved clauses
            description   → explanation
            intents       → from intent extractor
            intent_status → from intent extractor
        """
        return self._attach_intent(
            {
                "status":      "suggest",
                "message":     "Did you mean one of these for unmatched place name(s)?",
                "entities":    self.dedupe(entities),
                "options":     self.dedupe(options),
                "description": "Some locations matched exactly; others are close spelling matches "
                               "from the database — please confirm.",
            },
            query,
        )

    def partial(self, entities: List[Dict], query: str) -> Dict:
        """
        Multi-clause query where some clauses resolved but one or more
        clauses found nothing at all (not even a fuzzy candidate).

        Shape:
            status        → "not_found"
            entities      → locations that DID resolve
            message       → user-facing notice
            description   → explanation
            intents       → from intent extractor
            intent_status → from intent extractor
        """
        return self._attach_intent(
            {
                "status":      "not_found",
                "entities":    self.dedupe(entities),
                "message":     "Could not match some location names in your query.",
                "description": "Partial resolution — some location names were unrecognised.",
            },
            query,
        )

    def partial_with_known(self, entities: List[Dict], query: str) -> Dict:
        """
        Stage 3 variant: named type keyword was present but could not be
        resolved, while other parts of the query did resolve.

        Shape: identical to partial() — kept as a separate method so call
        sites in resolver.py remain self-documenting.
        """
        return self._attach_intent(
            {
                "status":      "not_found",
                "message":     "Could not match some location names in your query.",
                "description": "Partial resolution — some location names were unrecognised.",
                "entities":    self.dedupe(entities),
            },
            query,
        )

    def not_found(self, query: str, *, with_context: bool = False) -> Dict:
        """
        Nothing matched at all.

        Args:
            with_context: True when a type keyword was present in the query
                          but the name itself was unrecognisable even via fuzzy.
                          Produces a slightly more specific description.

        Shape:
            status        → "not_found"
            message       → user-facing notice
            description   → explanation (varies by with_context)
            intents       → from intent extractor
            intent_status → from intent extractor
        """
        description = (
            "No matching location was found even after fuzzy search. "
            "Try spelling the location exactly or include the state name."
            if with_context
            else
            "No known state/district/block names matched your query. "
            "Try spelling the location exactly or include more context."
        )
        return self._attach_intent(
            {
                "status":      "not_found",
                "message":     "Could not find any matching location. Please clarify.",
                "description": description,
            },
            query,
        )