import React, { useState } from 'react';
import { Radio, Input, Button, Space, Typography } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { QuestionType } from '../types/question';

const { TextArea } = Input;
const { Text } = Typography;

interface AnswerSectionProps {
  type: QuestionType;
  options?: string[];
  onSubmit: (answer: string) => void;
  isSubmitted: boolean;
  correctAnswer?: string;
}

const AnswerSection: React.FC<AnswerSectionProps> = ({
  type,
  options = [],
  onSubmit,
  isSubmitted,
  correctAnswer
}) => {
  const [selectedOption, setSelectedOption] = useState<string>();
  const [essayAnswer, setEssayAnswer] = useState('');

  const handleOptionChange = (e: RadioChangeEvent) => {
    setSelectedOption(e.target.value);
  };

  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEssayAnswer(e.target.value);
  };

  const handleSubmit = () => {
    if (type === 'multiple_choice' && selectedOption) {
      onSubmit(selectedOption);
    } else if (type === 'essay' && essayAnswer.trim()) {
      onSubmit(essayAnswer);
    }
  };

  const getOptionStyle = (optionNumber: string) => {
    if (!isSubmitted || !correctAnswer) return {};
    
    const isCorrect = optionNumber === correctAnswer;
    const isSelected = optionNumber === selectedOption;
    
    if (isCorrect) {
      return { 
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f'
      };
    }
    if (isSelected && !isCorrect) {
      return {
        backgroundColor: '#fff2f0',
        border: '1px solid #ffccc7'
      };
    }
    return {};
  };

  return (
    <div style={{ padding: '24px' }}>
      {type === 'multiple_choice' ? (
        <Radio.Group 
          onChange={handleOptionChange} 
          value={selectedOption}
          disabled={isSubmitted}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {options.map((option, index) => (
              <Radio
                key={index + 1}
                value={(index + 1).toString()}
                style={{
                  ...getOptionStyle((index + 1).toString()),
                  padding: '12px',
                  width: '100%',
                  borderRadius: '4px'
                }}
              >
                {option}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      ) : (
        <TextArea
          value={essayAnswer}
          onChange={handleEssayChange}
          placeholder="כתוב את תשובתך כאן..."
          autoSize={{ minRows: 4, maxRows: 8 }}
          disabled={isSubmitted}
        />
      )}

      {!isSubmitted && (
        <div style={{ marginTop: '16px', textAlign: 'left' }}>
          <Button 
            type="primary"
            onClick={handleSubmit}
            disabled={
              (type === 'multiple_choice' && !selectedOption) ||
              (type === 'essay' && !essayAnswer.trim())
            }
          >
            הגש תשובה
          </Button>
        </div>
      )}

      {isSubmitted && type === 'essay' && correctAnswer && (
        <div style={{ marginTop: '16px' }}>
          <Text strong>פתרון מוצע:</Text>
          <div style={{ 
            marginTop: '8px',
            padding: '12px',
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '4px'
          }}>
            {correctAnswer}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerSection; 