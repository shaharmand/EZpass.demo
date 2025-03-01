import React from 'react';
import { Typography } from 'antd';
import type { Question, QuestionFeedback } from '../types/question';
import './QuestionMultipleChoiceInput.css';

const { Text } = Typography;

interface QuestionMultipleChoiceInputProps {
  question: Question;
  onChange: (selectedOption: number) => void;
  value: number | null;
  disabled?: boolean;
  feedback?: QuestionFeedback;
}

export const QuestionMultipleChoiceInput: React.FC<QuestionMultipleChoiceInputProps> = ({
  question,
  onChange,
  value,
  disabled,
  feedback
}) => {
  if (!question.options) return null;

  const handleOptionSelect = (optionNumber: number) => {
    if (!disabled) {
      onChange(optionNumber);
    }
  };

  return (
    <div className="options-list">
      {question.options.map((option, index) => {
        const optionNumber = index + 1;
        const isSelected = value === optionNumber;
        const isCorrectOption = feedback && question.correctOption === optionNumber;
        
        // Build class names - Show correct answer only after feedback
        const optionClasses = [
          'option-card',
          isSelected ? 'selected' : '',
          disabled ? 'disabled' : '',
          // Show incorrect only on selected wrong answer
          feedback && isSelected && !feedback.isSuccess ? 'incorrect' : '',
          // Show correct on either correct selection or correct answer after feedback
          feedback && (isCorrectOption || (isSelected && feedback.isSuccess)) ? 'correct' : ''
        ].filter(Boolean).join(' ');

        const numberClasses = [
          'option-number',
          isSelected ? 'selected' : '',
          feedback && isSelected && !feedback.isSuccess ? 'incorrect' : '',
          feedback && (isCorrectOption || (isSelected && feedback.isSuccess)) ? 'correct' : ''
        ].filter(Boolean).join(' ');

        const textClasses = [
          'option-text',
          isSelected ? 'selected' : '',
          feedback && isSelected && !feedback.isSuccess ? 'incorrect' : '',
          feedback && (isCorrectOption || (isSelected && feedback.isSuccess)) ? 'correct' : ''
        ].filter(Boolean).join(' ');
        
        return (
          <div
            key={index}
            className={optionClasses}
            onClick={() => handleOptionSelect(optionNumber)}
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