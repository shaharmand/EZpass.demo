import React, { useCallback, useEffect, useState, memo, useRef } from 'react';
import { Space, Spin, Typography, Card, Button } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { 
  Question, 
  FullAnswer,
  QuestionType,
  SourceType
} from '../../types/question';
import { 
  QuestionFeedback
} from '../../types/feedback/types';
import { DetailedEvalLevel } from '../../types/feedback/levels';
import { isSuccessfulAnswer } from '../../types/feedback/status';
import { SkipReason, QuestionPracticeState } from '../../types/prepUI';
import { StudentPrep } from '../../types/prepState';
import { getQuestionTopicName } from '../../utils/questionUtils';
import QuestionContentDisplay from '../QuestionContent';
import QuestionResponseInput from '../QuestionResponseInput';
import { AnsweringActionBar } from './AnsweringActionBar';
import { getQuestionSourceDisplay } from '../../utils/translations';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { FeedbackActionBar } from './FeedbackActionBar';
import { TopicSelectionDialog } from './TopicSelectionDialog';
import QuestionSetProgress from './QuestionSetProgress';
import { motion, AnimatePresence } from 'framer-motion';
import './QuestionInteractionContainer.css';
import styled from 'styled-components';
import { FeedbackContainer } from '../feedback/FeedbackContainer';
import { QuestionHeader } from './QuestionHeader';

const { Text } = Typography;

// Simple Answer Header component
const AnswerHeader: React.FC = () => {
  return (
    <div className="question-header simplified">
      <div className="title-row">
        <h2 className="question-title">
          <span>תשובה</span>
        </h2>
      </div>
    </div>
  );
};

// Simple Feedback Header component
const FeedbackHeader: React.FC = () => {
  return (
    <div className="question-header simplified">
      <div className="title-row">
        <h2 className="question-title">
          <span>משוב</span>
        </h2>
      </div>
    </div>
  );
};

