import type {
  UserProfile,
  SkillGapResponse,
  RoadmapState,
  ResourceItem,
  EvaluationResponse,
  EvidenceRecord,
  RoadmapMutationLog,
  QAResponse
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

async function handleResponse<T = any>(res: Response, fallbackError: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${fallbackError} (${res.status})`);
  }
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Backend is currently offline or unreachable.');
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res, 'Backend unreachable');
  },

  async getOntology(): Promise<any> {
    const res = await fetch(`${API_BASE}/ontology`);
    return handleResponse(res, 'Failed to load ontology');
  },

  async getResources(subskill: string = 'sql_joins'): Promise<{ subskill: string; resources: ResourceItem[] }> {
    const res = await fetch(`${API_BASE}/resources?subskill=${encodeURIComponent(subskill)}`);
    return handleResponse(res, 'Failed to fetch resources');
  },

  async seedDemoProfile(): Promise<{ profile: UserProfile; gaps: SkillGapResponse }> {
    const res = await fetch(`${API_BASE}/profile/demo`, { method: 'POST' });
    return handleResponse(res, 'Failed to load demo profile');
  },

  async uploadPdfResume(file: File, name: string = 'Learner', targetRole: string = 'Data Analyst'): Promise<{ profile: UserProfile; gaps: SkillGapResponse }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('target_role', targetRole);
    const res = await fetch(`${API_BASE}/profile/upload-pdf`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload PDF resume');
    return res.json();
  },

  async analyzeTextResume(rawText: string, name: string = 'Learner', targetRole: string = 'Data Analyst'): Promise<{ profile: UserProfile; gaps: SkillGapResponse }> {
    const res = await fetch(`${API_BASE}/profile/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText, name, target_role: targetRole })
    });
    if (!res.ok) throw new Error('Failed to analyze resume text');
    return res.json();
  },

  async getGaps(userId: string = 'candidate-001'): Promise<SkillGapResponse> {
    const res = await fetch(`${API_BASE}/gaps?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to load skill gaps');
    return res.json();
  },

  async analyzeGap(
    resumeText?: string,
    name: string = 'Learner',
    targetRole: string = 'Data Analyst'
  ): Promise<{ profile: UserProfile; gaps: SkillGapResponse }> {
    const body = resumeText && resumeText.trim()
      ? JSON.stringify({ resume_text: resumeText, name, target_role: targetRole })
      : null;
    const res = await fetch(`${API_BASE}/profile/analyze-gap`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body,
    });
    if (!res.ok) throw new Error('Failed to analyze skill gap');
    return res.json();
  },

  async analyzeGapPdf(
    file: File,
    name: string = 'Learner',
    targetRole: string = 'Data Analyst'
  ): Promise<{ filename: string; profile: UserProfile; gaps: SkillGapResponse }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('target_role', targetRole);
    const res = await fetch(`${API_BASE}/profile/analyze-gap/pdf`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to analyze PDF resume');
    return res.json();
  },

  async getRoadmap(userId: string = 'learner-001'): Promise<RoadmapState & { weekly_plan: any[] }> {
    const res = await fetch(`${API_BASE}/roadmap?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to load roadmap');
    return res.json();
  },

  async generateRoadmap(
    userId?: string,
    targetRole: string = 'Data Analyst',
    forceDemo: boolean = false,
    hoursPerWeek: number = 10
  ): Promise<RoadmapState & { weekly_plan: any[] }> {
    const res = await fetch(`${API_BASE}/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, target_role: targetRole, force_demo: forceDemo, hours_per_week: hoursPerWeek }),
    });
    if (!res.ok) throw new Error('Failed to generate roadmap');
    return res.json();
  },

  async getSkillProof(subskill: string = 'multi_table_joins'): Promise<any> {
    const res = await fetch(`${API_BASE}/skill-proof/${encodeURIComponent(subskill)}`);
    if (!res.ok) throw new Error('Failed to load skill proof');
    return res.json();
  },

  async evaluateTask(userId: string, challengeId: string, queryText: string): Promise<EvaluationResponse> {
    const res = await fetch(`${API_BASE}/evaluation/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, challenge_id: challengeId, query_text: queryText })
    });
    if (!res.ok) throw new Error('Failed to evaluate task');
    return res.json();
  },

  async triggerReplan(userId: string): Promise<{ mutation: RoadmapMutationLog; roadmap: RoadmapState & { weekly_plan: any[] } }> {
    const res = await fetch(`${API_BASE}/roadmap/replan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to replan roadmap');
    return res.json();
  },

  async getEvidence(userId: string = 'candidate-001'): Promise<EvidenceRecord[]> {
    const res = await fetch(`${API_BASE}/evidence?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch evidence');
    return res.json();
  },

  async askAssistant(userId: string, question: string): Promise<QAResponse> {
    const res = await fetch(`${API_BASE}/qa/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, question })
    });
    if (!res.ok) throw new Error('Failed to query assistant');
    return res.json();
  },

  async resetDemo(): Promise<void> {
    await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  }
};
