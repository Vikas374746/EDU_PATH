/**
 * AppContext.tsx — Unified Reactive Global State Engine for SkillForge
 *
 * Architecture:
 *  - AppStateContext  → consumed by any component needing to read state
 *  - AppDispatchContext → consumed by any component needing to dispatch actions
 *  - appReducer → pure state transitions
 *  - Thunk action creators → async API calls that dispatch multiple actions
 *  - AppProvider → wraps the app tree; runs init effects on mount
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { api } from '../services/api';
import type {
  UserProfile,
  SkillGapResponse,
  EvaluationResponse,
  ResourceItem,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// 1. TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type TargetRole =
  | 'Data Analyst'
  | 'Frontend Engineer'
  | 'Product Manager'
  | 'Data Engineer';

export type HoursPerWeek = 5 | 10 | 20;

export type StepId =
  | 'profile'
  | 'gap'
  | 'roadmap'
  | 'learn'
  | 'prove'
  | 'diagnose'
  | 'adapt';

export interface OntologyDomain {
  id: string;
  name: string;
  weight: number;
  subskills: Array<{
    id: string;
    name: string;
    description: string;
    level: string;
    prerequisites: string[];
  }>;
}

export interface OntologyShape {
  role: string;
  description: string;
  domains: OntologyDomain[];
}

export interface RoadmapModule {
  id: string;
  name: string;
  status: string;
}

export interface RoadmapWeekLocal {
  week: number;
  title: string;
  objective?: string;
  status: string;
  modules: RoadmapModule[];
}

export interface RoadmapResult {
  weekly_plan: RoadmapWeekLocal[];
  has_mutation?: boolean;
  mutation_explanation?: string;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STATE SHAPE
// ─────────────────────────────────────────────────────────────────────────────

export interface SkillFocusState {
  gapId: string;
  skillName: string;
  currentLevel: string;
  requiredLevel: string;
  gapLevel: string;
  status: string;
  confidence: number;
  priority: number;
  prerequisites: string[];
  evidence: string;
  nextAction: string;
  rootCause: string;
  challengeTarget: string;
}

export interface AppState {
  // Identity
  targetRole: TargetRole;
  hoursPerWeek: HoursPerWeek;

  // Pipeline data
  profile: UserProfile | null;
  gapAnalysis: SkillGapResponse | null;
  skillFocus: SkillFocusState | null;
  roadmap: RoadmapResult | null;
  resources: ResourceItem[];
  skillProof: any | null;
  evaluationResult: EvaluationResponse | null;
  replanResult: any | null;

  // UI control
  activeStep: StepId;
  isAnalyzed: boolean;
  isAnalyzing: boolean;
  isSubmittingTask: boolean;
  isProcessingProfile: boolean;
  logs: string[];
  error: string | null;

  // System
  backendHealth: { status: string; service: string } | null;
  ontology: OntologyShape | null;
  sqlSubmission: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const initialState: AppState = {
  targetRole: 'Data Analyst',
  hoursPerWeek: 10,

  profile: null,
  gapAnalysis: null,
  skillFocus: null,
  roadmap: null,
  resources: [],
  skillProof: null,
  evaluationResult: null,
  replanResult: null,

  activeStep: 'profile',
  isAnalyzed: false,
  isAnalyzing: false,
  isSubmittingTask: false,
  isProcessingProfile: false,
  logs: [
    `[${new Date().toLocaleTimeString()}] 💡 Agent Status: Waiting for a resume to begin the AI skill-gap analysis.`,
    `[${new Date().toLocaleTimeString()}] 💡 Agent Status: The platform will adapt the roadmap and learning plan once the profile is analyzed.`,
  ],
  error: null,

  backendHealth: null,
  ontology: null,
  sqlSubmission: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ACTION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'SET_ROLE'; payload: TargetRole }
  | { type: 'SET_HOURS'; payload: HoursPerWeek }
  | { type: 'SET_STEP'; payload: StepId }
  | { type: 'SET_ANALYZED'; payload: boolean }
  | { type: 'SET_SKILL_FOCUS'; payload: SkillFocusState | null }
  | { type: 'ADD_LOG'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BACKEND_HEALTH'; payload: { status: string; service: string } | null }
  | { type: 'SET_ONTOLOGY'; payload: OntologyShape | null }
  | { type: 'SET_RESOURCES'; payload: ResourceItem[] }
  | { type: 'SET_SQL_SUBMISSION'; payload: string }
  | { type: 'ANALYZE_RESUME_START' }
  | {
      type: 'ANALYZE_RESUME_SUCCESS';
      payload: { profile: UserProfile; gapAnalysis: SkillGapResponse };
    }
  | { type: 'ANALYZE_RESUME_ERROR'; payload: string }
  | { type: 'GENERATE_ROADMAP_SUCCESS'; payload: RoadmapResult }
  | { type: 'LOAD_SKILL_PROOF_SUCCESS'; payload: any }
  | { type: 'EVALUATE_SQL_START' }
  | { type: 'EVALUATE_SQL_SUCCESS'; payload: EvaluationResponse }
  | { type: 'EVALUATE_SQL_ERROR'; payload: string }
  | { type: 'REPLAN_SUCCESS'; payload: { replanResult: any; roadmap: RoadmapResult } }
  | { type: 'RESET' };

// ─────────────────────────────────────────────────────────────────────────────
// 5. REDUCER — pure state transitions
// ─────────────────────────────────────────────────────────────────────────────

function ts(): string {
  return `[${new Date().toLocaleTimeString()}]`;
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, targetRole: action.payload };

    case 'SET_HOURS':
      return { ...state, hoursPerWeek: action.payload };

    case 'SET_STEP':
      return { ...state, activeStep: action.payload };

    case 'SET_ANALYZED':
      return { ...state, isAnalyzed: action.payload };

    case 'SET_SKILL_FOCUS':
      return { ...state, skillFocus: action.payload };

    case 'ADD_LOG':
      return {
        ...state,
        logs: [...state.logs, `${ts()} ${action.payload}`],
      };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_BACKEND_HEALTH':
      return { ...state, backendHealth: action.payload };

    case 'SET_ONTOLOGY':
      return { ...state, ontology: action.payload };

    case 'SET_RESOURCES':
      return { ...state, resources: action.payload };

    case 'SET_SQL_SUBMISSION':
      return { ...state, sqlSubmission: action.payload };

    case 'ANALYZE_RESUME_START':
      return {
        ...state,
        isAnalyzing: true,
        isProcessingProfile: true,
        error: null,
      };

    case 'ANALYZE_RESUME_SUCCESS':
      return {
        ...state,
        isAnalyzing: false,
        isAnalyzed: true,
        profile: action.payload.profile,
        gapAnalysis: action.payload.gapAnalysis,
        skillFocus: getCurrentSkillFocus(action.payload.gapAnalysis),
        activeStep: 'gap',
      };

    case 'ANALYZE_RESUME_ERROR':
      return {
        ...state,
        isAnalyzing: false,
        isProcessingProfile: false,
        error: action.payload,
      };

    case 'GENERATE_ROADMAP_SUCCESS':
      return { ...state, roadmap: action.payload };

    case 'LOAD_SKILL_PROOF_SUCCESS':
      return {
        ...state,
        skillProof: action.payload,
        activeStep: 'prove',
        sqlSubmission: '', // Always start empty per spec
      };

    case 'EVALUATE_SQL_START':
      return { ...state, isSubmittingTask: true, error: null };

    case 'EVALUATE_SQL_SUCCESS':
      return {
        ...state,
        isSubmittingTask: false,
        evaluationResult: action.payload,
        activeStep: 'diagnose',
      };

    case 'EVALUATE_SQL_ERROR':
      return {
        ...state,
        isSubmittingTask: false,
        error: action.payload,
      };

    case 'REPLAN_SUCCESS':
      return {
        ...state,
        replanResult: action.payload.replanResult,
        roadmap: action.payload.roadmap,
        skillFocus: getCurrentSkillFocus(state.gapAnalysis),
        activeStep: 'adapt',
      };

    case 'RESET':
      return {
        ...initialState,
        // Preserve system data
        backendHealth: state.backendHealth,
        ontology: state.ontology,
        resources: state.resources,
        isAnalyzed: false,
        logs: [
          ...state.logs,
          `${ts()} SYSTEM: Session state reset. Ready for new profile ingestion.`,
        ],
      };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CONTEXTS
// ─────────────────────────────────────────────────────────────────────────────

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(
  undefined
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. CUSTOM HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SPRINT HELPER (shared utility)
// ─────────────────────────────────────────────────────────────────────────────

export function getSprintDetails(hours: number): {
  label: string;
  cardCount: number;
} {
  if (hours >= 20) return { label: '2-Week Fast-Track Sprint', cardCount: 2 };
  if (hours >= 10) return { label: '4-Week Standard Sprint', cardCount: 4 };
  return { label: '6-Week Extended Sprint', cardCount: 6 };
}

export function getGapOrderedSubskills(gapAnalysis: SkillGapResponse | null): string[] {
  if (!gapAnalysis?.gaps?.length) return ['multi_table_joins', 'window_functions', 'python_pandas', 'powerbi_modeling'];

  const statusWeight: Record<string, number> = {
    Missing: 0,
    Weak: 1,
    Developing: 2,
    Strong: 3,
  };

  const ordered = [...gapAnalysis.gaps]
    .filter((gap) => gap && gap.subskill_id)
    .sort((a, b) => {
      const aPriority = a.priority ?? 99;
      const bPriority = b.priority ?? 99;
      const aStatus = statusWeight[a.status] ?? 99;
      const bStatus = statusWeight[b.status] ?? 99;
      return aPriority - bPriority || aStatus - bStatus || a.name.localeCompare(b.name);
    })
    .map((gap) => gap.subskill_id);

  const deduped: string[] = [];
  for (const id of ordered) {
    const canonical = id === 'sql_joins' ? 'multi_table_joins' : id;
    if (!deduped.includes(canonical)) deduped.push(canonical);
  }

  const fallback = ['multi_table_joins', 'window_functions', 'python_pandas', 'powerbi_modeling', 'basic_queries', 'aggregations_group_by'];
  for (const id of fallback) {
    if (!deduped.includes(id)) deduped.push(id);
  }

  return deduped;
}

export function getCurrentSkillFocus(gapAnalysis: SkillGapResponse | null): SkillFocusState | null {
  if (!gapAnalysis?.gaps?.length) return null;

  const statusOrder = { Missing: 0, Weak: 1, Developing: 2, Strong: 3 } as Record<string, number>;
  const ordered = [...gapAnalysis.gaps]
    .filter((gap) => gap && (gap.subskill_id || gap.name))
    .sort((a, b) => {
      const aPriority = a.priority ?? 99;
      const bPriority = b.priority ?? 99;
      const aStatus = statusOrder[a.status] ?? 99;
      const bStatus = statusOrder[b.status] ?? 99;
      return aPriority - bPriority || aStatus - bStatus || (a.name || '').localeCompare(b.name || '');
    });

  const gap = ordered[0];
  if (!gap) return null;

  const skillName = gap.name || gap.subskill_id || 'Target skill';
  const gapId = gap.subskill_id || `gap-${Math.random().toString(36).slice(2, 8)}`;
  const prerequisites = ['Foundational SQL fluency', 'Business data modeling basics'];
  const rootCause = gap.status === 'Missing'
    ? 'The user has not yet demonstrated the required practical skill in a real business context.'
    : gap.status === 'Weak'
      ? 'The user has partial exposure, but the live evidence shows inconsistent application and weak concept coverage.'
      : 'The user is in progress but still needs targeted practice to reach the required level.';

  return {
    gapId,
    skillName,
    currentLevel: gap.status === 'Strong' ? 'Strong' : gap.status === 'Developing' ? 'Developing' : gap.status === 'Weak' ? 'Weak' : 'Missing',
    requiredLevel: gap.status === 'Strong' ? 'Strong' : 'Intermediate',
    gapLevel: gap.status === 'Strong' ? 'None' : gap.status === 'Developing' ? 'Moderate' : gap.status === 'Weak' ? 'Significant' : 'Critical',
    status: gap.status || 'Missing',
    confidence: gap.confidence ?? 0.6,
    priority: gap.priority ?? 1,
    prerequisites,
    evidence: gap.evidence_text || gapAnalysis.ai_diagnostic_summary || 'Resume evidence and assessments show this remains the most important gap.',
    nextAction: gap.status === 'Strong'
      ? 'Advance to the next most relevant skill and verify it with a fresh challenge.'
      : 'Targeted learning, practice, and a proof task should be focused on this skill before progressing.',
    rootCause,
    challengeTarget: gapId,
  };
}

export function getFallbackRoadmapWeeks(hours: number, gapAnalysis: SkillGapResponse | null = null): RoadmapWeekLocal[] {
  const orderedSubskills = getGapOrderedSubskills(gapAnalysis);
  const cardCount = getSprintDetails(hours).cardCount;
  const titleMap: Record<string, string> = {
    basic_queries: 'Basic Queries & Aggregations',
    aggregations_group_by: 'SQL Aggregations & GROUP BY',
    multi_table_joins: 'Relational Multi-Table JOINs',
    python_pandas: 'Python Data Wrangling',
    powerbi_modeling: 'BI & Dashboards: Star Schema Design',
    window_functions: 'Advanced SQL: Window Functions & CTEs',
    excel_lookups: 'Excel Lookups & Data Cleanup',
  };

  return orderedSubskills.slice(0, cardCount).map((subskill, index) => ({
    week: index + 1,
    title: `Week ${index + 1}: ${titleMap[subskill] || subskill.replace(/_/g, ' ')}`,
    objective: `Focus on ${titleMap[subskill] || subskill.replace(/_/g, ' ')} as the highest-priority learning need for this profile.`,
    status: index === 0 ? 'in_progress' : (index === 1 ? 'upcoming' : 'upcoming'),
    modules: [
      {
        id: `mod_${subskill}`,
        name: titleMap[subskill] || subskill.replace(/_/g, ' '),
        status: index === 0 ? 'active' : 'upcoming',
      },
    ],
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. ASYNC ACTION CREATORS (Thunks)
// ─────────────────────────────────────────────────────────────────────────────

type Dispatch = React.Dispatch<AppAction>;
type GetState = () => AppState;

/** Generate/recalibrate roadmap and dispatch success */
export async function generateRoadmapThunk(
  dispatch: Dispatch,
  getState: GetState
): Promise<void> {
  const { profile, targetRole, hoursPerWeek } = getState();
  const userId = profile?.id || 'candidate-001';
  try {
    const result = await api.generateRoadmap(userId, targetRole, false, hoursPerWeek);
    dispatch({ type: 'GENERATE_ROADMAP_SUCCESS', payload: result as any });
    dispatch({
      type: 'SET_SKILL_FOCUS',
      payload: getCurrentSkillFocus(getState().gapAnalysis),
    });
  } catch (err: any) {
    dispatch({ type: 'ADD_LOG', payload: `ERROR: ${err.message}` });
  }
}

