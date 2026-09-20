/**
 * App.tsx — Lean Router (Phase 4 Refactor)
 *
 * This component is now a pure router. All state lives in AppStateContext.
 * All section views are isolated components that read from context.
 *
 * Section map:
 *   profile  → Step 1: Profile Onboarding & Resume Upload
 *   gap      → Step 2: Skill Gap Dashboard
 *   roadmap  → Step 3: Week-by-Week Roadmap
 *   learn    → Step 4: Curated Resource Track
 *   prove    → Step 5: SQL Skill Proof
 *   diagnose → Step 6: Diagnosis & Examiner
 *   adapt    → Step 7: Adapted Roadmap
 */

import { CheckCircle2 } from 'lucide-react';
import { AppProvider, useAppState, useAppActions } from './context/AppContext';
import { Header } from './components/common/Header';
import { Stepper } from './components/common/Stepper';
import { AgentTerminal } from './components/common/AgentTerminal';
import { AgentThoughtConsole } from './components/common/AgentThoughtConsole';
import { ResumeUploader } from './components/onboarding/ResumeUploader';
import { SkillGapView } from './components/sections/SkillGapView';
import { RoadmapSection } from './components/sections/RoadmapSection';
import { ResourceSection } from './components/sections/ResourceSection';
import { SkillProofSection } from './components/sections/SkillProofSection';
import { DiagnoseSection } from './components/sections/DiagnoseSection';
import { AdaptSection } from './components/sections/AdaptSection';

// ─────────────────────────────────────────────────────────────────────────────
// INNER ROUTER — reads context, renders the active step
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_STEPS = ['profile', 'gap', 'roadmap', 'learn', 'prove', 'diagnose', 'adapt'];

function AppRouter() {
  const { activeStep, error, logs, isAnalyzing, profile, targetRole, hoursPerWeek } =
    useAppState();
  const { setStep, analyzeResume, changeRole, changeHours } = useAppActions();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
      }}
    >
      {/* 1. Sticky Header — reads targetRole & backendHealth from context */}
      <Header />

      {/* 2. Linear Stepper */}
      <Stepper currentStepId={activeStep} onSelectStep={(id) => setStep(id as any)} />

      {/* 3. Main Content */}
      <main
        style={{
          flex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          padding: '2rem 1.5rem',
        }}
      >
        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              background: 'var(--status-missing-bg)',
              border: '1px solid var(--status-missing-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: 'var(--status-missing-text)',
              fontSize: '0.85rem',
            }}
          >
            <strong>Notice:</strong> {error}
          </div>
        )}

        {/* STEP 1: Profile Onboarding */}
        {activeStep === 'profile' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1.1fr)',
              gap: '2rem',
              alignItems: 'start',
            }}
          >
            <div>
              <ResumeUploader
                selectedRole={targetRole}
                onSelectRole={(role) => changeRole(role as any)}
                onAnalyze={analyzeResume}
                isLoading={isAnalyzing}
                currentProfile={profile}
                hoursPerWeek={hoursPerWeek}
                onHoursPerWeekChange={changeHours}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AgentTerminal />
              <AgentThoughtConsole logs={logs} title="Agent Thought Console" />
            </div>
          </div>
        )}

        {/* STEP 2: Skill Gap Dashboard */}
        {activeStep === 'gap' && <SkillGapView />}

        {/* STEP 3: Roadmap */}
        {activeStep === 'roadmap' && <RoadmapSection />}

        {/* STEP 4: Learning Resources */}
        {activeStep === 'learn' && <ResourceSection />}

        {/* STEP 5: SQL Skill Proof */}
        {activeStep === 'prove' && <SkillProofSection />}

        {/* STEP 6: Diagnosis */}
        {activeStep === 'diagnose' && <DiagnoseSection />}

        {/* STEP 7: Adapted Roadmap */}
        {activeStep === 'adapt' && <AdaptSection />}

        {/* Fallback: unknown step */}
        {!KNOWN_STEPS.includes(activeStep) && (
          <div className="sf-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'var(--accent-primary)',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
              }}
            >
              Step Navigation: {activeStep.toUpperCase()}
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                maxWidth: '460px',
                margin: '0 auto 1.5rem',
              }}
            >
              This step will be unlocked in upcoming build phases.
            </p>
            <button
              type="button"
              onClick={() => setStep('profile')}
              className="sf-btn sf-btn-secondary"
            >
              Back to Profile Onboarding
            </button>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1rem 1.5rem',
          marginTop: 'auto',
          color: 'var(--text-tertiary)',
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>EduPath • Professional Productivity Platform</span>
        <span>Target: {targetRole} • SQL JOINs Adaptive Loop</span>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — wraps the router in AppProvider
// ─────────────────────────────────────────────────────────────────────────────

export function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
