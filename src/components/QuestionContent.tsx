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
        minHeight: '100px'
      }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="question-content-text">
      <MarkdownRenderer content={content} />
      <style>
        {`
          .question-content-text {
            font-size: 16px;
            line-height: 1.6;
          }
        `}
      </style>
    </div>
  );
};

export default QuestionContent; 