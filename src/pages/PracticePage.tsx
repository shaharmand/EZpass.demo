import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { Alert, Space, Button, Spin, Typography, Layout } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { PracticeHeader } from '../components/PracticeHeader';
import QuestionInteractionContainer from '../components/practice/QuestionInteractionContainer';
import type { PracticeQuestion, SkipReason } from '../types/prepUI';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EnhancedSidebar } from '../components/EnhancedSidebar/EnhancedSidebar';
import type { FilterState, Question, DifficultyLevel } from '../types/question';
import './PracticePage.css';
import { QuestionFilter } from '../components/EnhancedSidebar/QuestionFilter';
import QuestionMetadata from '../components/QuestionMetadata';
import { FilterSummary } from '../components/EnhancedSidebar/FilterSummary';
import QuestionContent from '../components/QuestionContent';
import QuestionResponseInput from '../components/QuestionResponseInput';
import type { QuestionStatus } from '../types/prepState';
import { PrepStateManager } from '../services/PrepStateManager';

const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const { prepId } = useParams();
  const [error, setError] = useState<string | null>(null);
  const requestInProgress = useRef(false);
  const isComponentMounted = useRef(true);
  const { findExamById } = useExam();
  const {
    activePrep,
    getPrep,
    currentQuestion,
    startPrep,
    submitAnswer,
    pausePrep,
    setCurrentQuestion,
    getNextQuestion,
    setActivePrep
  } = useStudentPrep();
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({});
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Track user progress
  const [userProgress, setUserProgress] = useState({
    completedContent: [] as string[],
    currentContent: undefined as string | undefined
  });

  // Loading state for questions (both initial and transitions)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    // Ensure difficulty is always DifficultyLevel[]
    if (newFilters.difficulty) {
      newFilters.difficulty = newFilters.difficulty.map(d => 
        typeof d === 'string' ? parseInt(d) as DifficultyLevel : d
      );
    }
    setFilters(newFilters);
  }, []);

  // Set mounted flag
  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!prepId) {
        console.warn('Practice initialization failed:', { 
          reason: 'Missing prepId',
          prepId 
        });
        if (mounted) {
          setError('מזהה תרגול לא תקין');
          setIsLoading(false);
          setIsLoadingQuestion(false);
        }
        return;
      }

      try {
        console.log('Initializing practice:', { prepId });
        if (mounted) {
          setIsLoading(true);
          setIsLoadingQuestion(true);
        }
        
        // Set requestInProgress only when making the request
        requestInProgress.current = true;
        const prep = await getPrep(prepId);
        
        if (!mounted) return;

        if (!prep) {
          console.error('Practice not found:', { prepId });
          setError('לא נמצא מידע על התרגול המבוקש');
          return;
        }

        console.log('Practice loaded:', { 
          prepId, 
          status: prep.state.status,
          exam: prep.exam 
        });

        // Only restore from localStorage if this is NOT a new prep
        const isNewPrep = prep.state.status === 'active' && 
                         prep.state.startedAt && 
                         Date.now() - prep.state.startedAt < 5000;
        
        if (isNewPrep) {
          localStorage.removeItem('current_question');
          setCurrentQuestion(null);
        }

        setIsLoading(false);
        requestInProgress.current = false;

      } catch (error) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'אירעה שגיאה בטעינת התרגול';
          console.error('Practice initialization error:', error);
          setError(errorMessage);
          setIsLoadingQuestion(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          requestInProgress.current = false;
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [prepId, getPrep]);

  // Effect to handle question loading states
  useEffect(() => {
    if (currentQuestion) {
      setIsLoadingQuestion(false);
    }
  }, [currentQuestion]);

  const handleAnswer = async (answer: string) => {
    if (requestInProgress.current || !currentQuestion || !activePrep) return;
    requestInProgress.current = true;
    setIsLoadingQuestion(true);

    try {
      console.log('Submitting answer:', {
        prepId: activePrep.id,
        questionId: currentQuestion.question.id,
        questionIndex: currentQuestion.state.questionIndex,
        answerLength: answer.length
      });

      // For multiple choice, check if the selected option is correct
      let isCorrect = false;
      if (currentQuestion.question.type === 'multiple_choice' && currentQuestion.question.correctOption) {
        isCorrect = answer === currentQuestion.question.correctOption.toString();
      }

      // Update correct answers count and average score
      const newCorrectAnswers = isCorrect ? (currentQuestion.state.correctAnswers || 0) + 1 : (currentQuestion.state.correctAnswers || 0);
      const currentIndex = currentQuestion.state.questionIndex || 0;
      const newAverageScore = Math.round((newCorrectAnswers / (currentIndex + 1)) * 100);

      // Create updated question state
      const updatedQuestion = {
        ...currentQuestion,
        state: {
          ...currentQuestion.state,
          correctAnswers: newCorrectAnswers,
          averageScore: newAverageScore,
          status: 'submitted' as QuestionStatus,
          submittedAnswer: {
            text: answer,
            timestamp: Date.now()
          },
          lastUpdatedAt: Date.now()
        }
      };

      // Update the current question state first
      setCurrentQuestion(updatedQuestion);

      // Then submit the answer
      await submitAnswer(answer, isCorrect);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error submitting answer';
      console.error('Error submitting answer:', {
        error,
        prepId: activePrep.id,
        questionId: currentQuestion.question.id,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(errorMessage);
    } finally {
      if (isComponentMounted.current) {
        requestInProgress.current = false;
        setIsLoadingQuestion(false);
      }
    }
  };

  const handleHelp = async () => {
    if (!currentQuestion || !activePrep) return;

    try {
      console.log('Requesting help:', {
        prepId: activePrep.id,
        questionId: currentQuestion.question.id,
        questionIndex: currentQuestion.state.questionIndex,
        previousHelpRequests: currentQuestion.state.helpRequests.length
      });

      // Just update the state with the help request
      const updatedState = {
        ...currentQuestion.state,
        helpRequests: [
          ...(currentQuestion.state.helpRequests || []),
          {
            type: 'hint' as const,
            timestamp: Date.now()
          }
        ]
      };

      setCurrentQuestion({
        ...currentQuestion,
        state: updatedState
      });

      console.log('Help request recorded:', {
        prepId: activePrep.id,
        questionId: currentQuestion.question.id,
        totalHelpRequests: updatedState.helpRequests.length
      });
    } catch (error) {
      console.error('Error requesting help:', {
        error,
        prepId: activePrep.id,
        questionId: currentQuestion.question.id,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  const handleSkip = async (reason: SkipReason) => {
    if (!currentQuestion || !activePrep) {
      return;
    }

    try {
      requestInProgress.current = true;
      setIsLoading(true);

      // Skip question without counting it
      const updatedPrep = PrepStateManager.skipQuestion(activePrep);
      setActivePrep(updatedPrep);
      setCurrentQuestion(null);

      // Get next question
      const nextQuestionData = await getNextQuestion();
      if (!nextQuestionData) {
        throw new Error('Failed to get next question');
      }

      // Create practice question with current state values
      const nextQuestion: PracticeQuestion = {
        question: nextQuestionData,
        state: {
          status: 'active',
          startedAt: Date.now(),
          lastUpdatedAt: Date.now(),
          helpRequests: [],
          questionIndex: currentQuestion.state.questionIndex || 0,
          correctAnswers: currentQuestion.state.correctAnswers || 0,
          averageScore: currentQuestion.state.averageScore || 0
        }
      };

      // Update state
      setCurrentQuestion(nextQuestion);
      setIsLoading(false);
      requestInProgress.current = false;
    } catch (error) {
      console.error('Failed to get next question:', error);
      setError('Failed to get next question');
      setIsLoading(false);
      requestInProgress.current = false;
    }
  };

  const handleNext = async () => {
    if (!currentQuestion || !activePrep) {
      return;
    }

    try {
      requestInProgress.current = true;
      setIsLoading(true);

      // Move to next question
      const updatedPrep = PrepStateManager.moveToNextQuestion(activePrep);
      setCurrentQuestion(null);

      // Get next question
      const nextQuestionData = await getNextQuestion();
      if (!nextQuestionData) {
        throw new Error('Failed to get next question');
      }

      // Create practice question
      const nextQuestion: PracticeQuestion = {
        question: nextQuestionData,
        state: {
          status: 'active',
          startedAt: Date.now(),
          lastUpdatedAt: Date.now(),
          helpRequests: [],
          questionIndex: (currentQuestion.state.questionIndex || 0) + 1,
          correctAnswers: currentQuestion.state.correctAnswers || 0,
          averageScore: currentQuestion.state.averageScore || 0
        }
      };

      // Update state
      setCurrentQuestion(nextQuestion);
      setIsLoading(false);
      requestInProgress.current = false;
    } catch (error) {
      console.error('Failed to get next question:', error);
      setError('Failed to get next question');
      setIsLoading(false);
      requestInProgress.current = false;
    }
  };

  const handleRetry = () => {
    if (!currentQuestion || !activePrep) return;

    console.log('Retrying question:', {
      prepId: activePrep.id,
      questionId: currentQuestion.question.id,
      questionIndex: currentQuestion.state.questionIndex,
      previousHelpRequests: currentQuestion.state.helpRequests.length
    });

    // Reset the question state to active, clearing feedback and current answer
    setCurrentQuestion({
      ...currentQuestion,
      state: {
        status: 'active',
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        helpRequests: currentQuestion.state.helpRequests || [],
        questionIndex: currentQuestion.state.questionIndex,
        correctAnswers: currentQuestion.state.correctAnswers || 0,
        averageScore: currentQuestion.state.averageScore || 0,
        feedback: undefined,
        currentAnswer: undefined
      }
    });

    console.log('Question reset for retry:', {
      prepId: activePrep.id,
      questionId: currentQuestion.question.id,
      newStartTime: Date.now()
    });
  };

  const handleClearFilter = () => {
    setFilters({});
  };

  // Format metadata for QuestionMetadata
  const formattedMetadata = currentQuestion ? {
    topicId: currentQuestion.question.metadata.topicId,
    subtopicId: currentQuestion.question.metadata.subtopicId,
    type: currentQuestion.question.type,
    difficulty: currentQuestion.question.metadata.difficulty.toString(),
    source: currentQuestion.question.metadata.source ? {
      type: 'exam',
      ...currentQuestion.question.metadata.source
    } : { type: 'ezpass' }
  } : {
    topicId: '',
    type: 'multiple_choice',
    difficulty: '1',
    source: { type: 'ezpass' }
  };

  // Error display with better messaging
  if (!prepId || error) {
    return (
      <div style={{ 
        padding: '24px',
        maxWidth: '600px',
        margin: '0 auto',
        marginTop: '32px'
      }}>
        <Alert
          message="שגיאה בטעינת התרגול"
          description={error || 'לא נמצא מידע על התרגול המבוקש'}
          type="error"
          showIcon
          action={
            <Space>
              <Button 
                icon={<HomeOutlined />} 
                onClick={() => navigate('/')}
                type="default"
              >
                חזרה לדף הבית
              </Button>
              {error?.includes('המערכת עמוסה') && (
                <Button 
                  type="primary" 
                  onClick={() => window.location.reload()}
                >
                  נסה שוב
                </Button>
              )}
            </Space>
          }
        />
      </div>
    );
  }

  // Loading state
  if (!activePrep) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px'
      }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Typography.Text>טוען מידע...</Typography.Text>
        </Space>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Layout className="practice-page-layout">
      <PracticeHeader prep={activePrep} />
      
      <Layout.Content className="practice-content">
        <div className="practice-container">
          {/* Main Content Area */}
          <div className="practice-main">
            {error ? (
              <Alert
                message="שגיאה"
                description={error}
                type="error"
                showIcon
                action={
                  <Button 
                    onClick={() => navigate('/')}
                    icon={<HomeOutlined />}
                  >
                    חזור לדף הבית
                  </Button>
                }
              />
            ) : isLoading ? (
              <LoadingSpinner />
            ) : !currentQuestion ? (
              <LoadingSpinner />
            ) : (
              <QuestionInteractionContainer
                question={currentQuestion.question}
                onAnswer={handleAnswer}
                onSkip={handleSkip}
                onHelp={handleHelp}
                onNext={handleNext}
                onRetry={handleRetry}
                state={{
                  status: currentQuestion.state.status || 'loading',
                  feedback: currentQuestion.state.feedback,
                  questionIndex: ('completedQuestions' in activePrep.state) ? activePrep.state.completedQuestions : 0,
                  correctAnswers: ('correctAnswers' in activePrep.state) ? activePrep.state.correctAnswers : 0,
                  averageScore: ('averageScore' in activePrep.state) ? activePrep.state.averageScore : 0
                }}
                filters={filters}
                onFiltersChange={handleFilterChange}
                activePrep={activePrep}
              />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="practice-sidebar practice-sidebar-right">
            {currentQuestion && (
              <EnhancedSidebar
                question={currentQuestion.question}
                filters={filters}
                onFiltersChange={handleFilterChange}
              />
            )}
          </div>
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default PracticePage; 