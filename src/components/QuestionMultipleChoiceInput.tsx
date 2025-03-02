import React from 'react';
import { Typography } from 'antd';
import type { Question, QuestionFeedback } from '../types/question';
import { isSuccessfulAnswer } from '../types/question';
import './QuestionMultipleChoiceInput.css';

const { Text } = Typography;

interface QuestionMultipleChoiceInputProps {
  question: Question;
  onChange: (selectedOption: number) => void;
  value: number | null;
  disabled?: boolean;
  feedback?: QuestionFeedback;
}

type OptionStatus = 'correct' | 'incorrect' | 'default';

const getCorrectOption = (question: Question): number | null => {
  if (question.answer.finalAnswer.type === 'multiple_choice') {
    return question.answer.finalAnswer.value;
  }
  return null;
};

const getOptionStatus = (
  isSelected: boolean,
  optionNumber: number,
  correctOption: number | null,
  feedback?: QuestionFeedback
): OptionStatus => {
  if (!feedback) return 'default';
  
  if (isSelected) {
    return isSuccessfulAnswer(feedback.evalLevel) ? 'correct' : 'incorrect';
  }
  
  // Show correct answer after feedback
  if (correctOption === optionNumber) {
    return 'correct';
  }
  
  return 'default';
};

export const QuestionMultipleChoiceInput: React.FC<QuestionMultipleChoiceInputProps> = ({
  question,
  onChange,
  value,
  disabled,
  feedback
}) => {
  if (!question.content.options) return null;

  const handleOptionSelect = (optionNumber: number) => {
    if (!disabled) {
      onChange(optionNumber);
    }
  };

  const correctOption = getCorrectOption(question);

  return (
    <div className="options-list">
      {question.content.options.map((option, index) => {
        const optionNumber = index + 1;
        const isSelected = value === optionNumber;
        
        const status = getOptionStatus(isSelected, optionNumber, correctOption, feedback);
        
        // Build class names using the status
        const optionClasses = [
          'option',
          isSelected ? 'selected' : '',
          disabled ? 'disabled' : '',
          status !== 'default' ? status : ''
        ].filter(Boolean).join(' ');

        const numberClasses = [
          'option-number',
          isSelected ? 'selected' : '',
          status !== 'default' ? status : ''
        ].filter(Boolean).join(' ');

        const textClasses = [
          'option-text',
          isSelected ? 'selected' : '',
          status !== 'default' ? status : ''
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