import React, { useState } from 'react';
import { User, Target, Calendar, BookOpen, Code2, CheckSquare, RefreshCw, Lock } from 'lucide-react';
import { useAppState } from '../../context/AppContext';

export interface StepItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

export const JOURNEY_STEPS: StepItem[] = [
  { id: 'profile', label: '1. Profile', icon: User, description: 'Resume & Availability' },
  { id: 'gap', label: '2. Skill Gap', icon: Target, description: 'Ontology Gap Matrix' },
  { id: 'roadmap', label: '3. Roadmap', icon: Calendar, description: 'Personalized Sprints' },
  { id: 'learn', label: '4. Learn', icon: BookOpen, description: 'Curated Resource Track' },
  { id: 'prove', label: '5. Prove', icon: Code2, description: 'SQL Challenge Sandbox' },
  { id: 'diagnose', label: '6. Diagnose', icon: CheckSquare, description: 'Subskill Diagnosis' },
  { id: 'adapt', label: '7. Adapt', icon: RefreshCw, description: 'Updated Learning Plan' },
];

const LOCKED_STEPS = new Set(['gap', 'roadmap', 'learn', 'prove', 'diagnose', 'adapt']);

interface StepperProps {
  currentStepId: string;
  onSelectStep?: (id: string) => void;
}

export const Stepper: React.FC<StepperProps> = ({ currentStepId, onSelectStep }) => {
  const { isAnalyzed } = useAppState();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const handleClick = (stepId: string) => {
    if (!isAnalyzed && LOCKED_STEPS.has(stepId)) {
      showToast('Please upload a resume or run analysis on Step 1 first.');
      return;
    }
    if (onSelectStep) onSelectStep(stepId);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          padding: '0.5rem 1.5rem',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minWidth: '760px',
          }}
        >
          {JOURNEY_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStepId;
            const isPassed =
              JOURNEY_STEPS.findIndex((s) => s.id === currentStepId) > index;
            const isLocked = !isAnalyzed && LOCKED_STEPS.has(step.id);

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  title={isLocked ? 'Complete Step 1 analysis to unlock' : step.description}
                  onClick={() => handleClick(step.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border-default)' : 'transparent'}`,
                    color: isLocked
                      ? 'var(--text-tertiary)'
                      : isActive
                      ? 'var(--text-primary)'
                      : isPassed
                      ? 'var(--text-secondary)'
                      : 'var(--text-tertiary)',
                    cursor: isLocked ? 'not-allowed' : onSelectStep ? 'pointer' : 'default',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.15s ease',
                    opacity: isLocked ? 0.4 : 1,
                    userSelect: 'none',
                  }}
                >
                  {isLocked ? (
                    <Lock size={12} style={{ opacity: 0.7 }} />
                  ) : (
                    <Icon size={14} />
                  )}
                  <span>{step.label}</span>
                  {isLocked && (
                    <span style={{ fontSize: '10px', opacity: 0.6 }}>🔒</span>
                  )}
                </button>
                {index < JOURNEY_STEPS.length - 1 && (
                  <span style={{ color: 'var(--border-default)', fontSize: '0.75rem' }}>
                    /
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Toast notification */}
      {toastMsg && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            zIndex: 60,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <Lock size={12} />
          {toastMsg}
        </div>
      )}
    </div>
  );
};
