import React, { useState, useEffect } from 'react';
import { Input, Button, Typography } from 'antd';
import type { Question, QuestionFeedback, FullAnswer } from '../types/question';
import { QuestionType } from '../types/question';
import { SimpleTextMathInput } from './SimpleTextMathInput';
import { MonacoEditor } from './MonacoEditor';
import { QuestionMultipleChoiceInput } from './QuestionMultipleChoiceInput';
import { RedoOutlined } from '@ant-design/icons';
import './QuestionResponseInput.css';
import { usePracticeAttempts } from '../contexts/PracticeAttemptsContext';
import { isSuccessfulAnswer } from '../types/question';

const { TextArea } = Input;
const { Text } = Typography;

interface QuestionResponseInputProps {
  question: Question;
  onAnswer: (answer: FullAnswer) => void;
  onRetry: () => void;
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

const QuestionResponseInput: React.FC<QuestionResponseInputProps> = ({
  question,
  onAnswer,
  onRetry,
  disabled = false,
  feedback,
  selectedAnswer = null,
  onCanSubmitChange
}) => {
  const { isGuestLimitExceeded } = usePracticeAttempts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if answer is valid based on question type
  const isAnswerValid = (answer: FullAnswer | null): boolean => {
    if (!answer) return false;
    
    if (answer.finalAnswer.type === 'multiple_choice') {
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
            format: 'markdown',
            requiredSolution: false
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
            format: 'markdown',
            requiredSolution: false
          }
        };
      default:
        return {
          finalAnswer: { type: 'none' },
          solution: {
            text: value,
            format: 'markdown',
            requiredSolution: true
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
    
    if (selectedAnswer.finalAnswer.type === 'multiple_choice') {
      return selectedAnswer.finalAnswer.value.toString();
    }
    
    if (selectedAnswer.finalAnswer.type === 'numerical') {
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
              onChange={(selectedOption) => handleAnswerChange(selectedOption.toString())}
              value={selectedAnswer?.finalAnswer.type === 'multiple_choice' ? selectedAnswer.finalAnswer.value : null}
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
              className={`response-textarea ${feedback ? (isSuccessfulAnswer(feedback.evalLevel) ? 'correct' : 'incorrect') : ''}`}
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

          .response-textarea.incorrect {
            border-color: #ef4444;
            background: #fef2f2;
          }

          .step-by-step-container {
            width: 100%;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
          }

          .response-textarea:disabled {
            opacity: 0.85;
            color: #374151;
            background-color: #f9fafb;
          }
        `}
      </style>
    </div>
  );
};

export default QuestionResponseInput; 