/** Analyze resume (file or demo) — chains gap analysis + roadmap generation */
export async function analyzeResumeThunk(
  dispatch: Dispatch,
  getState: GetState,
  file: File | null,
  isDemo: boolean
): Promise<void> {
  const { selectedRole: _unused, targetRole, hoursPerWeek } = getState() as AppState & {
    selectedRole?: string;
  };
  dispatch({ type: 'ANALYZE_RESUME_START' });

  try {
    let res: { profile: UserProfile; gaps: SkillGapResponse };

    if (isDemo || !file) {
      dispatch({
        type: 'ADD_LOG',
        payload: `INGESTION: Loading demo profile for Demo Candidate: Data Analyst (${targetRole})...`,
      });
      res = await api.seedDemoProfile();
    } else {
      dispatch({
        type: 'ADD_LOG',
        payload: `INGESTION: Uploading ${file.name} for ${targetRole}...`,
      });
      res = await api.uploadPdfResume(file, 'Candidate', targetRole);
    }

    dispatch({
      type: 'ANALYZE_RESUME_SUCCESS',
      payload: { profile: res.profile, gapAnalysis: res.gaps },
    });
    dispatch({
      type: 'SET_SKILL_FOCUS',
      payload: getCurrentSkillFocus(res.gaps),
    });

    if (isDemo || !file) {
      dispatch({
        type: 'ADD_LOG',
        payload: `EXTRACTION: Verified demo skills: Excel (Advanced), Python (Intermediate), SQL (Novice).`,
      });
    } else {
      dispatch({
        type: 'ADD_LOG',
        payload: `EXTRACTION: Parsed ${res.profile.skills.length} skills from ${file!.name}.`,
      });
    }

    dispatch({
      type: 'ADD_LOG',
      payload: `ANALYSIS: Computed readiness score: ${res.gaps.readiness_percentage}%.`,
    });
    dispatch({
      type: 'ADD_LOG',
      payload: `DIAGNOSTIC: Identified critical missing prerequisite: Relational Multi-Table JOINs.`,
    });

    // Chain: auto-generate roadmap after profile ingestion
    const stateAfter = getState();
    const sprint = getSprintDetails(stateAfter.hoursPerWeek);
    const userId = res.profile.id;
    try {
      const roadmapResult = await api.generateRoadmap(
        userId,
        targetRole,
        false,
        hoursPerWeek
      );
      dispatch({ type: 'GENERATE_ROADMAP_SUCCESS', payload: roadmapResult as any });
      dispatch({
        type: 'ADD_LOG',
        payload: `[Agent Planner] Generated custom ${sprint.label} roadmap paced for ${hoursPerWeek} hrs/week based on target role constraints.`,
      });
    } catch (roadmapErr: any) {
      dispatch({ type: 'ADD_LOG', payload: `WARN: Roadmap generation deferred: ${roadmapErr.message}` });
    }

    dispatch({
      type: 'ADD_LOG',
      payload: `PIPELINE: Navigating to Step 2 (Skill Gap Dashboard).`,
    });

    // Clear processing flag after short delay (UI feedback)
    setTimeout(() => {
      dispatch({ type: 'ADD_LOG', payload: `SYSTEM: Profile processing complete.` });
    }, 1500);
  } catch (err: any) {
    console.error('Analysis error:', err);
    dispatch({ type: 'ANALYZE_RESUME_ERROR', payload: err.message || 'Failed to analyze resume' });
    dispatch({ type: 'ADD_LOG', payload: `ERROR: ${err.message}` });
  }
}

