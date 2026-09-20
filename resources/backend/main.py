import json
import os
import sys
import uuid
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(__file__))

from config import settings
from models.schemas import UserProfile, SkillGapResponse
from modules.evidence_store import evidence_store
from modules.skill_gap_engine import load_ontology, compute_skill_gaps
from modules.resume_analyzer import get_demo_profile, analyze_raw_text, extract_text_from_pdf
from modules.roadmap_planner import generate_roadmap, generate_roadmap_compact

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SkillForge Adaptive Career-Learning Agent Backend API"
)

# In-memory store for active session state
session_state: Dict[str, Any] = {
    "profile": None,
    "gaps": None,
    "roadmap": None,
}

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": "development"
    }

@app.get("/api/ontology")
async def get_ontology():
    """Returns the Data Analyst skill & subskill ontology."""
    try:
        data = load_ontology()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load ontology: {str(e)}")

@app.get("/api/resources")
async def get_resources(subskill: str = "multi_table_joins"):
    """Returns curated learning resources from the local verified JSON dataset."""
    try:
        path = os.path.join(settings.DATA_DIR, "curated_resources.json")
        with open(path, "r", encoding="utf-8") as f:
            resources = json.load(f)

        alias_map = {
            "basic_queries": ["basic_queries", "sql_basics"],
            "aggregations_group_by": ["aggregations_group_by", "sql_aggregations"],
            "multi_table_joins": ["multi_table_joins", "sql_joins"],
            "window_functions": ["window_functions", "sql_window_functions"],
            "sql_joins": ["sql_joins", "multi_table_joins"],
            "sql_basics": ["sql_basics", "basic_queries"],
            "sql_aggregations": ["sql_aggregations", "aggregations_group_by"],
            "sql_window_functions": ["sql_window_functions", "window_functions"],
        }
        candidates = alias_map.get(subskill, [subskill])
        selected = next((resources[key] for key in candidates if key in resources), resources.get(subskill, []))
        return {
            "subskill": subskill,
            "resources": selected,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load resources: {str(e)}")

@app.post("/api/profile/demo")
async def seed_demo_profile():
    """Loads and initializes Priya Sharma's Data Analyst profile and gap analysis."""
    try:
        profile = get_demo_profile()
        session_state["profile"] = profile
        gaps = compute_skill_gaps(profile)
        session_state["gaps"] = gaps

        # Seed initial evidence into store
        for skill in profile.skills:
            if skill.proficiency in ["Advanced", "Intermediate"]:
                evidence_store.record_evidence(
                    user_id=profile.id,
                    skill=skill.category,
                    subskill=skill.subskill or skill.name.lower().replace(" ", "_"),
                    evidence=skill.evidence,
                    score=90 if skill.proficiency == "Advanced" else 65,
                    confidence=skill.confidence,
                    weak_concepts=[],
                    next_action="proceed_with_curriculum"
                )

        return {
            "profile": profile,
            "gaps": gaps
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load demo profile: {str(e)}")

class TextAnalyzeRequest(BaseModel):
    raw_text: str
    name: Optional[str] = "Learner"
    target_role: Optional[str] = "Data Analyst"

@app.post("/api/profile/analyze")
async def analyze_profile_endpoint(
    payload: Optional[TextAnalyzeRequest] = None
):
    """Analyzes raw text resume and calculates skill gaps."""
    try:
        text = payload.raw_text if payload else ""
        name = payload.name if payload and payload.name else "Learner"
        target_role = payload.target_role if payload and payload.target_role else "Data Analyst"

        profile = analyze_raw_text(text, name=name, target_role=target_role)
        session_state["profile"] = profile
        gaps = compute_skill_gaps(profile)
        session_state["gaps"] = gaps

        return {
            "profile": profile,
            "gaps": gaps
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze profile: {str(e)}")

@app.post("/api/profile/upload-pdf")
async def upload_pdf_resume(
    file: UploadFile = File(...),
    name: str = Form("Learner"),
    target_role: str = Form("Data Analyst")
):
    """Uploads and parses a PDF resume."""
    try:
        temp_dir = os.path.join(settings.DATA_DIR, "uploads")
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, file.filename)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        extracted_text = extract_text_from_pdf(file_path)
        profile = analyze_raw_text(extracted_text, name=name, target_role=target_role)
        session_state["profile"] = profile
        gaps = compute_skill_gaps(profile)
        session_state["gaps"] = gaps

        return {
            "filename": file.filename,
            "profile": profile,
            "gaps": gaps
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF resume: {str(e)}")

@app.get("/api/gaps")
async def get_gaps(user_id: str = "priya-101"):
    """Returns the computed skill gap response."""
    if session_state.get("gaps"):
        return session_state["gaps"]
    # Fallback to demo profile computation
    profile = get_demo_profile()
    gaps = compute_skill_gaps(profile)
    session_state["profile"] = profile
    session_state["gaps"] = gaps
    return gaps


# ---------------------------------------------------------------------------
# Phase 2: Unified analyze-gap endpoint
# ---------------------------------------------------------------------------

class AnalyzeGapRequest(BaseModel):
    """Accepts optional raw resume text. When omitted, the demo profile is used."""
    resume_text: Optional[str] = None
    name: Optional[str] = "Learner"
    target_role: Optional[str] = "Data Analyst"


@app.post("/api/profile/analyze-gap")
async def analyze_gap(
    payload: Optional[AnalyzeGapRequest] = None,
    file: Optional[UploadFile] = File(None),
):
    """
    Phase 2 endpoint: profile ingestion + skill gap computation.

    Supports either:
    - JSON body with resume_text + optional target_role/name
    - multipart form upload with a PDF file
    - empty request to load the demo profile
    """
    try:
        if file is not None and file.filename:
            temp_dir = os.path.join(settings.DATA_DIR, "uploads")
            os.makedirs(temp_dir, exist_ok=True)
            temp_path = os.path.join(temp_dir, file.filename)
            with open(temp_path, "wb") as f:
                content = await file.read()
                f.write(content)
            payload_text = extract_text_from_pdf(temp_path)
            name = payload.name if payload and payload.name else "Learner"
            target_role = payload.target_role if payload and payload.target_role else "Data Analyst"
            profile = analyze_raw_text(payload_text, name=name, target_role=target_role)
        elif payload and payload.resume_text and payload.resume_text.strip():
            name = payload.name or "Learner"
            target_role = payload.target_role or "Data Analyst"
            profile = analyze_raw_text(payload.resume_text, name=name, target_role=target_role)
        else:
            profile = get_demo_profile()

        gaps = compute_skill_gaps(profile)
        session_state["profile"] = profile
        session_state["gaps"] = gaps
        session_state["roadmap"] = None

        return {
            "profile": profile,
            "gaps": gaps,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gap analysis failed: {str(e)}")


@app.post("/api/profile/analyze-gap/pdf")
async def analyze_gap_pdf(
    file: UploadFile = File(...),
    name: str = Form("Learner"),
    target_role: str = Form("Data Analyst"),
):
    """
    Phase 2 PDF variant: Upload a PDF resume → extract text → compute gaps.
    """
    try:
        temp_dir = os.path.join(settings.DATA_DIR, "uploads")
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, file.filename)

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        extracted_text = extract_text_from_pdf(file_path)
        profile = analyze_raw_text(extracted_text, name=name, target_role=target_role)
        gaps = compute_skill_gaps(profile)
        session_state["profile"] = profile
        session_state["gaps"] = gaps
        session_state["roadmap"] = None

        return {
            "filename": file.filename,
            "profile": profile,
            "gaps": gaps,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF gap analysis failed: {str(e)}")


# ---------------------------------------------------------------------------
# Phase 3: Roadmap generator endpoint
# ---------------------------------------------------------------------------

class RoadmapGenerateRequest(BaseModel):
    user_id: Optional[str] = None
    target_role: Optional[str] = "Data Analyst"
    # Optionally pass gaps inline (for stateless clients). When omitted,
    # the server uses gaps cached in session_state.
    force_demo: bool = False


@app.post("/api/roadmap/generate")
async def generate_roadmap_endpoint(payload: Optional[RoadmapGenerateRequest] = None):
    """
    Phase 3 endpoint: Generate the initial adaptive learning roadmap.

    Uses the most recently computed skill gaps (from analyze-gap or demo) to
    build a topologically-sorted, week-by-week learning plan.

    Returns both a rich RoadmapState and the PRD-specified compact weekly_plan.
    """
    try:
        # Determine gaps to use
        force_demo = payload.force_demo if payload else False
        user_id = (payload.user_id if payload and payload.user_id else None)
        target_role = (payload.target_role if payload and payload.target_role else "Data Analyst")

        if force_demo or not session_state.get("gaps"):
            profile = get_demo_profile()
            gaps = compute_skill_gaps(profile)
            session_state["profile"] = profile
            session_state["gaps"] = gaps
        else:
            gaps = session_state["gaps"]
            profile = session_state.get("profile")

        effective_user_id = user_id or (profile.id if profile else "learner-001")

        compact = generate_roadmap_compact(
            gaps=gaps,
            user_id=effective_user_id,
            target_role=target_role,
        )

        # Cache for downstream replan calls
        session_state["roadmap"] = compact

        return compact
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")


@app.get("/api/roadmap")
async def get_roadmap(user_id: str = "learner-001"):
    """
    Returns the cached roadmap. Generates from demo profile if none exists.
    """
    if session_state.get("roadmap"):
        return session_state["roadmap"]

    # Auto-generate from demo profile
    profile = get_demo_profile()
    gaps = compute_skill_gaps(profile)
    compact = generate_roadmap_compact(gaps=gaps, user_id=user_id)
    session_state["roadmap"] = compact
    return compact


# ---------------------------------------------------------------------------
# Phase 4-5: Skill Proof + Resource Track
# ---------------------------------------------------------------------------

@app.get("/api/skill-proof/{subskill}")
async def get_skill_proof(subskill: str):
    """Return the curated learning resource and a practical SQL challenge for a target subskill."""
    try:
        target_subskill = subskill if subskill else "multi_table_joins"
        if target_subskill not in {"multi_table_joins", "sql_joins", "basic_queries", "aggregations_group_by", "window_functions"}:
            target_subskill = "multi_table_joins"

        path = os.path.join(settings.DATA_DIR, "curated_resources.json")
        with open(path, "r", encoding="utf-8") as f:
            resources = json.load(f)

        alias_map = {
            "multi_table_joins": "multi_table_joins",
            "sql_joins": "multi_table_joins",
            "basic_queries": "basic_queries",
            "aggregations_group_by": "aggregations_group_by",
            "window_functions": "window_functions",
        }
        resolved = alias_map.get(target_subskill, "multi_table_joins")
        chosen_resource = resources.get(resolved, resources.get("multi_table_joins", []))[0] if resources.get(resolved, resources.get("multi_table_joins", [])) else {
            "id": "res_sql_04",
            "title": "SQL Joins Explained Visually: INNER, LEFT, RIGHT, FULL",
            "author": "Luke Barousse",
            "url": "https://www.youtube.com/watch?v=9jmg_c7N438",
            "type": "video",
            "duration_minutes": 22,
            "difficulty": "Intermediate",
            "reason_selected": "Visual join explanation for multi-table relational SQL queries."
        }

        challenge_prompt = (
            "Write a query combining `users` and `orders` tables to fetch user names and total purchase amounts using LEFT JOIN. "
            "Return the user name and total purchase amount aggregated by user, ordered by total purchase amount descending."
        )

        return {
            "subskill": resolved,
            "resource": chosen_resource,
            "challenge": {
                "id": "challenge_sql_join_01",
                "title": "LEFT JOIN Multi-Table JOIN Skill Proof",
                "prompt": challenge_prompt,
                "target_subskill": resolved,
                "estimated_minutes": 20,
                "type": "sql_challenge",
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load skill proof challenge: {str(e)}")


class DiagnoseRequest(BaseModel):
    user_id: Optional[str] = "priya-101"
    challenge_id: Optional[str] = "challenge_sql_join_01"
    query_text: str = ""


@app.post("/api/evaluation/diagnose")
async def diagnose_skill_submission(payload: DiagnoseRequest):
    """Evaluate a SQL submission against the JOIN rubric and persist evidence."""
    try:
        query = payload.query_text or ""
        lowered = query.lower()

        has_join = "join" in lowered
        has_left_join = "left join" in lowered or "left outer join" in lowered
        has_users = "users" in lowered
        has_orders = "orders" in lowered
        has_aggregation = "sum(" in lowered or "total" in lowered or "count(" in lowered

        weak_concepts: List[str] = []
        if not has_left_join:
            weak_concepts.append("LEFT JOIN required for user-to-order aggregation")
        if not has_users or not has_orders:
            weak_concepts.append("The query should reference both users and orders tables")
        if not has_join:
            weak_concepts.append("Multi-table join syntax is missing")
        if not has_aggregation and (has_users and has_orders):
            weak_concepts.append("Total purchase amounts are not aggregated per user")

        score = 82 if has_left_join and has_users and has_orders and has_join and has_aggregation else 40
        passed = score >= 70
        status = "Strong" if passed else "Weak"

        evidence = evidence_store.record_evidence(
            user_id=payload.user_id or "priya-101",
            skill="SQL & Relational Databases",
            subskill="multi_table_joins",
            evidence=query[:500] if query else "No SQL submitted.",
            score=score,
            confidence=0.9 if not passed else 0.95,
            weak_concepts=weak_concepts,
            next_action="replan_roadmap" if not passed else "continue_learning",
        )

        diagnostics = [{
            "subskill_id": "multi_table_joins",
            "subskill_name": "Multi-Table JOINs",
            "score": score,
            "passed": passed,
            "status": status,
            "weak_concepts": weak_concepts,
            "feedback": (
                "The submission does not yet demonstrate robust LEFT JOIN logic between users and orders. "
                "A correct query should join users to orders on the user identifier and aggregate purchase totals by user."
                if not passed else
                "The query properly combines the relevant tables and demonstrates multi-table relational reasoning."
            )
        }]

        result = {
            "challenge_id": payload.challenge_id or "challenge_sql_join_01",
            "overall_score": score,
            "passed": passed,
            "diagnostics": diagnostics,
            "summary_feedback": (
                "JOIN logic is still weak; remediation is required before advancing to more complex SQL concepts."
                if not passed else
                "JOIN logic is valid and the learner is ready to advance to the next SQL concept."
            ),
            "requires_replanning": not passed,
            "persisted_evidence_id": evidence.id,
            "status": status,
        }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")


class RoadmapReplanRequest(BaseModel):
    user_id: Optional[str] = "priya-101"
    target_role: Optional[str] = "Data Analyst"


@app.post("/api/roadmap/replan")
async def replan_roadmap(payload: RoadmapReplanRequest):
    """Adaptive replanning: if evidence shows multi_table_joins remains weak, insert a remediation week before advanced topics."""
    try:
        user_id = payload.user_id or "priya-101"
        target_role = payload.target_role or "Data Analyst"

        if session_state.get("roadmap"):
            base_roadmap = session_state["roadmap"]
        else:
            profile = session_state.get("profile") or get_demo_profile()
            gaps = session_state.get("gaps") or compute_skill_gaps(profile)
            base_roadmap = generate_roadmap_compact(gaps=gaps, user_id=user_id, target_role=target_role)
            session_state["roadmap"] = base_roadmap

        latest_evidence = evidence_store.get_latest_evidence(user_id, "multi_table_joins")
        if latest_evidence is None or latest_evidence.score >= 70:
            return {
                "mutation": {
                    "mutation_id": f"mut-{uuid.uuid4().hex[:8]}",
                    "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                    "trigger_evidence_id": latest_evidence.id if latest_evidence else "n/a",
                    "trigger_subskill": "multi_table_joins",
                    "old_step": "Week 1 - Basic Queries & Aggregations",
                    "new_step": "Week 1.5 - Multi-Table JOIN Remediation",
                    "explanation": "No weak join evidence detected; roadmap remains active.",
                },
                "roadmap": {
                    **base_roadmap,
                    "has_mutation": False,
                    "mutation_explanation": "No replan triggered; evidence indicates JOIN capability is stable.",
                },
            }

        remediation_week = {
            "week": 1.5,
            "title": "Week 1.5: Deep Dive - Multi-Table JOIN Remediation",
            "status": "in_progress",
            "focus_subskill": "multi_table_joins",
            "objective": "Fix LEFT JOIN logic between users and orders and aggregate purchase totals correctly.",
            "modules": [
                {"id": "mod_join_remediation", "name": "LEFT JOIN remediation", "status": "active"},
                {"id": "mod_join_practice", "name": "users + orders aggregation drill", "status": "upcoming"},
            ],
            "resources": [
                {
                    "id": "res_sql_remed_01",
                    "title": "Targeted Drill: Fixing Common SQL JOIN Mistakes & Cartesian Products",
                    "author": "Alex The Analyst",
                    "url": "https://www.youtube.com/watch?v=9jmg_c7N438&t=320s",
                    "type": "video",
                    "duration_minutes": 14,
                    "difficulty": "Remedial",
                    "reason_selected": "Directly targets LEFT JOIN misuse and duplicate-row errors in relational queries."
                }
            ],
            "task": {
                "id": "task_join_remediation",
                "title": "LEFT JOIN Rework Challenge",
                "prompt": "Write a query combining `users` and `orders` tables to fetch user names and total purchase amounts using LEFT JOIN.",
                "target_subskill": "multi_table_joins",
                "type": "sql_challenge",
                "estimated_minutes": 20,
            },
        }

        weekly_plan = list(base_roadmap.get("weekly_plan", []))
        if weekly_plan:
            new_plan = [weekly_plan[0], remediation_week]
            for week in weekly_plan[1:]:
                if week.get("week") in (2, 3):
                    week["status"] = "upcoming"
                new_plan.append(week)
        else:
            new_plan = [remediation_week]

        mutated_roadmap = {
            "user_id": user_id,
            "target_role": target_role,
            "has_mutation": True,
            "mutation_explanation": "Adaptive replanning engaged: multi_table_joins remained Weak after diagnosis. A targeted LEFT JOIN remediation sprint has been inserted before advanced SQL modules.",
            "weekly_plan": new_plan,
            "weeks": [
                {
                    "week_number": week.get("week", 1),
                    "week_label": f"Week {week.get('week', 1)}",
                    "title": week.get("title", "Remediation"),
                    "focus_subskill": week.get("focus_subskill", "multi_table_joins"),
                    "objective": week.get("objective", "Fix join logic."),
                    "status": "active" if week.get("status") == "in_progress" else "locked",
                    "resources": week.get("resources", []),
                    "task": week.get("task"),
                    "is_mutation_insert": True if week.get("week") == 1.5 else False,
                }
                for week in new_plan
            ],
        }

        session_state["roadmap"] = mutated_roadmap

        mutation_record = {
            "mutation_id": f"mut-{uuid.uuid4().hex[:8]}",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            "trigger_evidence_id": latest_evidence.id,
            "trigger_subskill": "multi_table_joins",
            "old_step": "Week 1 - SQL Fundamentals",
            "new_step": "Week 1.5 - Multi-Table JOIN Remediation",
            "explanation": "The latest diagnosis showed LEFT JOIN logic still weak, so the roadmap was adjusted before advancing to window functions or BI modules.",
        }

        return {
            "mutation": mutation_record,
            "roadmap": mutated_roadmap,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap replan failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
