import React, { useState } from 'react';
import { Space, Button, message } from 'antd';
import PracticeQuestionDisplay from './PracticeQuestionDisplay';
import AnswerSection from '../AnswerSection';
import type { Question } from '../../types/question';

interface PracticeContainerProps {
  question: Question;
  onNext?: () => void;
  onComplete?: (result: {
    isCorrect: boolean;
    timeTaken: number;
    needsHelp: boolean;
  }) => void;
}

export const PracticeContainer: React.FC<PracticeContainerProps> = ({
  question,
  onNext,
  onComplete
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [needsHelp, setNeedsHelp] = useState(false);

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

  const handleHelp = (action: string) => {
    setNeedsHelp(true);
    if (action === 'hint') {
      message.info('רמז: נסה לחשוב על הנושא מזווית אחרת');
    } else if (action === 'next') {
      handleNext();
    }
  };

  const handleAnswer = async (answer: string, isCorrect: boolean) => {
    const timeTaken = (Date.now() - startTime) / 1000;
    setIsSubmitted(true);
    
    if (onComplete) {
      onComplete({
        isCorrect,
        timeTaken,
        needsHelp
      });
    }
  };

  const getCorrectAnswer = (): string | undefined => {
    if (question.type === 'multiple_choice') {
      return question.correctOption?.toString();
    }
    return question.solution.text;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PracticeQuestionDisplay
        question={question}
        onHelp={handleHelp}
        onAnswer={handleAnswer}
        onNextQuestion={handleNext}
      />
      
      {isSubmitted && onNext && (
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" onClick={onNext}>
            לשאלה הבאה
          </Button>
        </div>
      )}
    </Space>
  );
};

export default PracticeContainer; 