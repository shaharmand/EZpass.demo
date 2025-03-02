import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { Space, Spin, Typography, Card, Button } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { 
  Question, 
  FilterState, 
  QuestionFeedback, 
  BasicAnswerLevel, 
  DetailedEvalLevel, 
  isSuccessfulAnswer,
  FullAnswer,
  QuestionType
} from '../../types/question';
import { SkipReason, QuestionPracticeState } from '../../types/prepUI';
import type { StudentPrep } from '../../types/prepState';
import QuestionContent from '../QuestionContent';
import { FeedbackContainer } from '../feedback/FeedbackContainer';
import { QuestionHeader } from './QuestionHeader';
import QuestionResponseInput from '../QuestionResponseInput';
import { AnsweringActionBar } from './AnsweringActionBar';
import { getQuestionTopicName, getQuestionTypeLabel } from '../../utils/questionUtils';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { FeedbackActionBar } from './FeedbackActionBar';
import { TopicSelectionDialog } from './TopicSelectionDialog';
import QuestionSetProgress from './QuestionSetProgress';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '../../utils/logger';
import './QuestionInteractionContainer.css';

const { Text } = Typography;

interface QuestionInteractionContainerProps {
  question: Question;
  onSubmit: (answer: FullAnswer) => void;
  onSkip: (reason: SkipReason, filters?: FilterState) => Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  prep: StudentPrep;
  isQuestionLoading?: boolean;
  showDetailedFeedback?: boolean;
  state: QuestionPracticeState;
}

