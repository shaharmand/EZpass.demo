import React from 'react';
import { Typography, Space, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Question } from '../../types/question';
import { QuestionSubmission } from '../../types/submissionTypes';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { isSuccessfulAnswer } from '../../types/feedback/status';
import styled from 'styled-components';
import './Feedback.css';
import SectionTitle from '../practice/SectionTitle';

const { Text, Title } = Typography;

// Styled components for the options
const OptionItem = styled.div<{ $correct?: boolean; $incorrect?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
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

const OptionContent = styled.div`
  flex: 1;
`;

const OptionLabel = styled.div`
  font-size: 14px;
  color: #4b5563;
  font-weight: 600;
  margin-bottom: 8px;
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
  
  return (
    <div className="multiple-choice-feedback">
      {/* Feedback Summary - Always visible */}
      <div className={`feedback-summary ${isCorrect ? 'correct' : 'incorrect'}`}>
        <div className="feedback-icon">
          {isCorrect ? (
            <CheckCircleOutlined style={{ fontSize: 24 }} />
          ) : (
            <CloseCircleOutlined style={{ fontSize: 24 }} />
          )}
        </div>
        <div className="feedback-text">
          <Text strong>
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
          <OptionContent>
            <Text strong style={{ fontSize: 14 }}>
              {question.content.options?.[correctOptionIndex]?.text}
            </Text>
          </OptionContent>
        </OptionItem>
        
        {/* User's Answer - Only show if incorrect */}
        {!isCorrect && userSelectedIndex >= 0 && userSelectedIndex !== correctOptionIndex && (
          <>
            <OptionLabel>התשובה שלך:</OptionLabel>
            <OptionItem $incorrect>
              <OptionContent>
                <Text style={{ fontSize: 14 }}>
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
          <SectionTitle>הסבר</SectionTitle>
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