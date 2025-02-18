import React from 'react';
import { Progress, Tooltip, Space } from 'antd';
import './ProgressBar.css';

export interface ProgressMetric {
  title: string;
  value: number;
  total: number;
  status: 'low' | 'medium' | 'high' | 'red' | 'yellow' | 'green';
  tooltipContent: string;
}

interface ProgressBarProps {
  metrics: ProgressMetric[];
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
};

export default ProgressBar; 