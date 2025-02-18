import React from 'react';
import { Progress, Row, Col, Typography, Tooltip, Card, Space } from 'antd';
import { CheckCircleOutlined, QuestionCircleOutlined, FieldTimeOutlined } from '@ant-design/icons';
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
}

interface ProgressBarProps {
  metrics: ProgressMetric[] | ProgressMetrics;
}

const getStatusColor = (status: ProgressMetric['status']): string => {
  switch (status) {
    case 'low':
    case 'red':
      return '#dc2626';
    case 'medium':
    case 'yellow':
      return '#d97706';
    case 'high':
    case 'green':
      return '#059669';
    default:
      return '#2563eb';
  }
};

const ProgressBar: React.FC<ProgressBarProps> = ({ metrics }) => {
  // Check if metrics is the old format (array) or new format (object)
  if (Array.isArray(metrics)) {
    // Render old format
    return (
      <div className="progress-section">
        <Space size={32}>
          {metrics.map((metric, index) => {
            const percentage = metric.total > 0 
              ? Math.round((metric.value / metric.total) * 100)
              : 0;

            return (
              <Tooltip 
                key={index}
                title={metric.tooltipContent}
                placement="bottom"
              >
                <div className="progress-bar-section">
                  <div className="progress-title">{metric.title}</div>
                  <Progress 
                    type="line"
                    percent={percentage}
                    strokeColor={getStatusColor(metric.status)}
                    showInfo={false}
                    size="small"
                  />
                  <div 
                    className="progress-value"
                    style={{ color: getStatusColor(metric.status) }}
                  >
                    {percentage}%
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </Space>
      </div>
    );
  }

  // Render new format - more compact layout
  const coveragePercentage = (metrics.questionsAnswered / metrics.totalQuestions) * 100;

  return (
    <Row gutter={[16, 0]} align="middle" style={{ marginTop: '8px' }}>
      {/* Success Rate - Prominent Position */}
      <Col span={6}>
        <Tooltip title={`${metrics.successRate}% הצלחה בתשובות נכונות`}>
          <div style={{ 
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '6px',
            backgroundColor: '#f6ffed'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <Text strong style={{ fontSize: '12px' }}>אחוזי הצלחה</Text>
              <Text style={{ fontSize: '11px' }}>
                {metrics.successRate}%
              </Text>
            </div>
            <div style={{ padding: '0 2px' }}>
              <Progress 
                percent={metrics.successRate}
                strokeColor="#52c41a"
                size="small"
                showInfo={false}
                strokeWidth={3}
              />
            </div>
          </div>
        </Tooltip>
      </Col>

      {/* Progress Goals - Horizontal Layout */}
      <Col span={18}>
        <Card size="small" bordered={false} bodyStyle={{ padding: '4px 8px' }}>
          <Row gutter={[16, 8]}>
            {/* Coverage Box */}
            <Col span={6}>
              <Tooltip title={`${metrics.questionsAnswered} שאלות מתוך ${metrics.totalQuestions} שאלות אפשריות`}>
                <div style={{ 
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  padding: '6px',
                  backgroundColor: '#f0f5ff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text strong style={{ fontSize: '12px' }}>כיסוי</Text>
                    <Text style={{ fontSize: '11px' }}>
                      {metrics.questionsAnswered}/{metrics.totalQuestions}
                    </Text>
                  </div>
                  <div style={{ padding: '0 2px' }}>
                    <Progress 
                      percent={coveragePercentage}
                      strokeColor="#1890ff"
                      size="small"
                      showInfo={false}
                      strokeWidth={3}
                    />
                  </div>
                </div>
              </Tooltip>
            </Col>

            {/* Overall Progress */}
            <Col span={6}>
              <Tooltip title={`${metrics.overallProgress.current} מתוך ${metrics.overallProgress.target} שעות`}>
                <div style={{ 
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  padding: '6px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text strong style={{ fontSize: '12px' }}>יעד כללי</Text>
                    <Text style={{ fontSize: '11px' }}>
                      {metrics.overallProgress.current}/{metrics.overallProgress.target}ש׳
                    </Text>
                  </div>
                  <div style={{ padding: '0 2px' }}>
                    <Progress 
                      percent={(metrics.overallProgress.current / metrics.overallProgress.target) * 100} 
                      strokeColor="#722ed1"
                      size="small"
                      showInfo={false}
                      strokeWidth={3}
                    />
                  </div>
                </div>
              </Tooltip>
            </Col>

            {/* Weekly Progress */}
            <Col span={6}>
              <Tooltip title={`${metrics.weeklyProgress.current} מתוך ${metrics.weeklyProgress.target} שעות שבועיות`}>
                <div style={{ 
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  padding: '6px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text strong style={{ fontSize: '12px' }}>יעד שבועי</Text>
                    <Text style={{ fontSize: '11px' }}>
                      {metrics.weeklyProgress.current}/{metrics.weeklyProgress.target}ש׳
                    </Text>
                  </div>
                  <div style={{ padding: '0 2px' }}>
                    <Progress 
                      percent={(metrics.weeklyProgress.current / metrics.weeklyProgress.target) * 100} 
                      strokeColor="#13c2c2"
                      size="small"
                      showInfo={false}
                      strokeWidth={3}
                    />
                  </div>
                </div>
              </Tooltip>
            </Col>

            {/* Daily Progress */}
            <Col span={6}>
              <Tooltip title={`${metrics.dailyProgress.current} מתוך ${metrics.dailyProgress.target} שעות ביום`}>
                <div style={{ 
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  padding: '6px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text strong style={{ fontSize: '12px' }}>יעד יומי</Text>
                    <Text style={{ fontSize: '11px' }}>
                      {metrics.dailyProgress.current}/{metrics.dailyProgress.target}ש׳
                    </Text>
                  </div>
                  <div style={{ padding: '0 2px' }}>
                    <Progress 
                      percent={(metrics.dailyProgress.current / metrics.dailyProgress.target) * 100} 
                      strokeColor="#faad14"
                      size="small"
                      showInfo={false}
                      strokeWidth={3}
                    />
                  </div>
                </div>
              </Tooltip>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default ProgressBar; 