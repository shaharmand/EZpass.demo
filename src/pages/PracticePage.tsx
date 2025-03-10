import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Space, Button, Layout, Typography, Card, message, Result } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { PracticeHeader } from '../components/PracticeHeader';
import QuestionInteractionContainer from '../components/practice/QuestionInteractionContainer';
import { WelcomeScreen } from '../components/practice/WelcomeScreen';
import type { ActivePracticeQuestion, SkipReason } from '../types/prepUI';
import type { Question, FullAnswer } from '../types/question';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { QuestionStatus } from '../types/prepState';
import type { StudentPrep } from '../types/prepState';
import { logger } from '../utils/logger';
import { usePracticeAttempts } from '../contexts/PracticeAttemptsContext';
import { useAuth } from '../contexts/AuthContext';
import { GuestLimitDialog } from '../components/dialogs/GuestLimitDialog';
import { UserLimitDialog } from '../components/dialogs/UserLimitDialog';
import './PracticePage.css';
import { memo } from 'react';
import moment from 'moment';
import { examService } from '../services/examService';
import { PrepStateManager } from '../services/PrepStateManager';

interface PageState {
  error?: string;
  prep?: StudentPrep;
  isLoading: boolean;
}

const PracticePage: React.FC = () => {
  const { prepId } = useParams<{ prepId: string }>();
  const navigate = useNavigate();
  const { 
    prep,
    currentQuestion,
    submitAnswer,
    skipQuestion,
    getPreviousQuestion,
    isQuestionLoading,
    questionState,
    setQuestionState,
    getNext,
    startPrep,
    startPractice
  } = useStudentPrep();
  const { incrementAttempt, hasExceededLimit, getCurrentAttempts, getMaxAttempts } = usePracticeAttempts();
  const { user } = useAuth();
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [state, setState] = useState<PageState>({
    isLoading: false,
    prep: prep || undefined
  });
  const hasInitialized = useRef(false);

  // Handle new prep creation
  useEffect(() => {
    const initializePrep = async () => {
      if (!prepId) return;
      
      // Check if this is a new prep request
      if (prepId.startsWith('new/')) {
        const examId = prepId.split('/')[1];
        try {
          setState(prev => ({ ...prev, isLoading: true }));
          const exam = await examService.getExamById(examId);
          if (!exam) {
            throw new Error('Failed to load exam template');
          }
          const newPrepId = await startPrep(exam);
          
          // If user is guest, store the prep ID
          if (!user) {
            PrepStateManager.storeGuestPrepId(newPrepId);
          }
          
          navigate(`/practice/${newPrepId}`, { replace: true });
        } catch (error) {
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Failed to start practice'
          }));
        } finally {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializePrep();
  }, [prepId, startPrep, navigate, user]);

  // Update state.prep when prep changes
  useEffect(() => {
    setState(prev => ({ ...prev, prep: prep || undefined }));
  }, [prep]);

  // Helper function to create new question state
  const createQuestionState = useCallback((question: Question): ActivePracticeQuestion => {
    return {
      question,
      practiceState: {
        status: 'idle',
        currentAnswer: null,
        practiceStartedAt: Date.now(),
        submissions: [],
        helpRequests: []
      }
    };
  }, []);

  const handleSkip = useCallback(async (reason: SkipReason) => {
    await skipQuestion(reason);
  }, [skipQuestion]);

  const handleNext = useCallback(async () => {
    // Show dialog when moving to next question after exceeding limit
    console.log('=== handleNext called ===', {
      hasExceededLimit,
      showLimitDialog,
      isGuest: !user,
      attempts: getCurrentAttempts(),
      maxAttempts: getMaxAttempts()
    });

    if (hasExceededLimit) {
      console.log('Showing limit dialog due to exceeded limit in handleNext');
      setShowLimitDialog(true);
    }
    
    // Always proceed to next question
    await getNext();
  }, [getNext, hasExceededLimit, user, getCurrentAttempts, getMaxAttempts]);

  const handlePrevious = useCallback(() => {
    getPreviousQuestion();
  }, [getPreviousQuestion]);

  const handleSubmit = useCallback(async (answer: FullAnswer) => {
    const currentAttempts = getCurrentAttempts();
    const maxAttempts = getMaxAttempts();
    
    console.log('=== handleSubmit called ===', {
      hasExceededLimit,
      showLimitDialog,
      isGuest: !user,
      currentAttempts,
      maxAttempts
    });

    // First increment the attempt
    await incrementAttempt();
    
    // Always submit the answer
    submitAnswer(answer);
  }, [submitAnswer, incrementAttempt, getCurrentAttempts, getMaxAttempts, user]);

  const handleExamDateChange = useCallback((date: moment.Moment) => {
    if (!state.prep) return;
    
    // Update prep goals with new exam date
    const updatedPrep = {
      ...state.prep,
      goals: {
        ...state.prep.goals,
        examDate: date.valueOf()
      }
    };
    
    setState(prev => ({ ...prev, prep: updatedPrep }));
  }, [state.prep]);

  const handleStartPractice = useCallback(async () => {
    if (!state.prep) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await startPractice();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start practice'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.prep, startPractice]);

  // Add logging for dialog visibility changes
  useEffect(() => {
    console.log('=== Dialog visibility state changed ===', {
      showLimitDialog,
      hasExceededLimit,
      isGuest: !user,
      attempts: getCurrentAttempts(),
      maxAttempts: getMaxAttempts()
    });
  }, [showLimitDialog, hasExceededLimit, user, getCurrentAttempts, getMaxAttempts]);

  if (!prep) {
    return (
      <Result
        status="warning"
        title="No active preparation session"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Return Home
          </Button>
        }
      />
    );
  }

  const activePracticeQuestion = currentQuestion ? {
    question: currentQuestion,
    practiceState: questionState
  } : undefined;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <PracticeHeader 
        prepId={prepId || ''} 
        currentQuestion={activePracticeQuestion && currentQuestion ? {
          question: currentQuestion.data,
          practiceState: activePracticeQuestion.practiceState
        } : undefined}
        question={currentQuestion?.data}
        prep={state.prep}
        onPrepUpdate={(updatedPrep) => {
          setState(prev => ({ ...prev, prep: updatedPrep }));
        }}
      />
      <Layout.Content className="practice-content">
        {state.error && (
          <Alert
            message="שגיאה"
            description={state.error}
            type="error"
            showIcon
            closable
            onClose={() => setState(prev => ({ ...prev, error: undefined }))}
          />
        )}
        {!currentQuestion && !state.isLoading && !state.error && state.prep && (
          <WelcomeScreen
            onStart={handleStartPractice}
            onExamDateChange={handleExamDateChange}
            prep={state.prep}
          />
        )}
        {state.isLoading && !currentQuestion && (
          <LoadingSpinner />
        )}
        {currentQuestion && state.prep && (
          <div className="practice-container">
            <div className="practice-main">
              {currentQuestion ? (
                <QuestionInteractionContainer
                  question={currentQuestion.data}
                  onSubmit={handleSubmit}
                  onSkip={handleSkip}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  prep={state.prep}
                  isQuestionLoading={state.isLoading}
                  state={questionState}
                  setState={setQuestionState}
                />
              ) : (
                <div>Loading...</div>
              )}
            </div>
          </div>
        )}
      </Layout.Content>

      {/* Dialogs handle their own visibility state */}
      {!user && (
        <GuestLimitDialog 
          open={showLimitDialog} 
          onClose={() => {
            console.log('Dialog onClose called, setting showLimitDialog to false');
            setShowLimitDialog(false);
          }} 
        />
      )}
      {user && (
        <UserLimitDialog 
          open={showLimitDialog} 
          onClose={() => setShowLimitDialog(false)}
        />
      )}
    </Layout>
  );
};

export default memo(PracticePage); 