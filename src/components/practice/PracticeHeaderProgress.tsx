import React, { useEffect, useCallback } from 'react';

interface PracticeMetrics {
  overallProgress: number;
  questionsAnswered: number;
}

interface PracticeHeaderProgressProps {
  prepId: string;
  metrics: PracticeMetrics;
}

const PracticeHeaderProgress: React.FC<PracticeHeaderProgressProps> = ({ prepId, metrics }) => {
  const componentId = React.useId();
  const renderCount = React.useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (!metrics) return;
    
    // Only log in development and when explicitly enabled
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_METRICS === 'true') {
      console.log('📈 PracticeHeaderProgress - Metrics changed:', {
        prepId,
        componentId,
        renderCount: renderCount.current,
        overallProgress: metrics.overallProgress,
        questionsAnswered: metrics.questionsAnswered,
      });
    }
  }, [metrics, prepId, componentId]);

  const renderProgressValue = useCallback(() => {
    // Only log in development and when explicitly enabled
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_METRICS === 'true') {
      console.log('📊 PracticeHeaderProgress - Rendering progress value:', {
        prepId,
        componentId,
        renderCount: renderCount.current,
        questionsAnswered: metrics?.questionsAnswered,
        progress: `${metrics?.overallProgress || 0}/100`,
      });
    }
    
    return (
      <div className="progress-value">
        {metrics?.overallProgress || 0}%
      </div>
    );
  }, [metrics, prepId, componentId]);

  return (
    <div className="practice-header-progress">
      {renderProgressValue()}
    </div>
  );
};

export default PracticeHeaderProgress; 