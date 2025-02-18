import React from 'react';
import ProgressBar from './ProgressBar/ProgressBar';
import { usePracticeProgress } from '../hooks/usePracticeProgress';

const PracticeHeader: React.FC = () => {
  const { metrics, isLoading } = usePracticeProgress();

  if (isLoading) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 24px'
    }}>
      <ProgressBar metrics={metrics} />
    </div>
  );
};

export default PracticeHeader; 