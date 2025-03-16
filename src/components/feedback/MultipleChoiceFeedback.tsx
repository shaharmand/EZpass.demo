import React from 'react';
import { Typography, Space, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Question } from '../../types/question';
import { QuestionSubmission } from '../../types/submissionTypes';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { isSuccessfulAnswer } from '../../types/feedback/status';
import styled from 'styled-components';
import './Feedback.css';

const { Text, Title } = Typography;

// Styled components for the options
const OptionItem = styled.div<{ $correct?: boolean; $incorrect?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid ${props => 
    props.$correct ? '#10b981' : 
    props.$incorrect ? '#ef4444' : '#e5e7eb'};
  background-color: ${props => 
    props.$correct ? 'rgba(16, 185, 129, 0.1)' : 
    props.$incorrect ? 'rgba(239, 68, 68, 0.1)' : '#ffffff'};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 4px;
    height: 100%;
    background-color: ${props => 
      props.$correct ? '#10b981' : 
      props.$incorrect ? '#ef4444' : 'transparent'};
  }
`;

const OptionNumber = styled.div<{ $correct?: boolean; $incorrect?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin-left: 12px;
  font-weight: 600;
  background-color: ${props => 
    props.$correct ? '#10b981' : 
    props.$incorrect ? '#ef4444' : '#f3f4f6'};
  color: ${props => 
    (props.$correct || props.$incorrect) ? '#ffffff' : '#4b5563'};
  transition: all 0.2s ease;
`;

const OptionContent = styled.div`
  flex: 1;
`;

const OptionLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
`;

interface MultipleChoiceFeedbackProps {
  question: Question;
  submission: QuestionSubmission;
}

export const MultipleChoiceFeedback: React.FC<MultipleChoiceFeedbackProps> = ({
  question,
  submission
}) => {
  // Check if the answer is correct based on the feedback data
  const isCorrect = submission.feedback?.data?.score === 100;
  
  // Find the correct option based on schoolAnswer
  const correctOptionNumber = question.schoolAnswer?.finalAnswer?.type === 'multiple_choice' 
    ? question.schoolAnswer.finalAnswer.value 
    : null;
  
  // Convert to zero-based index
  const correctOptionIndex = correctOptionNumber !== null 
    ? correctOptionNumber - 1 
    : question.content.options?.findIndex((option: any) => option.isCorrect === true) || 0;
  
  // Get the user's selected option - adjust based on your actual data structure
  const userSelectedIndex = submission.answer?.finalAnswer 
    ? (typeof submission.answer.finalAnswer.value === 'number' 
      ? submission.answer.finalAnswer.value - 1 
      : -1)
    : -1;
  
  // Hebrew option markers
  const optionMarkers = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח'];
  
  return (
    <div className="multiple-choice-feedback">
      {/* Feedback Summary - Always visible */}
      <div className={`feedback-summary ${isCorrect ? 'correct' : 'incorrect'}`}>
        <div className="feedback-icon">
          {isCorrect ? (
            <CheckCircleOutlined style={{ color: '#10b981', fontSize: 24 }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#ef4444', fontSize: 24 }} />
          )}
        </div>
        <div className="feedback-text">
          <Text strong style={{ fontSize: 16, color: isCorrect ? '#10b981' : '#ef4444' }}>
            {isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}
          </Text>
        </div>
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      {/* Only show the correct answer and user's answer if incorrect */}
      <div className="feedback-answers">
        {/* Correct Answer */}
        <OptionLabel>התשובה הנכונה:</OptionLabel>
        <OptionItem $correct>
          <OptionNumber $correct>
            {optionMarkers[correctOptionIndex]}
          </OptionNumber>
          <OptionContent>
            <Text strong>
              {question.content.options?.[correctOptionIndex]?.text}
            </Text>
          </OptionContent>
        </OptionItem>
        
        {/* User's Answer - Only show if incorrect */}
        {!isCorrect && userSelectedIndex >= 0 && userSelectedIndex !== correctOptionIndex && (
          <>
            <OptionLabel>התשובה שלך:</OptionLabel>
            <OptionItem $incorrect>
              <OptionNumber $incorrect>
                {optionMarkers[userSelectedIndex]}
              </OptionNumber>
              <OptionContent>
                <Text>
                  {question.content.options?.[userSelectedIndex]?.text}
                </Text>
              </OptionContent>
            </OptionItem>
          </>
        )}
      </div>
      
      {/* Explanation - show schoolAnswer.solution if available */}
      {(question.schoolAnswer?.solution || submission.feedback?.data?.message) && (
        <div className="feedback-explanation">
          <Divider style={{ margin: '12px 0' }} />
          <Space align="start" style={{ marginBottom: '8px' }}>
            <InfoCircleOutlined style={{ color: '#3b82f6', fontSize: 16 }} />
            <Text strong style={{ fontSize: 15 }}>הסבר:</Text>
          </Space>
          <div className="explanation-content">
            {question.schoolAnswer?.solution ? (
              <MarkdownRenderer content={question.schoolAnswer.solution.text} />
            ) : (
              <MarkdownRenderer content={submission.feedback?.data?.message || ''} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 