import re
from functools import lru_cache
from typing import List, Tuple, Dict

try:
    from rapidfuzz import process, fuzz
except Exception:
    from fuzzywuzzy import process, fuzz

from entity_index import EntityIndex

#  tweak these values for optimal results
MAX_QUERY_TOKENS = 20
FUZZY_SCORE_CUTOFF = 90
MAX_NGRAM_SIZE = 3
MAX_FUZZY_KEYS_TO_CONSIDER = 4


class FuzzyMatcher:

    def __init__(self, index: EntityIndex):
        self.index = index

    def _tokenize(self, text: str) -> List[str]:
        return self.index.normalize(text).split()

    def _ngrams(self, tokens: List[str]) -> List[str]:
        tokens = tokens[:MAX_QUERY_TOKENS]
        n = len(tokens)
        out = []
        for k in range(1, min(MAX_NGRAM_SIZE, n) + 1):
            for i in range(n - k + 1):
                out.append(" ".join(tokens[i:i + k]))
        return out

    def extract_entities(self, query: str) -> List[str]:
        query = self.index.normalize(query)
        q_tokens = query.split()
        if not q_tokens:
            return []
        candidate_keys = set()
        for ft in set(q_tokens):
            for k in self.index.keys_by_first_token.get(ft, []):
                candidate_keys.add(k)
        spans = []
        for key in candidate_keys:
            k_tokens = key.split()
            if not k_tokens or len(k_tokens) > len(q_tokens):
                continue
            for i in range(0, len(q_tokens) - len(k_tokens) + 1):
                if q_tokens[i:i + len(k_tokens)] == k_tokens:
                    spans.append((i, i + len(k_tokens), len(k_tokens), key))
                    break
        spans.sort(key=lambda s: (-s[2], s[0]))
        occupied = [False] * len(q_tokens)
        selected = []
        for start, end, length, key in spans:
            if any(occupied[idx] for idx in range(start, end)):
                continue
            for idx in range(start, end):
                occupied[idx] = True
            selected.append((start, end, length, key))
        selected.sort(key=lambda s: s[0])
        return [s[3] for s in selected]

    @lru_cache(maxsize=1000)
    def fuzzy_match(self, query: str) -> List[Tuple[str, int]]:
        tokens = self._tokenize(query)
        stopwords = {
            "tell", "me", "about", "please", "show", "find", "where", "which",
            "location", "loc", "entity", "resolver", "resolve", "name",
            "state", "district", "block", "city", "cities", "town", "village", "place", "places",
        }
        tokens = [t for t in tokens if t not in stopwords and not t.isdigit()]
        candidates = list(set(self._ngrams(tokens) + tokens)) if tokens else [self.index.normalize(query)]
        results: Dict[str, int] = {}
        for cand in candidates:
            if len(cand) < 2:
                continue
            cand_tokens = set(cand.split())
            prefix = cand[:2]
            filtered = [k for k in self.index.all_keys if prefix and k.startswith(prefix)]
            matches = process.extract(cand, filtered if filtered else self.index.all_keys, scorer=fuzz.WRatio, limit=5)
            for match in matches:
                name, score = (match[0], match[1]) if len(match) >= 2 else (None, 0)
                if not name or score < FUZZY_SCORE_CUTOFF:
                    continue
                name_tokens = set(str(name).split())
                overlap = cand_tokens & name_tokens
                if not overlap or all(t == "and" for t in overlap):
                    continue
                results[name] = max(results.get(name, 0), int(score))
        return sorted(results.items(), key=lambda x: x[1], reverse=True)[:MAX_FUZZY_KEYS_TO_CONSIDER]