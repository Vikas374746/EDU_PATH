import React from 'react';
import type { SkillStatus } from '../../types';

interface BadgeProps {
  status?: SkillStatus | 'neutral' | 'active' | 'locked';
  children: React.ReactNode;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status = 'neutral', children, showDot = true }) => {
  const statusClass = {
    Strong: 'sf-badge-strong',
    Developing: 'sf-badge-developing',
    Weak: 'sf-badge-weak',
    Missing: 'sf-badge-missing',
    active: 'sf-badge-developing',
    locked: 'sf-badge-neutral',
    neutral: 'sf-badge-neutral'
  }[status] || 'sf-badge-neutral';

  return (
    <span className={`sf-badge ${statusClass}`}>
      {showDot && <span className="sf-badge-dot" />}
      {children}
    </span>
  );
};
