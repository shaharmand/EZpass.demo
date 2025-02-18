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

const PracticeContainer: React.FC<PracticeContainerProps> = ({
  question,
  onNext,
  onComplete
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [needsHelp, setNeedsHelp] = useState(false);

  const handleSubmit = (answer: string) => {
    const timeTaken = (Date.now() - startTime) / 1000; // Convert to seconds
    const isCorrect = question.type === 'multiple_choice' 
      ? parseInt(answer) === question.correctOption
      : false; // For essay questions, correctness is determined elsewhere

    setIsSubmitted(true);
    
    if (onComplete) {
      onComplete({
        isCorrect,
        timeTaken,
        needsHelp
      });
    }
  };

  const handleHelp = (action: string) => {
    setNeedsHelp(true);
    if (action === 'hint') {
      message.info('רמז: נסה לחשוב על הנושא מזווית אחרת');
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PracticeQuestionDisplay
        question={question}
        onHelp={handleHelp}
        onNext={onNext}
      />
      
      <AnswerSection
        type={question.type}
        options={question.type === 'multiple_choice' ? question.options : undefined}
        onSubmit={handleSubmit}
        isSubmitted={isSubmitted}
        correctAnswer={question.type === 'multiple_choice' ? question.correctOption.toString() : question.solution}
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