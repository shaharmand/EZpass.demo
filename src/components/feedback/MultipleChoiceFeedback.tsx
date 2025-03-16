import React, { useEffect } from 'react';
import { Card, Space, Typography, Divider, Button } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, StarOutlined, RedoOutlined } from '@ant-design/icons';
import { Question } from '../../types/question';
import { 
  QuestionFeedback,
  BasicQuestionFeedback
} from '../../types/feedback/types';
import { QuestionSubmission } from '../../types/submissionTypes';
import { BinaryEvalLevel } from '../../types/feedback/levels';
import { FeedbackStatus, getFeedbackStatus } from '../../types/feedback/status';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { logger } from '../../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { JoinEZPassPlusMessage } from './JoinEZPassPlusMessage';
import { MultipleChoiceFeedbackHeader } from './MultipleChoiceFeedbackHeader';
import { MultipleChoiceFeedbackExplanation } from './MultipleChoiceFeedbackExplanation';
import styles from './MultipleChoiceFeedback.module.css';
import styled from 'styled-components';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, BookOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;

// Styled components for enhanced feedback display
const FeedbackContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-top: 24px;
`;

const FeedbackContent = styled.div`
  padding: 24px;
`;

const AnswerSection = styled.div`
  margin-top: 16px;
`;

const SectionTitle = styled(Title)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px !important;
  margin-bottom: 16px !important;
  color: #334155;
  
  svg {
    color: #3b82f6;
  }
`;

const AnswerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const AnswerItem = styled.div<{ $isSelected: boolean; $isCorrect: boolean }>`
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-radius: 8px;
  background: ${props => 
    props.$isSelected && props.$isCorrect ? '#f0fdf4' :
    props.$isSelected && !props.$isCorrect ? '#fef2f2' :
    props.$isCorrect ? '#f0fdf4' : '#ffffff'
  };
  border: 1px solid ${props => 
    props.$isSelected && props.$isCorrect ? '#86efac' :
    props.$isSelected && !props.$isCorrect ? '#fecaca' :
    props.$isCorrect ? '#86efac' : '#e2e8f0'
  };
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const AnswerIcon = styled.div<{ $isCorrect: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.$isCorrect ? '#10b981' : '#ef4444'};
  color: white;
  margin-left: 12px;
  flex-shrink: 0;
`;

const AnswerContent = styled.div`
  flex: 1;
`;

const AnswerText = styled(Text)<{ $isSelected: boolean; $isCorrect: boolean }>`
  font-weight: ${props => (props.$isSelected || props.$isCorrect) ? '600' : '400'};
  color: ${props => 
    props.$isSelected && props.$isCorrect ? '#059669' :
    props.$isSelected && !props.$isCorrect ? '#dc2626' :
    props.$isCorrect ? '#059669' : '#334155'
  };
  font-size: 16px;
  display: block;
`;

const ExplanationSection = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
  border: 1px solid #e2e8f0;
