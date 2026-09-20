import json
import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from models import EvidenceRecord

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STORE_FILE = os.path.join(DATA_DIR, "evidence_store.json")

class SkillEvidenceStore:
    def __init__(self):
        self._ensure_store_file()

    def _ensure_store_file(self):
        if not os.path.exists(STORE_FILE):
            with open(STORE_FILE, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read_all(self) -> List[Dict[str, Any]]:
        self._ensure_store_file()
        try:
            with open(STORE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_all(self, items: List[Dict[str, Any]]):
        with open(STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2)

    def record_evidence(
        self,
        user_id: str,
        skill: str,
        subskill: str,
        evidence: str,
        score: int,
        confidence: float,
        weak_concepts: List[str],
        next_action: str
    ) -> EvidenceRecord:
        record = EvidenceRecord(
            id=f"evid-{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            skill=skill,
            subskill=subskill,
            evidence=evidence,
            score=score,
            confidence=round(confidence, 2),
            weak_concepts=weak_concepts,
            next_action=next_action,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
        items = self._read_all()
        items.append(record.model_dump())
        self._write_all(items)
        return record

    def get_user_evidence(self, user_id: str) -> List[EvidenceRecord]:
        items = self._read_all()
        user_items = [i for i in items if i.get("user_id") == user_id]
        return [EvidenceRecord(**i) for i in user_items]

    def get_latest_evidence(self, user_id: str, subskill: Optional[str] = None) -> Optional[EvidenceRecord]:
        records = self.get_user_evidence(user_id)
        if subskill:
            records = [r for r in records if r.subskill == subskill]
        if not records:
            return None
        return records[-1]

    def clear(self, user_id: Optional[str] = None):
        if user_id:
            items = self._read_all()
            remaining = [i for i in items if i.get("user_id") != user_id]
            self._write_all(remaining)
        else:
            self._write_all([])

evidence_store = SkillEvidenceStore()
