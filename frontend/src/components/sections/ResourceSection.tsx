/**
 * ResourceSection.tsx — learning resources personalized to the live skill bottleneck.
 */
import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { AgentThoughtConsole } from '../common/AgentThoughtConsole';
import { AnalysisGate } from '../common/AnalysisGate';
import { useAppState, useAppActions } from '../../context/AppContext';

export const ResourceSection: React.FC = () => {
  const { resources, logs, isAnalyzed, gapAnalysis, profile, skillFocus } = useAppState();
  const { loadSkillProof } = useAppActions();

  if (!isAnalyzed) return <AnalysisGate />;

  const focusSkill = skillFocus?.skillName || gapAnalysis?.primary_bottleneck || gapAnalysis?.primaryBottleneck || 'multi-table SQL joins';

  const orderedGapIds = (gapAnalysis?.gaps || []).map((gap) => gap.subskill_id).filter(Boolean);
  const nextGapSubskill = skillFocus?.gapId || (orderedGapIds.length > 0 ? orderedGapIds[0] : 'multi_table_joins');
  const resourceSubskill = nextGapSubskill === 'sql_joins' ? 'multi_table_joins' : nextGapSubskill;

  const fallbackResources = [
    {
      id: `res-${resourceSubskill}-1`,
      title: resourceSubskill === 'multi_table_joins' ? 'SQL JOINs Explained Visually' : 'Targeted Learning for the Current Gap',
      author: resourceSubskill === 'multi_table_joins' ? 'Luke Barousse' : 'EduPath Advisor',
      type: 'video',
      duration_minutes: 18,
      reason_selected: `Addressing the current bottleneck: ${focusSkill}.`,
      url: 'https://www.youtube.com/watch?v=9jmg_c7N438',
    },
    {
      id: `res-${resourceSubskill}-2`,
      title: resourceSubskill === 'multi_table_joins' ? 'LEFT JOIN and Relational Modeling Practice' : 'Applied Practice for the Active Skill Gap',
      author: resourceSubskill === 'multi_table_joins' ? 'Mode SQL Tutorial' : 'EduPath Advisor',
      type: 'documentation',
      duration_minutes: 12,
      reason_selected: 'Uses project-based examples to strengthen the current bottleneck with real-world business logic.',
      url: 'https://mode.com/sql-tutorial/sql-joins-where-vs-on/',
    },
    {
      id: `res-${resourceSubskill}-3`,
      title: resourceSubskill === 'multi_table_joins' ? 'Data Aggregation with Multi-Table Queries' : 'Skill Application and Review',
      author: resourceSubskill === 'multi_table_joins' ? 'Data School' : 'EduPath Advisor',
      type: 'video',
      duration_minutes: 16,
      reason_selected: 'Connects the current gap to a realistic business task and measurable proof step.',
      url: 'https://www.youtube.com/watch?v=HXV3zeRRBAc',
    },
  ];

  const displayResources = resources?.length > 0 ? resources : fallbackResources;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--accent-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginBottom: '0.35rem',
            }}
          >
            <BookOpen size={14} /> LEARNING RESOURCES
          </div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {profile?.name || 'Candidate'} learning path for {focusSkill}
          </h2>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem',
            }}
          >
            Curated around the highest-priority skill gap surfaced in the AI review of this resume.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSkillProof}
          className="sf-btn sf-btn-primary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <span>Start Skill Proof</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <AgentThoughtConsole
        logs={[
          ...logs,
          `💡 Agent Status: The learning plan is focused on ${focusSkill} because it is the clearest gap in the current candidate profile.`,
        ]}
        title="Agent Thought Console"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {displayResources.map((item: any) => {
          const validUrl = item.url && /^https?:\/\//i.test(item.url);
          if (!validUrl) {
            console.error('Invalid URL:', item.url);
            // Optionally, you can set a fallback URL or display a message to the user
          }

          return (
            <div key={item.id} className="sf-card sf-card-interactive">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.4rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    maxWidth: '75%',
                  }}
                >
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-tertiary)',
                    textTransform: 'capitalize',
                  }}
                >
                  {item.type} • {item.duration_minutes}m
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-primary)',
                  marginBottom: '0.5rem',
                }}
              >
                Instructor: {item.author}
              </div>

              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '0.5rem 0.65rem',
                  marginBottom: '0.75rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    🎯 Why Selected
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>• Addresses {focusSkill}</span>
                </div>
                <div>{item.reason_selected}</div>
              </div>

              <a
                href={validUrl ? item.url : 'https://www.youtube.com/watch?v=9jmg_c7N438'}
                target="_blank"
                rel="noopener noreferrer"
                className="sf-btn sf-btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                Watch Lesson
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
