import React, { useState, useEffect } from 'react';
import { Input, Button, Typography } from 'antd';
import type { Question, FullAnswer } from '../types/question';
import type { QuestionFeedback } from '../types/feedback/types';
import { QuestionType } from '../types/question';
import { SimpleTextMathInput } from './SimpleTextMathInput';
import { MonacoEditor } from './MonacoEditor';
import { QuestionMultipleChoiceInput } from './QuestionMultipleChoiceInput';
import { RedoOutlined } from '@ant-design/icons';
import './QuestionResponseInput.css';
import { getFeedbackStatus, FeedbackStatus } from '../types/feedback/status';
import styled from 'styled-components';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
`;

const OptionItem = styled.div<{ $selected: boolean; $correct?: boolean; $incorrect?: boolean; $isAnswered: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid ${props => 
    props.$correct ? '#10b981' : 
    props.$incorrect ? '#ef4444' : 
    props.$selected ? '#3b82f6' : '#e5e7eb'};
  background-color: ${props => 
    props.$correct ? 'rgba(16, 185, 129, 0.1)' : 
    props.$incorrect ? 'rgba(239, 68, 68, 0.1)' : 
    props.$selected ? 'rgba(59, 130, 246, 0.1)' : '#ffffff'};
  cursor: ${props => props.$isAnswered ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: ${props => 
      props.$isAnswered ? 
        (props.$correct ? '#10b981' : 
         props.$incorrect ? '#ef4444' : 
         props.$selected ? '#3b82f6' : '#e5e7eb') : 
      '#3b82f6'};
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: ${props => 
      props.$correct ? '#10b981' : 
      props.$incorrect ? '#ef4444' : 
      props.$selected ? '#3b82f6' : 'transparent'};
  }
`;

