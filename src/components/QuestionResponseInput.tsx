import React, { useState, useEffect } from 'react';
import { Input, Button, Space, Typography } from 'antd';
import type { Question } from '../types/question';
import { SimpleTextMathInput } from './SimpleTextMathInput';
import { MonacoEditor } from './MonacoEditor';
import './QuestionResponseInput.css';
import { RedoOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface QuestionResponseInputProps {
  question: Question;
  onAnswer: (answer: string) => Promise<void>;
  onRetry: () => void;
  disabled?: boolean;
  feedback?: {
    isCorrect: boolean;
    correctOption?: string;
    score?: number;
  };
}

// Multiple Choice Input
const MultipleChoiceInput: React.FC<{ 
  question: Question;
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
  feedback?: {
    isCorrect: boolean;
    correctOption?: string;
  };
}> = ({ question, onChange, value, disabled, feedback }) => {
  if (!question.options) return null;
  
  const getFeedbackStyle = (isCorrect: boolean | undefined) => {
    if (isCorrect === undefined) return {};
    return {};  // Remove coloring from answer section
  };

  return (
    <div className="options-list">
      {question.options.map((option, index) => {
        const optionNumber = index + 1;
        const isSelected = value === String(optionNumber);
        const isCorrectOption = feedback?.correctOption === String(optionNumber);
        const showFeedback = Boolean(feedback);
        
        let optionStyle = {};
        if (showFeedback) {
          if (isSelected) {
            optionStyle = getFeedbackStyle(feedback?.isCorrect);
          } else if (isCorrectOption) {
            optionStyle = getFeedbackStyle(true);
          }
        }

        // Build class names
        const optionClasses = [
          'option-card',
          isSelected ? 'selected' : '',
          disabled ? 'disabled' : ''
        ].filter(Boolean).join(' ');

        const numberClasses = [
          'option-number',
          isSelected ? 'selected' : ''
        ].filter(Boolean).join(' ');

        const textClasses = [
          'option-text',
          isSelected ? 'selected' : ''
        ].filter(Boolean).join(' ');
        
        return (
          <div
            key={index}
            className={optionClasses}
            style={optionStyle}
            onClick={() => !disabled && onChange(String(optionNumber))}
          >
            <div className="option-content">
              <div className={numberClasses}>
                {optionNumber}
              </div>
              <Text className={textClasses}>
                {option.text}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
  // Get the programming language from the question metadata or default to JavaScript
  const language = question.metadata?.programmingLanguage || 'javascript';
  
  // Get code template from question if available
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
  feedback
}) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (disabled) {
      setIsSubmitting(false);
    }
  }, [disabled]);

  // Reset answer when feedback changes to undefined (retry case)
  useEffect(() => {
    if (!feedback) {
      setAnswer('');
    }
  }, [feedback]);

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAnswer(answer);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowRetry = feedback && !feedback.isCorrect && (!feedback.score || feedback.score < 80);

  const renderActionButtons = () => (
    <div className="action-buttons-container">
      <div className="action-buttons">
        {!disabled && !feedback && (
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!answer.trim()}
            size="large"
            className="submit-button"
          >
            שלח תשובה
          </Button>
        )}
        {feedback && shouldShowRetry && (
          <Button
            type="primary"
            icon={<RedoOutlined />}
            onClick={onRetry}
            size="large"
            className="retry-button"
          >
            נסה שוב
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="question-response-input">
      <div className="input-section">
        {question.type === 'multiple_choice' ? (
          <div className="multiple-choice-container">
            <MultipleChoiceInput
              question={question}
              onChange={setAnswer}
              value={answer}
              disabled={disabled}
              feedback={feedback}
            />
          </div>
        ) : question.type === 'code' ? (
          <div className="code-input-container">
            <CodeInput
              question={question}
              onChange={setAnswer}
              value={answer}
              disabled={disabled}
            />
          </div>
        ) : question.type === 'step_by_step' ? (
          <div className="step-by-step-container">
            <StepByStepInput
              onChange={setAnswer}
              value={answer}
              disabled={disabled}
            />
          </div>
        ) : (
          <div className="text-input-container">
            <TextArea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="הקלד את תשובתך כאן..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              disabled={disabled}
              className={`response-textarea ${feedback ? (feedback.isCorrect ? 'correct' : 'incorrect') : ''}`}
            />
          </div>
        )}
      </div>

      {renderActionButtons()}

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

          .action-buttons-container {
            display: flex;
            justify-content: flex-end;
            padding: 12px 16px;
            border-top: 1px solid #e5e7eb;
          }

          .action-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          }

          .submit-button {
            min-width: 200px;
            height: 48px;
            border-radius: 24px;
            font-size: 16px;
            font-weight: 500;
            background: #2563eb;  /* Primary blue */
            border: none;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
            transition: all 0.3s ease;
          }

          .submit-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
            background: #2563eb;  /* Keep consistent */
          }

          .submit-button:disabled {
            opacity: 0.7;
            background: #94a3b8;
            box-shadow: none;
          }

          .retry-button {
            height: 48px;
            min-width: 160px;
            border-radius: 24px;
            font-size: 16px;
            font-weight: 500;
            background: #2563eb;  /* Primary blue */
            border: none;
            color: white;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
            transition: all 0.3s ease;
          }

          .retry-button:hover {
            transform: translateY(-2px);
            background: #2563eb;  /* Keep consistent */
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
          }

          .option-card {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 8px;
            background: #ffffff;
          }

          .option-card:hover:not(.disabled) {
            border-color: #2563eb;  /* Primary blue */
            background: rgba(37, 99, 235, 0.05);
            transform: translateY(-1px);
          }

          .option-card.selected {
            border-color: #2563eb;  /* Primary blue */
            background: rgba(37, 99, 235, 0.1);
          }

          .option-card.disabled {
            cursor: not-allowed;
            opacity: 0.85;
          }

          .option-content {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .option-number {
            min-width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #f3f4f6;
            color: #6b7280;
            font-weight: 500;
            transition: all 0.2s ease;
            font-size: 14px;
          }

          .option-number.selected {
            background: #2563eb;  /* Primary blue */
            color: white;
          }

          .option-text {
            flex: 1;
            font-size: 15px;
            color: #374151;
            line-height: 1.4;
          }

          .option-text.selected {
            color: #2563eb;  /* Primary blue */
            font-weight: 500;
          }

          /* Ensure disabled text remains readable */
          .option-card.disabled .option-text {
            color: #374151;
            opacity: 0.85;
          }

          .response-textarea:disabled {
            opacity: 0.85;
            color: #374151;
            background-color: #f9fafb;
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