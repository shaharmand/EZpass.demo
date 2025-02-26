import React from 'react';
import { Typography } from 'antd';
import type { Question } from '../types/question';
import './QuestionMultipleChoiceInput.css';

const { Text } = Typography;

interface QuestionMultipleChoiceInputProps {
  question: Question;
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
  feedback?: {
    isCorrect: boolean;
  };
}

export const QuestionMultipleChoiceInput: React.FC<QuestionMultipleChoiceInputProps> = ({
  question,
  onChange,
  value,
  disabled,
  feedback
}) => {
  if (!question.options) return null;

  return (
    <div className="options-list">
      {question.options.map((option, index) => {
        const optionNumber = index + 1;
        const isSelected = value === String(optionNumber);
        const isCorrectOption = feedback && question.correctOption === optionNumber;
        
        // Build class names - Show correct answer only after feedback
        const optionClasses = [
          'option-card',
          isSelected ? 'selected' : '',
          disabled ? 'disabled' : '',
          // Show incorrect only on selected wrong answer
          feedback && isSelected && !feedback.isCorrect ? 'incorrect' : '',
          // Show correct on either correct selection or correct answer after feedback
          feedback && (isCorrectOption || (isSelected && feedback.isCorrect)) ? 'correct' : ''
        ].filter(Boolean).join(' ');

        const numberClasses = [
          'option-number',
          isSelected ? 'selected' : '',
          feedback && isSelected && !feedback.isCorrect ? 'incorrect' : '',
          feedback && (isCorrectOption || (isSelected && feedback.isCorrect)) ? 'correct' : ''
        ].filter(Boolean).join(' ');

        const textClasses = [
          'option-text',
          isSelected ? 'selected' : '',
          feedback && isSelected && !feedback.isCorrect ? 'incorrect' : '',
          feedback && (isCorrectOption || (isSelected && feedback.isCorrect)) ? 'correct' : ''
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

export default QuestionMultipleChoiceInput; 