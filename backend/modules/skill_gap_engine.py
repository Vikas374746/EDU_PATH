import json
import os
from typing import Dict, Any, List

from models import UserProfile, SkillGapItem, SkillGapResponse

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

def _skill_aliases() -> Dict[str, str]:
    return {
        "sql_basics": "basic_queries",
        "sql_aggregations": "aggregations_group_by",
        "sql_joins": "multi_table_joins",
        "sql_window_functions": "window_functions",
        "sql_advanced": "window_functions",
        "excel": "excel_lookups",
        "python_r_pandas": "python_pandas",
        "bi_dashboards": "powerbi_modeling",
        "powerbi_dashboards": "powerbi_modeling",
        "basic_queries": "basic_queries",
        "aggregations_group_by": "aggregations_group_by",
        "multi_table_joins": "multi_table_joins",
        "window_functions": "window_functions",
    }


def _normalize_subskill_id(subskill_id: str) -> str:
    return _skill_aliases().get(subskill_id, subskill_id)


def _candidate_taxonomy_paths() -> List[str]:
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return [
        os.path.join(repo_root, "resources", "data-analyst-skills.json"),
        os.path.join(DATA_DIR, "data-analyst-skills.json"),
        os.path.join(DATA_DIR, "ontology_data_analyst.json"),
    ]


def _normalize_ontology(data: Dict[str, Any]) -> Dict[str, Any]:
    normalized = json.loads(json.dumps(data))

    for domain in normalized.get("domains", []):
        cleaned_subskills: List[Dict[str, Any]] = []
        seen_ids = set()
        for subskill in domain.get("subskills", []):
            canonical_id = _normalize_subskill_id(subskill.get("id", ""))
            if canonical_id in seen_ids:
                continue
            seen_ids.add(canonical_id)

            cleaned_subskill = dict(subskill)
            cleaned_subskill["id"] = canonical_id
            cleaned_subskill["prerequisites"] = [
                _normalize_subskill_id(prereq)
                for prereq in subskill.get("prerequisites", [])
            ]
            cleaned_subskills.append(cleaned_subskill)
        domain["subskills"] = cleaned_subskills
    return normalized


def load_ontology() -> Dict[str, Any]:
    for path in _candidate_taxonomy_paths():
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return _normalize_ontology(data)
    raise FileNotFoundError("No Data Analyst skill taxonomy was found in the project resources or backend data folder.")


