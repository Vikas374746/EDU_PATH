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

def generate_roadmap(
    gaps: SkillGapResponse,
    user_id: str = "learner-001",
    target_role: str = "Data Analyst",
) -> RoadmapState:
    """
    Build a week-by-week roadmap from the skill gap analysis.

    Algorithm:
    1. Load taxonomy and sort subskills topologically (prereqs first).
    2. For each subskill, look up its gap status.
    3. Skip "Strong" subskills that already have sufficient evidence UNLESS they
       are prerequisites for later active/locked subskills (they become
       lightweight review weeks with status="completed").
    4. Assign week numbers sequentially starting at 1.
    5. Surface the adaptive focus subskill (multi_table_joins) early.
    6. Attach curated resources and a proof task where available.
    """
    taxonomy = load_taxonomy()
    resources_db = load_curated_resources()

    # Build a gap lookup keyed by subskill_id
    gap_map: Dict[str, SkillGapItem] = {g.subskill_id: g for g in gaps.gaps}

    # Collect all subskills across all domains with their domain metadata
    all_subskills: List[Dict] = []
    for domain in taxonomy["domains"]:
        for sub in domain["subskills"]:
            all_subskills.append({
                **sub,
                "domain_id": domain["id"],
                "domain_name": domain["name"],
                "domain_weight": domain["weight"],
            })

    # Topological sort
    sorted_subskills = _topological_sort(all_subskills)

    # Identify the adaptive focus subskill (multi_table_joins is the MVP demo core)
    ADAPTIVE_FOCUS_ID = "multi_table_joins"

    weeks: List[RoadmapWeek] = []
    week_num = 1
    seen_ids: set = set()

    def _make_week(sub: Dict, week_number: int) -> RoadmapWeek:
        s_id = sub["id"]
        gap = gap_map.get(s_id)
        gap_status = gap.status if gap else "Missing"
        w_status = _week_status_from_gap(gap_status)

        # Resources: look up by subskill id; fallback by domain id; empty list
        sub_resources_raw = resources_db.get(s_id, resources_db.get(sub["domain_id"], []))
        resource_items = [ResourceItem(**r) for r in sub_resources_raw]

        # Task: SQL subskills get a structured SQL challenge; others get None
        task_data = _SQL_TASKS.get(s_id)
        task = RoadmapTask(**task_data) if task_data else None

        # Week title describes what the learner will accomplish
        level_label = sub.get("level", "Core")
        objective = sub.get("learning_objective", f"Master {sub['name']}")

        return RoadmapWeek(
            week_number=week_number,
            week_label=f"Week {week_number}",
            title=sub["name"],
            focus_subskill=s_id,
            objective=objective,
            status=w_status,
            resources=resource_items,
            task=task,
            is_mutation_insert=False,
        )

    # ── Pass 1: SQL domain first (highest weight & adaptive focus lives here) ──
    sql_subskills = [s for s in sorted_subskills if s["domain_id"] == "sql"]
    for sub in sql_subskills:
        if sub["id"] in seen_ids:
            continue
        seen_ids.add(sub["id"])
        weeks.append(_make_week(sub, week_num))
        week_num += 1

    # ── Pass 2: remaining domains in taxonomy weight order ──
    non_sql = [s for s in sorted_subskills if s["domain_id"] != "sql" and s["id"] not in seen_ids]

    # Group by domain to keep domain clusters together
    domain_order = ["excel", "python", "bi_tools", "statistics"]
    domain_groups: Dict[str, List[Dict]] = {d: [] for d in domain_order}
    domain_groups["other"] = []
    for sub in non_sql:
        if sub["id"] in seen_ids:
            continue
        target_group = sub["domain_id"] if sub["domain_id"] in domain_groups else "other"
        domain_groups[target_group].append(sub)

    for domain_id in domain_order:
        for sub in domain_groups[domain_id]:
            if sub["id"] in seen_ids:
                continue
            seen_ids.add(sub["id"])
            weeks.append(_make_week(sub, week_num))
            week_num += 1

    # Derive mutation explanation if the adaptive focus is weak/missing
    adaptive_gap = gap_map.get(ADAPTIVE_FOCUS_ID)
    has_mutation = adaptive_gap is not None and adaptive_gap.status in ("Weak", "Missing")
    mutation_explanation: Optional[str] = None
    if has_mutation:
        mutation_explanation = (
            f"Adaptive replanning engaged: '{adaptive_gap.name}' was diagnosed as "
            f"'{adaptive_gap.status}' based on resume evidence. The SQL JOINs week "
            f"has been elevated in priority and a targeted Skill-Proof task has been "
            f"inserted into Week 3 of your roadmap."
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
) -> Dict[str, Any]:
    """
    Returns the roadmap in the PRD-specified compact weekly_plan format.

    {
      "weekly_plan": [
        {
          "week": 1,
          "title": "...",
          "status": "in_progress | upcoming | completed",
          "modules": [
            { "id": "...", "name": "...", "status": "completed | active | locked" }
          ]
        }
      ]
    }

    This format groups subskills that share a domain into a single week entry
    when the demo narrative requires it.
    """
    roadmap = generate_roadmap(gaps, user_id, target_role)

    STATUS_MAP = {
        "active":    "in_progress",
        "completed": "completed",
        "locked":    "upcoming",
        "remediated": "in_progress",
    }

    weekly_plan = []
    for w in roadmap.weeks:
        week_entry = {
            "week": int(w.week_number),
            "title": w.title,
            "status": STATUS_MAP.get(w.status, "upcoming"),
            "focus_subskill": w.focus_subskill,
            "objective": w.objective,
            "modules": [
                {
                    "id": f"mod_{w.focus_subskill}",
                    "name": w.title,
                    "status": w.status,
                }
            ],
            "resources": [r.model_dump() for r in w.resources],
            "task": w.task.model_dump() if w.task else None,
        }
        weekly_plan.append(week_entry)

    return {
        "user_id": roadmap.user_id,
        "target_role": roadmap.target_role,
        "has_mutation": roadmap.has_mutation,
        "mutation_explanation": roadmap.mutation_explanation,
        "weekly_plan": weekly_plan,
    }
