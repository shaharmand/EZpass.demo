import React from 'react';
import { Typography, Tooltip, Progress } from 'antd';
import { TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';
import { colors } from '../../utils/feedbackStyles';

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
  };
}

const PracticeHeaderProgress: React.FC<PracticeHeaderProgressProps> = ({ 
  prep,
  onShowTopicDetails,
  metrics
}) => {
  // Helper functions
  const normalizeProgress = (value: number) => Math.round(Math.min(100, Math.max(0, value)));
  const formatHours = (hours: number) => Number(hours.toFixed(1));

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

  return (
    <div style={{ 
      padding: '16px 24px',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      direction: 'rtl',
      gap: '32px'
    }}>
      {/* Overall Progress */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginRight: 'auto',
        borderLeft: '1px solid #f0f0f0',
        paddingLeft: '32px'
      }}>
        <TrophyOutlined style={{ fontSize: '16px', color: colors.gray }} />
        <Text style={{ fontSize: '14px' }}>התקדמות כללית</Text>
        <Progress 
          percent={metrics.overallProgress}
          size="small"
          strokeColor={colors.success}
          style={{ margin: 0, width: '80px' }}
          format={percent => {
            console.log('PracticeHeaderProgress: Rendering progress bar', {
              overallProgress: metrics.overallProgress,
              displayPercent: percent
            });
            return `${percent}%`;
          }}
        />
      </div>

      {/* Success Rate */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '8px',
        borderLeft: '1px solid #f0f0f0',
        paddingLeft: '32px'
      }}>
        <CheckCircleOutlined style={{ 
          fontSize: '16px',
          color: successStyles.icon
        }} />
        <Text style={{ fontSize: '14px' }}>הצלחה</Text>
        <div style={{
          background: successStyles.background,
          padding: '4px 12px',
          borderRadius: '16px',
          border: `1px solid ${successStyles.text}20`,
          minWidth: '60px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {questionCount === 0 ? (
            <Text style={{ 
              fontSize: '14px',
              color: colors.gray
            }}>
              אין נתונים
            </Text>
          ) : (
            <Text strong style={{ 
              fontSize: '16px',
              color: successStyles.text
            }}>
              {`${Math.round(successRate)}%`}
            </Text>
          )}
        </div>
      </div>

      {/* Time and Questions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text style={{ fontSize: '14px', color: colors.gray }}>שאלות:</Text>
          <Text strong style={{ fontSize: '14px' }}>
            {metrics.questionsAnswered}/{metrics.questionsAnswered + metrics.remainingQuestions}
          </Text>
        </div>
        <Text style={{ color: colors.gray }}>|</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text style={{ fontSize: '14px', color: colors.gray }}>שעות תרגול:</Text>
          <Text strong style={{ fontSize: '14px' }}>
            {formatHours(metrics.hoursPracticed)}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default PracticeHeaderProgress;