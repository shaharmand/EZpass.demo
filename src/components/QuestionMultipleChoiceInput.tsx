import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';
import type { Question } from '../types/question';
import type { QuestionFeedback } from '../types/feedback/types';
import { isSuccessfulAnswer } from '../types/feedback/status';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
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

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
`;

const OptionItem = styled.div<{ $status: OptionStatus; $selected: boolean; $disabled: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid ${props => 
    props.$status === 'correct' ? '#10b981' : 
    props.$status === 'incorrect' ? '#ef4444' : 
    props.$selected ? '#3b82f6' : '#e5e7eb'};
  background-color: ${props => 
    props.$status === 'correct' ? 'rgba(16, 185, 129, 0.1)' : 
    props.$status === 'incorrect' ? 'rgba(239, 68, 68, 0.1)' : 
    props.$selected ? 'rgba(59, 130, 246, 0.1)' : '#ffffff'};
  cursor: ${props => props.$disabled ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: ${props => 
      props.$disabled ? 
        (props.$status === 'correct' ? '#10b981' : 
         props.$status === 'incorrect' ? '#ef4444' : 
         props.$selected ? '#3b82f6' : '#e5e7eb') : 
      '#3b82f6'};
    box-shadow: ${props => props.$disabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
    transform: ${props => props.$disabled ? 'none' : 'translateY(-1px)'};
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 4px;
    height: 100%;
    background-color: ${props => 
      props.$status === 'correct' ? '#10b981' : 
      props.$status === 'incorrect' ? '#ef4444' : 
      props.$selected ? '#3b82f6' : 'transparent'};
  }
  
  &.animate-in {
    animation: slideIn 0.3s ease forwards;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const OptionNumber = styled.div<{ $status: OptionStatus; $selected: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: ${props => 
    props.$status === 'correct' ? '#10b981' : 
    props.$status === 'incorrect' ? '#ef4444' : 
    props.$selected ? '#3b82f6' : '#f1f5f9'};
  color: ${props => 
    (props.$status === 'correct' || props.$status === 'incorrect' || props.$selected) ? 
    '#ffffff' : '#64748b'};
  font-weight: 600;
  font-size: 14px;
  margin-left: 12px;
  flex-shrink: 0;
`;

const OptionContent = styled.div`
  flex: 1;
  font-size: 15px;
  line-height: 1.4;
  color: #334155;
`;

const ResultIcon = styled.div<{ $status: OptionStatus }>`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  color: ${props => 
    props.$status === 'correct' ? '#10b981' : 
    props.$status === 'incorrect' ? '#ef4444' : 
    'transparent'};
  font-size: 18px;
`;

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
    <OptionsContainer>
      {question.content.options.map((option, index) => {
        const optionNumber = index + 1;
        const isSelected = localSelection === optionNumber;
        const status = getOptionStatus(isSelected, optionNumber, correctOption, feedback, value);
        const isAnimated = animatedOptions.includes(optionNumber);
        const isDisabled = disabled || !!feedback;
        
        return (
          <OptionItem
            key={optionNumber}
            $status={status}
            $selected={isSelected}
            $disabled={isDisabled}
            onClick={() => !isDisabled && handleOptionSelect(optionNumber)}
            className={isAnimated ? 'animate-in' : ''}
          >
            <OptionNumber 
              $status={status}
              $selected={isSelected}
            >
              {numberToHebrewLetter(optionNumber)}
            </OptionNumber>
            <OptionContent>
              <div dangerouslySetInnerHTML={{ __html: option.text }} />
            </OptionContent>
            {feedback && (status === 'correct' || status === 'incorrect') && (
              <ResultIcon $status={status}>
                {status === 'correct' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              </ResultIcon>
            )}
          </OptionItem>
        );
      })}
    </OptionsContainer>
  );
};

export default QuestionMultipleChoiceInput; 