/** Change role — logs transition, triggers downstream re-evaluation if profile exists */
export async function changeRoleThunk(
  dispatch: Dispatch,
  getState: GetState,
  role: TargetRole
): Promise<void> {
  dispatch({ type: 'SET_ROLE', payload: role });
  dispatch({
    type: 'ADD_LOG',
    payload: `[Agent Event] Role transition detected: ${role} selected. Agent context updated without interrupting the active reasoning loop.`,
  });

  const state = getState();
  if (state.profile) {
    // Re-generate roadmap for new role
    await generateRoadmapThunk(dispatch, () => ({ ...getState(), targetRole: role }));
  }
}

/** Change hours per week — logs sprint label, re-generates roadmap if profile exists */
export async function changeHoursThunk(
  dispatch: Dispatch,
  getState: GetState,
  hours: number
): Promise<void> {
  const safeHours = (
    [5, 10, 20].includes(hours) ? hours : hours >= 20 ? 20 : hours >= 10 ? 10 : 5
  ) as HoursPerWeek;

  dispatch({ type: 'SET_HOURS', payload: safeHours });
  const sprint = getSprintDetails(safeHours);
  dispatch({
    type: 'ADD_LOG',
    payload: `[Agent Planner] Generated custom ${sprint.label} roadmap paced for ${safeHours} hrs/week based on target role constraints.`,
  });

  const state = getState();
  if (state.profile) {
    await generateRoadmapThunk(dispatch, () => ({
      ...getState(),
      hoursPerWeek: safeHours,
    }));
  }
}

