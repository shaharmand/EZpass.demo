import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Typography, Tooltip, Progress, Button, Modal, Popover, DatePicker } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, QuestionCircleOutlined, CrownOutlined, CalendarOutlined, BookOutlined, LineChartOutlined } from '@ant-design/icons';
import { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';
import { QuestionType } from '../../types/question';
import ProgressDetailsDialog from '../ProgressDetailsDialog/ProgressDetailsDialog';
import { ExamDatePicker } from '../practice/ExamDatePicker';
import moment from 'moment';
import { notification } from 'antd';
import styled from 'styled-components';
import { usePrepState } from '../../hooks/usePrepState';

const { Text } = Typography;

// Define UI colors since feedbackStyles doesn't have these
const uiColors = {
  background: {
    header: '#ffffff',
    metrics: '#f8fafc'
  },
  border: {
    light: '#e5e7eb',
    separator: '#f0f0f0'
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b'
  }
};

interface PracticeHeaderProgressProps {
  prep: StudentPrep;
  onShowTopicDetails?: () => void;
  onPrepUpdate?: (updatedPrep: StudentPrep) => void;
  metrics: {
    overallProgress: number;
    successRate: number;
    remainingHours: number;
    remainingQuestions: number;
    hoursPracticed: number;
    questionsAnswered: number;
    weeklyNeededHours: number;
    dailyNeededHours: number;
    examDate: number;
    totalQuestions: number;
    typeSpecificMetrics: Array<{
      type: QuestionType;
      progress: number;
      successRate: number;
      remainingHours: number;
      remainingQuestions: number;
      questionsAnswered: number;
    }>;
  };
}

const MetricsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  width: 100%;
  padding: 16px 24px;
  margin: 0 auto;
  direction: rtl;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const MetricGroup = styled.div<{ $hasBorder?: boolean }>`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: ${props => props.$hasBorder ? '0 0 0 24px' : '0'};
  margin: ${props => props.$hasBorder ? '0 0 0 24px' : '0'};
  border-left: ${props => props.$hasBorder ? `1px solid ${uiColors.border.light}` : 'none'};
  height: 60px;
`;

const MetricSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
`;

const MetricTitle = styled(Text)`
  font-size: 13px;
  color: ${uiColors.text.secondary};
  fontWeight: 500;
`;

const MetricValue = styled.div<{ $variant?: 'success' | 'progress' | 'default' | 'warning' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  padding: 0 12px;
  background: ${props => 
    props.$variant === 'success' ? '#f0fdf4' :
    props.$variant === 'progress' ? '#f0f7ff' :
    props.$variant === 'warning' ? '#fefce8' :
    props.$variant === 'error' ? '#fef2f2' :
    '#ffffff'};
  border: 1px solid ${props =>
    props.$variant === 'success' ? '#86efac' :
    props.$variant === 'progress' ? '#93c5fd' :
    props.$variant === 'warning' ? '#fde047' :
    props.$variant === 'error' ? '#fca5a5' :
    uiColors.border.light};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: ${props => 
    props.$variant === 'progress' ? '0 2px 4px rgba(37, 99, 235, 0.1)' : 
    '0 1px 2px rgba(0, 0, 0, 0.05)'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => 
      props.$variant === 'progress' ? '0 4px 8px rgba(37, 99, 235, 0.15)' : 
      '0 2px 6px rgba(0, 0, 0, 0.1)'};
  }
`;

const ProgressBar = styled(Progress)`
  width: 120px;
  margin-right: 8px;
  
  .ant-progress-inner {
    background-color: #e5e7eb !important;
    height: 8px !important;
    border-radius: 4px !important;
  }
  
  .ant-progress-bg {
    transition: all 0.3s ease-out;
    border-radius: 4px !important;
    box-shadow: 0 1px 2px rgba(2, 132, 199, 0.2);
  }
`;

// Progress value with animation styles
const AnimatedProgressValue = styled(Text)`
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(2, 132, 199, 0.08);
  line-height: 1.2;
  animation: highlight 0.6s ease-out;
  
  @keyframes highlight {
    0% {
      background: rgba(2, 132, 199, 0.25);
    }
    100% {
      background: rgba(2, 132, 199, 0.08);
    }
  }
`;

function PracticeHeaderProgress({ 
  prep: initialPrep,
  onShowTopicDetails,
  onPrepUpdate,
  metrics
}: PracticeHeaderProgressProps) {
  const componentId = useRef(Math.random().toString(36).substring(2, 8));
  const renderCount = useRef(0);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isExamDatePopoverOpen, setIsExamDatePopoverOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isLocalTopicsDialogOpen, setIsLocalTopicsDialogOpen] = useState(false);

  const prep = usePrepState(initialPrep.id, (updatedPrep) => {
    console.log('🔄 PracticeHeaderProgress - Received prep update:', {
      prepId: updatedPrep.id,
      componentId: componentId.current,
      renderCount: renderCount.current,
      topicsCount: updatedPrep.selection.subTopics.length,
      timestamp: new Date().toISOString()
    });
    if (onPrepUpdate) {
      console.log('📤 PracticeHeaderProgress - Calling onPrepUpdate callback');
      onPrepUpdate(updatedPrep);
    }
  });

  // Log component lifecycle
  useEffect(() => {
    renderCount.current += 1;
    console.log('🎯 PracticeHeaderProgress - Component mounted:', {
      prepId: prep?.id ?? 'unknown',
      componentId: componentId.current,
      renderCount: renderCount.current,
      hasPrep: !!prep,
      timestamp: new Date().toISOString()
    });

    return () => {
      console.log('👋 PracticeHeaderProgress - Component unmounted:', {
        prepId: prep?.id ?? 'unknown',
        componentId: componentId.current,
        renderCount: renderCount.current,
        timestamp: new Date().toISOString()
      });
    };
  }, [prep?.id]);

  // Log when prep changes
  useEffect(() => {
    console.log('📊 PracticeHeaderProgress - Prep state changed:', {
      prepId: prep?.id ?? 'unknown',
      componentId: componentId.current,
      renderCount: renderCount.current,
      hasPrep: !!prep,
      topicsCount: prep?.selection.subTopics.length ?? 0,
      timestamp: new Date().toISOString()
    });
  }, [prep]);

  // Log when metrics change
  useEffect(() => {
    console.log('📈 PracticeHeaderProgress - Metrics changed:', {
      prepId: prep?.id ?? 'unknown',
      componentId: componentId.current,
      renderCount: renderCount.current,
      overallProgress: metrics.overallProgress,
      questionsAnswered: metrics.questionsAnswered,
      successRate: metrics.successRate,
      timestamp: new Date().toISOString()
    });
  }, [metrics, prep?.id]);

  // Log before rendering
  console.log('🎨 PracticeHeaderProgress - Rendering:', {
    prepId: prep?.id ?? 'unknown',
    componentId: componentId.current,
    renderCount: renderCount.current,
    hasMetrics: !!metrics,
    overallProgress: metrics.overallProgress,
    timestamp: new Date().toISOString()
  });

  // Helper functions
  const normalizeProgress = (value: number) => Math.round(Math.min(100, Math.max(0, value)));
  const formatHours = (hours: number) => Number(hours.toFixed(1));
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    
    // Pad with zeros to ensure HH:MM format
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    
    return `${hStr}:${mStr}`;
  };

  const formatTimeUntilExam = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    return formatTime(hours);
  };

  // Get type-specific tooltips
  const getProgressTooltip = () => {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', color: '#fff' }}>
        <Text style={{ 
          color: '#e2e8f0',
          fontSize: '14px',
          fontWeight: '500',
          display: 'block',
          marginBottom: '4px'
        }}>מצב המוכנות שלך לקראת הבחינה</Text>
        <Text style={{ 
          color: '#94a3b8',
          fontSize: '13px'
        }}>לחץ כאן לפרטים נוספים</Text>
      </div>
    );
  };

  const getSuccessTooltip = () => {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', color: '#fff' }}>
        <Text style={{ 
          color: '#e2e8f0',
          fontSize: '14px',
          fontWeight: '500',
          display: 'block',
          marginBottom: '4px'
        }}>הציון המוערך שלך בבחינה (0-100)</Text>
        <Text style={{ 
          color: '#94a3b8',
          fontSize: '13px'
        }}>לחץ לפרטים נוספים</Text>
      </div>
    );
  };

  const getTimeTooltip = () => {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', color: '#fff' }}>
        <Text style={{ 
          color: '#e2e8f0',
          fontSize: '14px',
          fontWeight: '500',
          display: 'block',
          marginBottom: '4px'
        }}>הזמן הנותר לתרגול עד למוכנות</Text>
        <Text style={{ 
          color: '#94a3b8',
          fontSize: '13px'
        }}>לחץ כאן לפרטים נוספים</Text>
      </div>
    );
  };

  const getQuestionsTooltip = () => {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', color: '#fff' }}>
        <Text style={{ color: '#e2e8f0' }}>שאלות שנותרו: {metrics.remainingQuestions}</Text>
        <br />
        <Text style={{ color: '#e2e8f0' }}>שאלות שהושלמו: {metrics.questionsAnswered}</Text>
        <br />
        <Text style={{ color: '#e2e8f0' }}>סה"כ שאלות: {metrics.totalQuestions}</Text>
      </div>
    );
  };

  const getTopicsTooltip = () => {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', color: '#fff' }}>
        <Text style={{ 
          color: '#e2e8f0',
          fontSize: '14px',
          fontWeight: '500',
          display: 'block',
          marginBottom: '4px'
        }}>כמות הנושאים שכלולה במבחן שלך</Text>
        <Text style={{ 
          color: '#94a3b8',
          fontSize: '13px'
        }}>לחץ על מנת לשנות את תכולת המבחן</Text>
      </div>
    );
  };

  // Helper function to get success rate styles
  const getSuccessRateStyles = (rate: number, questionCount: number) => {
    if (questionCount === 0) {
      return {
        background: '#f1f5f9',
        text: '#64748b',
        border: '#cbd5e1'
      };
    }
    
    if (rate >= 80) {
      return {
        background: '#f0fdf4',
        text: '#16a34a',
        border: '#86efac'
      };
    } else if (rate >= 60) {
      return {
        background: '#fefce8',
        text: '#ca8a04',
        border: '#fde047'
      };
    } else {
      return {
        background: '#fef2f2',
        text: '#dc2626',
        border: '#fca5a5'
      };
    }
  };

  // Get question count and success rate
  const successStyles = getSuccessRateStyles(metrics.successRate, metrics.questionsAnswered);

  const examDateContent = (
    <div className="exam-date-popover">
      <DatePicker
        style={{ width: '100%' }}
        placeholder="בחר תאריך בחינה"
        onChange={(date) => {
          if (date) {
            // Here you would typically call a function to update the exam date
            console.log('New exam date:', date.valueOf());
          }
          setIsExamDatePopoverOpen(false);
        }}
        format="DD/MM/YYYY"
      />
    </div>
  );

  const handleOpenDetailsDialog = () => {
    // Refresh metrics before opening dialog
    if (onPrepUpdate && prep) {
      onPrepUpdate(prep);
    }
    setIsDetailsDialogOpen(true);
  };

  return (
    <MetricsContainer>
      {/* Animation styles */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      
      {/* Progress Group - First/Right */}
      <MetricGroup $hasBorder>
        {/* Progress Section */}
        <MetricSection>
          <MetricTitle>התקדמות</MetricTitle>
          <MetricValue 
            $variant={metrics.questionsAnswered === 0 ? 'default' : "progress"} 
            onClick={handleOpenDetailsDialog}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LineChartOutlined style={{ 
                fontSize: '18px', 
                color: metrics.questionsAnswered === 0 ? '#94a3b8' : '#0284c7' 
              }} />
              <Text 
                key={`progress-${Math.round(metrics.overallProgress)}`} 
                style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', 
                  color: metrics.questionsAnswered === 0 ? '#94a3b8' : '#0284c7',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: metrics.questionsAnswered === 0 ? 'transparent' : 'rgba(2, 132, 199, 0.08)',
                  transition: 'all 0.3s ease',
                  animation: metrics.questionsAnswered === 0 ? 'none' : 'pulse 0.6s ease-in-out'
                }}
              >
                {(() => {
                  console.log('📊 PracticeHeaderProgress - Rendering progress value:', {
                    prepId: prep?.id ?? 'unknown',
                    componentId: componentId.current,
                    renderCount: renderCount.current,
                    questionsAnswered: metrics.questionsAnswered,
                    progress: metrics.questionsAnswered === 0 ? '-' : `${Math.round(metrics.overallProgress)}/100`,
                    timestamp: new Date().toISOString()
                  });
                  return metrics.questionsAnswered === 0 ? '-' : `${Math.round(metrics.overallProgress)}/100`;
                })()}
              </Text>
            </div>
            <ProgressBar 
              percent={metrics.questionsAnswered === 0 ? 0 : metrics.overallProgress} 
              size="small"
              strokeColor={metrics.questionsAnswered === 0 ? "#cbd5e1" : "#0284c7"}
              strokeWidth={6}
              format={() => ''}
            />
          </MetricValue>
        </MetricSection>

        {/* Score Section */}
        <MetricSection>
          <MetricTitle>ציון</MetricTitle>
          <MetricValue 
            $variant={
              metrics.questionsAnswered === 0 ? 'default' :
              metrics.successRate >= 80 ? 'success' : 
              metrics.successRate >= 60 ? 'warning' : 
              'error'
            }
            onClick={handleOpenDetailsDialog}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircleOutlined style={{ 
                fontSize: '18px', 
                color: metrics.questionsAnswered === 0 ? '#94a3b8' : successStyles.text 
              }} />
              <Text 
                key={`score-${Math.round(metrics.successRate)}`}
                style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', 
                  color: metrics.questionsAnswered === 0 ? '#94a3b8' : successStyles.text,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: metrics.questionsAnswered === 0 ? 'transparent' : 
                    metrics.successRate >= 80 ? 'rgba(34, 197, 94, 0.08)' :
                    metrics.successRate >= 60 ? 'rgba(234, 179, 8, 0.08)' :
                    'rgba(239, 68, 68, 0.08)',
                  transition: 'all 0.3s ease',
                  animation: metrics.questionsAnswered === 0 ? 'none' : 'pulse 0.6s ease-in-out'
                }}
              >
                {metrics.questionsAnswered === 0 ? '-' : Math.round(metrics.successRate)}
              </Text>
            </div>
          </MetricValue>
        </MetricSection>
      </MetricGroup>

      {/* Time Group - Middle */}
      <MetricGroup $hasBorder>
        {/* Time Section */}
        <MetricSection>
          <MetricTitle>נותרו לתרגל</MetricTitle>
          <MetricValue onClick={handleOpenDetailsDialog}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClockCircleOutlined style={{ fontSize: '16px', color: '#64748b' }} />
              <Text style={{ fontSize: '15px', fontWeight: '600', color: '#64748b' }}>
                {formatTime(metrics.remainingHours)}
              </Text>
            </div>
          </MetricValue>
        </MetricSection>

        {/* Exam Date Section */}
        <MetricSection>
          <MetricTitle>זמן למבחן</MetricTitle>
          <MetricValue>
            <CalendarOutlined style={{ fontSize: '16px', color: '#64748b', marginLeft: '8px' }} />
            {prep && (
              <ExamDatePicker 
                prep={prep}
                onPrepUpdate={onPrepUpdate}
              />
            )}
          </MetricValue>
        </MetricSection>
      </MetricGroup>

      {/* Topics Group - Left */}
      <MetricGroup>
        <MetricSection>
          <MetricTitle>תכולת מבחן</MetricTitle>
          <MetricValue $variant="progress" onClick={() => onShowTopicDetails?.()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOutlined style={{ fontSize: '16px', color: '#3b82f6' }} />
              <Text style={{ 
                fontSize: '15px', 
                fontWeight: '600', 
                color: '#3b82f6',
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.08)'
              }}>
                {prep?.selection.subTopics.length ?? 0}/{prep ? PrepStateManager.getTotalTopicsCount(prep) : 0} תתי-נושאים
              </Text>
            </div>
          </MetricValue>
        </MetricSection>
      </MetricGroup>

      <ProgressDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        metrics={metrics}
      />
    </MetricsContainer>
  );
}

export default PracticeHeaderProgress;