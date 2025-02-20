import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Card, Space, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, ClockCircleOutlined, 
  CalendarOutlined, TrophyOutlined, 
  FieldTimeOutlined 
} from '@ant-design/icons';
import './ProgressBar.css';

const { Text } = Typography;

// Old interface for backward compatibility
export interface ProgressMetric {
  title: string;
  value: number;
  total: number;
  status: 'low' | 'medium' | 'high' | 'red' | 'yellow' | 'green';
  tooltipContent: string;
}

// New interface for enhanced metrics
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
  totalTime?: number; // Total time in minutes
}

interface ProgressBarProps {
  metrics: ProgressMetric[] | ProgressMetrics;
}

// Updated color scheme
const colors = {
  primary: '#3b82f6',
  success: {
    low: {
      background: 'rgba(100, 116, 139, 0.1)', // Slate color for "in progress"
      border: '#64748b',
      text: '#334155'
    },
    medium: {
      background: 'rgba(59, 130, 246, 0.1)', // Blue color for "on track"
      border: '#3b82f6',
      text: '#1e40af'
    },
    high: {
      background: 'rgba(52, 211, 153, 0.1)', // Green color for "ahead"
      border: '#34d399',
      text: '#065f46'
    }
  },
  border: '#e2e8f0',
  text: {
    primary: '#1e293b',
    secondary: '#64748b'
  },
  background: {
    light: '#f8fafc',
    highlight: '#f0f7ff'
  }
};

const metricCardStyle = {
  backgroundColor: colors.background.light,
  borderColor: colors.border,
  height: '72px',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  borderRadius: '8px',
  overflow: 'hidden'
};

const labelStyle = {
  fontSize: '14px',
  color: colors.text.secondary,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '4px',
  justifyContent: 'center'
};

const valueStyle = {
  fontSize: '16px',
  color: colors.text.primary,
  fontWeight: 600,
  textAlign: 'center' as const,
  direction: 'ltr' as const,
  marginTop: '4px'
};

const successValueStyle = {
  fontSize: '24px',
  fontWeight: 700,
  textAlign: 'center' as const,
  direction: 'ltr' as const,
  lineHeight: '1',
  margin: '4px 0'
};

const miniProgressStyle = {
  height: '3px',
  backgroundColor: '#e2e8f0',
  borderRadius: '1.5px',
  overflow: 'hidden',
  margin: '6px 12px 0'
};

const getProgressColor = (percent: number) => {
  if (percent >= 80) return colors.success.high.border; // Green for >= 80%
  if (percent >= 60) return colors.success.medium.border; // Orange for 60-79%
  return colors.success.low.border; // Red for < 60%
};

const getSuccessCardStyle = (successRate: number) => ({
  ...metricCardStyle,
  backgroundColor: successRate === -1 ? colors.background.light : 
    successRate >= 80 ? colors.success.high.background :
    successRate >= 60 ? colors.success.medium.background :
    colors.success.low.background,
  borderColor: successRate === -1 ? colors.border :
    successRate >= 80 ? colors.success.high.border :
    successRate >= 60 ? colors.success.medium.border :
    colors.success.low.border,
  transition: 'all 0.3s ease'
});

const getSuccessTextStyle = (successRate: number) => ({
  ...valueStyle,
  color: successRate === -1 ? colors.text.secondary :
    successRate >= 80 ? colors.success.high.text :
    successRate >= 60 ? colors.success.medium.text :
    colors.success.low.text
});

const getSuccessLabelStyle = (successRate: number) => ({
  ...labelStyle,
  color: successRate === -1 ? colors.text.secondary :
    successRate >= 80 ? colors.success.high.text :
    successRate >= 60 ? colors.success.medium.text :
    colors.success.low.text
});

