import React from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface DailyLimitIndicatorProps {
  current: number;
  max: number;
}

export const DailyLimitIndicator: React.FC<DailyLimitIndicatorProps> = ({ current, max }) => {
  const remaining = Math.max(0, max - current);
  const isLow = remaining <= Math.min(5, max * 0.1); // Low if 5 or fewer remaining, or less than 10% of max
  
  return (
    <div className={`daily-limit-indicator ${isLow ? 'low-remaining' : ''}`}>
      <Tooltip title="מספר המשובים המפורטים שנותרו לך היום">
        <div className="limit-content">
          <InfoCircleOutlined className="info-icon" />
          <span className="limit-text">משובים מפורטים</span>
          <span className="limit-count">{remaining}/{max}</span>
        </div>
      </Tooltip>
      <style>
        {`
          .daily-limit-indicator {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
            border-radius: 20px;
            font-size: 14px;
            color: #1e40af;
            transition: all 0.2s ease;
          }
          
          .daily-limit-indicator.low-remaining {
            background: #fff1f2;
            border-color: #fecdd3;
            color: #9f1239;
          }
          
          .low-remaining .info-icon {
            color: #fb7185 !important;
          }
          
          .low-remaining .limit-count {
            color: #e11d48 !important;
          }

          .limit-content {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: help;
          }

          .info-icon {
            font-size: 16px;
            color: #60a5fa;
          }

          .limit-text {
            font-weight: 500;
          }

          .limit-count {
            font-weight: 600;
            color: #2563eb;
          }
        `}
      </style>
    </div>
  );
}; 