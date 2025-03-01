import React, { useState, useEffect } from 'react';
import { Input, Button, Typography } from 'antd';
import type { Question, QuestionFeedback } from '../types/question';
import type { QuestionAnswer } from '../types/prepUI';
import { SimpleTextMathInput } from './SimpleTextMathInput';
import { MonacoEditor } from './MonacoEditor';
import { QuestionMultipleChoiceInput } from './QuestionMultipleChoiceInput';
import { RedoOutlined } from '@ant-design/icons';
import './QuestionResponseInput.css';
import { usePracticeAttempts } from '../contexts/PracticeAttemptsContext';

const { TextArea } = Input;
const { Text } = Typography;

interface QuestionResponseInputProps {
  question: Question;
  onAnswer: (answer: QuestionAnswer) => void;
  onRetry: () => void;
  disabled?: boolean;
  feedback?: QuestionFeedback;
  selectedAnswer?: QuestionAnswer | null;
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
  const language = question.metadata?.programmingLanguage || 'javascript';
  const template = question.metadata?.codeTemplate || '';

  return (
    <MonacoEditor
      value={value}
      onChange={onChange}
      language={language}
      template={template}
      disabled={disabled}
      testCases={question.metadata?.testCases}
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
  const isAnswerValid = (answer: QuestionAnswer | null): boolean => {
    if (!answer) return false;
    
    switch (answer.type) {
      case 'multiple_choice':
        return answer.selectedOption >= 1 && answer.selectedOption <= 4;
      case 'open':
      case 'step_by_step':
        return answer.markdownText.trim().length > 0;
      case 'code':
        return answer.codeText.trim().length > 0;
      default:
        return false;
    }
  };

  // Create appropriate answer object based on question type
  const createAnswer = (value: string): QuestionAnswer => {
    switch (question.type) {
      case 'multiple_choice':
        return {
          type: 'multiple_choice',
          selectedOption: parseInt(value, 10)
        };
      case 'code':
        return {
          type: 'code',
          codeText: value
        };
      case 'step_by_step':
        return {
          type: 'step_by_step',
          markdownText: value
        };
      case 'open':
      default:
        return {
          type: 'open',
          markdownText: value
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
    
    switch (selectedAnswer.type) {
      case 'multiple_choice':
        return selectedAnswer.selectedOption.toString();
      case 'code':
        return selectedAnswer.codeText;
      case 'open':
      case 'step_by_step':
        return selectedAnswer.markdownText;
      default:
        return '';
    }
  };

  return (
    <div className="question-response-input">
      <div className="input-section">
        {question.type === 'multiple_choice' ? (
          <div className="multiple-choice-container">
            <QuestionMultipleChoiceInput
              question={question}
              onChange={(selectedOption) => handleAnswerChange(selectedOption.toString())}
              value={selectedAnswer?.type === 'multiple_choice' ? selectedAnswer.selectedOption : null}
              disabled={disabled}
              feedback={feedback}
            />
          </div>
        ) : question.type === 'code' ? (
          <div className="code-input-container">
            <MonacoEditor
              value={getCurrentValue()}
              onChange={handleAnswerChange}
              disabled={disabled}
              language={question.metadata.programmingLanguage || 'javascript'}
            />
          </div>
        ) : question.type === 'step_by_step' ? (
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
              className={`response-textarea ${feedback ? (feedback.isSuccess ? 'correct' : 'incorrect') : ''}`}
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