const ProgressBar: React.FC<ProgressBarProps> = ({ metrics }) => {
  if (Array.isArray(metrics)) {
    return null;
  }

  const renderMiniProgress = (percent: number) => (
    <div style={miniProgressStyle}>
      <div
        style={{
          width: `${Math.min(100, percent)}%`,
          height: '100%',
          backgroundColor: getProgressColor(percent),
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  );

  const formatValue = (current: number, total?: number, suffix?: string) => {
    if (total) {
      return `${current}/${total}${suffix ? ` ${suffix}` : ''}`;
    }
    return `${current}${suffix ? ` ${suffix}` : ''}`;
  };

  return (
    <Row gutter={16} align="middle">
      {/* Success Rate */}
      <Col span={4}>
        <Card size="small" style={getSuccessCardStyle(metrics.successRate)} bodyStyle={{ padding: '12px' }}>
          <Tooltip title="אחוז ההצלחה הכולל שלך במענה על שאלות">
            <div style={{ textAlign: 'center' }}>
              <div style={{ ...getSuccessLabelStyle(metrics.successRate), justifyContent: 'center', marginBottom: '8px' }}>
                <TrophyOutlined style={{ 
                  color: metrics.successRate === -1 ? colors.primary : 
                    metrics.successRate >= 80 ? colors.success.high.text :
                    metrics.successRate >= 60 ? colors.success.medium.text :
                    colors.success.low.text, 
                  fontSize: '18px' 
                }} />
                <Text style={getSuccessLabelStyle(metrics.successRate)}>הצלחה</Text>
              </div>
              <Text style={{
                ...successValueStyle,
                color: metrics.successRate === -1 ? colors.text.secondary :
                  metrics.successRate >= 80 ? colors.success.high.text :
                  metrics.successRate >= 60 ? colors.success.medium.text :
                  colors.success.low.text
              }}>
                {metrics.successRate === -1 ? '-' : `${Math.round(metrics.successRate)}%`}
              </Text>
            </div>
          </Tooltip>
        </Card>
      </Col>

      {/* Total Questions */}
      <Col span={4}>
        <Card size="small" style={metricCardStyle} bodyStyle={{ padding: '8px 12px' }}>
          <Tooltip title="מספר השאלות הכולל שענית מתוך היעד הכולל לתרגול למבחן">
            <div>
              <div style={labelStyle}>
                <CheckCircleOutlined style={{ color: colors.primary, fontSize: '16px' }} />
                <Text>סה״כ שאלות</Text>
              </div>
              <Text style={valueStyle}>
                {formatValue(metrics.questionsAnswered, metrics.totalQuestions)}
              </Text>
              {renderMiniProgress((metrics.questionsAnswered / metrics.totalQuestions) * 100)}
            </div>
          </Tooltip>
        </Card>
      </Col>

      {/* Overall Goal */}
      <Col span={4}>
        <Card size="small" style={metricCardStyle} bodyStyle={{ padding: '8px 12px' }}>
          <Tooltip title="היעד הכללי המינימלי בשעות תרגול למבחן">
            <div>
              <div style={labelStyle}>
                <FieldTimeOutlined style={{ color: colors.primary, fontSize: '16px' }} />
                <Text>יעד כללי</Text>
              </div>
              <Text style={valueStyle}>
                {formatValue(metrics.overallProgress.current, metrics.overallProgress.target, 'שעות')}
              </Text>
              {renderMiniProgress((metrics.overallProgress.current / metrics.overallProgress.target) * 100)}
            </div>
          </Tooltip>
        </Card>
      </Col>

      {/* Weekly Goal */}
      <Col span={4}>
        <Card size="small" style={metricCardStyle} bodyStyle={{ padding: '8px 12px' }}>
          <Tooltip title="היעד השבועי המינימלי בשעות תרגול למבחן">
            <div>
              <div style={labelStyle}>
                <CalendarOutlined style={{ color: colors.primary, fontSize: '16px' }} />
                <Text>יעד שבועי</Text>
              </div>
              <Text style={valueStyle}>
                {formatValue(metrics.weeklyProgress.current, metrics.weeklyProgress.target, 'שעות')}
              </Text>
              {renderMiniProgress((metrics.weeklyProgress.current / metrics.weeklyProgress.target) * 100)}
            </div>
          </Tooltip>
        </Card>
      </Col>

      {/* Daily Goal */}
      <Col span={4}>
        <Card size="small" style={metricCardStyle} bodyStyle={{ padding: '8px 12px' }}>
          <Tooltip title="היעד היומי המינימלי בדקות תרגול למבחן">
            <div>
              <div style={labelStyle}>
                <ClockCircleOutlined style={{ color: colors.primary, fontSize: '16px' }} />
                <Text>יעד יומי</Text>
              </div>
              <Text style={valueStyle}>
                {formatValue(metrics.dailyProgress.current, metrics.dailyProgress.target, 'דק׳')}
              </Text>
              {renderMiniProgress((metrics.dailyProgress.current / metrics.dailyProgress.target) * 100)}
            </div>
          </Tooltip>
        </Card>
      </Col>
    </Row>
  );
};

export default ProgressBar; 