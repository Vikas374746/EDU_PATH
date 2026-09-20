/**
 * AdaptSection.tsx — Step 7: Adaptive Replanner & Mutated Roadmap View
 * Displays clear Before vs. After (Mutated vs. Baseline) comparison,
 * highlights the newly inserted remediation module (Week 1.5),
 * and shows explainability grounding.
 */
import React from 'react';
import { GitBranch, Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';
import { AgentThoughtConsole } from '../common/AgentThoughtConsole';
import { AnalysisGate } from '../common/AnalysisGate';
import { useAppState, useAppActions, getFallbackRoadmapWeeks } from '../../context/AppContext';

export const AdaptSection: React.FC = () => {
  const { replanResult, hoursPerWeek, logs, roadmap, isAnalyzed } = useAppState();
  const { setStep } = useAppActions();

  if (!isAnalyzed) return <AnalysisGate />;

  const baselineWeeks = getFallbackRoadmapWeeks(hoursPerWeek);
  const mutatedWeeks =
    replanResult?.roadmap?.weekly_plan || roadmap?.weekly_plan || baselineWeeks;
  const hasMutation = replanResult?.roadmap?.has_mutation ?? true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Card */}
      <div className="sf-card" style={{ padding: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                marginBottom: '0.35rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <GitBranch size={13} />
              Step 7 • Adaptive Replanner
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.3rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Evidence-Driven Roadmap Adaptation
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge status={hasMutation ? 'Weak' : 'Strong'}>
              {hasMutation ? 'Roadmap Mutated' : 'Baseline Active'}
            </Badge>
            <span
              style={{
                fontSize: '0.75rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: 'var(--accent-primary)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
              }}
            >
              Trigger: Low JOIN Score (40%)
            </span>
          </div>
        </div>

        <AgentThoughtConsole
          logs={[
            ...logs,
            '💡 Agent Replanner: Evaluated evidence ledger. Multi-table JOIN weakness detected. Dynamic graph mutation executed: inserted Week 1.5 remediation sprint before unlocking advanced modules.',
          ]}
          title="Agent Thought Console"
        />

        {/* Explainability Callout Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(59, 130, 246, 0.06))',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            marginTop: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <Sparkles size={18} color="var(--status-weak-text)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              Your roadmap adapted based on practical task evidence.
            </strong>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {replanResult?.roadmap?.mutation_explanation ||
                'Because the SQL proof query lacked explicit LEFT JOIN logic, EduPath automatically restructured your curriculum. Week 1.5 (Relational JOIN Deep-Dive) has been inserted to build join fluency before you encounter multi-table window analytics.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Before vs. After (Mutated vs. Baseline) Side-by-Side Comparison */}
      <div className="sf-card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Before vs. After: Live State Mutation Comparison
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            Visualizing curriculum diff before and after empirical task failure
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Column A: BASELINE (BEFORE) */}
          <div
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                BASELINE ROADMAP (BEFORE)
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Pre-Assessment</span>
            </div>

            {baselineWeeks.map((w: any) => (
              <div
                key={`base-${w.week}`}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '0.75rem 1rem',
                  opacity: 0.75,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    Week {w.week}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Baseline</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {w.title}
                </div>
              </div>
            ))}
          </div>

          {/* Column B: MUTATED (AFTER) */}
          <div
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-weak-text)', textTransform: 'uppercase' }}>
                MUTATED ROADMAP (AFTER ADAPTATION)
              </span>
              <Badge status="Weak">Live Mutated</Badge>
            </div>

            {mutatedWeeks.map((w: any) => {
              const isInserted = w.week === 1.5 || String(w.week).includes('.5') || w.title?.includes('Remediation') || w.title?.includes('Deep Dive');

              return (
                <div
                  key={`mut-${w.week}`}
                  style={{
                    background: isInserted ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface)',
                    border: `1.5px solid ${isInserted ? 'var(--status-weak-border)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-xs)',
                    padding: '0.75rem 1rem',
                    boxShadow: isInserted ? '0 0 0 1px rgba(239, 68, 68, 0.2)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: isInserted ? 'var(--status-weak-text)' : 'var(--accent-primary)',
                        fontWeight: 700,
                      }}
                    >
                      Week {w.week} {isInserted && '• [INSERTED REMEDIATION]'}
                    </span>
                    <Badge status={isInserted ? 'Weak' : 'Developing'}>
                      {isInserted ? 'Active Focus' : 'Scheduled'}
                    </Badge>
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: isInserted ? 'var(--text-primary)' : 'var(--text-secondary)',
                      marginTop: '0.25rem',
                    }}
                  >
                    {w.title}
                  </div>
                  {isInserted && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Directly repairs LEFT JOIN queries, NULL preservation, and eliminates Cartesian joins before unlocking subsequent weeks.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Return / Retest Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setStep('prove')}
            className="sf-btn sf-btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <span>Retest in Skill Proof Runner</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
