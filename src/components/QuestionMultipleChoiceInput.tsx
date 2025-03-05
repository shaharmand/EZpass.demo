import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';
import type { Question } from '../types/question';
import type { QuestionFeedback } from '../types/feedback/types';
import { isSuccessfulAnswer } from '../types/feedback/status';
import './QuestionMultipleChoiceInput.css';

const { Text } = Typography;

// Convert number to Hebrew letter (1 -> א, 2 -> ב, etc.)
const numberToHebrewLetter = (num: number): string => {
  const letters = ['א', 'ב', 'ג', 'ד'];
  return letters[num - 1] || '';
};

interface QuestionMultipleChoiceInputProps {
  question: Question;
  onChange: (selectedOption: number) => void;
  value: number | null;
  disabled?: boolean;
  feedback?: QuestionFeedback;
}

type OptionStatus = 'correct' | 'incorrect' | 'default';

const getCorrectOption = (question: Question): number | null => {
  if (question.schoolAnswer.finalAnswer?.type === 'multiple_choice') {
    return question.schoolAnswer.finalAnswer.value;
  }
  return null;
};

const getOptionStatus = (
  isSelected: boolean,
  optionNumber: number,
  correctOption: number | null,
  feedback?: QuestionFeedback,
  selectedValue?: number | null
): OptionStatus => {
  if (!feedback) return 'default';
  
  // If there's feedback, show correct/incorrect status
  if (feedback) {
    if (correctOption === optionNumber) {
      return 'correct';
    }
    if (isSelected && optionNumber === selectedValue) {
      return isSuccessfulAnswer(feedback.evalLevel) ? 'correct' : 'incorrect';
    }
  }
  
  return 'default';
};

export const QuestionMultipleChoiceInput: React.FC<QuestionMultipleChoiceInputProps> = ({
  question,
  onChange,
  value,
  disabled = false,
  feedback
}) => {
  const [localSelection, setLocalSelection] = useState<number | null>(value);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);

  // Update local selection when value prop changes
  useEffect(() => {
    setLocalSelection(value);
  }, [value]);

  // Handle staggered animation of options
  useEffect(() => {
    setAnimatedOptions([]); // Reset animations when question changes
    
    // Stagger the animations
    const options = question.content.options || [];
    options.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedOptions(prev => [...prev, index + 1]);
      }, 100 * (index + 1));
    });

    return () => {
      setAnimatedOptions([]); // Cleanup animations on unmount
    };
  }, [question.id]); // Reset and re-run animations when question changes

  if (!question.content.options) return null;

  const handleOptionSelect = (optionNumber: number) => {
    if (disabled || feedback) return;
    setLocalSelection(optionNumber);
    onChange(optionNumber);
  };

  const correctOption = getCorrectOption(question);

  return (
    <div className="options-list">
      {question.content.options.map((option, index) => {
        const optionNumber = index + 1;
        const isSelected = localSelection === optionNumber;
        const status = getOptionStatus(isSelected, optionNumber, correctOption, feedback, value);
        const isAnimated = animatedOptions.includes(optionNumber);
        
        const optionClasses = [
          'multiple-choice-option',
          isSelected ? 'selected' : '',
          (disabled || feedback) ? 'disabled' : '',
          status !== 'default' ? status : '',
          isAnimated ? 'animate-in' : ''
        ].filter(Boolean).join(' ');

        return (
          <div
            key={optionNumber}
            className={optionClasses}
            onClick={(disabled || feedback) ? undefined : () => handleOptionSelect(optionNumber)}
            role="button"
            tabIndex={(disabled || feedback) ? -1 : 0}
            style={{ 
              pointerEvents: (disabled || feedback) ? 'none' : 'auto',
              cursor: (disabled || feedback) ? 'default' : 'pointer'
            }}
          >
            <div className="option-indicator">
              {numberToHebrewLetter(optionNumber)}
            </div>
            <div className="option-text">
              <Text>{option.text}</Text>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuestionMultipleChoiceInput; 