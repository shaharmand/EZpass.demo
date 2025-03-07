import React, { useState } from 'react';
import { Typography, Tooltip, Progress, Button, Modal, Popover, DatePicker } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, QuestionCircleOutlined, CrownOutlined, CalendarOutlined, BookOutlined } from '@ant-design/icons';
import { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';
import { colors } from '../../utils/feedbackStyles';
import { QuestionType } from '../../types/question';
import ProgressDetailsDialog from '../ProgressDetailsDialog/ProgressDetailsDialog';
import { ExamDatePicker } from '../practice/ExamDatePicker';
import moment from 'moment';
import { notification } from 'antd';

const { Text } = Typography;

interface PracticeHeaderProgressProps {
  prep: StudentPrep;
  onShowTopicDetails?: () => void;
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

const PracticeHeaderProgress: React.FC<PracticeHeaderProgressProps> = ({ 
  prep,
  onShowTopicDetails,
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

  // Get success rate styles
  const getSuccessRateStyles = (rate: number, questionCount: number) => {
    if (questionCount === 0) {
      return {
        icon: colors.gray,
        text: colors.gray,
        background: '#f5f5f5'
      };
    }
    
    // Use the same thresholds as the feedback system
    if (rate >= 80) {
      return {
        icon: colors.success,
        text: colors.success,
        background: '#f0fdf4'  // Light green background
      };
    }
    if (rate >= 55) {
      return {
        icon: colors.warning,
        text: colors.warning,
        background: '#fff7e6'  // Light yellow background
      };
    }
    return {
      icon: colors.error,
      text: colors.error,
      background: '#fff1f0'  // Light red background
    };
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

  return (
    <>
      <div style={{ 
        padding: '16px 24px',
        background: '#f8fafc',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        direction: 'rtl',
        gap: '0',
        minHeight: '72px',
      }}>
        {/* Overall Progress - Main Metric */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginRight: 'auto',
          borderLeft: '1px solid #e2e8f0',
          padding: '0 32px',
          height: '100%',
          cursor: 'pointer'
        }}
        onClick={() => setIsDetailsDialogOpen(true)}>
          <Tooltip title={getProgressTooltip()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <TrophyOutlined style={{ 
                fontSize: '28px', 
                color: '#3b82f6',
                marginTop: '4px'
              }} />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '2px',
                width: '180px',
                padding: '0 4px'
              }}>
                <Text style={{ 
                  fontSize: '15px', 
                  color: '#64748b',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>התקדמות</Text>
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '36px'
                }}>
                  <Text style={{
                    fontSize: '14px',
                    color: '#0284c7',
                    fontWeight: '500',
                    minWidth: '45px',
                    textAlign: 'left'
                  }}>{questionCount === 0 ? '-' : `${Math.round(metrics.overallProgress)}/100`}</Text>
                  <Progress 
                    percent={metrics.overallProgress} 
                    size="small"
                    strokeColor="#0284c7"
                    trailColor="#bae6fd"
                    showInfo={false}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Success Rate */}
        <div style={{
          width: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderLeft: '1px solid #e2e8f0',
          padding: '0 24px',
          cursor: 'pointer'
        }}
        onClick={() => setIsDetailsDialogOpen(true)}>
          <Tooltip title={getSuccessTooltip()}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Text style={{
                fontSize: '15px',
                color: '#64748b',
                fontWeight: '500',
                marginBottom: '8px'
              }}>ציון</Text>
              <div style={{
                background: successStyles.background,
                border: `1px solid ${successStyles.text}`,
                borderRadius: '4px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '36px'
              }}>
                <Text style={{
                  fontSize: '16px',
                  color: successStyles.text,
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}>
                  {questionCount === 0 ? '-' : Math.round(successRate)}
                </Text>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Time and Questions Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          height: '100%',
          marginRight: '40px',
          position: 'relative',
          borderLeft: '1px solid #e2e8f0',
          padding: '0 24px'
        }}>
          {/* Hours Remaining */}
          <Tooltip title={getTimeTooltip()}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                 onClick={() => setIsDetailsDialogOpen(true)}>
              <Text style={{
                fontSize: '15px',
                color: '#64748b',
                fontWeight: '500',
                marginBottom: '8px'
              }}>נותרו לתרגל</Text>
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '36px',
                minWidth: '80px'
              }}>
                <ClockCircleOutlined style={{ fontSize: '16px', color: '#64748b', marginLeft: '8px' }} />
                <Text style={{
                  fontSize: '16px',
                  color: '#64748b',
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}>
                  {formatTime(metrics.remainingHours)}
                </Text>
              </div>
            </div>
          </Tooltip>

          {/* Exam Date */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start'  // Changed from 'center' to 'flex-start'
          }}>
            <Text style={{
              fontSize: '15px',
              color: '#64748b',
              fontWeight: '500',
              marginBottom: '8px'
            }}>זמן למבחן</Text>
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',  // Changed from 'center' to 'flex-start'
              height: '36px',
              minWidth: '120px'
            }}>
              <ExamDatePicker 
                prep={prep}
                onPrepUpdate={(updatedPrep) => {
                  PrepStateManager.updatePrep(updatedPrep);
                }}
              />
            </div>
          </div>
        </div>

        {/* Topics Section - Simple Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          borderLeft: '1px solid #e2e8f0',
          padding: '0 24px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: '15px',
              color: '#64748b',
              fontWeight: '500',
              marginBottom: '8px'
            }}>תכולת מבחן</Text>
            <Button
              type="default"
              icon={<BookOutlined />}
              onClick={() => {
                if (typeof onShowTopicDetails === 'function') {
                  onShowTopicDetails();
                }
              }}
              style={{
                height: '36px',
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#f0f7ff',
                border: '1px solid #e5e7eb',
                color: '#3b82f6'
              }}
            >
              {prep.selection.subTopics.length}/{subTopicCount} נושאים
            </Button>
          </div>
        </div>
      </div>

      <ProgressDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        metrics={metrics}
      />
    </>
  );
};

export default PracticeHeaderProgress;