import React, { useState, useEffect } from 'react';
import { Input, Button, Typography } from 'antd';
import type { Question } from '../types/question';
import { SimpleTextMathInput } from './SimpleTextMathInput';
import { MonacoEditor } from './MonacoEditor';
import { QuestionMultipleChoiceInput } from './QuestionMultipleChoiceInput';
import { RedoOutlined } from '@ant-design/icons';
import './QuestionResponseInput.css';

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
  selectedAnswer?: string;
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
  selectedAnswer = ''
}) => {
  const [answer, setAnswer] = useState(selectedAnswer);
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

  // Update local answer when selectedAnswer changes
  useEffect(() => {
    setAnswer(selectedAnswer);
  }, [selectedAnswer]);

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

  return (
    <div className="question-response-input">
      <div className="input-section">
        {question.type === 'multiple_choice' ? (
          <div className="multiple-choice-container">
            <QuestionMultipleChoiceInput
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