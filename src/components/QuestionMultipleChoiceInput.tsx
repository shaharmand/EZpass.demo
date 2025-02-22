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
    correctOption?: string;
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

export default QuestionMultipleChoiceInput; 