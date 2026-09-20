/**
 * SkillGapView.tsx — dynamic gap analysis based on the live resume and backend output.
 */

import React from 'react';
import { Database, FileSpreadsheet, Code2, BarChart2, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';
import { AgentThoughtConsole } from '../common/AgentThoughtConsole';
import { AnalysisGate } from '../common/AnalysisGate';
import { useAppState, useAppActions } from '../../context/AppContext';
import type { SkillStatus } from '../../types';

export interface TaxonomySubskillItem {
  id: string;
  canonicalId: string;
  name: string;
  domainId: string;
  domainName: string;
  status: SkillStatus;
  detail: string;
}

export interface DomainSection {
  id: string;
  name: string;
  weight: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
  subskills: TaxonomySubskillItem[];
}

const normalizeId = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const mapProficiencyToStatus = (proficiency?: string): SkillStatus => {
  const value = (proficiency || '').toLowerCase();
  if (value === 'advanced') return 'Strong';
  if (value === 'intermediate') return 'Developing';
  if (value === 'novice') return 'Weak';
  return 'Missing';
};

export const SkillGapView: React.FC = () => {
  const { gapAnalysis, targetRole, ontology, logs, isProcessingProfile, profile, isAnalyzed } =
    useAppState();
  const { setStep, openRoadmap } = useAppActions();

  if (!isAnalyzed) return <AnalysisGate />;

  const activeProfile = profile;
  const activeGapData = gapAnalysis;
  const ontologyDomainCount = ontology?.domains.length ?? 4;

  const initialExtractedSkills: TaxonomySubskillItem[] = [
    {
      id: 'basic_queries',
      canonicalId: 'sql_basics',
      name: 'Basic Queries & Aggregations',
      domainId: 'sql_domain',
      domainName: 'SQL & Relational Databases',
      status: 'Developing',
      detail: 'SELECT, WHERE, GROUP BY & aggregate metrics',
    },
    {
      id: 'multi_table_joins',
      canonicalId: 'sql_joins',
      name: 'Multi-Table JOINs',
      domainId: 'sql_domain',
      domainName: 'SQL & Relational Databases',
      status: 'Weak',
      detail: 'INNER and LEFT JOINs without Cartesian duplicates',
    },
    {
      id: 'window_functions',
      canonicalId: 'sql_advanced',
      name: 'Window Functions & CTEs',
      domainId: 'sql_domain',
      domainName: 'SQL & Relational Databases',
      status: 'Missing',
      detail: 'ROW_NUMBER, RANK, PARTITION BY, modular CTEs',
    },
    {
      id: 'excel_lookups',
      canonicalId: 'excel',
      name: 'Lookups & Pivot Tables',
      domainId: 'excel_domain',
      domainName: 'Excel & Spreadsheets',
      status: 'Developing',
      detail: 'XLOOKUP, INDEX/MATCH, automated pivot summaries',
    },
    {
      id: 'python_pandas',
      canonicalId: 'python_r_pandas',
      name: 'Data Wrangling with Pandas',
      domainId: 'python_domain',
      domainName: 'Python Data Wrangling',
      status: 'Strong',
      detail: 'DataFrame filtering, transformations, null handling',
    },
    {
      id: 'powerbi_dashboards',
      canonicalId: 'bi_dashboards',
      name: 'Data Modeling & Dashboards',
      domainId: 'bi_domain',
      domainName: 'BI & Dashboards',
      status: 'Developing',
      detail: 'Star schema modeling, KPI visualizations, DAX/LOD',
    },
  ];

  const extractedSkills: TaxonomySubskillItem[] = (() => {
    if (activeGapData?.gaps && activeGapData.gaps.length > 0) {
      return activeGapData.gaps.map((gap, index) => ({
        id: gap.subskill_id || `gap_${index}`,
        canonicalId: gap.subskill_id || `gap_${index}`,
        name: gap.name || 'Skill',
        domainId: normalizeId(gap.domain_id || gap.domain_name || 'core_skills'),
        domainName: gap.domain_name || 'Core Skills',
        status: (gap.status || 'Developing') as SkillStatus,
        detail: gap.evidence_text || 'Evidence captured from the resume analysis.',
      }));
    }

    if (activeProfile?.skills && activeProfile.skills.length > 0) {
      return activeProfile.skills.map((skill, index) => ({
        id: skill.subskill || normalizeId(skill.name) || `skill_${index}`,
        canonicalId: skill.subskill || normalizeId(skill.name) || `skill_${index}`,
        name: skill.name,
        domainId: normalizeId(skill.category || 'core_skills'),
        domainName: skill.category || 'Core Skills',
        status: mapProficiencyToStatus(skill.proficiency),
        detail: skill.evidence || `Verified through resume evidence for ${skill.name}.`,
      }));
    }

    return initialExtractedSkills;
  })();

  const domainMap = new Map<string, TaxonomySubskillItem[]>();
  extractedSkills.forEach((skill) => {
    const key = skill.domainName || 'Core Skills';
    const bucket = domainMap.get(key) || [];
    bucket.push(skill);
    domainMap.set(key, bucket);
  });

  const domains: DomainSection[] = Array.from(domainMap.entries()).map(([domainName, items], index) => {
    const fallbackIcons = [Database, FileSpreadsheet, Code2, BarChart2];
    const Icon = fallbackIcons[index % fallbackIcons.length];
    return {
      id: normalizeId(domainName),
      name: domainName,
      weight: `${Math.max(12, Math.min(35, 100 / Math.max(domainMap.size, 1)))}%`,
      icon: Icon,
      subskills: items,
    };
  });

  const summaryCounts = {
    Strong: extractedSkills.filter((s) => s.status === 'Strong').length,
    Developing: extractedSkills.filter((s) => s.status === 'Developing').length,
    Weak: extractedSkills.filter((s) => s.status === 'Weak').length,
    Missing: extractedSkills.filter((s) => s.status === 'Missing').length,
  };

  const strongSubskills = extractedSkills.filter((s) => s.status === 'Strong');
  const developingSubskills = extractedSkills.filter((s) => s.status === 'Developing');
  const weakSubskills = extractedSkills.filter((s) => s.status === 'Weak');
  const missingSubskills = extractedSkills.filter((s) => s.status === 'Missing');

  const primaryBottleneck =
    activeGapData?.primary_bottleneck ||
    activeGapData?.primaryBottleneck ||
    weakSubskills[0]?.name ||
    'Core analytical gaps';

  const aiDiagnosticSummary =
    activeGapData?.ai_diagnostic_summary ||
    activeGapData?.aiDiagnosticSummary ||
    activeGapData?.agent_reasoning ||
    `The current profile is strongest in ${strongSubskills[0]?.name || 'key fundamentals'}, but the highest-priority gap is ${primaryBottleneck}. The roadmap should prioritize the most business-critical skill gaps first.`;

  const getSubskillLabelList = (items: TaxonomySubskillItem[]): string => {
    if (items.length === 0) return 'None identified';
    return items.map((item) => item.name).slice(0, 3).join(', ');
  };

  if (!gapAnalysis && !isProcessingProfile) {
    return (
      <div className="sf-card" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Job Match Score: --%
        </div>
        <div
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
          }}
        >
          Status: Awaiting candidate profile or resume upload.
        </div>
        <button type="button" onClick={() => setStep('profile')} className="sf-btn sf-btn-secondary">
          Return to Step 1 to upload resume or load demo profile.
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
          gap: '1.5rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.35rem',
              flexWrap: 'wrap',
            }}
          >
            <span className="label-micro" style={{ color: 'var(--accent-primary)' }}>
              Step 2 Complete
            </span>
            <span style={{ color: 'var(--border-default)' }}>•</span>
            <span className="label-micro">Target: {targetRole}</span>
            <span style={{ color: 'var(--border-default)' }}>•</span>
            <span className="label-micro">Domains profiled: {ontologyDomainCount}</span>
          </div>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.35rem',
            }}
          >
            {targetRole} Skill Gap Analysis
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Evaluated {activeProfile?.name || 'the candidate'} against the live {targetRole} taxonomy.
            Primary bottleneck isolated:{' '}
            <strong style={{ color: 'var(--status-weak-text)' }}>{primaryBottleneck}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1.25rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--status-dev-text)',
              }}
            >
              {gapAnalysis?.readiness_percentage ?? 45}%
            </div>
            <span className="label-micro" style={{ fontSize: '10px' }}>
              Job Match Score
            </span>
          </div>

          <button
            type="button"
            onClick={openRoadmap}
            className="sf-btn sf-btn-primary"
            style={{
              padding: '0.75rem 1.35rem',
              fontWeight: 700,
              minWidth: '200px',
              justifyContent: 'center',
              boxShadow: '0 8px 22px rgba(37, 99, 235, 0.22)',
            }}
          >
            <span>Open Learning Track</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {isProcessingProfile && (
        <div className="sf-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              fontWeight: 600,
            }}
          >
            🟢 Agent Thought: Parsing candidate skills against {targetRole} requirements...
          </div>
        </div>
      )}

      {gapAnalysis && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="sf-card" style={{ padding: '1rem' }}>
              <span className="label-micro" style={{ color: 'var(--status-strong-text)' }}>
                Strong ({summaryCounts.Strong})
              </span>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  color: 'var(--status-strong-text)',
                }}
              >
                {summaryCounts.Strong}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {strongSubskills.length > 0 ? `${getSubskillLabelList(strongSubskills)} verified` : 'No strong competencies verified'}
              </span>
            </div>

            <div className="sf-card" style={{ padding: '1rem' }}>
              <span className="label-micro" style={{ color: 'var(--status-dev-text)' }}>
                Developing ({summaryCounts.Developing})
              </span>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  color: 'var(--status-dev-text)',
                }}
              >
                {summaryCounts.Developing}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {developingSubskills.length > 0 ? `${getSubskillLabelList(developingSubskills)} in progress` : 'None in progress'}
              </span>
            </div>

            <div className="sf-card" style={{ padding: '1rem' }}>
              <span className="label-micro" style={{ color: 'var(--status-weak-text)' }}>
                Weak ({summaryCounts.Weak})
              </span>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  color: 'var(--status-weak-text)',
                }}
              >
                {summaryCounts.Weak}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {weakSubskills.length > 0 ? `${getSubskillLabelList(weakSubskills)} (Critical Gap)` : 'No weak skills flagged'}
              </span>
            </div>

            <div className="sf-card" style={{ padding: '1rem' }}>
              <span className="label-micro" style={{ color: 'var(--status-missing-text)' }}>
                Missing ({summaryCounts.Missing})
              </span>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  color: 'var(--status-missing-text)',
                }}
              >
                {summaryCounts.Missing}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {missingSubskills.length > 0 ? getSubskillLabelList(missingSubskills) : 'No missing prerequisites'}
              </span>
            </div>
          </div>

          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.04))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.1rem',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.3rem' }}>
              💡 AI Diagnostic Summary:
            </strong>
            {aiDiagnosticSummary}
          </div>

          <AgentThoughtConsole logs={logs} title="Agent Thought Console" />

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                Domain Skill Matrix ({domains.length} Domains • {extractedSkills.length} Subskills)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Taxonomy Benchmark: {targetRole}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {domains.map((domain) => {
                const DomainIcon = domain.icon;
                return (
                  <div key={domain.id} className="sf-card" style={{ padding: '1rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DomainIcon size={16} color="var(--accent-primary)" />
                        <span
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {domain.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-tertiary)',
                          fontWeight: 500,
                        }}
                      >
                        Weight {domain.weight}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      {domain.subskills.map((sub) => (
                        <div
                          key={sub.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.75rem',
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ maxWidth: '65%' }}>
                            <div
                              style={{
                                color: 'var(--text-primary)',
                                fontWeight: 500,
                              }}
                            >
                              {sub.name}
                            </div>
                            <div
                              style={{
                                marginTop: '0.15rem',
                                color: 'var(--text-tertiary)',
                                fontSize: '0.7rem',
                                lineHeight: '1.3',
                              }}
                            >
                              {sub.detail}
                            </div>
                          </div>
                          <Badge status={sub.status}>{sub.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SkillGapView;
