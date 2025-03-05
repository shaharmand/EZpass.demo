import React, { useEffect } from 'react';
import { Card, Space, Typography, Divider, Button } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, StarOutlined, RedoOutlined } from '@ant-design/icons';
import { Question } from '../../types/question';
import { 
  QuestionFeedback,
  BasicQuestionFeedback
} from '../../types/feedback/types';
import { QuestionSubmission } from '../../types/submissionTypes';
import { BinaryEvalLevel } from '../../types/feedback/levels';
import { FeedbackStatus, getFeedbackStatus } from '../../types/feedback/status';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { logger } from '../../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { JoinEZPassPlusMessage } from './JoinEZPassPlusMessage';
import { MultipleChoiceFeedbackHeader } from './MultipleChoiceFeedbackHeader';
import { MultipleChoiceFeedbackExplanation } from './MultipleChoiceFeedbackExplanation';
import styles from './MultipleChoiceFeedback.module.css';

const { Text, Title } = Typography;

// Convert number to Hebrew letter (1 -> א, 2 -> ב, etc.)
const numberToHebrewLetter = (num: number): string => {
  const letters = ['א', 'ב', 'ג', 'ד'];
  return letters[num - 1] || '';
};

interface MultipleChoiceFeedbackProps {
  question: Question;
  submission: QuestionSubmission;
  showDetailedFeedback?: boolean;
  onUpgradeClick?: () => void;
}

export const MultipleChoiceFeedback: React.FC<MultipleChoiceFeedbackProps> = ({
  question,
  submission,
  showDetailedFeedback = true,
  onUpgradeClick
}) => {
  const correctAnswerIndex = question.schoolAnswer?.finalAnswer?.type === 'multiple_choice' ? 
    question.schoolAnswer.finalAnswer.value - 1 : -1;

  // Get selected answer from submission
  const selectedAnswer = submission.answer.finalAnswer?.type === 'multiple_choice' ? 
    String(submission.answer.finalAnswer.value) : '';
  const feedback = submission.feedback?.data as BasicQuestionFeedback;

  useEffect(() => {
    // Component mount/update log with more prominent message
    console.log('🎯 MULTIPLE CHOICE FEEDBACK RECEIVED:', {
      questionId: question.id,
      feedbackData: {
        evalLevel: feedback?.evalLevel,
        score: feedback?.score,
        allFeedbackKeys: Object.keys(feedback || {}),
        fullFeedback: feedback
      },
      questionData: {
        correctAnswerIndex,
        totalOptions: question.content.options?.length,
        options: question.content.options?.map((opt, idx) => `${idx + 1}: ${opt.text.substring(0, 30)}...`)
      }
    });

    // Log raw incoming data with more detail
    console.log('📝 RAW FEEDBACK DATA:', {
      answer: {
        value: selectedAnswer,
        type: typeof selectedAnswer,
        isValid: typeof selectedAnswer === 'string' ? 
          parseInt(selectedAnswer) >= 1 && parseInt(selectedAnswer) <= 4 : false
      },
      correctAnswer: {
        index: correctAnswerIndex,
        value: correctAnswerIndex + 1
      },
      evalLevel: feedback?.evalLevel,
      score: feedback?.score,
      fullFeedbackObject: JSON.stringify(feedback, null, 2)
    });

    // Get the selected and correct answer texts
    const selectedOptionIndex = parseInt(selectedAnswer || '1') - 1;

    // Log option processing
    logger.info('Processing options:', {
      selectedOptionRaw: selectedAnswer,
      selectedOptionIndex,
      selectedOptionText: question.content.options?.[selectedOptionIndex]?.text,
      correctAnswerIndex,
      correctAnswerText: question.content.options?.[correctAnswerIndex]?.text
    });

    // Log the actual user choice for debugging
    logger.info('User choice debug:', {
      rawAnswer: selectedAnswer,
      rawAnswerType: typeof selectedAnswer,
      parsedAnswer: selectedAnswer ? parseInt(selectedAnswer) : 'no answer provided',
      isNumber: selectedAnswer ? !isNaN(parseInt(selectedAnswer)) : false,
      answerRange: selectedAnswer ? (parseInt(selectedAnswer) >= 1 && parseInt(selectedAnswer) <= 4) : false,
      totalOptions: question.content.options?.length || 0,
      evalLevel: feedback?.evalLevel
    });
  }, [question.id, feedback, question.content.options, correctAnswerIndex, selectedAnswer]);

  // Get the selected and correct answer texts and numbers - with validation
  const selectedOptionNumber = !isNaN(parseInt(selectedAnswer)) ? parseInt(selectedAnswer) : null;
  const correctOptionNumber = question.schoolAnswer?.finalAnswer?.type === 'multiple_choice' ? 
    question.schoolAnswer.finalAnswer.value : null;

  const selectedOption = selectedOptionNumber !== null && question.content.options && 
    selectedOptionNumber > 0 && selectedOptionNumber <= question.content.options.length
    ? question.content.options[selectedOptionNumber - 1]?.text || ''
    : '';
  const correctOption = question.content.options?.[correctAnswerIndex]?.text || '';

  const feedbackStatus = getFeedbackStatus(feedback.evalLevel);
  const isCorrect = feedbackStatus === FeedbackStatus.SUCCESS;

  return (
    <div className={styles['multiple-choice-feedback']}>
      <MultipleChoiceFeedbackHeader
        question={question}
        submission={submission}
        feedback={feedback}
      />
      <MultipleChoiceFeedbackExplanation
        feedback={feedback}
        showDetailedFeedback={showDetailedFeedback}
        onUpgradeClick={onUpgradeClick}
      />
    </div>
  );
}; 