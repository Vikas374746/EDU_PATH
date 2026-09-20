import type {
  UserProfile,
  SkillGapResponse,
  RoadmapState,
  ResourceItem,
  EvaluationResponse,
  EvidenceRecord,
  RoadmapMutationLog,
  QAResponse,
} from '../types';
import { clientFallback } from './clientFallback';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

async function handleResponse<T = any>(res: Response, fallbackError: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${fallbackError} (${res.status})`);
  }
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Backend returned non-JSON response');
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<{ status: string; service: string }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await handleResponse(res, 'Backend unreachable');
    } catch {
      return clientFallback.getHealth();
    }
  },

  async getOntology(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/ontology`);
      return await handleResponse(res, 'Failed to load ontology');
    } catch {
      return clientFallback.getOntology();
    }
  },

  async getResources(subskill: string = 'sql_joins'): Promise<{ subskill: string; resources: ResourceItem[] }> {
    try {
      const res = await fetch(`${API_BASE}/resources?subskill=${encodeURIComponent(subskill)}`);
      return await handleResponse(res, 'Failed to fetch resources');
    } catch {
      return clientFallback.getResources(subskill);
    }
  },

  async seedDemoProfile(): Promise<{ profile: UserProfile; gaps: SkillGapResponse }> {
    try {
      const res = await fetch(`${API_BASE}/profile/demo`, { method: 'POST' });
      return await handleResponse(res, 'Failed to load demo profile');
    } catch {
      return clientFallback.seedDemoProfile();
    }
  },

  async uploadPdfResume(file: File, name: string = 'Learner', targetRole: string = 'Data Analyst'): Promise<{ profile: UserProfile; gaps: SkillGapResponse }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('target_role', targetRole);
      const res = await fetch(`${API_BASE}/profile/upload-pdf`, {
        method: 'POST',
        body: formData,
      });
      return await handleResponse(res, 'Failed to upload PDF resume');
    } catch {
      return clientFallback.parseTextResume(`Candidate Resume: Skills in Excel, Python, and statistical modeling. Education in Computer Science.`, name, targetRole);
    }
  },

  async analyzeTextResume(rawText: string, name: string = 'Learner', targetRole: string = 'Data Analyst'): Promise<{ profile: UserProfile; gaps: SkillGapResponse }> {
    try {
      const res = await fetch(`${API_BASE}/profile/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText, name, target_role: targetRole }),
      });
      return await handleResponse(res, 'Failed to analyze resume text');
    } catch {
      return clientFallback.parseTextResume(rawText, name, targetRole);
    }
  },

  async getGaps(userId: string = 'candidate-001'): Promise<SkillGapResponse> {
    try {
      const res = await fetch(`${API_BASE}/gaps?user_id=${encodeURIComponent(userId)}`);
      return await handleResponse(res, 'Failed to load skill gaps');
    } catch {
      return clientFallback.seedDemoProfile().gaps;
    }
  },

  async analyzeGap(
    resumeText?: string,
    name: string = 'Learner',
    targetRole: string = 'Data Analyst'
  ): Promise<{ profile: UserProfile; gaps: SkillGapResponse }> {
    try {
      const body = resumeText && resumeText.trim()
        ? JSON.stringify({ resume_text: resumeText, name, target_role: targetRole })
        : null;
      const res = await fetch(`${API_BASE}/profile/analyze-gap`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body,
      });
      return await handleResponse(res, 'Failed to analyze skill gap');
    } catch {
      return resumeText
        ? clientFallback.parseTextResume(resumeText, name, targetRole)
        : clientFallback.seedDemoProfile();
    }
  },

  async analyzeGapPdf(
    file: File,
    name: string = 'Learner',
    targetRole: string = 'Data Analyst'
  ): Promise<{ filename: string; profile: UserProfile; gaps: SkillGapResponse }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('target_role', targetRole);
      const res = await fetch(`${API_BASE}/profile/analyze-gap/pdf`, {
        method: 'POST',
        body: formData,
      });
      return await handleResponse(res, 'Failed to analyze PDF resume');
    } catch {
      const parsed = clientFallback.parseTextResume(`Resume file: ${file.name}`, name, targetRole);
      return { filename: file.name, profile: parsed.profile, gaps: parsed.gaps };
    }
  },

  async getRoadmap(userId: string = 'learner-001'): Promise<RoadmapState & { weekly_plan: any[] }> {
    try {
      const res = await fetch(`${API_BASE}/roadmap?user_id=${encodeURIComponent(userId)}`);
      return await handleResponse(res, 'Failed to load roadmap');
    } catch {
      return clientFallback.generateRoadmap(userId, 'Data Analyst', 10);
    }
  },

  async generateRoadmap(
    userId?: string,
    targetRole: string = 'Data Analyst',
    forceDemo: boolean = false,
    hoursPerWeek: number = 10
  ): Promise<RoadmapState & { weekly_plan: any[] }> {
    try {
      const res = await fetch(`${API_BASE}/roadmap/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, target_role: targetRole, force_demo: forceDemo, hours_per_week: hoursPerWeek }),
      });
      return await handleResponse(res, 'Failed to generate roadmap');
    } catch {
      return clientFallback.generateRoadmap(userId, targetRole, hoursPerWeek);
    }
  },

  async getSkillProof(subskill: string = 'multi_table_joins'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/skill-proof/${encodeURIComponent(subskill)}`);
      return await handleResponse(res, 'Failed to load skill proof');
    } catch {
      return clientFallback.getSkillProof(subskill);
    }
  },

  async evaluateTask(userId: string, challengeId: string, queryText: string): Promise<EvaluationResponse> {
    try {
      const res = await fetch(`${API_BASE}/evaluation/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, challenge_id: challengeId, query_text: queryText }),
      });
      return await handleResponse(res, 'Failed to evaluate task');
    } catch {
      return clientFallback.evaluateTask(userId, challengeId, queryText);
    }
  },

  async triggerReplan(userId: string): Promise<{ mutation: RoadmapMutationLog; roadmap: RoadmapState & { weekly_plan: any[] } }> {
    try {
      const res = await fetch(`${API_BASE}/roadmap/replan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      return await handleResponse(res, 'Failed to replan roadmap');
    } catch {
      return clientFallback.triggerReplan(userId);
    }
  },

  async getEvidence(userId: string = 'candidate-001'): Promise<EvidenceRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/evidence?user_id=${encodeURIComponent(userId)}`);
      return await handleResponse(res, 'Failed to fetch evidence');
    } catch {
      return clientFallback.getEvidence(userId);
    }
  },

  async askAssistant(userId: string, question: string): Promise<QAResponse> {
    try {
      const res = await fetch(`${API_BASE}/qa/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, question }),
      });
      return await handleResponse(res, 'Failed to query assistant');
    } catch {
      return clientFallback.askAssistant(userId, question);
    }
  },

  async resetDemo(): Promise<void> {
    try {
      await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    } catch {
      // noop
    }
  },
};
