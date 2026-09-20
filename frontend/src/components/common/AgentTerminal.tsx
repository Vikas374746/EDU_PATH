import React from 'react';
import { Terminal, Shield, ArrowUpRight, Cpu } from 'lucide-react';
import { useAppState, useAppActions } from '../../context/AppContext';

export const AgentTerminal: React.FC = () => {
  const { logs, isAnalyzing, gapAnalysis, targetRole } = useAppState();
  const { analyzeResume, reset } = useAppActions();

  const agentState: 'AWAITING_RESUME' | 'ANALYZING' | 'GAPS_COMPUTED' | 'ROADMAP_ACTIVE' | 'EVALUATING' | 'REPLANNING' = isAnalyzing
    ? 'ANALYZING'
    : gapAnalysis
    ? 'GAPS_COMPUTED'
    : 'AWAITING_RESUME';

  const stateLabel = {
    AWAITING_RESUME: 'Agent Reasoning Active',
    ANALYZING: 'Analyzing Evidence',
    GAPS_COMPUTED: 'Skill Gaps Computed',
    ROADMAP_ACTIVE: 'Roadmap Active',
    EVALUATING: 'Evaluating SQL Proof',
    REPLANNING: 'Replanning Roadmap',
  }[agentState];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#E5E7EB' }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={16} color="#E5E7EB" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F3F4F6', margin: 0 }}>
            AI Skill Orchestrator
          </h3>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.28rem 0.7rem',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#A7F3D0',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            boxShadow: '0 0 0 1px rgba(22, 163, 74, 0.15)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34D399',
              display: 'inline-block',
              animation: 'pulse 1.8s ease-in-out infinite',
            }}
          />
          <span>🟢 {stateLabel}</span>
        </div>
      </div>

      {/* Next Action Guide Card */}
      <div
        className="sf-card"
        style={{
          padding: '1.25rem',
          background: 'rgba(17, 24, 39, 0.75)',
          borderColor: 'rgba(148, 163, 184, 0.25)',
        }}
      >
        <div className="label-micro" style={{ color: '#93C5FD', marginBottom: '0.4rem' }}>
          Recommended Next Action
        </div>
        <h4
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#F3F4F6',
            marginBottom: '0.5rem',
          }}
        >
          Ingest Profile &amp; Extract Gaps
        </h4>
        <ol
          style={{
            paddingLeft: '1.2rem',
            fontSize: '0.8rem',
            color: '#D1D5DB',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            lineHeight: '1.5',
          }}
        >
          <li>
            Selected Role: <strong style={{ color: '#F3F4F6' }}>{targetRole}</strong>.
          </li>
          <li>
            Upload your resume or click{' '}
            <strong style={{ color: '#F3F4F6' }}>Load Demo Profile</strong>.
          </li>
          <li>
            The orchestrator will scan explicit project and coursework evidence.
          </li>
          <li>
            Your profile will be benchmarked against {targetRole} skill ontology to isolate
            critical missing prerequisites.
          </li>
        </ol>
      </div>

      {/* System Config */}
      <div
        className="sf-card"
        style={{
          padding: '1rem 1.25rem',
          background: 'rgba(17, 24, 39, 0.82)',
          borderColor: 'rgba(148, 163, 184, 0.22)',
        }}
      >
        <div className="label-micro" style={{ marginBottom: '0.65rem', color: '#D1D5DB' }}>
          System Configuration
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9CA3AF' }}>Target Role:</span>
            <strong style={{ color: '#F3F4F6' }}>{targetRole}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9CA3AF' }}>Agent Mode:</span>
            <span style={{ color: '#A5F3FC', fontWeight: 600 }}>
              {targetRole} Job Skills Loaded
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9CA3AF' }}>Adaptive Loop:</span>
            <strong style={{ color: targetRole === 'Data Analyst' ? '#A7F3D0' : '#D1D5DB' }}>
              {targetRole === 'Data Analyst' ? 'SQL Relational JOINs Drill' : 'Roadmap Preview Mode'}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9CA3AF' }}>Evidence Store:</span>
            <span style={{ color: '#D1D5DB' }}>Persistent JSON Ledger</span>
          </div>
        </div>
      </div>

      {/* Live Event Log */}
      <div
        className="sf-card"
        style={{
          padding: '0.85rem 1rem',
          background: 'rgba(15, 23, 42, 0.82)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <span className="label-micro" style={{ color: '#D1D5DB' }}>
            Agent Event Stream
          </span>
          <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Real-time</span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            background: '#0B1120',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 'var(--radius-xs)',
            padding: '0.65rem',
            height: '140px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            color: '#D1D5DB',
          }}
        >
          {logs.map((log, index) => (
            <div key={index} style={{ wordBreak: 'break-all', color: '#D1D5DB' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => analyzeResume(null, true)}
          className="sf-btn sf-btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', flex: 1 }}
        >
          <Shield size={13} />
          <span>Load Demo Profile</span>
          <ArrowUpRight size={12} />
        </button>
        <button
          type="button"
          onClick={reset}
          className="sf-btn sf-btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
        >
          <Cpu size={13} />
          <span>Reset State</span>
        </button>
      </div>
    </div>
  );
};
