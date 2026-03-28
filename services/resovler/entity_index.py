import json, re
from typing import Dict, List

class EntityIndex:

    def __init__(self, json_path: str):
        with open(json_path, "r") as f:
            self.data = json.load(f)
        self.entity_index = {"state": {}, "district": {}, "block": {}}
        self.entity_index_flat = {}
        self._build_index()
        self.all_keys = list(self.entity_index_flat.keys())
        self.keys_by_first_token: Dict[str, List[str]] = {}
        for key in self.all_keys:
            parts = key.split()
            if parts:
                self.keys_by_first_token.setdefault(parts[0], []).append(key)

    def normalize(self, text: str) -> str:
        s = (text or "").lower().strip()
        s = s.replace("&", " and ")
        s = re.sub(r"[^a-z0-9\s]", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def _add_to_index(self, key: str, entity: dict):
        self.entity_index_flat.setdefault(key, []).append(entity)

    def _build_index(self):
        for state in self.data["states"]:
            s_name = self.normalize(state["name"])
            state_obj = {"type": "state", "state": state["name"]}
            self.entity_index["state"].setdefault(s_name, []).append(state_obj)
            self._add_to_index(s_name, state_obj)
            for district in state["districts"]:
                d_name = self.normalize(district["name"])
                district_obj = {"type": "district", "district": district["name"], "state": state["name"]}
                self.entity_index["district"].setdefault(d_name, []).append(district_obj)
                self._add_to_index(d_name, district_obj)
                for block in district["assessmentUnits"]:
                    b_name = self.normalize(block["name"])
                    block_obj = {"type": "block", "block": block["name"], "district": district["name"], "state": state["name"]}
                    self.entity_index["block"].setdefault(b_name, []).append(block_obj)
                    self._add_to_index(b_name, block_obj)