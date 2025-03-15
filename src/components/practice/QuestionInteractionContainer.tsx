import React, { useCallback, useEffect, useState, memo, useRef } from 'react';
import { Space, Spin, Typography, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
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
import QuestionContent from '../QuestionContent';
import { FeedbackContainer } from '../feedback/FeedbackContainer';
import { QuestionHeader } from './QuestionHeader';
import QuestionResponseInput from '../QuestionResponseInput';
import { AnsweringActionBar } from './AnsweringActionBar';
import { getQuestionSourceDisplay } from '../../utils/translations';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { FeedbackActionBar } from './FeedbackActionBar';
import { TopicSelectionDialog } from './TopicSelectionDialog';
import QuestionSetProgress from './QuestionSetProgress';
import { motion, AnimatePresence } from 'framer-motion';
import { SubtopicVideoBar } from './SubtopicVideoBar';
import { VimeoPlayer } from './VimeoPlayer';
import './QuestionInteractionContainer.css';
import { videoContentService } from '../../services/videoContentService';
import { VideoContent } from '../../types/videoContent';

const { Text } = Typography;

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

const QuestionInteractionContainer: React.FC<QuestionInteractionContainerProps> = ({
  question,
  onSubmit,
  onSkip,
  onNext,
  onPrevious,
  prep,
  isQuestionLoading,
  showDetailedFeedback = true,
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
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [subtopicVideos, setSubtopicVideos] = useState<VideoContent[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  
  // Add effect to scroll to feedback when it appears
  useEffect(() => {
    if (state.submissions.length > 0 && state.submissions[state.submissions.length - 1].feedback?.data) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [state.submissions]);

  // Add effect to handle question transitions
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

  // Load videos when subtopic changes
  useEffect(() => {
    const loadSubtopicVideos = async () => {
      if (!question.metadata.subtopicId) {
        setSubtopicVideos([]);
        return;
      }

      setIsLoadingVideos(true);
      try {
        const videos = await videoContentService.getSubtopicVideos(question.metadata.subtopicId);
        setSubtopicVideos(videos);
      } catch (error) {
        console.error('Failed to load subtopic videos:', error);
        setSubtopicVideos([]);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    loadSubtopicVideos();
  }, [question.metadata.subtopicId]);

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

  const handleNext = useCallback(() => {
    console.log('=== Starting handleNext ===', {
      questionId: question.id,
      currentState: state.status,
      hasSubmissions: state.submissions.length > 0
    });
    
    // Reset answer state before moving to next question
    setAnswer(null);
    setIsSubmitEnabled(false);
    
    // Reset question state
    setState(prev => ({
      ...prev,
      status: 'active',
      currentAnswer: null,
      error: undefined,
      submissions: [],
      helpRequests: [],
      practiceStartedAt: Date.now()
    }));
    
    onNext();
    
    console.log('=== Completed handleNext ===', {
      questionId: question.id
    });
  }, [onNext, question.id, state.status, state.submissions.length, setState]);

  const handleSkip = async (reason: SkipReason) => {
    console.log('User skipping question', { reason });
    await onSkip(reason);
  };

  const handleHelp = (type: 'explain_question' | 'guide_solution' | 'hint' | 'show_solution' | 'learning_materials') => {
    console.log('User requested help', { type });
    // TODO: Implement help functionality
  };

  const getAnswerDisplayValue = (answer: FullAnswer | null): string | undefined => {
    if (!answer?.finalAnswer) return undefined;
    
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
          {showSource && question.metadata.source && (
            <Text type="secondary" className="source-info">
              {getQuestionSourceDisplay({
                sourceType: question.metadata.source.type as SourceType,
                ...(question.metadata.source.type === SourceType.EXAM ? {
                  examTemplateId: question.metadata.source.examTemplateId,
                  year: question.metadata.source.year,
                  period: question.metadata.source.period,
                  moed: question.metadata.source.moed,
                  order: question.metadata.source.order
                } : {})
              })}
            </Text>
          )}
        </div>
      </div>
    );
  };

  const renderAnswerSection = () => {
    return (
      <div className={`answer-section ${isAnswerSectionVisible ? 'animate-in' : ''}`}>
        <div className="answer-header">
          <Typography.Title level={3}>תשובה</Typography.Title>
        </div>
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

  const renderActionBar = () => {
    return (
      <div className="daily-practice-action-bar">
        <div className="action-bar-wrapper">
          <AnsweringActionBar
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            onHelp={handleHelp}
            disabled={!isSubmitEnabled}
          />
        </div>
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
    <div className={`question-interaction-container ${className || ''}`} style={style} ref={containerRef}>
      <div className="daily-practice-wrapper" style={{ 
        marginRight: question.metadata.subtopicId ? '320px' : '0',
        transition: 'margin-right 0.3s ease'
      }}>
        <div className="daily-practice-container">
          <div className="daily-practice-content">
            <div className="progress-section" ref={progressSectionRef}>
              <div ref={questionCounterRef} className="question-counter-wrapper">
                <QuestionSetProgress
                  questionId={question.id}
                  prepId={prep.id}
                  prep={prep}
                />
              </div>
            </div>

            <Card 
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
                ref={feedbackRef}
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
                    <div className="feedback-section">
                      {(() => {
                        const feedbackData = state.submissions[state.submissions.length - 1]?.feedback?.data;
                        if (!feedbackData) return null;
                        return (
                          <FeedbackContainer 
                            question={question}
                            submission={state.submissions[state.submissions.length - 1]}
                            isLimitedFeedback={isAllowedFullFeedback()}
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {state.submissions.length > 0 && state.submissions[state.submissions.length - 1].feedback?.data && (
            <div className="daily-practice-action-bar">
              {(() => {
                const feedbackData = state.submissions[state.submissions.length - 1]?.feedback?.data;
                if (!feedbackData) return null;
                return (
                  <FeedbackActionBar
                    feedback={feedbackData}
                    onRetry={handleRetry}
                    onNext={handleNext}
                    showRetry={!isSuccessfulAnswer(feedbackData.evalLevel)}
                  />
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {question.metadata.subtopicId && (
        <>
          <SubtopicVideoBar
            subtopicId={question.metadata.subtopicId}
            subtopicName={getQuestionTopicName(question)}
            videos={subtopicVideos}
            onVideoSelect={(videoId) => setSelectedVideoId(videoId)}
            isLoading={isLoadingVideos}
          />
          
          <VimeoPlayer
            videoId={selectedVideoId || ''}
            isOpen={!!selectedVideoId}
            onClose={() => setSelectedVideoId(null)}
          />
        </>
      )}

      <TopicSelectionDialog
        exam={prep.exam}
        open={isTopicSelectionDialogOpen}
        onClose={() => setIsTopicSelectionDialogOpen(false)}
        currentQuestion={question}
        onSkip={onSkip}
      />
    </div>
  );
};

export default memo(QuestionInteractionContainer);