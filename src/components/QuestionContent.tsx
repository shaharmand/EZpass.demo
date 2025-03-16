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
    <div className="question-content-text">
      <MarkdownRenderer content={content} />
      <style>
        {`
          .question-content-text {
            font-size: 16px;
            line-height: 1.6;
            font-weight: 400;
            color: #262626;
          }
          
          .question-content-text p {
            margin: 0.8em 0;
          }
          
          .question-content-text strong {
            font-weight: 600;
          }
        `}
      </style>
    </div>
  );
};

export default QuestionContent; 