/**
 * GapDashboard.tsx — Step 2: Skill Gap Analysis Dashboard
 * Re-exports the synchronized SkillGapView component.
 */
import React from 'react';
import { SkillGapView } from './SkillGapView';

export const GapDashboard: React.FC = () => {
  return <SkillGapView />;
};

export default GapDashboard;
