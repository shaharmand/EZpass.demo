import React from 'react';
import { Typography, Spin } from 'antd';
import { MarkdownRenderer } from './MarkdownRenderer';

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
        minHeight: '80px'
      }}>
        <Spin />
      </div>
    );
  }

  return (
    <MarkdownRenderer content={content} className="question-content-text" />
  );
};

export default QuestionContent; 