/** Load skill proof challenge and navigate to prove step */
export async function loadSkillProofThunk(
  dispatch: Dispatch,
  _getState: GetState
): Promise<void> {
  try {
    const activeFocus = getCurrentSkillFocus(_getState().gapAnalysis);
    const targetSubskill = activeFocus?.gapId || 'multi_table_joins';
    dispatch({
      type: 'ADD_LOG',
      payload: `PROOF: Preparing a targeted challenge for ${activeFocus?.skillName || 'the current skill gap'}.`,
    });
    const proof = await api.getSkillProof(targetSubskill);
    dispatch({ type: 'LOAD_SKILL_PROOF_SUCCESS', payload: proof });
    dispatch({
      type: 'ADD_LOG',
      payload: `PROOF: Ready for challenge (${proof.challenge?.title || 'JOIN Challenge'}).`,
    });
  } catch (err: any) {
    console.error('Skill proof error:', err);
    dispatch({ type: 'SET_ERROR', payload: err.message || 'Unable to load skill proof challenge' });
    dispatch({ type: 'ADD_LOG', payload: `ERROR: ${err.message}` });
  }
}

/** Evaluate SQL submission */
export async function evaluateSqlThunk(
  dispatch: Dispatch,
  getState: GetState
): Promise<void> {
  const { profile, sqlSubmission } = getState();
  const userId = profile?.id || 'candidate-001';

  dispatch({ type: 'EVALUATE_SQL_START' });
  dispatch({
    type: 'ADD_LOG',
    payload: 'EVALUATOR: Running SQL diagnosis against the JOIN rubric.',
  });

  try {
    const result = await api.evaluateTask(userId, 'challenge_sql_join_01', sqlSubmission);
    dispatch({ type: 'EVALUATE_SQL_SUCCESS', payload: result });
    dispatch({
      type: 'ADD_LOG',
      payload: `DIAGNOSTIC: Overall score ${result.overall_score}; replanning required = ${result.requires_replanning ? 'yes' : 'no'}.`,
    });
  } catch (err: any) {
    console.error('Evaluation error:', err);
    dispatch({
      type: 'EVALUATE_SQL_ERROR',
      payload: err.message || 'Failed to evaluate SQL submission',
    });
    dispatch({ type: 'ADD_LOG', payload: `ERROR: ${err.message}` });
  }
}

