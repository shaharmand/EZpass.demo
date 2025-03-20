import React, { memo } from 'react';
import { Typography, Button } from 'antd';
import { Question } from '../../types/question';
import { SkipReason } from '../../types/prepUI';
import SectionTitle from './SectionTitle';
import styled from 'styled-components';
import { VoiceInput } from '../VoiceInput';
import { QuestionPracticeStatus } from '../../types/prepUI';

const HeaderContainer = styled.div.attrs({
  className: 'section-header'
})`
  padding: 12px 24px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: none;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 24px;
    right: 24px;
    height: 1px;
    background: linear-gradient(to right, rgba(229, 231, 235, 0), rgba(229, 231, 235, 0.5), rgba(229, 231, 235, 0));
  }
`;

const AnswerTitle = styled(SectionTitle)`
  color: #1f2937;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

interface AnswerHeaderProps {
  question?: Question;
  onSkip?: (reason: SkipReason) => void;
  title?: string;
  showControls?: boolean;
  onVoiceTranscript?: (text: string) => void;
  disabled?: boolean;
  status?: QuestionPracticeStatus;
  isMultipleChoice?: boolean;
}

export const AnswerHeader: React.FC<AnswerHeaderProps> = memo(({ 
  question,
  onSkip,
  title = "תשובה",
  showControls = true,
  onVoiceTranscript,
  disabled = false,
  status = 'idle',
  isMultipleChoice = false
}) => {
  return (
    <HeaderContainer>
      <AnswerTitle noLine>{title}</AnswerTitle>
      {!isMultipleChoice && (
        <ControlsContainer>
          <VoiceInput 
            onTranscript={onVoiceTranscript || (() => {})} 
            disabled={disabled}
            canUpdateText={status === 'idle' || status === 'active'}
          />
        </ControlsContainer>
      )}
    </HeaderContainer>
  );
});

export default AnswerHeader; 