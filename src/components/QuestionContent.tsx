import React from 'react';
import { Typography, Spin } from 'antd';
import ReactMarkdown from 'react-markdown';

interface QuestionContentProps {
  content: string;
  isLoading?: boolean;
}

const QuestionContent: React.FC<QuestionContentProps> = ({
  content,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100px'
      }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ fontSize: '16px', lineHeight: 1.6 }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default QuestionContent; 