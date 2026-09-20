import React from 'react';

interface AgentThoughtConsoleProps {
  logs: string[];
  title?: string;
}

export const AgentThoughtConsole: React.FC<AgentThoughtConsoleProps> = ({
  logs,
  title = 'AI Agent Thought Console'
}) => {
  const visibleLogs = logs.slice(-5);

  return (
    <div className="sf-card" style={{
      padding: '1rem 1.1rem',
      background: 'linear-gradient(180deg, rgba(15,23,42,0.88), rgba(15,23,42,0.96))',
      borderColor: 'rgba(148, 163, 184, 0.2)',
      color: '#E5E7EB'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#93C5FD', textTransform: 'uppercase', fontWeight: 700 }}>
          {title}
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.6rem',
          borderRadius: '999px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          color: '#A7F3D0',
          fontSize: '0.7rem',
          fontWeight: 700
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
          Active
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.7rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        background: '#0B1120',
        fontSize: '0.78rem',
        lineHeight: 1.5,
        color: '#D1D5DB'
      }}>
        {visibleLogs.length === 0 ? (
          <div>💡 Agent Status: Waiting for a resume so we can compare it against real job skills.</div>
        ) : (
          visibleLogs.map((log, index) => (
            <div key={`${log}-${index}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
              <span style={{ color: '#A5F3FC' }}>💡</span>
              <span>{log}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
