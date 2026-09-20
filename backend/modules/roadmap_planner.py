"""
roadmap_planner.py
------------------
Phase 3: Initial Roadmap Generator.

Converts skill gap analysis output into a prioritised, week-by-week learning
plan.  The plan is deterministic (no LLM call required) so it can be exercised
reliably in a demo environment without network dependencies.

Key design decisions
- Weeks are ordered by prerequisite dependency: foundational → core → advanced.
- The adaptive focus subskill (multi_table_joins / SQL JOINs) is always placed
  in the first eligible position so the demo core-loop is immediately visible.
- Each week carries the curated learning resources from the local dataset.
- Module IDs are stable across calls so the frontend can track status changes.
"""

import json
import os
from typing import List, Dict, Any, Optional

from models import (
    RoadmapState,
    RoadmapWeek,
    RoadmapTask,
    ResourceItem,
    SkillGapResponse,
    SkillGapItem,
)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

# ---------------------------------------------------------------------------
# Taxonomy loader
# ---------------------------------------------------------------------------

def load_taxonomy() -> Dict[str, Any]:
    """Load the canonical Data Analyst skill taxonomy."""
    path = os.path.join(DATA_DIR, "data-analyst-skills.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Resource loader
# ---------------------------------------------------------------------------

def load_curated_resources() -> Dict[str, List[Dict]]:
    """Load the local curated resource dataset keyed by subskill_id."""
    path = os.path.join(DATA_DIR, "curated_resources.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Helper: topological sort of subskills by prerequisite graph
# ---------------------------------------------------------------------------

def _topological_sort(subskills: List[Dict]) -> List[Dict]:
    """
    Returns subskills in dependency order (prerequisites before dependents).
    Within the same dependency level, preserves original order so the ontology
    author controls sequencing.
    """
    id_to_sub = {s["id"]: s for s in subskills}
    visited: set = set()
    result: List[Dict] = []

    def visit(sub_id: str) -> None:
        if sub_id in visited:
            return
        visited.add(sub_id)
        for prereq_id in id_to_sub.get(sub_id, {}).get("prerequisites", []):
            if prereq_id in id_to_sub:
                visit(prereq_id)
        if sub_id in id_to_sub:
            result.append(id_to_sub[sub_id])

    for sub in subskills:
        visit(sub["id"])

    return result


# ---------------------------------------------------------------------------
# Helper: choose week status based on gap status
# ---------------------------------------------------------------------------

def _week_status_from_gap(gap_status: str) -> str:
    if gap_status == "Strong":
        return "completed"
    if gap_status in ("Developing", "Weak"):
        return "active"
    return "locked"  # Missing or no evidence


# ---------------------------------------------------------------------------
# Proof-of-skill task generator
# ---------------------------------------------------------------------------

_SQL_TASKS: Dict[str, Dict] = {
    "basic_queries": {
        "id": "task_basic_queries",
        "title": "Single-Table Query Challenge",
        "prompt": (
            "Write a SQL query against the `sales` table to return all orders "
            "placed in 2023 where the total_amount exceeds 500, sorted by "
            "total_amount descending. Alias the amount column as `revenue`."
        ),
        "target_subskill": "basic_queries",
        "type": "sql_challenge",
        "estimated_minutes": 15,
    },
    "aggregations_group_by": {
        "id": "task_aggregations",
        "title": "Aggregation & Grouping Challenge",
        "prompt": (
            "Using the `orders` and `products` tables, calculate the total "
            "revenue per product category for Q1 2024. Only include categories "
            "with total revenue above 10,000. Return category name and total "
            "revenue, sorted highest first."
        ),
        "target_subskill": "aggregations_group_by",
        "type": "sql_challenge",
        "estimated_minutes": 20,
    },
    "multi_table_joins": {
        "id": "task_sql_joins",
        "title": "Multi-Table JOIN Skill Proof",
        "prompt": (
            "Write a SQL query that joins the `customers`, `orders`, and "
            "`products` tables to produce a report showing: customer name, "
            "order date, product name, and line total. Include only customers "
            "who have placed at least one order. Use an INNER JOIN between "
            "customers and orders, and a LEFT JOIN to products so unmatched "
            "product rows are retained."
        ),
        "target_subskill": "multi_table_joins",
        "type": "sql_challenge",
        "estimated_minutes": 25,
    },
    "window_functions": {
        "id": "task_window_functions",
        "title": "Window Function Challenge",
        "prompt": (
            "Write a SQL query using a window function to rank customers by "
            "their total spend within each region. Use RANK() OVER "
            "(PARTITION BY region ORDER BY total_spend DESC). Return customer "
            "name, region, total_spend, and rank."
        ),
        "target_subskill": "window_functions",
        "type": "sql_challenge",
        "estimated_minutes": 30,
    },
}


# ---------------------------------------------------------------------------
# Core roadmap generation
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Core roadmap generation with dynamic pacing and prerequisite progression
# ---------------------------------------------------------------------------

def _normalize_hours_per_week(hours_per_week: Optional[int]) -> int:
    try:
        hours = int(hours_per_week or 10)
    except (TypeError, ValueError):
        hours = 10
    return max(5, min(30, hours))


def get_sprint_title(hours_per_week: int) -> str:
    normalized = _normalize_hours_per_week(hours_per_week)
    if normalized >= 20:
        return "2-Week Fast-Track Sprint"
    if normalized >= 10:
        return "4-Week Standard Sprint"
    return "6-Week Extended Sprint"


def generate_roadmap(
    gaps: SkillGapResponse,
    user_id: str = "learner-001",
    target_role: str = "Data Analyst",
    hours_per_week: int = 10,
) -> RoadmapState:
    """
    Build the roadmap from the learner's latest skill-gap diagnosis instead of a
    static template. The highest-priority weak/missing skills are placed first,
    while remaining skills follow in a logical prerequisite order.
    """
    resources_db = load_curated_resources()
    normalized_hours = _normalize_hours_per_week(hours_per_week)

    def _canonical_id(subskill_id: str) -> str:
        alias_map = {
            "sql_basics": "basic_queries",
            "sql_aggregations": "aggregations_group_by",
            "sql_joins": "multi_table_joins",
            "sql_window_functions": "window_functions",
            "sql_advanced": "window_functions",
            "powerbi_dashboards": "powerbi_modeling",
            "bi_dashboards": "powerbi_modeling",
            "python_r_pandas": "python_pandas",
            "python_viz": "python_pandas",
            "excel": "excel_lookups",
            "excel_formulas": "excel_lookups",
            "powerbi_dax": "powerbi_modeling",
            "stats_descriptive": "basic_queries",
            "stats_ab_testing": "window_functions",
        }
        return alias_map.get(subskill_id, subskill_id)

    gap_map: Dict[str, SkillGapItem] = {}
    for gap in gaps.gaps:
        canonical_id = _canonical_id(gap.subskill_id)
        existing = gap_map.get(canonical_id)
        if existing is None or gap.priority < existing.priority:
            gap_map[canonical_id] = SkillGapItem(**gap.model_dump())
            gap_map[canonical_id].subskill_id = canonical_id

    def _status_rank(status: str) -> int:
        return {"Missing": 0, "Weak": 1, "Developing": 2, "Strong": 3}.get(status, 99)

    def _focus_sort_key(gap: SkillGapItem) -> tuple:
        priority_weight = {
            "multi_table_joins": 0,
            "window_functions": 1,
            "python_pandas": 2,
            "powerbi_modeling": 3,
            "basic_queries": 4,
            "aggregations_group_by": 5,
            "excel_lookups": 6,
        }
        return (
            gap.priority if gap.priority is not None else 99,
            _status_rank(gap.status),
            priority_weight.get(gap.subskill_id, 99),
            gap.name.lower(),
        )

    ordered_gaps = sorted(gap_map.values(), key=_focus_sort_key)
    ordered_ids = []
    for gap in ordered_gaps:
        if gap.subskill_id and gap.subskill_id not in ordered_ids:
            ordered_ids.append(gap.subskill_id)

    fallback_order = [
        "multi_table_joins",
        "window_functions",
        "python_pandas",
        "powerbi_modeling",
        "basic_queries",
        "aggregations_group_by",
        "excel_lookups",
    ]
    for fallback_id in fallback_order:
        if fallback_id not in ordered_ids:
            ordered_ids.append(fallback_id)

    if normalized_hours >= 20:
        focus_ids = ordered_ids[:2]
    elif normalized_hours >= 10:
        focus_ids = ordered_ids[:4]
    else:
        focus_ids = ordered_ids[:6]

    def _friendly_title(subskill_id: str) -> str:
        mapping = {
            "basic_queries": "Basic Queries & Aggregations",
            "aggregations_group_by": "SQL Aggregations & GROUP BY",
            "multi_table_joins": "Relational Multi-Table JOINs",
            "python_pandas": "Python Data Wrangling",
            "powerbi_modeling": "BI & Dashboards: Star Schema Design",
            "window_functions": "Advanced SQL: Window Functions & CTEs",
            "excel_lookups": "Excel Lookups & Data Cleanup",
        }
        return mapping.get(subskill_id, subskill_id.replace("_", " ").title())

    def _objective_for(subskill_id: str) -> str:
        mapping = {
            "basic_queries": "Build single-table query confidence: SELECT, WHERE filters, GROUP BY, and aggregate business metrics.",
            "aggregations_group_by": "Summarize datasets with aggregate functions and grouped business metrics.",
            "multi_table_joins": "Combine multiple tables accurately using INNER and LEFT JOIN logic without Cartesian errors.",
            "python_pandas": "Clean and transform business datasets with Python/Pandas before modeling or dashboarding.",
            "powerbi_modeling": "Design clean business models and dashboards with star schema principles and relationships.",
            "window_functions": "Master analytical SQL: ROW_NUMBER, RANK, running totals with PARTITION BY, and modular CTEs.",
            "excel_lookups": "Strengthen lookup and worksheet logic used for data cleanup, reconciliation, and dashboard prep.",
        }
        return mapping.get(subskill_id, f"Develop capability in {subskill_id} using project-based practice.")

    def _get_res(sub_key: str) -> List[ResourceItem]:
        raw = resources_db.get(sub_key, [])
        return [ResourceItem(**r) for r in raw]

    weeks: List[RoadmapWeek] = []
    for idx, subskill_id in enumerate(focus_ids[: max(1, min(len(focus_ids), 6))], start=1):
        gap = gap_map.get(subskill_id)
        gap_status = gap.status if gap else "Missing"
        week_status = "completed" if gap_status == "Strong" else ("active" if gap_status in ("Weak", "Developing") else "locked")

        task_data = _SQL_TASKS.get(subskill_id)
        task = RoadmapTask(**task_data) if task_data else None
        weeks.append(
            RoadmapWeek(
                week_number=idx,
                week_label=f"Week {idx}",
                title=f"Week {idx}: {_friendly_title(subskill_id)}",
                focus_subskill=subskill_id,
                objective=_objective_for(subskill_id),
                status=week_status,
                resources=_get_res(subskill_id),
                task=task,
                is_mutation_insert=False,
            )
        )

    adaptive_gap = gap_map.get("multi_table_joins")
    has_mutation = adaptive_gap is not None and adaptive_gap.status in ("Weak", "Missing")
    sprint_title = get_sprint_title(normalized_hours)
    mutation_explanation: Optional[str] = None
    if has_mutation:
        target_wk = "Week 1" if normalized_hours >= 20 else ("Week 2" if normalized_hours >= 10 else "Week 3")
        mutation_explanation = (
            f"Adaptive replanning engaged: '{adaptive_gap.name}' was diagnosed as "
            f"'{adaptive_gap.status}' based on resume evidence. The roadmap has been reordered to tackle this gap first in {target_wk} of your {sprint_title}."
        )

    return RoadmapState(
        user_id=user_id,
        target_role=target_role,
        has_mutation=has_mutation,
        mutation_explanation=mutation_explanation,
        weeks=weeks,
    )


# ---------------------------------------------------------------------------
# Alternative compact output format (matches PRD JSON spec exactly)
# ---------------------------------------------------------------------------

def generate_roadmap_compact(
    gaps: SkillGapResponse,
    user_id: str = "learner-001",
    target_role: str = "Data Analyst",
    hours_per_week: int = 10,
) -> Dict[str, Any]:
    """Returns the roadmap in the compact weekly_plan format tuned to the learner's time budget."""
    normalized_hours = _normalize_hours_per_week(hours_per_week)
    roadmap = generate_roadmap(gaps, user_id, target_role, hours_per_week=normalized_hours)
    sprint_title = get_sprint_title(normalized_hours)

    STATUS_MAP = {
        "active": "in_progress",
        "completed": "completed",
        "locked": "upcoming",
        "remediated": "in_progress",
    }

    weekly_plan = []
    for w in roadmap.weeks:
        # Build modules matching the week's composition
        w_status = STATUS_MAP.get(w.status, "upcoming")
        if "SQL Foundations + Relational JOINs" in w.title:
            modules = [
                {"id": "mod_sql_basics", "name": "Basic Queries & Aggregations", "status": "completed"},
                {"id": "mod_sql_joins", "name": "Relational Multi-Table JOINs", "status": "active"}
            ]
        elif "Basic Queries & Aggregations" in w.title:
            modules = [
                {"id": "mod_sql_basics", "name": "Basic Queries & Filtering", "status": "completed"},
                {"id": "mod_sql_aggregations", "name": "Aggregations & GROUP BY", "status": "completed"}
            ]
        elif "Relational Multi-Table JOINs" in w.title:
            modules = [
                {"id": "mod_sql_joins", "name": "Relational Multi-Table JOINs", "status": "active"}
            ]
        elif "Python Data Wrangling & BI Dashboards" in w.title:
            modules = [
                {"id": "mod_python_pandas", "name": "Data Wrangling with Pandas", "status": "upcoming"},
                {"id": "mod_powerbi_modeling", "name": "Data Modeling & Star Schema", "status": "upcoming"}
            ]
        elif "Applied Data Wrangling + Advanced SQL" in w.title:
            modules = [
                {"id": "mod_python_pandas", "name": "Python Data Wrangling with Pandas", "status": "upcoming"},
                {"id": "mod_sql_window", "name": "Advanced SQL: Window Functions & CTEs", "status": "upcoming"}
            ]
        else:
            modules = [
                {
                    "id": f"mod_{w.focus_subskill}",
                    "name": w.title.split(": ", 1)[-1] if ": " in w.title else w.title,
                    "status": w.status,
                }
            ]

        week_entry = {
            "week": int(w.week_number),
            "title": w.title,
            "status": w_status,
            "focus_subskill": w.focus_subskill,
            "objective": w.objective,
            "modules": modules,
            "resources": [r.model_dump() for r in w.resources],
            "task": w.task.model_dump() if w.task else None,
        }
        weekly_plan.append(week_entry)

    return {
        "user_id": roadmap.user_id,
        "target_role": roadmap.target_role,
        "hours_per_week": normalized_hours,
        "sprint_title": sprint_title,
        "has_mutation": roadmap.has_mutation,
        "mutation_explanation": roadmap.mutation_explanation,
        "weekly_plan": weekly_plan,
    }

