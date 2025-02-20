import React, { useState, useEffect } from 'react';
import { Input, Button, Space, Typography } from 'antd';
import type { Question } from '../types/question';
import { SimpleTextMathInput } from './SimpleTextMathInput';
import { MonacoEditor } from './MonacoEditor';
import './QuestionResponseInput.css';
import { RedoOutlined } from '@ant-design/icons';

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
  
  return (
    <div className="options-list">
      {question.options.map((option, index) => {
        const optionNumber = index + 1;
        const isSelected = value === String(optionNumber);
        
        // Determine if this option should be marked as correct or incorrect
        let isCorrect = false;
        let isIncorrect = false;
        
        // Check feedback regardless of disabled state
        if (feedback && feedback.correctOption) {
          const isCorrectOption = String(optionNumber) === feedback.correctOption;
          const wasSelectedWrongly = isSelected && !feedback.isCorrect;
          
          isCorrect = isCorrectOption; // Always show correct option in green
          isIncorrect = wasSelectedWrongly; // Only show selected wrong answer in red
        }

        // Build class names
        const optionClasses = [
          'option-card',
          isSelected ? 'selected' : '',
          isCorrect ? 'correct' : '',
          isIncorrect ? 'incorrect' : '',
          disabled ? 'disabled' : ''
        ].filter(Boolean).join(' ');

        const numberClasses = [
          'option-number',
          isSelected ? 'selected' : '',
          isCorrect ? 'correct' : '',
          isIncorrect ? 'incorrect' : ''
        ].filter(Boolean).join(' ');

        const textClasses = [
          'option-text',
          isSelected ? 'selected' : '',
          isCorrect ? 'correct' : '',
          isIncorrect ? 'incorrect' : ''
        ].filter(Boolean).join(' ');
        
        return (
          <div
            key={index}
            className={optionClasses}
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
  <SimpleTextMathInput
    value={value}
    onChange={onChange}
    placeholder="הקלד את תשובתך כאן..."
    disabled={disabled}
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

  // Reset state when question changes or when disabled state changes to false (retry)
  useEffect(() => {
    setAnswer('');
    setIsSubmitting(false);
  }, [question.id, disabled]);

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting) return;

    try {
      console.log('Submitting answer:', {
        questionId: question.id,
        questionType: question.type,
        answerLength: answer.trim().length,
        timestamp: Date.now()
      });

      setIsSubmitting(true);
      await onAnswer(answer.trim());
    } catch (error) {
      console.error('Error in answer submission:', {
        error,
        questionId: question.id,
        questionType: question.type,
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add logging to input changes
  const handleInputChange = (value: string) => {
    setAnswer(value);
  };

  const renderInput = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceInput
            question={question}
            onChange={handleInputChange}
            value={answer}
            disabled={disabled}
            feedback={feedback}
          />
        );
      
      case 'open':
        return (
          <OpenTextInput
            onChange={handleInputChange}
            value={answer}
            disabled={disabled}
          />
        );
      
      case 'step_by_step':
        return (
          <StepByStepInput
            onChange={handleInputChange}
            value={answer}
            disabled={disabled}
          />
        );
      
      case 'code':
        return (
          <CodeInput
            question={question}
            onChange={handleInputChange}
            value={answer}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {renderInput()}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '24px',
        padding: '16px',
        borderTop: '1px solid #f0f0f0',
        gap: '12px'
      }}>
        {disabled ? (
          <Button
            onClick={onRetry}
            size="large"
            style={{
              minWidth: '160px',
              height: '48px',
              fontSize: '16px',
              borderRadius: '24px',
              border: '1px solid #1890ff',
              background: 'white',
              transition: 'all 0.3s ease'
            }}
            className="retry-button"
            icon={<RedoOutlined />}
          >
            נסה שוב
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={disabled || !answer.trim()}
            size="large"
            style={{
              minWidth: '200px',
              height: '48px',
              fontSize: '16px',
              borderRadius: '24px',
              background: 'linear-gradient(45deg, #1890ff, #40a9ff)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
              transition: 'all 0.3s ease'
            }}
            className="submit-button"
          >
            {isSubmitting ? 'שולח תשובה...' : 'שלח תשובה'}
          </Button>
        )}
      </div>
    </Space>
  );
};

export default QuestionResponseInput; 