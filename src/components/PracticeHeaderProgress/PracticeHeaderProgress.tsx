import React, { useState } from 'react';
import { Typography, Tooltip, Progress, Button, Modal, Popover, DatePicker } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, QuestionCircleOutlined, CrownOutlined, CalendarOutlined, BookOutlined } from '@ant-design/icons';
import { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';
import { QuestionType } from '../../types/question';
import ProgressDetailsDialog from '../ProgressDetailsDialog/ProgressDetailsDialog';
import { ExamDatePicker } from '../practice/ExamDatePicker';
import moment from 'moment';
import { notification } from 'antd';
import styled from 'styled-components';

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
  gap: 24px;
  max-width: 1200px;
  width: 100%;
  height: 80px;
  padding: 0 24px;
  margin: 0 auto;
  direction: rtl;
  background: #f8fafc;
`;

const MetricGroup = styled.div<{ $hasBorder?: boolean }>`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: ${props => props.$hasBorder ? '0 24px' : '0'};
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
  font-weight: 500;
`;

const MetricValue = styled.div<{ $variant?: 'success' | 'progress' | 'default' | 'warning' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
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
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
  }
`;

const ProgressBar = styled(Progress)`
  width: 80px;
  
  .ant-progress-inner {
    background-color: #e5e7eb !important;
  }
  
  .ant-progress-bg {
    transition: all 0.3s ease-out;
  }
`;

const PracticeHeaderProgress: React.FC<PracticeHeaderProgressProps> = ({ 
  prep,
  onShowTopicDetails,
  onPrepUpdate,
  metrics
}) => {
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isExamDatePopoverOpen, setIsExamDatePopoverOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isLocalTopicsDialogOpen, setIsLocalTopicsDialogOpen] = useState(false);

  // Add logging when component receives new props
  console.log('PracticeHeaderProgress - Received props:', {
    hasPrep: !!prep,
    topicsCount: prep?.selection?.subTopics?.length,
    totalTopics: prep?.exam?.topics?.reduce((acc, topic) => acc + topic.subTopics.length, 0),
    metrics
  });

  // Calculate topic counts
  const subTopicCount = prep.exam.topics?.reduce(
    (count: number, topic) => count + (topic.subTopics?.length || 0), 
    0
  ) || 0;

  // Add detailed logging
  console.log('PracticeHeaderProgress: Topic counts', {
    selectedTopics: prep.selection.subTopics,
    selectedCount: prep.selection.subTopics.length,
    totalSubTopics: subTopicCount,
    examTopics: prep.exam.topics?.map(topic => ({
      topicName: topic.name,
      subTopicsCount: topic.subTopics?.length
    }))
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

  // Calculate total values
  const totalQuestions = metrics.questionsAnswered + metrics.remainingQuestions;
  const totalHours = metrics.hoursPracticed + metrics.remainingHours;

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
        }}>הציון המוערך שלך בבחינה</Text>
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
        <Text style={{ color: '#e2e8f0' }}>סה"כ שאלות: {totalQuestions}</Text>
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
  const questionCount = metrics.questionsAnswered;
  const successRate = metrics.successRate;
  const successStyles = getSuccessRateStyles(successRate, questionCount);

  console.log('PracticeHeaderProgress: Received progress data', {
    metrics,
    questionCount,
    successRate
  });

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

  // Add logging before render
  console.log('PracticeHeaderProgress - Rendering with topics:', {
    selectedTopics: prep?.selection?.subTopics?.length,
    totalTopics: prep?.exam?.topics?.reduce((acc, topic) => acc + topic.subTopics.length, 0)
  });

  const handleOpenDetailsDialog = () => {
    // Refresh metrics before opening dialog
    if (onPrepUpdate) {
      onPrepUpdate(prep);
    }
    setIsDetailsDialogOpen(true);
  };

  return (
    <MetricsContainer>
      {/* Progress Group */}
      <MetricGroup $hasBorder>
        {/* Progress Section */}
        <MetricSection>
          <MetricTitle>התקדמות</MetricTitle>
          <MetricValue $variant="progress" onClick={handleOpenDetailsDialog}>
            <TrophyOutlined style={{ fontSize: '18px', color: '#3b82f6' }} />
            <Text style={{ fontSize: '15px', fontWeight: '600', color: '#0284c7' }}>
              {questionCount === 0 ? '-' : `${Math.round(metrics.overallProgress)}/100`}
            </Text>
            <ProgressBar 
              percent={metrics.overallProgress} 
              size="small"
              strokeColor="#0284c7"
              trailColor="#bae6fd"
              showInfo={false}
            />
          </MetricValue>
        </MetricSection>

        {/* Score Section */}
        <MetricSection>
          <MetricTitle>ציון</MetricTitle>
          <MetricValue 
            $variant={
              successRate >= 80 ? 'success' : 
              successRate >= 60 ? 'warning' : 
              'error'
            }
            onClick={handleOpenDetailsDialog}
          >
            <Text style={{
              fontSize: '18px',
              color: successStyles.text,
              fontWeight: '600',
              margin: '0 auto'
            }}>
              {questionCount === 0 ? '-' : Math.round(successRate)}
            </Text>
          </MetricValue>
        </MetricSection>
      </MetricGroup>

      {/* Time Group */}
      <MetricGroup $hasBorder>
        {/* Time Section */}
        <MetricSection>
          <MetricTitle>נותרו לתרגל</MetricTitle>
          <MetricValue onClick={handleOpenDetailsDialog}>
            <ClockCircleOutlined style={{ fontSize: '16px', color: '#64748b' }} />
            <Text style={{ fontSize: '15px', fontWeight: '600', color: '#64748b' }}>
              {formatTime(metrics.remainingHours)}
            </Text>
          </MetricValue>
        </MetricSection>

        {/* Exam Date Section */}
        <MetricSection>
          <MetricTitle>זמן למבחן</MetricTitle>
          <MetricValue>
            <CalendarOutlined style={{ fontSize: '16px', color: '#64748b', marginLeft: '8px' }} />
            <ExamDatePicker 
              prep={prep}
              onPrepUpdate={onPrepUpdate}
            />
          </MetricValue>
        </MetricSection>
      </MetricGroup>

      {/* Topics Group */}
      <MetricGroup>
        <MetricSection>
          <MetricTitle>תכולת מבחן</MetricTitle>
          <MetricValue $variant="progress" onClick={() => onShowTopicDetails?.()}>
            <BookOutlined style={{ fontSize: '16px', color: '#3b82f6' }} />
            <Text style={{ fontSize: '15px', fontWeight: '600', color: '#3b82f6' }}>
              {prep.selection.subTopics.length}/{subTopicCount} נושאים
            </Text>
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
};

export default PracticeHeaderProgress;