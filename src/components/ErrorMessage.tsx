import React from 'react';
import { Alert, Button, Space } from 'antd';

interface ErrorMessageProps {
  message: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  description,
  onRetry
}) => {
  return (
    <Alert
      type="error"
      showIcon
      message={message}
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          {description}
          {onRetry && (
            <Button type="primary" onClick={onRetry}>
              נסה שוב
            </Button>
          )}
        </Space>
      }
      style={{ margin: '24px 0' }}
    />
  );
}; 