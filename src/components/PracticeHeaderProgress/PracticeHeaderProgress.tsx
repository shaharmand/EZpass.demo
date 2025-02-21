import React from 'react';
import { Typography, Space, Tooltip } from 'antd';
import { 
  ClockCircleOutlined, 
  CalendarOutlined,
  FieldTimeOutlined,
  CheckCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import './PracticeHeaderProgress.css';

const { Text } = Typography;

export interface ProgressMetrics {
  successRate: number;
  questionsAnswered: number;
  totalQuestions: number;
  overallProgress: {
    current: number;
    target: number;
  };
  weeklyProgress: {
    current: number;
    target: number;
  };
  dailyProgress: {
    current: number;
    target: number;
  };
}

interface PracticeHeaderProgressProps {
  metrics: ProgressMetrics;
}

const PracticeHeaderProgress: React.FC<PracticeHeaderProgressProps> = ({ metrics }) => {
  const getSuccessRateClass = (rate: number) => {
    if (rate >= 80) return 'high';
    if (rate >= 60) return 'medium';
    return 'low';
  };

  const successClass = getSuccessRateClass(metrics.successRate);

  return (
    <div className="progress-section">
      {/* Success Rate - Main Metric */}
      <div className={`success-metric ${successClass}`}>
        <div className="metric-header">
          <TrophyOutlined className="metric-icon" />
          <Text className="metric-label">אחוז הצלחה</Text>
        </div>
        <Text className="success-value">
          {metrics.successRate > -1 ? (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {Math.round(metrics.successRate)}%
            </motion.span>
          ) : '-'}
        </Text>
      </div>

      {/* Questions Group */}
      <div className="questions-group">
        <div className="progress-metric">
          <div className="metric-header">
            <CheckCircleOutlined className="metric-icon" />
            <Text className="metric-label">סה״כ שאלות</Text>
          </div>
          <Text className="metric-value">
            {metrics.questionsAnswered}/{metrics.totalQuestions}
          </Text>
          <div className="progress-bar-container">
            <motion.div 
              className="progress-bar questions"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((metrics.questionsAnswered / metrics.totalQuestions) * 100, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Hours Group */}
      <div className="hours-group">
        <div className="progress-metric">
          <div className="metric-header">
            <ClockCircleOutlined className="metric-icon" />
            <Text className="metric-label">סה״כ שעות</Text>
          </div>
          <Text className="metric-value">
            {metrics.overallProgress.current}/{metrics.overallProgress.target}
          </Text>
          <div className="progress-bar-container">
            <motion.div 
              className="progress-bar hours"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((metrics.overallProgress.current / metrics.overallProgress.target) * 100, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeHeaderProgress; 