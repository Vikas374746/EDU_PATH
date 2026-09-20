"""
SkillForge Core Functional Modules
"""
from modules.evidence_store import evidence_store, SkillEvidenceStore
from modules.resume_analyzer import get_demo_profile, analyze_raw_text, extract_text_from_pdf
from modules.skill_gap_engine import compute_skill_gaps, load_ontology

__all__ = [
    "evidence_store",
    "SkillEvidenceStore",
    "get_demo_profile",
    "analyze_raw_text",
    "extract_text_from_pdf",
    "compute_skill_gaps",
    "load_ontology"
]
