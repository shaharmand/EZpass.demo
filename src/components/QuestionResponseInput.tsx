import React, { useState, useEffect } from 'react';
import { Input, Button, Space, Radio, Typography } from 'antd';
import type { Question } from '../types/question';
import { MathInput } from './MathInput';
import { MonacoEditor } from './MonacoEditor';

const { TextArea } = Input;
const { Text } = Typography;

interface QuestionResponseInputProps {
  question: Question;
  onAnswer: (answer: string) => Promise<void>;
  disabled?: boolean;
}

// Multiple Choice Input
const MultipleChoiceInput: React.FC<{ 
  question: Question;
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}> = ({ question, onChange, value, disabled }) => {
  if (!question.options) return null;
  
  return (
    <Radio.Group 
      onChange={(e) => onChange(e.target.value)}
      value={value}
      disabled={disabled}
      style={{ width: '100%' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {question.options.map((option, index) => (
          <Radio key={index} value={String(index + 1)} style={{ width: '100%', padding: '8px' }}>
            {option.text}
          </Radio>
        ))}
      </Space>
    </Radio.Group>
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
    autoSize={{ minRows: 3, maxRows: 6 }}
    disabled={disabled}
  />
);

// Step by Step Input
const StepByStepInput: React.FC<{
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}> = ({ onChange, value, disabled }) => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <MathInput
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder="הכנס את תשובתך (ניתן להשתמש ב-LaTeX)"
    />
  </Space>
);

// Code Input
const CodeInput: React.FC<{
  question: Question;
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}> = ({ question, onChange, value, disabled }) => (
  <MonacoEditor
    value={value}
    onChange={onChange}
    language="javascript" // Default to JavaScript, could be made configurable
    disabled={disabled}
  />
);

const QuestionResponseInput: React.FC<QuestionResponseInputProps> = ({
  question,
  onAnswer,
  disabled = false
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
      <Button
        type="primary"
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={disabled || !answer.trim()}
        style={{ marginTop: '8px' }}
      >
        שלח תשובה
      </Button>
    </Space>
  );
};

export default QuestionResponseInput; 