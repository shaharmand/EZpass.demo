import React, { useState } from 'react';
import { Input, Space } from 'antd';
import 'katex/dist/katex.min.css';  // Note: KaTeX currently triggers -ms-high-contrast deprecation warnings. These will be resolved in future updates.
import { InlineMath } from 'react-katex';

const { TextArea } = Input;

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  disabled,
  placeholder
}) => {
  const [showPreview, setShowPreview] = useState(true);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoSize={{ minRows: 2, maxRows: 4 }}
        disabled={disabled}
      />
      {showPreview && value && (
        <div style={{ 
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '4px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '4px', color: '#64748b', fontSize: '14px' }}>
            תצוגה מקדימה:
          </div>
          <div style={{ direction: 'ltr' }}>
            {(() => {
              try {
                return <InlineMath math={value} />;
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return <span style={{ color: '#ef4444' }}>Invalid LaTeX: {errorMessage}</span>;
              }
            })()}
          </div>
        </div>
      )}
    </Space>
  );
}; 