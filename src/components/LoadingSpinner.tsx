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
      padding: '24px',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        <Space direction="vertical" align="center">
          <Spin size={size} />
          {text && <Text type="secondary">{text}</Text>}
        </Space>
      </div>
    </div>
  );
}; 