`;

// Convert number to Hebrew letter (1 -> א, 2 -> ב, etc.)
const numberToHebrewLetter = (num: number): string => {
  const letters = ['א', 'ב', 'ג', 'ד'];
  return letters[num - 1] || '';
};

interface MultipleChoiceFeedbackProps {
  question: Question;
  submission: QuestionSubmission;
  showDetailedFeedback?: boolean;
  onUpgradeClick?: () => void;
}

export const MultipleChoiceFeedback: React.FC<MultipleChoiceFeedbackProps> = ({
  question,
  submission,
  showDetailedFeedback = true,
  onUpgradeClick
}) => {
  const correctAnswerIndex = question.schoolAnswer?.finalAnswer?.type === 'multiple_choice' ? 
    question.schoolAnswer.finalAnswer.value - 1 : -1;

  // Get selected answer from submission
  const selectedAnswer = submission.answer.finalAnswer?.type === 'multiple_choice' ? 
    submission.answer.finalAnswer.value : null;
  const feedback = submission.feedback?.data as BasicQuestionFeedback;

  useEffect(() => {
    // Component mount/update log with more prominent message
    console.log('🎯 MULTIPLE CHOICE FEEDBACK RECEIVED:', {
      questionId: question.id,
      feedbackData: {
        evalLevel: feedback?.evalLevel,
        score: feedback?.score,
        allFeedbackKeys: Object.keys(feedback || {}),
        fullFeedback: feedback
      },
      questionData: {
        correctAnswerIndex,
        totalOptions: question.content.options?.length,
        options: question.content.options?.map((opt, idx) => `${idx + 1}: ${opt.text.substring(0, 30)}...`)
      }
    });

    // Log raw incoming data with more detail
    console.log('📝 RAW FEEDBACK DATA:', {
      answer: {
        value: selectedAnswer,
        type: typeof selectedAnswer,
        isValid: typeof selectedAnswer === 'number' ? 
          selectedAnswer >= 1 && selectedAnswer <= 4 : false
      },
      correctAnswer: {
        index: correctAnswerIndex,
        value: correctAnswerIndex + 1
      },
      evalLevel: feedback?.evalLevel,
      score: feedback?.score,
      fullFeedbackObject: JSON.stringify(feedback, null, 2)
    });

    // Get the selected and correct answer texts
    const selectedOptionIndex = selectedAnswer ? selectedAnswer - 1 : -1;

    // Log option processing
    logger.info('Processing options:', {
      selectedOptionRaw: selectedAnswer,
      selectedOptionIndex,
      selectedOptionText: question.content.options?.[selectedOptionIndex]?.text,
      correctAnswerIndex,
      correctAnswerText: question.content.options?.[correctAnswerIndex]?.text
    });

    // Log the actual user choice for debugging
    logger.info('User choice debug:', {
      rawAnswer: selectedAnswer,
      rawAnswerType: typeof selectedAnswer,
      parsedAnswer: selectedAnswer || 'no answer provided',
      isNumber: selectedAnswer ? typeof selectedAnswer === 'number' : false,
      answerRange: selectedAnswer ? (selectedAnswer >= 1 && selectedAnswer <= 4) : false,
      totalOptions: question.content.options?.length || 0,
      evalLevel: feedback?.evalLevel
    });
  }, [question.id, feedback, question.content.options, correctAnswerIndex, selectedAnswer]);

  // Get the selected and correct answer texts and numbers - with validation
  const selectedOptionNumber = selectedAnswer;
  const correctOptionNumber = question.schoolAnswer?.finalAnswer?.type === 'multiple_choice' ? 
    question.schoolAnswer.finalAnswer.value : null;

  const selectedOption = selectedOptionNumber !== null && question.content.options && 
    selectedOptionNumber > 0 && selectedOptionNumber <= question.content.options.length
    ? question.content.options[selectedOptionNumber - 1]?.text || ''
    : '';
  const correctOption = question.content.options?.[correctAnswerIndex]?.text || '';

  const feedbackStatus = getFeedbackStatus(feedback.evalLevel);
  const isCorrect = feedbackStatus === FeedbackStatus.SUCCESS;

  return (
    <FeedbackContainer>
      <MultipleChoiceFeedbackHeader
        question={question}
        submission={submission}
        feedback={feedback}
      />
      <FeedbackContent>
        <AnswerSection>
          <SectionTitle level={4}>
            <InfoCircleOutlined /> תשובות
          </SectionTitle>
          
          <AnswerList>
            {question.content.options?.map((option, index) => {
              const isSelected = selectedAnswer === index + 1;
              const isCorrect = correctAnswerIndex === index;
              
              return (
                <AnswerItem 
                  key={index} 
                  $isSelected={isSelected} 
                  $isCorrect={isCorrect}
                >
                  {(isSelected || isCorrect) && (
                    <AnswerIcon $isCorrect={isCorrect}>
                      {isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    </AnswerIcon>
                  )}
                  <AnswerContent>
                    <AnswerText $isSelected={isSelected} $isCorrect={isCorrect}>
                      {option.text}
                    </AnswerText>
                    
                    {isSelected && !isCorrect && (
                      <Text type="danger" style={{ fontSize: '14px', marginTop: '4px', display: 'block' }}>
                        התשובה שבחרת אינה נכונה
                      </Text>
                    )}
                    
                    {isCorrect && (
                      <Text type="success" style={{ fontSize: '14px', marginTop: '4px', display: 'block' }}>
                        התשובה הנכונה
                      </Text>
                    )}
                  </AnswerContent>
                </AnswerItem>
              );
            })}
          </AnswerList>
        </AnswerSection>
        
        <Divider />
        
        <SectionTitle level={4}>
          <BookOutlined /> הסבר
        </SectionTitle>
        
        <ExplanationSection>
          {question.schoolAnswer?.solution ? (
            <MarkdownRenderer content={question.schoolAnswer.solution.text} />
          ) : (
            <Paragraph>
              {feedback.message || 'אין הסבר זמין לשאלה זו.'}
            </Paragraph>
          )}
        </ExplanationSection>
      </FeedbackContent>
    </FeedbackContainer>
  );
}; 