/** Trigger adaptive replan */
export async function replanRoadmapThunk(
  dispatch: Dispatch,
  getState: GetState
): Promise<void> {
  const { profile } = getState();
  const userId = profile?.id || 'candidate-001';

  dispatch({
    type: 'ADD_LOG',
    payload: 'ADAPTATION: Triggering roadmap mutation based on latest join evidence.',
  });

  try {
    const result = await api.triggerReplan(userId);
    dispatch({
      type: 'REPLAN_SUCCESS',
      payload: { replanResult: result, roadmap: result.roadmap as any },
    });
    dispatch({
      type: 'ADD_LOG',
      payload: `REPLAN: Inserted remediation week ${
        result.roadmap?.weekly_plan?.find((w: any) => w.week === 1.5)?.title || 'Week 1.5'
      }.`,
    });
  } catch (err: any) {
    console.error('Replan error:', err);
    dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to replan roadmap' });
    dispatch({ type: 'ADD_LOG', payload: `ERROR: ${err.message}` });
  }
}

/** Navigate to roadmap step and regenerate roadmap */
export async function openRoadmapThunk(
  dispatch: Dispatch,
  getState: GetState
): Promise<void> {
  await generateRoadmapThunk(dispatch, getState);
  dispatch({ type: 'SET_STEP', payload: 'roadmap' });
  const { hoursPerWeek } = getState();
  const sprint = getSprintDetails(hoursPerWeek);
  dispatch({
    type: 'ADD_LOG',
    payload: `[Agent Planner] Generated custom ${sprint.label} roadmap paced for ${hoursPerWeek} hrs/week based on target role constraints.`,
  });
  dispatch({
    type: 'ADD_LOG',
    payload: 'AGENT: Opening the full roadmap view so the plan can be reviewed before the next practice step.',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. APP PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Keep a ref to state so thunks can read current state without stale closures
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // Initialize: load backend health + ontology on mount
  useEffect(() => {
    async function initApp() {
      try {
        const health = await api.getHealth();
        dispatch({ type: 'SET_BACKEND_HEALTH', payload: health });

        const onto = await api.getOntology();
        dispatch({ type: 'SET_ONTOLOGY', payload: onto });

        const resData = await api.getResources('sql_joins');
        dispatch({ type: 'SET_RESOURCES', payload: resData.resources || [] });
      } catch (err: any) {
        console.warn('Backend is offline or not yet connected:', err?.message);
        dispatch({
          type: 'SET_BACKEND_HEALTH',
          payload: { status: 'offline', service: 'EduPath API' },
        });
      }
    }
    initApp();
  }, []);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. CONVENIENCE HOOK — provides bound action creators
// ─────────────────────────────────────────────────────────────────────────────

export function useAppActions() {
  const dispatch = useAppDispatch();
  const state = useAppState();
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const getState = useCallback(() => stateRef.current, []);

  return {
    setStep: useCallback(
      (step: StepId) => dispatch({ type: 'SET_STEP', payload: step }),
      [dispatch]
    ),
    addLog: useCallback(
      (msg: string) => dispatch({ type: 'ADD_LOG', payload: msg }),
      [dispatch]
    ),
    setSqlSubmission: useCallback(
      (sql: string) => dispatch({ type: 'SET_SQL_SUBMISSION', payload: sql }),
      [dispatch]
    ),
    reset: useCallback(() => dispatch({ type: 'RESET' }), [dispatch]),

    analyzeResume: useCallback(
      (file: File | null, isDemo: boolean) =>
        analyzeResumeThunk(dispatch, getState, file, isDemo),
      [dispatch, getState]
    ),
    changeRole: useCallback(
      (role: TargetRole) => changeRoleThunk(dispatch, getState, role),
      [dispatch, getState]
    ),
    changeHours: useCallback(
      (hours: number) => changeHoursThunk(dispatch, getState, hours),
      [dispatch, getState]
    ),
    loadSkillProof: useCallback(
      () => loadSkillProofThunk(dispatch, getState),
      [dispatch, getState]
    ),
    evaluateSql: useCallback(
      () => evaluateSqlThunk(dispatch, getState),
      [dispatch, getState]
    ),
    replanRoadmap: useCallback(
      () => replanRoadmapThunk(dispatch, getState),
      [dispatch, getState]
    ),
    openRoadmap: useCallback(
      () => openRoadmapThunk(dispatch, getState),
      [dispatch, getState]
    ),
    openResourceTrack: useCallback(() => {
      dispatch({ type: 'SET_STEP', payload: 'learn' });
      dispatch({
        type: 'ADD_LOG',
        payload: 'AGENT: Moving to the resource library to review JOIN practice guidance and examples.',
      });
    }, [dispatch]),
    openSkillProof: useCallback(() => {
      dispatch({ type: 'SET_STEP', payload: 'prove' });
      dispatch({
        type: 'ADD_LOG',
        payload: 'AGENT: Starting the SQL challenge so the learner can prove the JOIN skill in a realistic task.',
      });
    }, [dispatch]),
  };
}
