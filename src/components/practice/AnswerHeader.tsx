import React from 'react';
import { Typography } from 'antd';
import { Question } from '../../types/question';
import { SkipReason } from '../../types/prepUI';
import SectionTitle from './SectionTitle';
import styled from 'styled-components';

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

interface AnswerHeaderProps {
  question?: Question;
  onSkip?: (reason: SkipReason) => void;
  title?: string;
  showControls?: boolean;
}

export const AnswerHeader: React.FC<AnswerHeaderProps> = ({ 
  question,
  onSkip,
  title = "תשובה",
  showControls = true
}) => {
  return (
    <HeaderContainer>
      <AnswerTitle noLine>{title}</AnswerTitle>
    </HeaderContainer>
  );
};

export default AnswerHeader; 