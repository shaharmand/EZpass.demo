import React from 'react';
import { Typography, Spin } from 'antd';
import { MarkdownRenderer } from './MarkdownRenderer';
import styled from 'styled-components';

interface QuestionContentProps {
  content: string;
  options?: string[];
  isLoading?: boolean;
  showControls?: boolean;
}

const ContentWrapper = styled.div`
  position: relative;
`;

const QuestionContent: React.FC<QuestionContentProps> = ({
  content,
  options,
  isLoading = false,
  showControls = true
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
    <ContentWrapper>
      <MarkdownRenderer content={content} className="question-content-text" />
    </ContentWrapper>
  );
};

export default QuestionContent; 