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
      <Tooltip title={`משובים מפורטים: נותרו ${remaining} מתוך ${max} היום`}>
        <div className="limit-content">
          <InfoCircleOutlined className="info-icon" />
          <span className="limit-counter">{remaining}</span>
        </div>
      </Tooltip>
      <style>
        {`
          .daily-limit-indicator {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
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
          
          .low-remaining .limit-counter {
            background: #fecdd3 !important;
            color: #e11d48 !important;
          }

          .limit-content {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: help;
          }

          .info-icon {
            font-size: 16px;
            color: #60a5fa;
          }

          .limit-counter {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 22px;
            height: 22px;
            background: #bfdbfe;
            border-radius: 11px;
            padding: 0 6px;
            font-weight: 600;
            font-size: 13px;
            color: #1e40af;
          }
        `}
      </style>
    </div>
  );
}; 