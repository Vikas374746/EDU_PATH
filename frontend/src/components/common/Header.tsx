import React from 'react';
import { Terminal, ShieldCheck, Cpu } from 'lucide-react';
import { useAppState, useAppActions } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { backendHealth, targetRole } = useAppState();
  const { analyzeResume } = useAppActions();

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-app)',
        padding: '0.65rem 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* Left: Product Mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
            }}
          >
            <Terminal size={15} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              EduPath
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                borderLeft: '1px solid var(--border-subtle)',
                paddingLeft: '0.5rem',
              }}
            >
              Adaptive Learning Agent
            </span>
          </div>
        </div>

        {/* Right: Dynamic Role & Agent Mode Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Dynamic Agent Mode Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <Cpu size={12} color="var(--accent-primary)" />
            <span>Agent Mode:</span>
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {targetRole} Job Skills Loaded
            </strong>
          </div>

          {/* Backend Status Dot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: backendHealth ? 'var(--text-secondary)' : 'var(--status-missing-text)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: backendHealth ? '#10B981' : '#EF4444',
              }}
            />
            <span>{backendHealth ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Demo Mode Button */}
          <button
            type="button"
            onClick={() => analyzeResume(null, true)}
            className="sf-btn sf-btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
          >
            <ShieldCheck size={13} />
            <span>Demo Mode</span>
          </button>
        </div>
      </div>
    </header>
  );
};
