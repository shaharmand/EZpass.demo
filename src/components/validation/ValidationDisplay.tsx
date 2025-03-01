import React from 'react';
import { Alert, Space } from 'antd';
import { ValidationError, ValidationWarning } from '../../types/validation';

interface ValidationDisplayProps {
  errors: ValidationError[];
  warnings?: ValidationWarning[];
  section: string;
  showAllErrors?: boolean;
}

export const ValidationDisplay: React.FC<ValidationDisplayProps> = ({
  errors,
  warnings = [],
  section,
  showAllErrors = false
}) => {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {errors.map((error, index) => (
        <Alert
          key={`error-${error.field}-${index}`}
          message={error.message}
          description={error.details}
          type="error"
          showIcon
        />
      ))}
      {warnings.map((warning, index) => (
        <Alert
          key={`warning-${warning.field}-${index}`}
          message={warning.message}
          description={warning.details}
          type="warning"
          showIcon
        />
      ))}
    </Space>
  );
}; 