const OptionNumber = styled.div<{ $selected: boolean; $correct?: boolean; $incorrect?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin-right: 12px;
  font-weight: 600;
  background-color: ${props => 
    props.$correct ? '#10b981' : 
    props.$incorrect ? '#ef4444' : 
    props.$selected ? '#3b82f6' : '#f3f4f6'};
  color: ${props => 
    (props.$correct || props.$incorrect || props.$selected) ? '#ffffff' : '#4b5563'};
  transition: all 0.2s ease;
`;

const OptionContent = styled.div`
  flex: 1;
  font-size: 16px;
`;

const FeedbackIndicator = styled.div<{ $correct: boolean }>`
  display: flex;
  align-items: center;
  margin-left: 12px;
  color: ${props => props.$correct ? '#10b981' : '#ef4444'};
  font-weight: 500;
`;

interface QuestionResponseInputProps {
  question: Question;
  onAnswer: (answer: FullAnswer) => void;
  disabled?: boolean;
  feedback?: QuestionFeedback;
  selectedAnswer?: FullAnswer | null;
  onCanSubmitChange?: (canSubmit: boolean) => void;
}

// Open Text Input
const OpenTextInput: React.FC<{
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}> = ({ onChange, value, disabled }) => (
  <TextArea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="הקלד את תשובתך כאן..."
    disabled={disabled}
    autoSize={{ minRows: 4, maxRows: 8 }}
  />
);

// Step by Step Input
const StepByStepInput: React.FC<{
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}> = ({ onChange, value, disabled }) => (
  <SimpleTextMathInput
    value={value}
    onChange={onChange}
    placeholder="הקלד את תשובתך צעד אחר צעד..."
    disabled={disabled}
  />
);

// Code Input
const CodeInput: React.FC<{
  question: Question;
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}> = ({ question, onChange, value, disabled }) => {
  // These properties should be added to the Question type if needed
  const language = 'javascript';
  const template = '';

  return (
    <MonacoEditor
      value={value}
      onChange={onChange}
      language={language}
      template={template}
      disabled={disabled}
    />
  );
};

const getResponseClass = (feedback?: QuestionFeedback): string => {
  if (!feedback?.evalLevel) return '';
  
  const status = getFeedbackStatus(feedback.evalLevel);
  switch (status) {
    case FeedbackStatus.SUCCESS:
      return 'correct';
    case FeedbackStatus.PARTIAL:
      return 'partial';
    case FeedbackStatus.FAILURE:
      return 'incorrect';
    default:
      return '';
  }
};

const QuestionResponseInput: React.FC<QuestionResponseInputProps> = ({
  question,
  onAnswer,
  disabled = false,
  feedback,
  selectedAnswer = null,
  onCanSubmitChange
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if answer is valid based on question type
  const isAnswerValid = (answer: FullAnswer | null): boolean => {
    if (!answer) return false;
    
    if (answer.finalAnswer?.type === 'multiple_choice') {
      return answer.finalAnswer.value >= 1 && answer.finalAnswer.value <= 4;
    }
    
    // For non-multiple choice questions, check solution text
    return answer.solution.text.trim().length > 0;
  };

  // Create appropriate answer object based on question type
  const createAnswer = (value: string): FullAnswer => {
    switch (question.metadata.type) {
      case QuestionType.MULTIPLE_CHOICE:
        const numValue = parseInt(value, 10);
        return {
          finalAnswer: { 
            type: 'multiple_choice', 
            value: numValue as 1 | 2 | 3 | 4 
          },
          solution: {
            text: '',
            format: 'markdown'
          }
        };
      case QuestionType.NUMERICAL:
        return {
          finalAnswer: {
            type: 'numerical',
            value: parseFloat(value),
            tolerance: 0
          },
          solution: {
            text: value,
            format: 'markdown'
          }
        };
      case QuestionType.OPEN:
        return {
          solution: {
            text: value,
            format: 'markdown'
          }
        };
      default:
        return {
          solution: {
            text: value,
            format: 'markdown'
          }
        };
    }
  };

  // Handle answer changes
  const handleAnswerChange = (value: string) => {
    const answer = createAnswer(value);
    onAnswer(answer);
    if (onCanSubmitChange) {
      onCanSubmitChange(isAnswerValid(answer));
    }
  };

  // Update canSubmit whenever selectedAnswer changes
  useEffect(() => {
    if (onCanSubmitChange) {
      onCanSubmitChange(isAnswerValid(selectedAnswer));
    }
  }, [selectedAnswer, onCanSubmitChange]);

  useEffect(() => {
    if (disabled) {
      setIsSubmitting(false);
    }
  }, [disabled]);

  // Get current value to display based on answer type
  const getCurrentValue = (): string => {
    if (!selectedAnswer) return '';
    
    if (selectedAnswer.finalAnswer?.type === 'multiple_choice') {
      return selectedAnswer.finalAnswer.value.toString();
    }
    
    if (selectedAnswer.finalAnswer?.type === 'numerical') {
      return selectedAnswer.finalAnswer.value.toString();
    }
    
    return selectedAnswer.solution.text;
  };

  return (
    <div className="question-response-input">
      <div className="input-section">
        {question.metadata.type === QuestionType.MULTIPLE_CHOICE ? (
          <div className="multiple-choice-container">
            <QuestionMultipleChoiceInput
              question={question}
              onChange={(selectedOption) => {
                const answer: FullAnswer = {
                  finalAnswer: {
                    type: 'multiple_choice',
                    value: parseInt(selectedOption.toString()) as 1 | 2 | 3 | 4
                  },
                  solution: {
                    text: '',
                    format: 'markdown'
                  }
                };
                onAnswer(answer);
              }}
              value={selectedAnswer?.finalAnswer?.type === 'multiple_choice' ? selectedAnswer.finalAnswer.value : null}
              disabled={disabled}
              feedback={feedback}
            />
          </div>
        ) : question.metadata.type === QuestionType.NUMERICAL ? (
          <div className="step-by-step-container">
            <SimpleTextMathInput
              value={getCurrentValue()}
              onChange={handleAnswerChange}
              disabled={disabled}
              feedback={feedback}
            />
          </div>
        ) : (
          <div className="text-input-container">
            <TextArea
              value={getCurrentValue()}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="הקלד את תשובתך כאן..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              disabled={disabled}
              className={`response-textarea ${getResponseClass(feedback)}`}
            />
          </div>
        )}
      </div>

      <style>
        {`
          .question-response-input {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .input-section {
            width: 100%;
          }

          .text-input-container,
          .multiple-choice-container {
            width: 100%;
          }

          .response-textarea {
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            padding: 16px;
            font-size: 16px;
            transition: all 0.2s ease;
          }

          .response-textarea:hover {
            border-color: #d1d5db;
          }

          .response-textarea:focus {
            border-color: #2196F3;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
          }

          .response-textarea.correct {
            border-color: #10b981;
            background: #f0fdf4;
          }

          .response-textarea.partial {
            border-color: #f59e0b;
            background: #fefce8;
          }

          .response-textarea.incorrect {
            border-color: #ef4444;
            background: #fef2f2;
          }

          .response-textarea:disabled {
            opacity: 0.85;
            color: #374151;
          }
          
          /* Preserve feedback colors when disabled */
          .response-textarea:disabled:not(.correct):not(.partial):not(.incorrect) {
            background-color: #f9fafb;
          }
          
          .response-textarea.correct:disabled {
            background: #f0fdf4;
            border-color: #10b981;
          }
          
          .response-textarea.partial:disabled {
            background: #fefce8;
            border-color: #f59e0b;
          }
          
          .response-textarea.incorrect:disabled {
            background: #fef2f2;
            border-color: #ef4444;
          }

          .step-by-step-container {
            width: 100%;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
          }
        `}
      </style>
    </div>
  );
};

export default QuestionResponseInput; 