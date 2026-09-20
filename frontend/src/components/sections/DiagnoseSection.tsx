/**
 * DiagnoseSection.tsx — Step 6: AI Skills Examiner & Diagnostic Results
 * Provides AST / subskill error isolation breakdown and links directly to Step 7 adaptive mutation.
 */
import React from 'react';
import { CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';
import { Badge } from '../common/Badge';
import { AgentThoughtConsole } from '../common/AgentThoughtConsole';
import { AnalysisGate } from '../common/AnalysisGate';
import { useAppState, useAppActions } from '../../context/AppContext';

export const DiagnoseSection: React.FC = () => {
  const { evaluationResult, logs, isAnalyzed, skillFocus } = useAppState();
  const { replanRoadmap, setStep } = useAppActions();

  if (!isAnalyzed) return <AnalysisGate />;

  const isPassed = evaluationResult?.passed ?? false;
  const score = evaluationResult?.overall_score ?? (isPassed ? 100 : 40);
  const requiresReplanning = evaluationResult?.requires_replanning ?? !isPassed;
  const targetSkill = skillFocus?.skillName || 'Current skill gap';
  const focusRootCause = skillFocus?.rootCause || 'The learner needs more targeted practice to close the active gap.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Card */}
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
              }}
            >
              Step 6 • Diagnostic Evaluation Report
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.3rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              AI Skills Examiner Result
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge status={isPassed ? 'Strong' : 'Weak'}>
              {isPassed ? 'Passed' : 'Needs Practice'}
            </Badge>
            <div
              style={{
                background: isPassed ? 'var(--status-strong-bg)' : 'var(--status-weak-bg)',
                border: `1px solid ${isPassed ? 'var(--status-strong-border)' : 'var(--status-weak-border)'}`,
                color: isPassed ? 'var(--status-strong-text)' : 'var(--status-weak-text)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              {score}/100
            </div>
          </div>
        </div>

        <AgentThoughtConsole
          logs={[
            ...logs,
            isPassed
              ? '💡 Agent Examiner: SQL query passed all syntactic and logical relational tests. JOIN mastery validated.'
              : '💡 Agent Examiner: Query isolated missing LEFT JOIN syntax. Evidence logged into persistent ledger; adaptive replanner armed.',
          ]}
          title="Agent Thought Console"
        />

        {/* Metric Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1.25rem',
          }}
        >
          <div
            className="sf-card"
            style={{ padding: '1rem', background: 'var(--bg-surface-elevated)' }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
              Target Subskill
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {targetSkill}
            </div>
            <span style={{ fontSize: '0.7rem', color: isPassed ? 'var(--status-strong-text)' : 'var(--status-weak-text)' }}>
              Status: {isPassed ? 'Strong' : 'Weak'}
            </span>
          </div>

          <div
            className="sf-card"
            style={{ padding: '1rem', background: 'var(--bg-surface-elevated)' }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
              Verification Verdict
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: isPassed ? 'var(--status-strong-text)' : 'var(--status-weak-text)',
              }}
            >
              {isPassed ? 'Verified Mastered' : 'Remediation Needed'}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Score: {score}%
            </span>
          </div>

          <div
            className="sf-card"
            style={{ padding: '1rem', background: 'var(--bg-surface-elevated)' }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
              Requires Roadmap Replan
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: requiresReplanning ? 'var(--status-dev-text)' : 'var(--status-strong-text)',
              }}
            >
              {requiresReplanning ? 'Yes (Trigger Replan)' : 'No (On Track)'}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {requiresReplanning ? 'Will insert Week 1.5 drill' : 'Proceed to next module'}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Diagnostic & Feedback Card */}
      <div className="sf-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {isPassed ? (
            <CheckCircle2 size={18} color="var(--status-strong-text)" />
          ) : (
            <ShieldAlert size={18} color="var(--status-weak-text)" />
          )}
          <h4
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {isPassed ? 'Passing Evidence Analysis' : 'Diagnostic Error Isolation'}
          </h4>
        </div>

        <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.88rem' }}>
          {evaluationResult?.summary_feedback ||
            (isPassed
              ? `The query successfully demonstrates the required level for ${targetSkill}. This is now evidence that the learner is ready for the next skill in the gap-driven roadmap.`
              : `${focusRootCause} The current exam result indicates the learner needs targeted practice on ${targetSkill}, followed by a fresh proof attempt.`)}
        </p>

        {/* Weak / Verified Concepts Breakdown */}
        <div
          style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {isPassed ? 'Observed Competencies:' : 'Missing Relational Concepts Isolated by Examiner:'}
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              fontSize: '0.82rem',
            }}
          >
            {isPassed ? (
              <>
                <li>Explicit LEFT JOIN syntax utilized without Cartesian product</li>
                <li>Grouping by primary key (users.name) with aggregate SUM(orders.amount)</li>
                <li>NULL handling with COALESCE preserved zero-activity user rows</li>
              </>
            ) : (
              (evaluationResult?.diagnostics?.[0]?.weak_concepts?.length
                ? evaluationResult.diagnostics[0].weak_concepts
                : [
                    'Explicit LEFT JOIN syntax missing between users and orders',
                    'Aggregated metrics (SUM/COUNT) not grouped per user entity',
                    'Implicit comma-join creates potential Cartesian multiplication',
                  ]
              ).map((concept: string, idx: number) => (
                <li key={idx} style={{ color: 'var(--status-weak-text)' }}>
                  {concept}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {!isPassed ? (
            <button
              type="button"
              onClick={replanRoadmap}
              className="sf-btn sf-btn-primary"
              style={{
                padding: '0.7rem 1.5rem',
                fontWeight: 600,
                boxShadow: '0 8px 22px rgba(37, 99, 235, 0.22)',
              }}
            >
              <span>Adapt Roadmap (Trigger Real-Time Mutation)</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep('roadmap')}
              className="sf-btn sf-btn-primary"
              style={{ padding: '0.7rem 1.5rem', fontWeight: 600 }}
            >
              <span>Continue on Baseline Roadmap</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
