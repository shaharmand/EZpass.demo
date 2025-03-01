import React from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface DailyLimitIndicatorProps {
  current: number;
  max: number;
}

export const DailyLimitIndicator: React.FC<DailyLimitIndicatorProps> = ({ current, max }) => {
  return (
    <div className="daily-limit-indicator">
      <Tooltip title="מספר המשובים המפורטים שנותרו לך היום">
        <div className="limit-content">
          <InfoCircleOutlined className="info-icon" />
          <span className="limit-text">משובים מפורטים</span>
          <span className="limit-count">{max - current}/{max}</span>
        </div>
      </Tooltip>
      <style>
        {`
          .daily-limit-indicator {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            background: ${current >= max ? '#fff1f2' : '#f0f9ff'};
            border: 1px solid ${current >= max ? '#fecdd3' : '#bfdbfe'};
            border-radius: 20px;
            font-size: 14px;
            color: ${current >= max ? '#be123c' : '#1e40af'};
            transition: all 0.2s ease;
          }

          .limit-content {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: help;
          }

          .info-icon {
            font-size: 16px;
            color: ${current >= max ? '#fb7185' : '#60a5fa'};
          }

          .limit-text {
            font-weight: 500;
          }

          .limit-count {
            font-weight: 600;
            color: ${current >= max ? '#e11d48' : '#2563eb'};
          }
        `}
      </style>
    </div>
  );
}; 