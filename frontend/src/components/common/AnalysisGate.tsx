/**
 * AnalysisGate.tsx — Reusable guard component rendered by Steps 2-7
 * when `isAnalyzed === false`. Shows an empty state with a CTA back to Step 1.
 */
import React from 'react';
import { Lock } from 'lucide-react';
import { useAppActions } from '../../context/AppContext';

export const AnalysisGate: React.FC = () => {
  const { setStep } = useAppActions();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
        textAlign: 'center',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        minHeight: '360px',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          marginBottom: '1.25rem',
          borderRadius: '50%',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
        }}
      >
        <Lock size={22} />
      </div>

      <h3
        style={{
          fontSize: '1.15rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 0.5rem',
        }}
      >
        Analysis Required
      </h3>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          maxWidth: '400px',
          lineHeight: 1.6,
          margin: '0 0 1.75rem',
        }}
      >
        EduPath needs your resume or current target role settings to analyze gaps and
        construct your custom learning path.
      </p>

      <button
        type="button"
        onClick={() => setStep('profile')}
        className="sf-btn sf-btn-primary"
        style={{
          padding: '0.65rem 1.5rem',
          fontWeight: 600,
        }}
      >
        Go to Step 1: Upload Resume
      </button>
    </div>
  );
};
