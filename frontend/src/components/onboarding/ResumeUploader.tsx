import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  User,
  BarChart3,
  Code,
  Briefcase,
  Workflow
} from 'lucide-react';
import type { UserProfile } from '../../types';

export interface TargetRoleOption {
  id: string;
  title: string;
  description: string;
  badge: string;
  isSupported: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const TARGET_ROLES: TargetRoleOption[] = [
  {
    id: 'Data Analyst',
    title: 'Data Analyst',
    description: 'SQL, Excel, Python & BI Dashboards',
    badge: 'Full Adaptive Support',
    isSupported: true,
    icon: BarChart3
  },
  {
    id: 'Frontend Engineer',
    title: 'Frontend Engineer',
    description: 'React, TypeScript, CSS Architecture & Web Vitals',
    badge: 'Preview Track',
    isSupported: false,
    icon: Code
  },
  {
    id: 'Product Manager',
    title: 'Product Manager',
    description: 'PRDs, Product Metrics, A/B Testing & Roadmaps',
    badge: 'Preview Track',
    isSupported: false,
    icon: Briefcase
  },
  {
    id: 'Data Engineer',
    title: 'Data Engineer',
    description: 'Distributed Pipelines, Spark, dbt & Data Warehousing',
    badge: 'Preview Track',
    isSupported: false,
    icon: Workflow
  }
];

interface ResumeUploaderProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
  onAnalyze: (file: File | null, isDemo: boolean) => Promise<void>;
  isLoading: boolean;
  currentProfile: UserProfile | null;
  hoursPerWeek: number;
  onHoursPerWeekChange: (value: number) => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  selectedRole,
  onSelectRole,
  onAnalyze,
  isLoading,
  currentProfile,
  hoursPerWeek,
  onHoursPerWeekChange
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setIsDemoMode(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setIsDemoMode(false);
    }
  };

  const handleUseDemo = () => {
    setIsDemoMode(true);
    setSelectedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(selectedFile, isDemoMode);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header & Context */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Select Target Role & Ingest Profile
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Choose your target career path to calibrate the skill ontology. EduPath will extract verified evidence from your resume and construct your personalized gap roadmap.
        </p>
      </div>

      {/* 2. Target Role Card Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <label className="label-micro">1. Select Target Role</label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Active: <strong style={{ color: 'var(--text-primary)' }}>{selectedRole}</strong>
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '0.75rem'
        }}>
          {TARGET_ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                className="sf-card"
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 0 1px var(--accent-primary)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  transition: 'all 0.15s ease',
                  color: '#E5E7EB'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-surface)' : 'var(--bg-app)',
                      border: `1px solid ${isSelected ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? 'var(--accent-primary)' : '#D1D5DB'
                    }}>
                      <Icon size={16} />
                    </div>

                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-xs)',
                      background: role.isSupported ? 'var(--status-strong-bg)' : 'var(--bg-app)',
                      color: role.isSupported ? 'var(--status-strong-text)' : '#D1D5DB',
                      border: `1px solid ${role.isSupported ? 'var(--status-strong-border)' : 'var(--border-subtle)'}`
                    }}>
                      {role.badge}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isSelected ? '#F3F4F6' : '#E5E7EB', marginBottom: '0.2rem' }}>
                    {role.title}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#D1D5DB', lineHeight: '1.4', margin: 0 }}>
                    {role.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  color: isSelected ? '#F3F4F6' : '#D1D5DB',
                  fontWeight: 500
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isSelected ? 'var(--accent-primary)' : '#D1D5DB'
                  }} />
                  <span>{isSelected ? 'Active Selection' : 'Click to select'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Resume Upload & Commitment Area */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label className="label-micro" style={{ display: 'block', marginBottom: '0.65rem' }}>
            2. Upload Resume & Time Commitment
          </label>

          {/* Time Commitment Slider */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weekly Learning Budget</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{hoursPerWeek} hours / week</strong>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="5"
              value={hoursPerWeek}
              onChange={(e) => onHoursPerWeekChange(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--accent-primary)',
                height: '5px',
                borderRadius: '3px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
              <span>5 hrs (6-Week Extended)</span>
              <span>10 hrs (4-Week Standard)</span>
              <span>20 hrs (2-Week Fast-Track)</span>
            </div>
          </div>

          {/* Drag & Drop Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: isDragging ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
              border: `1.5px dashed ${isDragging ? 'var(--accent-primary)' : isDemoMode || selectedFile ? 'var(--border-default)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {isDemoMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--status-strong-bg)',
                  color: 'var(--status-strong-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle2 size={20} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Demo Candidate: Data Analyst
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                  B.S. Computer Science • Coursework in Excel & Python • Novice SQL exposure with missing relational JOIN proficiency.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDemoMode(false);
                  }}
                  className="sf-btn sf-btn-ghost"
                  style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}
                >
                  Change or upload custom file
                </button>
              </div>
            ) : selectedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={18} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {selectedFile.name}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB • PDF Document
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="sf-btn sf-btn-ghost"
                  style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UploadCloud size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Drag and drop your resume PDF
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                    or click to browse files (PDF or TXT)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Demo Shortcut Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={15} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              No PDF on hand? Test the complete adaptive loop instantly.
            </span>
          </div>
          <button
            type="button"
            onClick={handleUseDemo}
            className="sf-btn sf-btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
          >
            Load Demo Profile
          </button>
        </div>

        {/* Action Button: Analyze My Gap */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <button
            type="submit"
            disabled={isLoading || (!selectedFile && !isDemoMode)}
            className="sf-btn sf-btn-primary"
            style={{
              padding: '0.75rem 1.6rem',
              fontSize: '0.92rem',
              fontWeight: 700,
              letterSpacing: '0.01em',
              background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 10px 24px rgba(79, 70, 229, 0.35)',
              opacity: (!selectedFile && !isDemoMode) || isLoading ? 0.6 : 1,
              cursor: (!selectedFile && !isDemoMode) || isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span>Analyzing Evidence...</span>
            ) : (
              <>
                <span>Analyze My Gap</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Extracted preview if currentProfile is already present */}
      {currentProfile && (
        <div className="sf-card" style={{ marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <User size={14} color="var(--accent-primary)" />
              <span>Extracted Profile: {currentProfile.name}</span>
            </div>
            <span className="label-micro" style={{ color: 'var(--status-strong-text)' }}>
              Target: {currentProfile.target_role}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {currentProfile.skills.map((s, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  background: s.proficiency === 'Advanced' ? 'var(--status-strong-bg)' : s.proficiency === 'Intermediate' ? 'var(--status-dev-bg)' : 'var(--status-missing-bg)',
                  color: s.proficiency === 'Advanced' ? 'var(--status-strong-text)' : s.proficiency === 'Intermediate' ? 'var(--status-dev-text)' : 'var(--status-missing-text)',
                  border: `1px solid ${s.proficiency === 'Advanced' ? 'var(--status-strong-border)' : s.proficiency === 'Intermediate' ? 'var(--status-dev-border)' : 'var(--status-missing-border)'}`
                }}
              >
                {s.name} ({s.proficiency})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