const QuestionInteractionContainer: React.FC<QuestionInteractionContainerProps> = ({
  question,
  onSubmit,
  onSkip,
  onNext,
  onPrevious,
  filters,
  onFiltersChange,
  prep,
  isQuestionLoading,
  showDetailedFeedback = true,
  state
}) => {
  const { getFeedbackMode } = usePracticeAttempts();
  const isLimitedFeedback = getFeedbackMode() === 'limited';
  const [answer, setAnswer] = useState<FullAnswer | null>(null);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [currentQuestionBatch, setCurrentQuestionBatch] = useState<Question[]>([]);
  const [isTopicSelectionDialogOpen, setIsTopicSelectionDialogOpen] = useState(false);

  // Track current batch of 10 questions
  const [currentBatch, setCurrentBatch] = useState<Array<{
    index: number;
    isCorrect?: boolean;
    score?: number;
    status: 'pending' | 'active' | 'completed';
  }>>([]);

  // Initialize or reset batch when starting new practice
  useEffect(() => {
    if (prep && (!currentBatch.length || currentBatch.length !== 10)) {
      setCurrentBatch(Array.from({ length: 10 }, (_, i) => ({
        index: i,
        status: i === 0 ? 'active' : 'pending'
      })));
    }
  }, [prep]);

  // Update batch when question is answered
  useEffect(() => {
    if (!state.submissions.length) return;
    const lastSubmission = state.submissions[state.submissions.length - 1];

    logger.info('Feedback update:', {
      hasFeedback: !!lastSubmission,
      batchLength: currentBatch.length,
      feedback: lastSubmission?.feedback
    });

    const currentIndex = currentBatch.findIndex(q => q.status === 'active');
    if (currentIndex === -1) return;

    const newBatch = [...currentBatch];
    newBatch[currentIndex] = {
      ...newBatch[currentIndex],
      isCorrect: isSuccessfulAnswer(lastSubmission.feedback.evalLevel),
      score: lastSubmission.feedback.score,
      status: 'completed'
    };

    if (currentIndex + 1 < newBatch.length) {
      newBatch[currentIndex + 1].status = 'active';
    }

    setCurrentBatch(newBatch);
  }, [state.submissions]);

  const handleAnswerChange = useCallback((answer: FullAnswer) => {
    setAnswer(answer);
    setIsSubmitEnabled(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isSubmitEnabled && answer) {
      onSubmit(answer);
      setAnswer(null);
      setIsSubmitEnabled(false);
    }
  }, [answer, isSubmitEnabled, onSubmit]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const handleRetry = useCallback(() => {
    setAnswer(null);
    setIsSubmitEnabled(false);
  }, []);

  const handleSkip = async (reason: SkipReason) => {
    logger.info('User skipping question', { reason });
    await onSkip(reason, filters);
  };

  const handleHelp = (type: 'explain_question' | 'guide_solution' | 'hint' | 'show_solution' | 'learning_materials') => {
    logger.info('User requested help', { type });
    // TODO: Implement help functionality
  };

  const getAnswerDisplayValue = (answer: FullAnswer | null): string | undefined => {
    if (!answer) return undefined;
    
    // For multiple choice questions, use the selected option
    if (question.metadata.type === QuestionType.MULTIPLE_CHOICE) {
      return answer.finalAnswer.type === 'multiple_choice' ? 
        answer.finalAnswer.value.toString() : undefined;
    }
    
    // For numerical questions, use the value with unit
    if (question.metadata.type === QuestionType.NUMERICAL) {
      return answer.finalAnswer.type === 'numerical' ? 
        `${answer.finalAnswer.value}${answer.finalAnswer.unit || ''}` : undefined;
    }
    
    // For open questions, use the solution text (user's input)
    return answer.solution.text;
  };

  const renderQuestionContent = () => {
    return (
      <div className="question-content">
        <div className="question-body">
          <div className="question-content-wrapper">
            <QuestionContent
              content={question.content.text}
              isLoading={false}
            />
          </div>
          {question.metadata.source && (
            <div className="source-info">
              <Text type="secondary" italic>
                {getQuestionTopicName(question)}
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnswerSection = () => {
    return (
      <div className="answer-section">
        <div className="answer-header">
          <Typography.Title level={3}>תשובה</Typography.Title>
        </div>
        <QuestionResponseInput 
          question={question}
          onAnswer={handleAnswerChange}
          onRetry={handleRetry}
          disabled={state.status === 'submitted'}
          feedback={state.submissions.length > 0 ? state.submissions[state.submissions.length - 1].feedback : undefined}
          selectedAnswer={answer}
          onCanSubmitChange={setIsSubmitEnabled}
        />
      </div>
    );
  };

  const renderActionBar = () => {
    return (
      <div className="action-bar-wrapper">
        <AnsweringActionBar
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          onHelp={handleHelp}
          disabled={!isSubmitEnabled}
        />
      </div>
    );
  };

  if (isQuestionLoading) {
    return (
      <div className="question-loading">
        <div className="question-loading-content">
          <Spin size="large" />
          <Text style={{ textAlign: 'center' }}>טוען שאלה...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-practice-wrapper">
      <div className="daily-practice-container">
        <div className="daily-practice-content">
          <div className="progress-section">
            <QuestionSetProgress
              currentQuestionIndex={currentBatch.findIndex(q => q.status === 'active')}
              totalQuestions={10}
              questionId={question.id}
              prepId={prep.id}
            />
          </div>

          <Card className={`question-card question-type-${question.metadata.type}`}>
            <QuestionHeader
              question={question}
              filters={filters}
              onFiltersChange={onFiltersChange}
              onSkip={onSkip}
            />
            {renderQuestionContent()}
          </Card>

          {renderAnswerSection()}

          {!state.submissions.length && renderActionBar()}

          <AnimatePresence mode="wait">
            <motion.div
              key={`feedback-${question?.id}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {state.status === 'submitted' && state.submissions.length === 0 && (
                <div className="feedback-loading">
                  <Space direction="vertical">
                    <Spin size="large" />
                    <Text>בודק את התשובה שלך...</Text>
                  </Space>
                </div>
              )}

              {state.submissions.length > 0 && (
                <div className="feedback-container">
                  <div className="feedback-section">
                    <FeedbackContainer 
                      question={question}
                      feedback={state.submissions[state.submissions.length - 1].feedback}
                      selectedAnswer={getAnswerDisplayValue(answer)}
                      showDetailedFeedback={showDetailedFeedback}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {state.submissions.length > 0 && (
          <div className="daily-practice-action-bar">
            <FeedbackActionBar
              feedback={state.submissions[state.submissions.length - 1].feedback}
              onRetry={handleRetry}
              onNext={onNext}
              showRetry={!isSuccessfulAnswer(state.submissions[state.submissions.length - 1].feedback.evalLevel)}
            />
          </div>
        )}
      </div>

      <TopicSelectionDialog
        exam={prep.exam}
        open={isTopicSelectionDialogOpen}
        onClose={() => setIsTopicSelectionDialogOpen(false)}
        currentFilters={filters}
        onFilterChange={onFiltersChange}
        currentQuestion={question}
        onSkip={onSkip}
      />
    </div>
  );
};

export default memo(QuestionInteractionContainer);