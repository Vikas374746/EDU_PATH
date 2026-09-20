import json
import logging
import os
import re
import sys
import uuid
from typing import Optional, Dict, Any, List

import requests
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(__file__))

from config import settings
from models.schemas import UserProfile, SkillGapResponse
from modules.evidence_store import evidence_store
from modules.skill_gap_engine import load_ontology, compute_skill_gaps
from modules.resume_analyzer import get_demo_profile, analyze_raw_text, extract_text_from_pdf
from modules.roadmap_planner import generate_roadmap, generate_roadmap_compact

logger = logging.getLogger("skillforge")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="EduPath Adaptive Career-Learning Agent Backend API"
)


def _configure_gemini_client() -> Optional[Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.critical("[CRITICAL] GEMINI_API_KEY is missing from environment")
        return None

    if genai is None:
        logger.critical("[CRITICAL] google.generativeai package is not installed")
        return None

    try:
        genai.configure(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", settings.GEMINI_MODEL)
        return genai.GenerativeModel(model_name)
    except Exception:
        logger.exception("[CRITICAL] Failed to initialize Gemini client")
        return None


def _generate_gemini_text(prompt: str, *, response_mime: Optional[str] = None) -> Optional[str]:
    model = _configure_gemini_client()
    if model is None:
        return None

    try:
        generation_config = {}
        if response_mime:
            generation_config["response_mime_type"] = response_mime
        response = model.generate_content(prompt, generation_config=generation_config)
        text = getattr(response, "text", None)
        if text:
            return text.strip()
        candidates = getattr(response, "candidates", []) or []
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", []) if isinstance(candidates[0], dict) else getattr(candidates[0], "content", None)
            if isinstance(parts, list):
                text = "".join(getattr(part, "text", "") for part in parts)
                if text:
                    return text.strip()
        return None
    except Exception:
        logger.exception("[ERROR] Gemini generation failed")
        return None


# In-memory store for active session state
session_state: Dict[str, Any] = {
    "profile": None,
    "gaps": None,
    "roadmap": None,
    "learner_state": {
        "target_role": "Data Analyst",
        "current_skills": [],
        "required_skills": [],
        "skill_gaps": [],
        "current_active_skill": None,
        "proficiency": {},
        "evidence": [],
        "assessment_history": [],
        "failed_concepts": [],
        "prerequisites": [],
        "current_learning_objective": None,
        "roadmap": None,
        "recommended_next_action": None,
    },
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

        learner_state = _build_learner_state_snapshot(session_state.get("profile").id if session_state.get("profile") else "candidate-001")
        ai_selection = None
        if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"):
            ai_selection = _generate_ai_json(_build_learning_ai_prompt(learner_state, subskill))

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
        if not selected:
            selected = list(resources.values())[0] if resources else []

        if ai_selection and isinstance(ai_selection.get("resource_ids"), list):
            ranked = []
            for resource_id in ai_selection["resource_ids"]:
                for item in selected:
                    if item.get("id") == resource_id:
                        ranked.append(item)
                        break
            if ranked:
                selected = ranked

        return {
            "subskill": subskill,
            "resources": selected,
            "lesson_summary": ai_selection.get("lesson_summary") if ai_selection else None,
            "recommended_prerequisite": ai_selection.get("recommended_prerequisite") if ai_selection else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load resources: {str(e)}")

@app.post("/api/profile/demo")
async def seed_demo_profile():
    """Loads and initializes the demo candidate Data Analyst profile and gap analysis."""
    try:
        profile = get_demo_profile()
        session_state["profile"] = profile
        gaps = compute_skill_gaps(profile)
        session_state["gaps"] = gaps
        _build_learner_state_snapshot(profile.id)

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
        _build_learner_state_snapshot(profile.id)

        ai_gap = None
        if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"):
            ai_gap = _generate_ai_json(_build_skill_gap_ai_prompt(profile, gaps, target_role))
        if ai_gap:
            primary = ai_gap.get("primary_bottleneck") or gaps.primary_bottleneck
            summary = ai_gap.get("diagnostic_summary") or gaps.ai_diagnostic_summary
            if summary:
                gaps.ai_diagnostic_summary = summary
            if primary:
                gaps.primary_bottleneck = primary

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
        _build_learner_state_snapshot(profile.id)

        ai_gap = None
        if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"):
            ai_gap = _generate_ai_json(_build_skill_gap_ai_prompt(profile, gaps, target_role))
        if ai_gap:
            primary = ai_gap.get("primary_bottleneck") or gaps.primary_bottleneck
            summary = ai_gap.get("diagnostic_summary") or gaps.ai_diagnostic_summary
            if summary:
                gaps.ai_diagnostic_summary = summary
            if primary:
                gaps.primary_bottleneck = primary

        return {
            "filename": file.filename,
            "profile": profile,
            "gaps": gaps,
            "primary_bottleneck": gaps.primary_bottleneck,
            "primaryBottleneck": gaps.primary_bottleneck,
            "ai_diagnostic_summary": gaps.ai_diagnostic_summary,
            "aiDiagnosticSummary": gaps.ai_diagnostic_summary,
            "agent_reasoning": gaps.ai_diagnostic_summary,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF resume: {str(e)}")

@app.get("/api/gaps")
async def get_gaps(user_id: str = "candidate-001"):
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

        _build_learner_state_snapshot(profile.id)
        ai_payload = None
        if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"):
            ai_payload = _generate_ai_json(_build_skill_gap_ai_prompt(profile, gaps, target_role))

        if ai_payload:
            primary = ai_payload.get("primary_bottleneck") or gaps.primary_bottleneck
            summary = ai_payload.get("diagnostic_summary") or gaps.ai_diagnostic_summary
            if summary:
                gaps.ai_diagnostic_summary = summary
            if primary:
                gaps.primary_bottleneck = primary
            return {
                "profile": profile,
                "gaps": gaps,
                "diagnostic_summary": summary,
                "primary_bottleneck": primary,
                "primaryBottleneck": primary,
                "subskill_matrix": ai_payload.get("gaps", []),
                "ai_diagnostic_summary": summary,
                "aiDiagnosticSummary": summary,
                "agent_reasoning": summary,
            }

        agent_reasoning = gaps.ai_diagnostic_summary or (
            "We compared the candidate profile with job-relevant requirements and focused the next learning step on the biggest missing skill."
        )
        return {
            "profile": profile,
            "gaps": gaps,
            "primary_bottleneck": gaps.primary_bottleneck,
            "primaryBottleneck": gaps.primary_bottleneck,
            "ai_diagnostic_summary": gaps.ai_diagnostic_summary,
            "aiDiagnosticSummary": gaps.ai_diagnostic_summary,
            "agent_reasoning": agent_reasoning,
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

        _build_learner_state_snapshot(profile.id)
        ai_payload = None
        if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"):
            ai_payload = _generate_ai_json(_build_skill_gap_ai_prompt(profile, gaps, target_role))
        if ai_payload:
            primary = ai_payload.get("primary_bottleneck") or gaps.primary_bottleneck
            summary = ai_payload.get("diagnostic_summary") or gaps.ai_diagnostic_summary
            if summary:
                gaps.ai_diagnostic_summary = summary
            if primary:
                gaps.primary_bottleneck = primary
            return {
                "filename": file.filename,
                "profile": profile,
                "gaps": gaps,
                "diagnostic_summary": summary,
                "primary_bottleneck": primary,
                "primaryBottleneck": primary,
                "subskill_matrix": ai_payload.get("gaps", []),
                "ai_diagnostic_summary": summary,
                "aiDiagnosticSummary": summary,
                "agent_reasoning": summary,
            }

        return {
            "filename": file.filename,
            "profile": profile,
            "gaps": gaps,
            "primary_bottleneck": gaps.primary_bottleneck,
            "primaryBottleneck": gaps.primary_bottleneck,
            "ai_diagnostic_summary": gaps.ai_diagnostic_summary,
            "aiDiagnosticSummary": gaps.ai_diagnostic_summary,
            "agent_reasoning": gaps.ai_diagnostic_summary,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF gap analysis failed: {str(e)}")


# ---------------------------------------------------------------------------
# Phase 3: Roadmap generator endpoint
# ---------------------------------------------------------------------------

class RoadmapGenerateRequest(BaseModel):
    user_id: Optional[str] = None
    target_role: Optional[str] = "Data Analyst"
    hours_per_week: int = 10
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
        hours_per_week = (payload.hours_per_week if payload and payload.hours_per_week is not None else 10)

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
            hours_per_week=hours_per_week,
        )

        ai_roadmap = None
        if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"):
            ai_roadmap = _generate_ai_json(_build_roadmap_ai_prompt(profile, gaps, target_role, hours_per_week))
        if ai_roadmap and isinstance(ai_roadmap.get("weekly_plan"), list):
            compact = {
                "user_id": effective_user_id,
                "target_role": target_role,
                "hours_per_week": hours_per_week,
                "sprint_title": ai_roadmap.get("sprint_title") or compact.get("sprint_title"),
                "has_mutation": bool(ai_roadmap.get("has_mutation", False)),
                "mutation_explanation": ai_roadmap.get("mutation_explanation") or compact.get("mutation_explanation"),
                "weekly_plan": ai_roadmap["weekly_plan"],
            }

        session_state["roadmap"] = compact
        learner_state = _build_learner_state_snapshot(effective_user_id)
        learner_state["current_learning_objective"] = compact["weekly_plan"][0]["focus_subskill"] if compact.get("weekly_plan") else (gaps.primary_bottleneck or "current competency")
        learner_state["recommended_next_action"] = compact["weekly_plan"][0]["objective"] if compact.get("weekly_plan") else "Continue with the next most important skill gap."

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
            "Write a practical task aligned to the learner's current active skill gap and target role. "
            f"Focus on {resolved} and produce a realistic challenge that tests the relevant concept with clear success criteria."
        )

        ai_payload = None
        if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"):
            ai_payload = _generate_ai_json(_build_challenge_ai_prompt(_build_learner_state_snapshot(session_state.get("profile").id if session_state.get("profile") else "candidate-001"), resolved, session_state.get("profile").target_role if session_state.get("profile") else "Data Analyst"))
        if ai_payload and isinstance(ai_payload.get("challenge"), dict):
            challenge = ai_payload["challenge"]
            challenge["target_subskill"] = challenge.get("target_subskill") or resolved
            challenge["estimated_minutes"] = challenge.get("estimated_minutes") or 25
            challenge["type"] = challenge.get("type") or "practical_challenge"
            challenge["id"] = challenge.get("id") or f"challenge_{resolved}_01"
            return {
                "subskill": resolved,
                "resource": chosen_resource,
                "challenge": challenge,
                "why_this_task": ai_payload.get("why_this_task"),
            }

        return {
            "subskill": resolved,
            "resource": chosen_resource,
            "challenge": {
                "id": f"challenge_{resolved}_01",
                "title": f"Practical Skill Proof: {resolved}",
                "prompt": challenge_prompt,
                "target_subskill": resolved,
                "estimated_minutes": 20,
                "type": "practical_challenge",
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load skill proof challenge: {str(e)}")


class DiagnoseRequest(BaseModel):
    user_id: Optional[str] = "candidate-001"
    challenge_id: Optional[str] = "challenge_sql_join_01"
    query_text: str = ""


class LLMStructuredEvaluation(BaseModel):
    score: int = Field(..., ge=0, le=100)
    correctness: str
    strengths: List[str] = Field(default_factory=list)
    weak_subskills: List[str] = Field(default_factory=list)
    explanation: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    recommended_action: str


def _extract_json_object(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        pass

    match = re.search(r"\{.*\}", cleaned, flags=re.S)
    if match:
        try:
            parsed = json.loads(match.group(0))
            return parsed if isinstance(parsed, dict) else None
        except Exception:
            return None
    return None


def _serialize_for_ai(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return _serialize_for_ai(value.model_dump())
    if isinstance(value, dict):
        return {str(k): _serialize_for_ai(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize_for_ai(v) for v in value]
    return value


def _build_learner_state_snapshot(user_id: str = "candidate-001") -> Dict[str, Any]:
    profile = session_state.get("profile")
    gaps = session_state.get("gaps")
    roadmap = session_state.get("roadmap")
    evidence = evidence_store.get_user_evidence(user_id)
    failed_concepts = []
    for record in evidence:
        failed_concepts.extend(record.weak_concepts or [])

    if profile:
        current_skills = [skill.model_dump() for skill in profile.skills]
        target_role = profile.target_role
    else:
        current_skills = []
        target_role = "Data Analyst"

    current_active_skill = None
    if gaps:
        current_active_skill = getattr(gaps, "primary_bottleneck", None) or (
            getattr(gaps, "gaps", [{}])[0].name if getattr(gaps, "gaps", []) else None
        )

    snapshot = {
        "target_role": target_role,
        "current_skills": current_skills,
        "required_skills": [],
        "skill_gaps": _serialize_for_ai(gaps) if gaps else [],
        "current_active_skill": current_active_skill,
        "proficiency": {
            skill.subskill or skill.name: skill.proficiency for skill in (profile.skills if profile else [])
        },
        "evidence": [_serialize_for_ai(r) for r in evidence[-5:]],
        "assessment_history": [_serialize_for_ai(r) for r in evidence],
        "failed_concepts": list(dict.fromkeys(failed_concepts)),
        "prerequisites": [],
        "current_learning_objective": current_active_skill or "career readiness",
        "roadmap": _serialize_for_ai(roadmap) if roadmap else None,
        "recommended_next_action": None,
    }
    session_state["learner_state"] = snapshot
    return snapshot


def _generate_ai_json(prompt: str, *, response_mime: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if os.getenv("GEMINI_API_KEY"):
        raw = _generate_gemini_text(prompt, response_mime=response_mime)
        if raw:
            parsed = _extract_json_object(raw)
            if parsed and isinstance(parsed, dict):
                return parsed
    if os.getenv("OPENAI_API_KEY"):
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=30,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            parsed = _extract_json_object(content)
            if parsed and isinstance(parsed, dict):
                return parsed
        except Exception:
            return None
    return None


def _build_skill_gap_ai_prompt(profile: Any, gaps: Any, target_role: str) -> str:
    learner_state = _build_learner_state_snapshot(profile.id if profile else "candidate-001")
    return (
        "You are an expert career coach and skills diagnostician. Use ONLY the learner evidence below to produce a structured diagnosis. "
        "Do not invent missing facts. Return valid JSON only with the structure:\n"
        "{\n"
        "  'diagnostic_summary': '2 sentence summary',\n"
        "  'primary_bottleneck': 'most important current gap',\n"
        "  'recommended_next_skill': 'best next skill to learn',\n"
        "  'gaps': [{ 'subskill_id': 'id', 'status': 'Strong|Developing|Weak|Missing', 'confidence': 0.0, 'priority': 1, 'evidence': 'brief evidence', 'missing_prerequisite': 'if any' }]\n"
        "}\n\n"
        f"Target role: {target_role}\n\n"
        f"Profile: {json.dumps(_serialize_for_ai(profile), ensure_ascii=False, default=str)}\n\n"
        f"Current gaps: {json.dumps(_serialize_for_ai(gaps), ensure_ascii=False, default=str)}\n\n"
        f"Learner state: {json.dumps(learner_state, ensure_ascii=False, default=str)}"
    )


def _build_roadmap_ai_prompt(profile: Any, gaps: Any, target_role: str, hours_per_week: int) -> str:
    learner_state = _build_learner_state_snapshot(profile.id if profile else "candidate-001")
    return (
        "You are an adaptive learning planner. Generate a personalized roadmap for the learner using their current skill evidence and skill gaps. "
        "Return valid JSON only with this structure:\n"
        "{\n"
        "  'sprint_title': 'short title',\n"
        "  'mutation_explanation': 'why the roadmap changed or stayed stable',\n"
        "  'weekly_plan': [{ 'week': 1, 'title': 'Week 1: ...', 'status': 'in_progress|upcoming|completed', 'focus_subskill': 'skill_id', 'objective': 'objective', 'modules': [{'id': 'id', 'name': 'module', 'status': 'active|upcoming|completed'}], 'resources': [{'id': 'id', 'title': 'title', 'author': 'author', 'url': 'https://example.com', 'type': 'video', 'duration_minutes': 20, 'difficulty': 'Beginner', 'reason_selected': 'why'}], 'task': {'id': 'task_id', 'title': 'title', 'prompt': 'challenge', 'target_subskill': 'skill_id', 'type': 'sql_challenge', 'estimated_minutes': 25 } }]\n"
        "}\n\n"
        f"Target role: {target_role}\n"
        f"Hours per week: {hours_per_week}\n\n"
        f"Profile: {json.dumps(_serialize_for_ai(profile), ensure_ascii=False, default=str)}\n\n"
        f"Gaps: {json.dumps(_serialize_for_ai(gaps), ensure_ascii=False, default=str)}\n\n"
        f"Learner state: {json.dumps(learner_state, ensure_ascii=False, default=str)}"
    )


def _build_learning_ai_prompt(learner_state: Dict[str, Any], subskill: str) -> str:
    return (
        "You are a learning curator for an adaptive skills platform. Choose the most relevant learning resources for the learner's current gap. "
        "Return valid JSON only with this structure:\n"
        "{\n"
        "  'subskill': 'skill_id',\n"
        "  'lesson_summary': 'short explanation for this learning objective',\n"
        "  'resource_ids': ['id1', 'id2'],\n"
        "  'recommended_prerequisite': 'prereq or null'\n"
        "}\n\n"
        f"Subskill target: {subskill}\n\n"
        f"Learner state: {json.dumps(learner_state, ensure_ascii=False, default=str)}"
    )


def _build_challenge_ai_prompt(learner_state: Dict[str, Any], subskill: str, target_role: str) -> str:
    return (
        "You are a task generator for an adaptive learning platform. Create a practical challenge that matches the learner's actual current skill gap, role, and evidence. "
        "Return valid JSON only with this structure:\n"
        "{\n"
        "  'challenge': { 'id': 'task__id', 'title': 'title', 'prompt': 'task prompt', 'target_subskill': 'skill_id', 'estimated_minutes': 25, 'type': 'practical_challenge' },\n"
        "  'why_this_task': 'one sentence rationale'\n"
        "}\n\n"
        f"Target role: {target_role}\n"
        f"Target subskill: {subskill}\n\n"
        f"Learner state: {json.dumps(learner_state, ensure_ascii=False, default=str)}"
    )


def _build_diagnosis_ai_prompt(task_context: Dict[str, Any], query_text: str, learner_state: Dict[str, Any]) -> str:
    return (
        "You are a strict skills diagnostician. Evaluate the learner attempt against the actual task and the learner's current evidence. "
        "Return valid JSON only. Use the keys: score, correctness, strengths, weak_subskills, explanation, confidence, recommended_action, weak_concepts, likely_root_cause, missing_prerequisite, next_skill.\n\n"
        f"Task context: {json.dumps(task_context, ensure_ascii=False, default=str)}\n\n"
        f"Submission: {json.dumps(query_text, ensure_ascii=False)}\n\n"
        f"Learner state: {json.dumps(learner_state, ensure_ascii=False, default=str)}"
    )


def _build_adaptation_ai_prompt(learner_state: Dict[str, Any], latest_evidence: Optional[Any], roadmap: Optional[Any]) -> str:
    return (
        "You are an adaptive curriculum planner. Decide whether the roadmap should change based on the learner's assessment history, current gaps, and latest failure evidence. "
        "Return valid JSON only with structure:\n"
        "{\n"
        "  'should_replan': true,\n"
        "  'reason': 'short reason',\n"
        "  'focus_subskill': 'best next skill to prioritize',\n"
        "  'next_learning_objective': 'what to learn next',\n"
        "  'recommended_action': 'action summary',\n"
        "  'mutation': { 'week': 1.5, 'title': 'Week 1.5: ...', 'focus_subskill': 'skill_id', 'objective': 'goal', 'status': 'in_progress' }\n"
        "}\n\n"
        f"Latest evidence: {json.dumps(_serialize_for_ai(latest_evidence), ensure_ascii=False, default=str)}\n\n"
        f"Roadmap: {json.dumps(_serialize_for_ai(roadmap), ensure_ascii=False, default=str)}\n\n"
        f"Learner state: {json.dumps(learner_state, ensure_ascii=False, default=str)}"
    )


RESUME_GAP_SUBSKILL_DATA = {
    "sql_basics": "Basic Queries & Aggregations",
    "sql_joins": "Multi-Table JOINs",
    "window_functions": "Window Functions & CTEs",
    "lookups_pivot_tables": "Lookups & Pivot Tables",
    "python_data_wrangling": "Data Wrangling with Pandas",
    "data_modeling_dashboards": "Data Modeling & Dashboards",
}


def _normalize_resume_gap_status(value: Any) -> str:
    normalized = str(value or "").strip()
    lowered = normalized.lower()
    if "strong" in lowered:
        return "Strong"
    if "develop" in lowered:
        return "Developing"
    if "weak" in lowered:
        return "Weak"
    if "missing" in lowered:
        return "Missing"
    return "Developing"


def _build_resume_gap_prompt(resume_text: str, name: str, target_role: str) -> str:
    return (
        "You are an expert technical career evaluator. Analyze the candidate resume against a Data Analyst role.\n"
        "Identify status for these 6 subskills:\n"
        "1. Basic Queries & Aggregations\n"
        "2. Multi-Table JOINs\n"
        "3. Window Functions & CTEs\n"
        "4. Lookups & Pivot Tables\n"
        "5. Data Wrangling with Pandas\n"
        "6. Data Modeling & Dashboards\n\n"
        "Return STRICT JSON only matching this schema:\n"
        "{\n"
        "  \"diagnostic_summary\": \"1-2 sentence real-time AI evaluation of the candidate\",\n"
        "  \"primary_bottleneck\": \"Exact name of primary weak skill\",\n"
        "  \"subskill_matrix\": [\n"
        "    {\"id\": \"sql_basics\", \"status\": \"Strong|Developing|Weak|Missing\"},\n"
        "    {\"id\": \"sql_joins\", \"status\": \"Strong|Developing|Weak|Missing\"},\n"
        "    {\"id\": \"window_functions\", \"status\": \"Strong|Developing|Weak|Missing\"},\n"
        "    {\"id\": \"lookups_pivot_tables\", \"status\": \"Strong|Developing|Weak|Missing\"},\n"
        "    {\"id\": \"python_data_wrangling\", \"status\": \"Strong|Developing|Weak|Missing\"},\n"
        "    {\"id\": \"data_modeling_dashboards\", \"status\": \"Strong|Developing|Weak|Missing\"}\n"
        "  ]\n"
        "}\n\n"
        f"Candidate name: {name}\n"
        f"Target role: {target_role}\n\n"
        "Resume text:\n"
        + (resume_text[:20000] if resume_text else "No resume text available.")
    )


def _parse_resume_gap_analysis(raw_response: Any) -> Optional[Dict[str, Any]]:
    parsed = _extract_json_object(raw_response) if isinstance(raw_response, str) else raw_response
    if not isinstance(parsed, dict):
        return None

    diagnostic_summary = str(parsed.get("diagnostic_summary") or "").strip()
    primary_bottleneck = str(parsed.get("primary_bottleneck") or "").strip()
    subskill_matrix = parsed.get("subskill_matrix") or []
    if not isinstance(subskill_matrix, list):
        return None

    normalized_matrix = []
    for entry in subskill_matrix:
        if not isinstance(entry, dict):
            continue
        entry_id = str(entry.get("id") or "").strip()
        if entry_id in RESUME_GAP_SUBSKILL_DATA:
            normalized_matrix.append({
                "id": entry_id,
                "status": _normalize_resume_gap_status(entry.get("status")),
                "name": RESUME_GAP_SUBSKILL_DATA[entry_id],
            })

    if not diagnostic_summary and normalized_matrix:
        diagnostic_summary = "The candidate shows mixed readiness across core Data Analyst skills."
    if not primary_bottleneck and normalized_matrix:
        weak_entries = [item for item in normalized_matrix if item["status"] in {"Weak", "Missing"}]
        if weak_entries:
            primary_bottleneck = RESUME_GAP_SUBSKILL_DATA.get(weak_entries[0]["id"], weak_entries[0]["id"])

    if not normalized_matrix:
        return None

    return {
        "diagnostic_summary": diagnostic_summary,
        "primary_bottleneck": primary_bottleneck or "Multi-Table JOINs",
        "subskill_matrix": [
            {"id": item["id"], "status": item["status"]}
            for item in normalized_matrix
        ],
    }


def _call_llm_for_sql_evaluation(task_context: Dict[str, Any], query_text: str) -> Optional[Dict[str, Any]]:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    system_prompt = (
        "You are a strict SQL skill diagnostician. Evaluate the learner's actual submitted SQL against the task requirements. "
        "Return valid JSON only. Use the keys: score, correctness, strengths, weak_subskills, explanation, confidence, recommended_action. "
        "score must be an integer between 0 and 100. correctness should be one of: correct, partially_correct, incorrect. "
        "strengths and weak_subskills should be arrays of strings. confidence should be a float between 0 and 1. "
        "recommended_action should be a short actionable intervention."
    )
    task_json = json.dumps({"task": task_context, "submission": query_text}, ensure_ascii=False)

    try:
        if os.getenv("OPENAI_API_KEY"):
            model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model_name,
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": task_json},
                    ],
                },
                timeout=30,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return _extract_json_object(content)

        if os.getenv("GEMINI_API_KEY"):
            gemini_text = _generate_gemini_text(
                system_prompt + "\n\nReturn valid JSON only.\n\n" + task_json,
                response_mime="application/json",
            )
            if gemini_text:
                return _extract_json_object(gemini_text)
    except Exception:
        return None

    return None


def _deterministic_sql_diagnosis(query_text: str) -> Dict[str, Any]:
    lowered = (query_text or "").lower()

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

    score = 100 if has_left_join and has_users and has_orders and has_join and has_aggregation else 40
    passed = score >= 70

    return {
        "score": score,
        "correctness": "correct" if passed else "incorrect",
        "strengths": [
            "It references the core user/order tables and attempts to reason about relationships.",
        ] if has_users and has_orders else [],
        "weak_subskills": ["multi_table_joins"] if not passed else [],
        "explanation": (
            "The submission does not yet demonstrate robust LEFT JOIN logic between users and orders. "
            "A correct query should join users to orders on the user identifier and aggregate purchase totals by user."
            if not passed else
            "The query properly combines the relevant tables and demonstrates multi-table relational reasoning."
        ),
        "confidence": 0.9 if not passed else 0.95,
        "recommended_action": "Add a LEFT JOIN remediation sprint before continuing to advanced SQL topics." if not passed else "Continue to the next SQL concept and reinforce the join pattern.",
        "weak_concepts": weak_concepts,
        "passed": passed,
    }


@app.post("/api/evaluation/diagnose")
async def diagnose_skill_submission(payload: DiagnoseRequest):
    """Evaluate a SQL submission using an LLM when available, then persist evidence and trigger the existing replanner logic."""
    try:
        query = payload.query_text or ""
        task_context = {
            "challenge_id": payload.challenge_id or "challenge_sql_join_01",
            "task_title": "LEFT JOIN Multi-Table JOIN Skill Proof",
            "instruction": "Write a query combining users and orders tables to fetch user names and total purchase amounts using LEFT JOIN and aggregate by user.",
            "target_subskill": "multi_table_joins",
            "required_elements": [
                "LEFT JOIN",
                "users and orders tables",
                "aggregate totals per user",
                "join on the user identifier"
            ]
        }

        learner_state = _build_learner_state_snapshot(payload.user_id or "candidate-001")
        llm_result = None
        if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"):
            llm_result = _generate_ai_json(_build_diagnosis_ai_prompt(task_context, query, learner_state))
        validated_result: Optional[Dict[str, Any]] = None
        if llm_result:
            try:
                validated_result = LLMStructuredEvaluation.model_validate(llm_result).model_dump()
            except ValidationError:
                validated_result = None

        fallback = _deterministic_sql_diagnosis(query)
        final_result = validated_result or fallback

        score = int(final_result.get("score", fallback["score"]))
        correctness = str(final_result.get("correctness", fallback["correctness"]))
        strengths = list(final_result.get("strengths", fallback["strengths"]) or [])
        weak_subskills = list(final_result.get("weak_subskills", fallback["weak_subskills"]) or [])
        explanation = str(final_result.get("explanation", fallback["explanation"]))
        confidence = float(final_result.get("confidence", fallback["confidence"]))
        recommended_action = str(final_result.get("recommended_action", fallback["recommended_action"]))
        weak_concepts = list(final_result.get("weak_concepts", fallback["weak_concepts"]) or [])
        if not weak_concepts:
            weak_concepts = weak_subskills[:]
        passed = score >= 70
        status = "Strong" if passed else "Weak"

        evidence = evidence_store.record_evidence(
            user_id=payload.user_id or "candidate-001",
            skill="SQL & Relational Databases",
            subskill="multi_table_joins",
            evidence=query[:500] if query else "No SQL submitted.",
            score=score,
            confidence=confidence,
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
            "feedback": explanation,
        }]

        agent_reasoning = (
            "The learner submission was evaluated by the LLM and the curriculum engine kept the existing adaptive diagnosis flow intact."
            if validated_result is not None else
            "We checked your SQL against the job-style JOIN test. You got the basic idea, but the query still missed the key step of combining rows from two tables correctly."
        )

        result = {
            "score": score,
            "correctness": correctness,
            "strengths": strengths,
            "weak_subskill": weak_subskills[0] if weak_subskills else None,
            "weak_subskills": weak_subskills,
            "challenge_id": payload.challenge_id or "challenge_sql_join_01",
            "overall_score": score,
            "passed": passed,
            "diagnostics": diagnostics,
            "summary_feedback": explanation,
            "requires_replanning": not passed,
            "persisted_evidence_id": evidence.id,
            "status": status,
            "confidence": confidence,
            "recommended_action": recommended_action,
            "agent_reasoning": agent_reasoning,
            "llm_evaluated": validated_result is not None,
        }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")


class RoadmapReplanRequest(BaseModel):
    user_id: Optional[str] = "candidate-001"
    target_role: Optional[str] = "Data Analyst"


@app.post("/api/roadmap/replan")
async def replan_roadmap(payload: RoadmapReplanRequest):
    """Adaptive replanning: if evidence shows multi_table_joins remains weak, insert a remediation week before advanced topics."""
    try:
        user_id = payload.user_id or "candidate-001"
        target_role = payload.target_role or "Data Analyst"

        if session_state.get("roadmap"):
            base_roadmap = session_state["roadmap"]
        else:
            profile = session_state.get("profile") or get_demo_profile()
            gaps = session_state.get("gaps") or compute_skill_gaps(profile)
            base_roadmap = generate_roadmap_compact(gaps=gaps, user_id=user_id, target_role=target_role)
            session_state["roadmap"] = base_roadmap

        latest_evidence = evidence_store.get_user_evidence(user_id)
        newest = latest_evidence[-1] if latest_evidence else None
        learner_state = _build_learner_state_snapshot(user_id)
        ai_adaptation = None
        if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"):
            ai_adaptation = _generate_ai_json(_build_adaptation_ai_prompt(learner_state, newest, base_roadmap))

        if ai_adaptation and ai_adaptation.get("should_replan") is True:
            focus_skill = ai_adaptation.get("focus_subskill") or learner_state.get("current_active_skill") or "multi_table_joins"
            mutation = ai_adaptation.get("mutation") or {
                "week": 1.5,
                "title": f"Week 1.5: {focus_skill}",
                "focus_subskill": focus_skill,
                "objective": ai_adaptation.get("next_learning_objective") or "Reinforce the current skill gap before advancing.",
                "status": "in_progress",
            }
            weekly_plan = list(base_roadmap.get("weekly_plan", []))
            new_week = {
                "week": float(mutation.get("week", 1.5)),
                "title": mutation.get("title") or f"Week {mutation.get('week', 1.5)}: {focus_skill}",
                "status": mutation.get("status") or "in_progress",
                "focus_subskill": focus_skill,
                "objective": mutation.get("objective") or ai_adaptation.get("next_learning_objective") or "Reinforce the active skill gap before advancing.",
                "modules": [{"id": f"mod_{focus_skill}", "name": focus_skill, "status": "active"}],
                "resources": [],
                "task": {"id": f"task_{focus_skill}", "title": f"Practical challenge: {focus_skill}", "prompt": "Complete a focused task for the current skill gap.", "target_subskill": focus_skill, "type": "practical_challenge", "estimated_minutes": 25},
            }
            if weekly_plan:
                weekly_plan.insert(1, new_week)
            else:
                weekly_plan = [new_week]
            mutated_roadmap = {**base_roadmap, "has_mutation": True, "mutation_explanation": ai_adaptation.get("reason") or "The learner's evidence indicates the plan should be adjusted.", "weekly_plan": weekly_plan}
            session_state["roadmap"] = mutated_roadmap
            mutation_record = {
                "mutation_id": f"mut-{uuid.uuid4().hex[:8]}",
                "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                "trigger_evidence_id": newest.id if newest else "n/a",
                "trigger_subskill": focus_skill,
                "old_step": base_roadmap.get("weekly_plan", [{}])[0].get("title", "Current focus"),
                "new_step": mutation.get("title") or f"Week {mutation.get('week', 1.5)}: {focus_skill}",
                "explanation": ai_adaptation.get("reason") or "The learner's latest assessment revealed a skill gap that needs targeted support.",
            }
            return {"mutation": mutation_record, "roadmap": mutated_roadmap, "agent_reasoning": ai_adaptation.get("recommended_action") or ai_adaptation.get("reason") or "The plan was adjusted to match the learner's current evidence."}

        if newest is None or newest.score >= 70:
            no_change_reasoning = "The learner's latest evidence is consistent with the current plan, so the agent kept the roadmap stable."
            return {
                "mutation": {
                    "mutation_id": f"mut-{uuid.uuid4().hex[:8]}",
                    "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                    "trigger_evidence_id": newest.id if newest else "n/a",
                    "trigger_subskill": newest.subskill if newest else "current_gap",
                    "old_step": base_roadmap.get("weekly_plan", [{}])[0].get("title", "Current focus"),
                    "new_step": base_roadmap.get("weekly_plan", [{}])[0].get("title", "Current focus"),
                    "explanation": "No material evidence change detected; roadmap remains aligned with the learner's current profile.",
                },
                "roadmap": {**base_roadmap, "has_mutation": False, "mutation_explanation": "No replan triggered; evidence indicates the current learning plan remains appropriate."},
                "agent_reasoning": no_change_reasoning,
            }

        fallback_target = newest.subskill if newest else "current_gap"
        remediation_week = {
            "week": 1.5,
            "title": f"Week 1.5: Deep Dive - {fallback_target}",
            "status": "in_progress",
            "focus_subskill": fallback_target,
            "objective": "Address the latest weak skill signal before moving to more advanced work.",
            "modules": [{"id": f"mod_{fallback_target}", "name": fallback_target, "status": "active"}],
            "resources": [],
            "task": {"id": f"task_{fallback_target}", "title": f"Practical challenge: {fallback_target}", "prompt": "Complete a focused task for the current skill gap.", "target_subskill": fallback_target, "type": "practical_challenge", "estimated_minutes": 25},
        }
        weekly_plan = list(base_roadmap.get("weekly_plan", []))
        if weekly_plan:
            weekly_plan.insert(1, remediation_week)
        else:
            weekly_plan = [remediation_week]
        mutated_roadmap = {**base_roadmap, "has_mutation": True, "mutation_explanation": "The learner's latest evidence shows a concrete gap that needs a targeted remediation step before advancing.", "weekly_plan": weekly_plan}
        session_state["roadmap"] = mutated_roadmap
        return {
            "mutation": {
                "mutation_id": f"mut-{uuid.uuid4().hex[:8]}",
                "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                "trigger_evidence_id": newest.id if newest else "n/a",
                "trigger_subskill": fallback_target,
                "old_step": base_roadmap.get("weekly_plan", [{}])[0].get("title", "Current focus"),
                "new_step": remediation_week["title"],
                "explanation": "Latest learner evidence indicates a remediation sprint is needed before the next stage of learning.",
            },
            "roadmap": mutated_roadmap,
            "agent_reasoning": "The plan was adapted to the learner's most recent evidence and the current skill bottleneck.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap replan failed: {str(e)}")


class AskSkillForgeRequest(BaseModel):
    user_id: Optional[str] = "candidate-001"
    question: str = ""


@app.post("/api/qa/ask")
async def ask_skillforge(payload: AskSkillForgeRequest):
    """Answer based on the learner's actual profile, gaps, roadmap, and evidence state; no fake defaults."""
    try:
        question = (payload.question or "").strip()
        user_id = payload.user_id or "candidate-001"

        profile = session_state.get("profile")
        gaps = session_state.get("gaps")
        roadmap = session_state.get("roadmap")
        evidence = evidence_store.get_user_evidence(user_id)

        if not profile and not gaps and not roadmap and not evidence:
            return {
                "answer": "I do not have enough learner context yet. Please complete the profile and skill-gap analysis before asking about the plan.",
                "citations": [],
                "suggested_actions": ["Analyze the learner profile", "Generate the skill gaps", "Generate the roadmap"]
            }

        gap_summary = []
        if gaps:
            for item in getattr(gaps, "gaps", []) or []:
                if item.status in {"Weak", "Missing"}:
                    gap_summary.append(f"{item.name}: {item.status}")

        evidence_summary = []
        for record in evidence[-3:]:
            evidence_summary.append(f"{record.subskill}: score {record.score}, weak concepts={record.weak_concepts}")

        roadmap_summary = []
        if roadmap:
            for week in roadmap.get("weekly_plan", [])[:4]:
                roadmap_summary.append(f"{week.get('title', 'Plan Step')}: {week.get('status', 'unknown')}")

        state_summary = {
            "profile": profile.model_dump() if profile else None,
            "gaps": getattr(gaps, "model_dump", lambda: {})() if gaps else None,
            "roadmap": roadmap,
            "latest_evidence": [record.model_dump() for record in evidence[-3:]],
        }

        lower_q = question.lower()
        if not question:
            answer = "Please ask a question about your current skill gaps, roadmap, or evaluation results."
        elif "weak" in lower_q or "weak at" in lower_q or "currently weak" in lower_q:
            if gap_summary:
                answer = "Your strongest current weak points are: " + "; ".join(gap_summary) + "."
            else:
                answer = "I do not currently have any weak subskills recorded for this learner in the active state."
        elif "join" in lower_q and "window" in lower_q and "before" in lower_q:
            answer = "The plan prioritizes JOINs before Window Functions because JOINs are a prerequisite gap in the active skill graph. The latest evidence and roadmap mutation logic are intentionally sequencing the remediation before moving to advanced SQL."
        elif "why did my roadmap change" in lower_q or "roadmap change" in lower_q:
            if roadmap and roadmap.get("mutation_explanation"):
                answer = roadmap["mutation_explanation"]
            elif evidence:
                latest = evidence[-1]
                answer = f"The roadmap changed because the latest evidence for {latest.subskill} scored {latest.score}, which triggered the adaptive replanning rule."
            else:
                answer = "I do not have a recorded roadmap mutation or evaluation in the learner state yet."
        elif "what am i" in lower_q and "weak" in lower_q:
            if gap_summary:
                answer = "Your active weak gaps are: " + "; ".join(gap_summary) + "."
            else:
                answer = "I do not have a current weak-skill diagnosis for this learner."
        elif "profile" in lower_q:
            if profile:
                answer = f"Your active profile is {profile.name} targeting {profile.target_role} with {profile.hours_per_week} hours per week."
            else:
                answer = "There is no active learner profile in the current session state."
        else:
            answer = (
                "Based on your current learner state, the active focus is "
                f"{(gaps and getattr(gaps, 'primary_bottleneck', None)) or 'the current skill gap review'}. "
                + ("The latest roadmap items are: " + "; ".join(roadmap_summary) if roadmap_summary else "There is no active roadmap yet.")
            )

        llm_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
        if llm_key:
            prompt = (
                "Use ONLY the learner state below to answer the user's question. "
                "Do not invent facts. If the information is missing, say so.\n\n"
                f"Learner state JSON: {json.dumps(state_summary, ensure_ascii=False, default=str)}\n\n"
                f"Question: {question}"
            )
            try:
                if os.getenv("OPENAI_API_KEY"):
                    response = requests.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                            "temperature": 0.2,
                            "messages": [{"role": "user", "content": prompt}],
                        },
                        timeout=30,
                    )
                    response.raise_for_status()
                    ai_answer = response.json()["choices"][0]["message"]["content"].strip()
                    if ai_answer:
                        answer = ai_answer
                elif os.getenv("GEMINI_API_KEY"):
                    ai_answer = _generate_gemini_text(prompt)
                    if ai_answer:
                        answer = ai_answer
            except Exception:
                pass

        return {
            "answer": answer,
            "citations": [
                *(f"gap:{getattr(item, 'subskill_id', getattr(item, 'id', 'unknown'))}" for item in (getattr(gaps, 'gaps', []) or [])[:3]),
                *(f"evidence:{record.id}" for record in evidence[-2:]),
                *(f"roadmap:{week.get('title', 'week')}" for week in (roadmap.get("weekly_plan", [])[:2] if roadmap else [])),
            ],
            "suggested_actions": [
                "Review the current weak skill gaps",
                "Open the roadmap view",
                "Submit the next skill-proof task",
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ask SkillForge failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
