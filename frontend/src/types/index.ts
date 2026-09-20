export type SkillStatus = 'Strong' | 'Developing' | 'Weak' | 'Missing';
export type WeekStatus = 'active' | 'locked' | 'completed' | 'remediated';

export interface ExtractedSkill {
  name: string;
  subskill?: string;
  category: string;
  proficiency: 'Advanced' | 'Intermediate' | 'Novice' | 'None';
  confidence: number;
  evidence: string;
}

export interface UserProfile {
  id: string;
  name: string;
  target_role: string;
  goal: string;
  hours_per_week: number;
  education?: string;
  skills: ExtractedSkill[];
}

export interface SkillGapItem {
  subskill_id: string;
  name: string;
  domain_id: string;
  domain_name: string;
  status: SkillStatus;
  confidence: number;
  priority: number;
  evidence_text: string;
}

export interface SkillGapResponse {
  target_role: string;
  readiness_percentage: number;
  strong_count: number;
  developing_count: number;
  weak_count: number;
  missing_count: number;
  gaps: SkillGapItem[];
  primary_bottleneck?: string;
  primaryBottleneck?: string;
  ai_diagnostic_summary?: string;
  aiDiagnosticSummary?: string;
  agent_reasoning?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  author: string;
  url: string;
  type: 'video' | 'documentation' | 'guide';
  duration_minutes: number;
  difficulty: string;
  reason_selected: string;
}

export interface RoadmapTask {
  id: string;
  title: string;
  prompt: string;
  target_subskill: string;
  type: string;
  estimated_minutes: number;
}

export interface RoadmapWeek {
  week_number: number;
  week_label: string;
  title: string;
  focus_subskill: string;
  objective: string;
  status: WeekStatus;
  resources: ResourceItem[];
  task?: RoadmapTask;
  is_mutation_insert?: boolean;
}

export interface RoadmapState {
  user_id: string;
  target_role: string;
  has_mutation: boolean;
  mutation_explanation?: string;
  weeks: RoadmapWeek[];
}

export interface SubskillDiagnostic {
  subskill_id: string;
  subskill_name: string;
  score: number;
  passed: boolean;
  weak_concepts: string[];
  feedback: string;
}

export interface EvaluationResponse {
  challenge_id: string;
  overall_score: number;
  passed: boolean;
  diagnostics: SubskillDiagnostic[];
  summary_feedback: string;
  requires_replanning: boolean;
  persisted_evidence_id: string;
}

export interface EvidenceRecord {
  id: string;
  user_id: string;
  skill: string;
  subskill: string;
  evidence: string;
  score: number;
  confidence: number;
  weak_concepts: string[];
  next_action: string;
  timestamp: string;
}

export interface RoadmapMutationLog {
  mutation_id: string;
  timestamp: string;
  trigger_evidence_id: string;
  trigger_subskill: string;
  old_step: string;
  new_step: string;
  explanation: string;
}

export interface QAResponse {
  answer: string;
  citations: string[];
  suggested_actions: string[];
}
