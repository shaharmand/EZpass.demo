import React from 'react';
import { Typography } from 'antd';
import { Question } from '../../types/question';
import { QuestionSubmission } from '../../types/submissionTypes';
import { BasicQuestionFeedback, LimitedQuestionFeedback } from '../../types/feedback/types';
import styles from './MultipleChoiceFeedbackHeader.module.css';

const { Text, Title } = Typography;

// Convert number to Hebrew letter (1 -> א, 2 -> ב, etc.)
const numberToHebrewLetter = (num: number): string => {
  const letters = ['א', 'ב', 'ג', 'ד'];
  return letters[num - 1] || '';
};

interface MultipleChoiceFeedbackHeaderProps {
  question: Question;
  submission: QuestionSubmission;
  feedback: BasicQuestionFeedback | LimitedQuestionFeedback;
}

export const MultipleChoiceFeedbackHeader: React.FC<MultipleChoiceFeedbackHeaderProps> = ({
  question,
  submission,
  feedback
}) => {
  // Get selected answer from submission
  const selectedAnswer = submission.answer.finalAnswer?.type === 'multiple_choice' ? 
    String(submission.answer.finalAnswer.value) : '';

  // Get the selected and correct answer texts and numbers
  const selectedOptionNumber = !isNaN(parseInt(selectedAnswer)) ? parseInt(selectedAnswer) : null;
  const correctAnswerIndex = question.schoolAnswer?.finalAnswer?.type === 'multiple_choice' ? 
    question.schoolAnswer.finalAnswer.value - 1 : -1;
  const correctOptionNumber = question.schoolAnswer?.finalAnswer?.type === 'multiple_choice' ? 
    question.schoolAnswer.finalAnswer.value : null;

  const selectedOption = selectedOptionNumber !== null && question.content.options && 
    selectedOptionNumber > 0 && selectedOptionNumber <= question.content.options.length
    ? question.content.options[selectedOptionNumber - 1]?.text || ''
    : '';
  const correctOption = question.content.options?.[correctAnswerIndex]?.text || '';

  const isCorrect = feedback.isCorrect;

  return (
    <div className={`${styles['feedback-section']} ${isCorrect ? styles.success : ''}`}>
      <div className={styles['title-display']}>
        <Title level={4} className={isCorrect ? styles.success : styles.error}>
          {isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}
        </Title>
      </div>

      <div className={styles['answer-comparison']}>
        {!isCorrect ? (
          <div className={styles['answer-item']}>
            <div className={styles['answer-box']}>
              <div className={styles['answer-label']}>התשובה שלך</div>
              <div className={`${styles['answer-content']} ${styles.incorrect}`}>
                <span className={styles['option-number']}>{numberToHebrewLetter(selectedOptionNumber || 0)}</span>
                <span className={styles['option-text']}>{selectedOption}</span>
              </div>
            </div>
            <div className={styles['answer-box']}>
              <div className={styles['answer-label']}>התשובה הנכונה</div>
              <div className={`${styles['answer-content']} ${styles.correct}`}>
                <span className={styles['option-number']}>{numberToHebrewLetter(correctOptionNumber || 0)}</span>
                <span className={styles['option-text']}>{correctOption}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${styles['answer-item']} ${styles['single-answer']}`}>
            <div className={styles['answer-box']}>
              <div className={styles['answer-label']}>התשובה שלך</div>
              <div className={`${styles['answer-content']} ${styles.correct}`}>
                <span className={styles['option-number']}>{numberToHebrewLetter(selectedOptionNumber || 0)}</span>
                <span className={styles['option-text']}>{selectedOption}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 