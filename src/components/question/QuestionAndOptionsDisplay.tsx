import React from 'react';

interface QuestionAndOptionsDisplayProps {
  question: {
    options?: Array<{ text: string; format: 'markdown' }>;
    correctOption?: number;
  };
  showCorrectAnswer?: boolean;
}

const hebrewLetters = ['א', 'ב', 'ג', 'ד'];

export const QuestionAndOptionsDisplay: React.FC<QuestionAndOptionsDisplayProps> = ({
  question,
  showCorrectAnswer = false
}) => {
  if (!question.options?.length) return null;

  return (
    <div style={{ direction: 'rtl', marginTop: '12px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>אפשרויות:</div>
      {question.options.map((option, index) => {
        const isCorrect = showCorrectAnswer && question.correctOption === index + 1;
        
        return (
          <div 
            key={index} 
            style={{ 
              margin: '8px 0',
              padding: '8px 12px',
              border: isCorrect ? '2px solid #52c41a' : '1px solid #e8e8e8',
              borderRadius: '6px',
              backgroundColor: isCorrect ? '#f6ffed' : 'white'
            }}
          >
            <span style={{ 
              fontWeight: 'bold', 
              marginLeft: '12px',
              color: isCorrect ? '#52c41a' : 'inherit'
            }}>
              {hebrewLetters[index]}.
            </span>
            <span style={{ 
              color: isCorrect ? '#52c41a' : 'inherit'
            }}>
              {option.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}; 