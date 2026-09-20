/**
 * RoadmapSection.tsx — roadmap derived from the active gap diagnosis.
 */
import React from 'react';
import { Badge } from '../common/Badge';
import { AgentThoughtConsole } from '../common/AgentThoughtConsole';
import { AnalysisGate } from '../common/AnalysisGate';
import {
  useAppState,
  useAppActions,
  getSprintDetails,
  getFallbackRoadmapWeeks,
} from '../../context/AppContext';

export const RoadmapSection: React.FC = () => {
  const { roadmap, hoursPerWeek, logs, isAnalyzed, gapAnalysis, profile, skillFocus } = useAppState();
  const { changeHours, openResourceTrack, openSkillProof } = useAppActions();

  if (!isAnalyzed) return <AnalysisGate />;

  const sprint = getSprintDetails(hoursPerWeek);
  const focusSkill = skillFocus?.skillName || gapAnalysis?.primary_bottleneck || gapAnalysis?.primaryBottleneck || 'core analytical foundations';

  const visibleWeeks =
    roadmap?.weekly_plan && roadmap.weekly_plan.length > 0
      ? roadmap.weekly_plan.slice(0, sprint.cardCount)
      : getFallbackRoadmapWeeks(hoursPerWeek, gapAnalysis);

  const plannerLog = `[Agent Planner] Generated a ${sprint.label.toLowerCase()} plan for ${profile?.name || 'the learner'} focused on ${focusSkill}.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
              }}
            >
              ROADMAP PACING
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.35rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Personalized roadmap for {profile?.name || 'your profile'}
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.35rem',
                background: 'var(--bg-app)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {[
                { hours: 5, label: '5h (6 Wks)' },
                { hours: 10, label: '10h (4 Wks)' },
                { hours: 20, label: '20h (2 Wks)' },
              ].map((preset) => (
                <button
                  key={preset.hours}
                  type="button"
                  onClick={() => changeHours(preset.hours)}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.72rem',
                    fontWeight: hoursPerWeek === preset.hours ? 700 : 500,
                    borderRadius: 'var(--radius-xs)',
                    background:
                      hoursPerWeek === preset.hours ? 'var(--accent-primary)' : 'transparent',
                    color:
                      hoursPerWeek === preset.hours ? '#FFFFFF' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <Badge
              status={hoursPerWeek >= 20 ? 'Strong' : hoursPerWeek >= 10 ? 'Developing' : 'Weak'}
            >
              {sprint.label}
            </Badge>
          </div>
        </div>

        <AgentThoughtConsole
          logs={[
            ...logs,
            plannerLog,
            `💡 Agent Status: The plan is ordered around ${focusSkill.toLowerCase()} as the current bottleneck, then expands to supporting analytics and BI skills.`,
          ]}
          title="Agent Thought Console"
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              visibleWeeks.length === 2
                ? 'repeat(auto-fit, minmax(320px, 1fr))'
                : 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          {visibleWeeks.map((week: any, idx: number) => {
            const weekNum = week.week || idx + 1;
            const isCompleted = week.status === 'completed';
            const isInProgress = week.status === 'in_progress' || week.status === 'active';

            return (
              <div
                key={week.week || week.title || idx}
                className="sf-card"
                style={{
                  padding: '1.1rem',
                  background: 'var(--bg-surface-elevated)',
                  border: isInProgress ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.45rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--accent-primary)',
                        fontWeight: 700,
                      }}
                    >
                      Week {weekNum}
                    </span>
                    <Badge status={isCompleted ? 'Strong' : isInProgress ? 'Weak' : 'Developing'}>
                      {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Upcoming'}
                    </Badge>
                  </div>

                  <div
                    style={{
                      fontSize: '1.02rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {week.title}
                  </div>

                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '0.65rem',
                    }}
                  >
                    {week.objective || 'Focus on the key learning objective for this week.'}
                  </div>
                </div>

                <div>
                  {week.modules && week.modules.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      {week.modules.map((m: any, mIdx: number) => (
                        <span
                          key={m.id || mIdx}
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-subtle)',
                            color:
                              m.status === 'active' || m.status === 'in_progress'
                                ? 'var(--accent-primary)'
                                : 'var(--text-secondary)',
                            fontWeight:
                              m.status === 'active' || m.status === 'in_progress'
                                ? 600
                                : 400,
                          }}
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={openResourceTrack}
            className="sf-btn sf-btn-secondary"
          >
            View Resource Track
          </button>
          <button
            type="button"
            onClick={openSkillProof}
            className="sf-btn sf-btn-primary"
          >
            Start Skill Proof
          </button>
        </div>
      </div>
    </div>
  );
};
