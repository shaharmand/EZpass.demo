import React from 'react';
import { Typography, Progress } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Question } from '../../types/question';
import { QuestionSubmission } from '../../types/submissionTypes';
import { QuestionFeedback } from '../../types/feedback/types';
import { BinaryEvalLevel } from '../../types/feedback/levels';
import { FeedbackStatus, getFeedbackStatus } from '../../types/feedback/status';
import { getFeedbackColor, getFeedbackTitle } from '../../utils/feedbackStyles';

const { Text, Title } = Typography;

// Styled components for enhanced header display
const HeaderContainer = styled.div`
  padding: 24px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 20px;
`;

const ScoreCircle = styled.div`
  position: relative;
  
  .ant-progress-text {
    font-weight: 700 !important;
    font-size: 18px !important;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const FeedbackTitle = styled(Title)`
  margin-bottom: 8px !important;
  font-size: 24px !important;
`;

const FeedbackMessage = styled(Text)`
  font-size: 16px !important;
  display: block;
  color: #475569;
  max-width: 600px;
`;

const ResultIcon = styled.div<{ $isCorrect: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$isCorrect ? '#10b981' : '#ef4444'};
  color: white;
  font-size: 20px;
  margin-left: 16px;
  flex-shrink: 0;
`;

interface MultipleChoiceFeedbackHeaderProps {
  question: Question;
  submission: QuestionSubmission;
  feedback: QuestionFeedback;
}

export const MultipleChoiceFeedbackHeader: React.FC<MultipleChoiceFeedbackHeaderProps> = ({
  question,
  submission,
  feedback
}) => {
  const feedbackStatus = getFeedbackStatus(feedback.evalLevel);
  const isCorrect = feedbackStatus === FeedbackStatus.SUCCESS;
  
  return (
    <HeaderContainer>
      <ResultIcon $isCorrect={isCorrect}>
        {isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
      </ResultIcon>
      
      <HeaderContent>
        <FeedbackTitle level={3} style={{ color: getFeedbackColor(feedback.evalLevel) }}>
          {getFeedbackTitle(feedback.score, feedback.evalLevel)}
        </FeedbackTitle>
        <FeedbackMessage>
          {feedback.message}
        </FeedbackMessage>
      </HeaderContent>
      
      <ScoreCircle>
        <Progress
          type="circle"
          percent={feedback.score}
          format={(percent) => `${percent}%`}
          width={70}
          strokeColor={getFeedbackColor(feedback.evalLevel)}
          strokeWidth={8}
        />
      </ScoreCircle>
    </HeaderContainer>
  );
}; 