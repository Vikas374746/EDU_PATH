from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ExtractedSkill(BaseModel):
    name: str
    subskill: Optional[str] = None
    category: str
    proficiency: str  # "Advanced", "Intermediate", "Novice", "None"
    confidence: float
    evidence: str

class UserProfile(BaseModel):
    id: str = "priya-101"
    name: str = "Priya Sharma"
    target_role: str = "Data Analyst"
    goal: str = "Transition to entry-level Data Analyst"
    hours_per_week: int = 10
    education: Optional[str] = "B.S. in Computer Science (Junior)"
    skills: List[ExtractedSkill] = []

class SkillGapItem(BaseModel):
    subskill_id: str
    name: str
    domain_id: str
    domain_name: str
    status: str  # "Strong", "Developing", "Weak", "Missing"
    confidence: float
    priority: int  # 1 (Critical) to 5
    evidence_text: str

class SkillGapResponse(BaseModel):
    target_role: str
    readiness_percentage: int
    strong_count: int
    developing_count: int
    weak_count: int
    missing_count: int
    gaps: List[SkillGapItem]

class ResourceItem(BaseModel):
    id: str
    title: str
    author: str
    url: str
    type: str  # "video", "documentation", "guide"
    duration_minutes: int
    difficulty: str
    reason_selected: str

class RoadmapTask(BaseModel):
    id: str
    title: str
    prompt: str
    target_subskill: str
    type: str = "practical_challenge"
    estimated_minutes: int = 25

class RoadmapWeek(BaseModel):
    week_number: float  # e.g., 1.0, 2.0, 2.5, 3.0
    week_label: str    # e.g., "Week 1", "Week 2.5 (Remediation)"
    title: str
    focus_subskill: str
    objective: str
    status: str        # "active", "locked", "completed", "remediated"
    resources: List[ResourceItem] = []
    task: Optional[RoadmapTask] = None
    is_mutation_insert: bool = False

class RoadmapState(BaseModel):
    user_id: str
    target_role: str
    has_mutation: bool = False
    mutation_explanation: Optional[str] = None
    weeks: List[RoadmapWeek]

class SubskillDiagnostic(BaseModel):
    subskill_id: str
    subskill_name: str
    score: int
    passed: bool
    weak_concepts: List[str] = []
    feedback: str

class SqlSubmission(BaseModel):
    user_id: str = "priya-101"
    challenge_id: str = "challenge_sql_join_01"
    query_text: str

class EvaluationResponse(BaseModel):
    challenge_id: str
    overall_score: int
    passed: bool
    diagnostics: List[SubskillDiagnostic]
    summary_feedback: str
    requires_replanning: bool
    persisted_evidence_id: str

class EvidenceRecord(BaseModel):
    id: str
    user_id: str
    skill: str
    subskill: str
    evidence: str
    score: int
    confidence: float
    weak_concepts: List[str]
    next_action: str
    timestamp: str

class RoadmapMutationLog(BaseModel):
    mutation_id: str
    timestamp: str
    trigger_evidence_id: str
    trigger_subskill: str
    old_step: str
    new_step: str
    explanation: str

class QARequest(BaseModel):
    user_id: str = "priya-101"
    question: str

class QAResponse(BaseModel):
    answer: str
    citations: List[str]
    suggested_actions: List[str]
