/**
 * SkillProofSection.tsx — Step 5: SQL Skill Proof Editor
 * - Starts EMPTY by default.
 * - Table schemas (`users`, `orders`) visibly displayed.
 * - Provides both "Load Failing Attempt" and "Load Passing Attempt" helper buttons for smooth demo execution.
 */
import React from 'react';
import { Database, AlertTriangle, CheckCircle2, Play, RefreshCw } from 'lucide-react';
import { Badge } from '../common/Badge';
import { AgentThoughtConsole } from '../common/AgentThoughtConsole';
import { AnalysisGate } from '../common/AnalysisGate';
import { useAppState, useAppActions } from '../../context/AppContext';

export const SkillProofSection: React.FC = () => {
  const { skillProof, sqlSubmission, isSubmittingTask, logs, isAnalyzed, skillFocus } = useAppState();
  const { setSqlSubmission, evaluateSql } = useAppActions();

  if (!isAnalyzed) return <AnalysisGate />;

  const targetSkill = skillFocus?.skillName || skillProof?.subskill || 'multi_table_joins';

  const handleLoadFailing = () => {
    setSqlSubmission(
      `-- Practice challenge for ${targetSkill}: demonstrate the right join logic\nSELECT users.name, orders.amount\nFROM users, orders\nWHERE users.id = orders.user_id;`
    );
  };

  const handleLoadPassing = () => {
    setSqlSubmission(
      `-- Targeted pass example for ${targetSkill}\nSELECT u.name, COALESCE(SUM(o.amount), 0) AS total_amount\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.name\nORDER BY total_amount DESC;`
    );
  };

  const handleClear = () => {
    setSqlSubmission('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Challenge Header & Context */}
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
              Step 5 • Practical Evidence Check
            </div>
            <h3
              style={{
                fontSize: '1.3rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {skillProof?.challenge?.title || `${targetSkill} Challenge`}
            </h3>
          </div>
          <Badge status="Weak">
            Target Skill: {targetSkill}
          </Badge>
        </div>

        <AgentThoughtConsole
          logs={[
            ...logs,
            '💡 Agent Examiner: SQL workspace initialized. Submitting query executes AST validation and records persistent evidence ledger entry.',
          ]}
          title="Agent Thought Console"
        />

        {/* Prompt & Context Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: '1.25rem',
            marginTop: '1.25rem',
          }}
        >
          {/* Challenge Prompt */}
          <div>
            <div
              style={{
                marginBottom: '0.5rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
              }}
            >
              Challenge Objective
            </div>
            <div
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                fontSize: '0.85rem',
              }}
            >
              {skillProof?.challenge?.prompt ||
                `Use the ${targetSkill} skill to write a realistic SQL query that proves the learner can apply the correct logic to the business problem at hand. Include the essential filtering, grouping, and join behavior required for this gap.`}
            </div>
          </div>

          {/* Database Schema Reference */}
          <div>
            <div
              style={{
                marginBottom: '0.5rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Database size={14} color="var(--accent-primary)" />
              Database Schema Reference
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
                  TABLE: users
                </div>
                <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  id (INT PK) • name (VARCHAR) • email (VARCHAR) • signup_date (DATE)
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
                  TABLE: orders
                </div>
                <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  id (INT PK) • user_id (INT FK -&gt; users.id) • amount (DECIMAL) • status (VARCHAR)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Submission Console */}
      <div className="sf-card" style={{ padding: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h4
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Interactive SQL Submission Runner
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              (Starts empty per PRD specification)
            </span>
          </div>

          {/* Quick Demo Assist Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleLoadFailing}
              className="sf-btn sf-btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', borderColor: 'var(--status-weak-border)', color: 'var(--status-weak-text)' }}
              title="Loads an implicit Cartesian WHERE join without LEFT JOIN, which triggers diagnostic failure and adaptive replanning"
            >
              <AlertTriangle size={13} />
              <span>Load Failing Attempt (40%)</span>
            </button>

            <button
              type="button"
              onClick={handleLoadPassing}
              className="sf-btn sf-btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', borderColor: 'var(--status-strong-border)', color: 'var(--status-strong-text)' }}
              title="Loads a valid LEFT JOIN query with GROUP BY"
            >
              <CheckCircle2 size={13} />
              <span>Load Passing Attempt (100%)</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="sf-btn sf-btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.55rem' }}
            >
              <RefreshCw size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <textarea
          value={sqlSubmission}
          onChange={(e) => setSqlSubmission(e.target.value)}
          placeholder="-- Write your SQL query here... (starts empty)&#10;-- Click 'Load Failing Attempt' to simulate weak join evidence&#10;-- Or click 'Load Passing Attempt' to simulate verified mastery"
          rows={10}
          style={{
            width: '100%',
            resize: 'vertical',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-app)',
            color: 'var(--text-primary)',
            padding: '1rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.84rem',
            lineHeight: 1.5,
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Evaluation criteria: correct use of the current skill gap, explicit join logic, logical business rules, and practical edge-case handling.
          </div>

          <button
            type="button"
            onClick={evaluateSql}
            disabled={isSubmittingTask || !sqlSubmission.trim()}
            className="sf-btn sf-btn-primary"
            style={{
              padding: '0.65rem 1.5rem',
              fontWeight: 600,
              gap: '0.5rem',
              opacity: !sqlSubmission.trim() ? 0.6 : 1,
            }}
          >
            <Play size={14} />
            <span>{isSubmittingTask ? 'Evaluating Query…' : 'Execute & Diagnose Query'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
