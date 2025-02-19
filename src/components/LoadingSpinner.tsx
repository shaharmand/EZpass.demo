import React from 'react';
import { Spin, Typography, Space } from 'antd';

const { Text } = Typography;

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'default' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text = 'טוען...',
  size = 'large'
}) => {
  return (
    <div style={{ 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      padding: '24px'
    }}>
      <Space direction="vertical" align="center">
        <Spin size={size} />
        {text && <Text type="secondary">{text}</Text>}
      </Space>
    </div>
  );
}; 