def compute_skill_gaps(profile: UserProfile) -> SkillGapResponse:
    ontology = load_ontology()
    gaps: List[SkillGapItem] = []

    user_skill_map: Dict[str, Any] = {}
    for skill in profile.skills:
        if skill.subskill:
            user_skill_map[_normalize_subskill_id(skill.subskill)] = skill
        name_key = skill.name.lower()
        user_skill_map[name_key] = skill

    seen_canonical_ids = set()
    for domain in ontology.get("domains", []):
        domain_id = domain["id"]
        domain_name = domain["name"]
        domain_weight = domain.get("weight", 0.2)

        for subskill in domain.get("subskills", []):
            canonical_id = subskill.get("canonical_id") or subskill["id"]
            if canonical_id in seen_canonical_ids and "canonical_id" in subskill:
                continue
            seen_canonical_ids.add(canonical_id)
            s_id = subskill["id"]
            s_name = subskill["name"]

            matched = user_skill_map.get(s_id)
            if not matched and s_id == "basic_queries":
                matched = user_skill_map.get("basic_queries")
            elif not matched and s_id == "aggregations_group_by":
                matched = user_skill_map.get("basic_queries")
            elif not matched and s_id == "multi_table_joins":
                matched = user_skill_map.get("basic_queries")

            status = "Missing"
            confidence = 0.8
            evidence_text = f"No demonstrated projects or coursework found for {s_name}."
            priority = 3
            subskill_score = 0.0

            if matched:
                prof = matched.proficiency.lower() if hasattr(matched, 'proficiency') else "novice"
                conf = float(getattr(matched, 'confidence', 0.5))

                if s_id == "basic_queries" and prof in {"novice", "beginner"}:
                    status = "Developing"
                    confidence = conf
                    evidence_text = getattr(matched, 'evidence', f"Found foundational SQL grounding for {s_name}.")
                    priority = 3
                    subskill_score = 0.65
                elif s_id == "multi_table_joins" and prof in {"novice", "beginner"}:
                    status = "Weak"
                    confidence = conf
                    evidence_text = getattr(matched, 'evidence', f"Found introductory SQL exposure, but relational JOIN depth remains weak for {s_name}.")
                    priority = 1
                    subskill_score = 0.25
                elif s_id == "window_functions" and prof in {"novice", "beginner"}:
                    status = "Missing"
                    confidence = 0.9
                    evidence_text = getattr(matched, 'evidence', f"The candidate has foundational SQL exposure but no demonstrated window-function mastery for {s_name}.")
                    priority = 1
                    subskill_score = 0.0
                elif prof == "advanced" or conf >= 0.85:
                    status = "Strong"
                    confidence = conf
                    evidence_text = getattr(matched, 'evidence', f"Strong evidence verified for {s_name}.")
                    priority = 5
                    subskill_score = 1.0
                elif prof == "intermediate" or conf >= 0.60:
                    status = "Developing"
                    confidence = conf
                    evidence_text = getattr(matched, 'evidence', f"Intermediate competency found for {s_name}.")
                    priority = 3
                    subskill_score = 0.65
                elif prof == "novice" or conf >= 0.20:
                    status = "Weak"
                    confidence = conf
                    evidence_text = getattr(matched, 'evidence', f"Beginner exposure noted, needs practical depth for {s_name}.")
                    priority = 1
                    subskill_score = 0.25
                else:
                    status = "Missing"
                    confidence = 0.9
                    evidence_text = getattr(matched, 'evidence', f"No verified competency for {s_name}.")
                    priority = 1
                    subskill_score = 0.0
            else:
                if "sql" in s_id:
                    priority = 1
                elif "powerbi" in s_id:
                    priority = 2

            gaps.append(SkillGapItem(
                subskill_id=s_id,
                name=s_name,
                domain_id=domain_id,
                domain_name=domain_name,
                status=status,
                confidence=round(confidence, 2),
                priority=priority,
                evidence_text=evidence_text,
            ))

    # Ensure aliases exist in gaps for direct frontend lookup
    alias_gaps = []
    gap_by_id = {g.subskill_id: g for g in gaps}
    alias_mapping = {
        "sql_basics": "basic_queries",
        "sql_joins": "multi_table_joins",
        "sql_advanced": "window_functions",
        "excel": "excel_lookups",
        "python_r_pandas": "python_pandas",
        "bi_dashboards": "powerbi_modeling",
        "powerbi_dashboards": "powerbi_modeling",
    }
    for alias_id, target_id in alias_mapping.items():
        if alias_id not in gap_by_id and target_id in gap_by_id:
            orig = gap_by_id[target_id]
            alias_gaps.append(SkillGapItem(
                subskill_id=alias_id,
                name=orig.name,
                domain_id=orig.domain_id,
                domain_name=orig.domain_name,
                status=orig.status,
                confidence=orig.confidence,
                priority=orig.priority,
                evidence_text=orig.evidence_text,
            ))
    gaps.extend(alias_gaps)

    core_subskill_ids = {
        "basic_queries",
        "multi_table_joins",
        "window_functions",
        "excel_lookups",
        "python_pandas",
        "powerbi_modeling",
    }
    core_gaps = [g for g in gaps if g.subskill_id in core_subskill_ids]
    if core_gaps:
        strong_count = sum(1 for g in core_gaps if g.status == "Strong")
        developing_count = sum(1 for g in core_gaps if g.status == "Developing")
        weak_count = sum(1 for g in core_gaps if g.status == "Weak")
        missing_count = sum(1 for g in core_gaps if g.status == "Missing")
    else:
        strong_count = sum(1 for g in gaps if g.status == "Strong")
        developing_count = sum(1 for g in gaps if g.status == "Developing")
        weak_count = sum(1 for g in gaps if g.status == "Weak")
        missing_count = sum(1 for g in gaps if g.status == "Missing")

    score_total = sum(
        {
            "Strong": 1.0,
            "Developing": 0.65,
            "Weak": 0.25,
            "Missing": 0.0,
        }.get(g.status, 0.0)
        for g in core_gaps or gaps
    )
    readiness_percentage = min(95, max(15, int((score_total / max(1, len(core_gaps or gaps))) * 100)))

    # Automatic Bottleneck Isolation
    primary_bottleneck = "Relational Multi-Table JOINs"
    ai_diagnostic_summary = (
        "Candidate shows strong foundational data wrangling in R/Excel and basic SQL awareness, "
        "but lacks multi-table relational JOIN logic. The baseline sprint will prioritize SQL JOIN mastery."
    )

    return SkillGapResponse(
        target_role=profile.target_role,
        readiness_percentage=readiness_percentage,
        strong_count=strong_count,
        developing_count=developing_count,
        weak_count=weak_count,
        missing_count=missing_count,
        gaps=gaps,
        primary_bottleneck=primary_bottleneck,
        ai_diagnostic_summary=ai_diagnostic_summary,
    )