interface QuestionInteractionContainerProps {
  question: Question;
  onSubmit: (answer: FullAnswer) => void;
  onSkip: (reason: SkipReason) => Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
  prep: StudentPrep;
  isQuestionLoading?: boolean;
  showDetailedFeedback?: boolean;
  state: QuestionPracticeState;
  setState: React.Dispatch<React.SetStateAction<QuestionPracticeState>>;
  showSource?: boolean;
  showDifficulty?: boolean;
  showEstimatedTime?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  padding-bottom: 0;
  margin-bottom: 0;
`;

const ProgressContainer = styled.div`
  padding: 4px 0;
  margin-bottom: 4px;
`;

const ScrollableContent = styled.div`
  overflow-y: auto;
  max-height: calc(100vh - 140px);
  padding-bottom: 50px; /* Add space for the fixed action bar */
  margin-bottom: 0;
`;

const QuestionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const QuestionCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  border-right: 4px solid #3b82f6; /* Consistent blue border for all question types */
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 4px;
  max-height: calc(30vh - 60px); /* Reduced max-height to leave more space for answers and feedback */
  overflow-y: auto;
`;

const ActionBarContainer = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 4px;
  border-top: 1px solid #e5e7eb;
  z-index: 100;
  margin: 0;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  width: 100%; /* Ensure it takes the width of its parent */
`;

const FixedActionBar = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 2px solid #3b82f6;
  width: 80%;
  max-width: 600px;
`;

export const QuestionInteractionContainer: React.FC<QuestionInteractionContainerProps> = ({
  question,
  onSubmit,
  onSkip,
  onNext,
  onPrevious,
  prep,
  isQuestionLoading = false,
  state,
  setState,
  showSource = true,
  showDifficulty = true,
  showEstimatedTime = true,
  className,
  style
}) => {
  const { isAllowedFullFeedback } = usePracticeAttempts();
  const [answer, setAnswer] = useState<FullAnswer | null>(null);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isTopicSelectionDialogOpen, setIsTopicSelectionDialogOpen] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isQuestionEntering, setIsQuestionEntering] = useState(true);
  const [questionChangeKey, setQuestionChangeKey] = useState(0);
  const progressSectionRef = useRef<HTMLDivElement>(null);
  const questionCounterRef = useRef<HTMLDivElement>(null);
  const [isAnswerSectionVisible, setIsAnswerSectionVisible] = useState(false);

  // Animation and transition effects
  useEffect(() => {
    if (state.submissions.length > 0 && state.submissions[state.submissions.length - 1].feedback?.data) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [state.submissions]);

  useEffect(() => {
    // Reset animations
    const options = document.querySelectorAll('.multiple-choice-option');
    options.forEach(option => {
      option.classList.remove('animate-in');
    });
    
    setIsQuestionEntering(true);
    setQuestionChangeKey(prev => prev + 1);
    setIsAnswerSectionVisible(false);
    
    // Scroll to top with offset for fixed header and progress bar
    const scrollToTopWithOffset = () => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth' });
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };

    // Ensure the scroll happens after a small delay to allow for any layout updates
    setTimeout(scrollToTopWithOffset, 100);
    
    // Add transition classes
    if (progressSectionRef.current) {
      progressSectionRef.current.classList.add('question-changed');
      setTimeout(() => {
        progressSectionRef.current?.classList.remove('question-changed');
      }, 500);
    }
    
    if (questionCounterRef.current) {
      questionCounterRef.current.classList.add('number-changed');
      setTimeout(() => {
        questionCounterRef.current?.classList.remove('number-changed');
      }, 500);
    }

    // Remove entering state after animation and trigger answer section animation
    const timer = setTimeout(() => {
      setIsQuestionEntering(false);
      setIsAnswerSectionVisible(true);
      
      // Add animation class to multiple choice options with staggered timing
      const options = document.querySelectorAll('.multiple-choice-option');
      options.forEach((option, index) => {
        setTimeout(() => {
          option.classList.add('animate-in');
        }, 100 * (index + 1)); // Stagger each option by 100ms
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      // Cleanup animation classes
      const options = document.querySelectorAll('.multiple-choice-option');
      options.forEach(option => {
        option.classList.remove('animate-in');
      });
      if (progressSectionRef.current) {
        progressSectionRef.current.classList.remove('question-changed');
      }
      if (questionCounterRef.current) {
        questionCounterRef.current.classList.remove('number-changed');
      }
    };
  }, [question.id]);

  // Handlers
  const handleAnswerChange = useCallback((answer: FullAnswer) => {
    setAnswer(answer);
    setIsSubmitEnabled(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isSubmitEnabled && answer) {
      onSubmit(answer);
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
    console.log('=== Starting handleRetry ===', {
      questionId: question.id,
      currentState: state.status,
      hasSubmissions: state.submissions.length > 0
    });

    // Reset local state
    setAnswer(null);
    setIsSubmitEnabled(false);

    // Reset question state to allow for a new attempt
    setState(prev => {
      console.log('Resetting question state for retry', {
        previousStatus: prev.status,
        previousSubmissions: prev.submissions.length
      });
      return {
        ...prev,
        status: 'active',
        currentAnswer: null,
        error: undefined,
        submissions: [], // Clear all previous submissions and feedback
        helpRequests: [], // Reset help requests for the new attempt
        practiceStartedAt: Date.now() // Reset the timer for the new attempt
      };
    });

    console.log('=== Completed handleRetry ===', {
      questionId: question.id
    });
  }, [setState, question.id, state.status, state.submissions.length]);

  const handleHelp = useCallback((type: 'explain_question' | 'guide_solution' | 'hint' | 'show_solution' | 'learning_materials') => {
    console.log('User requested help', { type });
    // TODO: Implement help functionality
  }, []);

  // Render functions
  const renderQuestionContent = () => {
    return (
      <div className="question-content">
        <div className="question-body">
          <div className="question-content-wrapper">
            <QuestionContentDisplay
              content={question.content.text}
              isLoading={false}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderAnswerSection = () => {
    return (
      <div className={`answer-section ${isAnswerSectionVisible ? 'animate-in' : ''}`}>
        <AnswerHeader />
        <QuestionResponseInput 
          question={question}
          onAnswer={handleAnswerChange}
          disabled={state.status === 'submitted'}
          feedback={state.submissions.length > 0 ? state.submissions[state.submissions.length - 1].feedback?.data : undefined}
          selectedAnswer={answer}
          onCanSubmitChange={setIsSubmitEnabled}
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
    <StyledContainer className={className} style={style} ref={containerRef}>
      <ProgressContainer ref={progressSectionRef}>
        <div ref={questionCounterRef} className="question-counter-wrapper">
          <QuestionSetProgress
            questionId={question.id}
            prepId={prep.id}
            prep={prep}
          />
        </div>
      </ProgressContainer>
      
      <ScrollableContent>
        <QuestionContainer>
          <QuestionCard 
            className={`question-card question-type-${question.metadata.type} ${
              isQuestionEntering ? 'entering' : 'entered'
            }`}
            key={questionChangeKey}
          >
            <QuestionHeader
              question={question}
              onSkip={onSkip}
            />
            {renderQuestionContent()}
          </QuestionCard>

          {isAnswerSectionVisible && renderAnswerSection()}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`feedback-${question?.id}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              ref={feedbackRef}
              style={{ overflow: 'visible' }}
            >
              {state.status === 'submitted' && state.submissions.length === 0 && (
                <div className="feedback-loading">
                  <Space direction="vertical">
                    <Spin size="large" />
                    <Text>בודק את התשובה שלך...</Text>
                  </Space>
                </div>
              )}

              {state.submissions.length > 0 && state.submissions[state.submissions.length - 1].feedback?.data && (
                <div className="feedback-container">
                  <FeedbackHeader />
                  <div className="feedback-section">
                    <FeedbackContainer 
                      question={question}
                      submission={state.submissions[state.submissions.length - 1]}
                      isLimitedFeedback={!isAllowedFullFeedback()}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </QuestionContainer>
      </ScrollableContent>
      
      {(state.status === 'active' || state.status === 'idle') && (
        <ActionBarContainer className="ActionBarContainer">
          <AnsweringActionBar
            onSubmit={handleSubmit}
            onSkip={(reason) => onSkip(reason)}
            onHelp={handleHelp}
            disabled={!isSubmitEnabled || isQuestionLoading}
          />
        </ActionBarContainer>
      )}
      
      {(state.status === 'submitted' || state.status === 'receivedFeedback') && state.submissions.length > 0 && state.submissions[state.submissions.length - 1].feedback?.data && (
        <ActionBarContainer className="ActionBarContainer">
          <FeedbackActionBar
            feedback={state.submissions[state.submissions.length - 1].feedback!.data}
            onNext={onNext}
            onRetry={handleRetry}
            showRetry={!isSuccessfulAnswer(state.submissions[state.submissions.length - 1].feedback!.data.evalLevel)}
          />
        </ActionBarContainer>
      )}
      
      <TopicSelectionDialog
        exam={prep.exam}
        open={isTopicSelectionDialogOpen}
        onClose={() => setIsTopicSelectionDialogOpen(false)}
        currentQuestion={question}
        onSkip={onSkip}
      />
    </StyledContainer>
  );
};

export default memo(QuestionInteractionContainer);