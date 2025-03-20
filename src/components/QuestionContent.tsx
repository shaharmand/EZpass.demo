import React from 'react';
import { Typography, Spin, Space } from 'antd';
import { MarkdownRenderer } from './MarkdownRenderer';
import { VoiceReadingButton } from './voice/VoiceReadingButton';
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

const VoiceButtonContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  margin: 8px;
  z-index: 10;
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
      {showControls && (
        <VoiceButtonContainer>
          <VoiceReadingButton 
            text={content} 
            options={options}
            iconOnly={!options} 
            size="small"
            showStyleControls={true} 
          />
        </VoiceButtonContainer>
      )}
      <MarkdownRenderer content={content} className="question-content-text" />
    </ContentWrapper>
  );
};

export default QuestionContent; 