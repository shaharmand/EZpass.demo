import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { usePrepState } from '../hooks/usePrepState';
import { Alert, Space, Button, Spin, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { PracticeHeader } from '../components/PracticeHeader';
import PracticeContainer from '../components/practice/PracticeContainer';
import type { PracticeQuestion, SkipReason } from '../types/prepUI';
import type { QuestionState } from '../types/prepState';
import type { HelpRequest } from '../types/prepUI';
import type { PracticeQuestion as PracticeQuestionUI } from '../types/prepUI';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

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
    getNextQuestion
  } = useStudentPrep();
  const [isLoading, setIsLoading] = useState(true);

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
        }
        return;
      }

      try {
        console.log('Initializing practice:', { prepId });
        if (mounted) setIsLoading(true);
        
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
                         Date.now() - prep.state.startedAt < 5000; // Prep created in last 5 seconds
        
        if (isNewPrep) {
          // Clear any stored question for new preps
          localStorage.removeItem('current_question');
          setCurrentQuestion(null);
        }

        setIsLoading(false);
        requestInProgress.current = false;

      } catch (error) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'אירעה שגיאה בטעינת התרגול';
          console.error('Practice initialization error:', {
            error,
            message: errorMessage,
            prepId,
            stack: error instanceof Error ? error.stack : undefined
          });
          setError(errorMessage);
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
  }, [prepId, getPrep, currentQuestion]);

  const handleAnswer = async (answer: string) => {
    if (requestInProgress.current || !currentQuestion || !activePrep) return;
    requestInProgress.current = true;

    try {
      console.log('Submitting answer:', {
        prepId: activePrep.id,
        questionId: currentQuestion.question.id,
        questionIndex: currentQuestion.state.questionIndex,
        answerLength: answer.length
      });

      await submitAnswer(answer, true);
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
    if (requestInProgress.current || !currentQuestion || !activePrep) return;
    requestInProgress.current = true;

    try {
      // Clear current question to show loading
      setCurrentQuestion(null);

      // Get next question
      const nextQuestion = await getNextQuestion();
      if (isComponentMounted.current && nextQuestion) {
        const practiceQuestion: PracticeQuestionUI = {
          question: nextQuestion,
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
        setCurrentQuestion(practiceQuestion);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error skipping question';
      console.error('Error skipping question:', {
        error,
        prepId: activePrep.id,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(errorMessage);
    } finally {
      if (isComponentMounted.current) {
        requestInProgress.current = false;
      }
    }
  };

  const handleNext = async () => {
    if (requestInProgress.current || !currentQuestion || !activePrep) return;
    requestInProgress.current = true;

    try {
      // Clear current question to show loading
      setCurrentQuestion(null);

      // Get next question
      const nextQuestion = await getNextQuestion();
      if (isComponentMounted.current && nextQuestion) {
        const practiceQuestion: PracticeQuestionUI = {
          question: nextQuestion,
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
        setCurrentQuestion(practiceQuestion);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error loading next question';
      console.error('Error loading next question:', {
        error,
        prepId: activePrep.id,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(errorMessage);
    } finally {
      if (isComponentMounted.current) {
        requestInProgress.current = false;
      }
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
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      {activePrep && <PracticeHeader prep={activePrep} />}

      {/* Main Content */}
      {!currentQuestion || currentQuestion.state.status === 'loading' ? (
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Typography.Text>טוען שאלה...</Typography.Text>
          </Space>
        </div>
      ) : error ? (
        <div style={{ padding: '24px' }}>
          <Alert
            message="שגיאה"
            description={error}
            type="error"
            showIcon
            action={
              <Space>
                <Button onClick={() => setError(null)}>נסה שוב</Button>
              </Space>
            }
          />
        </div>
      ) : (
        <PracticeContainer
          question={currentQuestion.question}
          onAnswer={handleAnswer}
          onHelp={handleHelp}
          onSkip={handleSkip}
          onNext={handleNext}
          onRetry={handleRetry}
          state={{
            status: currentQuestion.state.status,
            feedback: currentQuestion.state.feedback,
            questionIndex: currentQuestion.state.questionIndex || 0,
            correctAnswers: 0,
            averageScore: 0
          }}
        />
      )}
    </div>
  );
};

export default PracticePage; 