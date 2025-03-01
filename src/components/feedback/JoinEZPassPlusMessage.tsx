import React from 'react';
import { Typography } from 'antd';
import { StarOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface JoinEZPassPlusMessageProps {
  variant?: 'compact' | 'full';
  className?: string;
  questionType?: 'multiple_choice' | 'other';
}

export const JoinEZPassPlusMessage: React.FC<JoinEZPassPlusMessageProps> = ({ 
  variant = 'compact',
  className = '',
  questionType = 'other'
}) => {
  const getMessage = () => {
    if (questionType === 'multiple_choice') {
      return 'הצטרף לאיזיפס פלוס וקבל הסברים מפורטים לתשובה, עזרה והנחיה אישיים ותכני לימוד מותאמים לצרכיך';
    }
    return 'הצטרף לאיזיפס פלוס וקבל משוב מפורט, פתרונות מלאים, עזרה והנחיה אישית ותכני לימוד מותאמים לצרכיך';
  };

  if (variant === 'compact') {
    return (
      <div 
        className={`join-ezpass-plus-message compact ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          background: '#f0f9ff',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          marginTop: '16px'
        }}
      >
        <StarOutlined style={{ color: '#2563eb', fontSize: '16px' }} />
        <Text style={{ color: '#1e40af', fontSize: '14px', flex: 1 }}>
          {getMessage()}
        </Text>
        <a 
          href="https://ezpass.co.il/plus"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '14px',
            color: '#2563eb',
            fontWeight: 500,
            textDecoration: 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          פרטים נוספים
        </a>
      </div>
    );
  }

  return (
    <div 
      className={`join-ezpass-plus-message full ${className}`}
      style={{
        padding: '20px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        textAlign: 'center'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <Text strong style={{ fontSize: '16px', color: '#1e40af' }}>
          הצטרף לאיזיפס פלוס
        </Text>
        <StarOutlined style={{ color: '#2563eb', fontSize: '18px' }} />
      </div>
      <Text style={{ 
        display: 'block',
        color: '#4b5563',
        fontSize: '14px',
        marginBottom: '16px',
        lineHeight: '1.5'
      }}>
        {getMessage()}
      </Text>
      <a
        href="https://ezpass.co.il/plus"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          padding: '8px 24px',
          background: '#2563eb',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        הצטרף עכשיו
      </a>
    </div>
  );
}; 