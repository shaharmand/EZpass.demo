import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Space, Button, Layout, Typography } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { PracticeHeader } from '../components/PracticeHeader';
import QuestionInteractionContainer from '../components/practice/QuestionInteractionContainer';
import { WelcomeScreen } from '../components/practice/WelcomeScreen';
import type { ActivePracticeQuestion, SkipReason, QuestionAnswer } from '../types/prepUI';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { FilterState, Question } from '../types/question';
import type { QuestionStatus } from '../types/prepState';
import type { StudentPrep } from '../types/prepState';
import { logger } from '../utils/logger';
import { usePracticeAttempts } from '../contexts/PracticeAttemptsContext';
import { useAuth } from '../contexts/AuthContext';
import './PracticePage.css';
import { memo } from 'react';
import moment from 'moment';

interface PageState {
  error?: string;
  filters: FilterState;
  prep?: StudentPrep;
  isLoading: boolean;
}

const PracticePage: React.FC = () => {
  const { prepId } = useParams<{ prepId: string }>();
  const navigate = useNavigate();
  const { getPrep, getNextQuestion, skipQuestion, setCurrentQuestion, submitAnswer, currentQuestion } = useStudentPrep();
  const { incrementAttempt, shouldShowDetailedFeedback, checkAndShowGuestLimitIfNeeded } = usePracticeAttempts();
  const { user } = useAuth();
  const [state, setState] = useState<PageState>({
    filters: {},
    isLoading: false
  });
  const hasInitialized = useRef(false);

  // Helper function to create new question state
  const createQuestionState = useCallback((question: Question, prevQuestion?: ActivePracticeQuestion): ActivePracticeQuestion => {
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

  // Shared utility for handling question transitions
  const handleQuestionTransition = useCallback(async (
    operation: 'skip' | 'next' | 'retry',
    filters?: FilterState,
    validateFn?: () => { canProceed: boolean; reason?: string }
  ) => {
    // Check loading state first
    if (state.isLoading) {
      console.log(`⚠️ Cannot ${operation}: loading in progress`);
      return;
    }

    // Run operation-specific validation if provided
    if (validateFn) {
      const { canProceed, reason } = validateFn();
      if (!canProceed) {
        console.log(`⚠️ Cannot ${operation}: ${reason}`);
        return;
      }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      setCurrentQuestion(null); // Clear current question to show loading state
      
      const nextQuestion = await getNextQuestion(filters);
      
      if (nextQuestion) {
        console.log(`✅ ${operation} successful:`, nextQuestion.id);
        setCurrentQuestion(createQuestionState(nextQuestion, currentQuestion || undefined));
      }
    } catch (err) {
      console.error(`Failed to ${operation}:`, err);
      setState(prev => ({ 
        ...prev,
        error: err instanceof Error ? err.message : `Failed to ${operation}`
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, getNextQuestion, setCurrentQuestion, createQuestionState, currentQuestion]);

  // Operation-specific handlers
  const handleSkip = useCallback(async (reason: SkipReason, skipFilters?: FilterState) => {
    console.log('FORCE LOG - PracticePage handleSkip:', {
      reason,
      currentFilters: state.filters,
      skipFilters,
      questionId: currentQuestion?.question.id,
      timestamp: new Date().toISOString()
    });

    if (state.isLoading) {
      console.log('⚠️ Cannot skip: loading in progress');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      setCurrentQuestion(null);
      
      console.log('FORCE LOG - PracticePage calling skipQuestion:', {
        reason,
        filters: skipFilters || state.filters,
        timestamp: new Date().toISOString()
      });
      
      const nextQuestion = await skipQuestion(reason, skipFilters || state.filters);
      
      if (nextQuestion) {
        console.log('FORCE LOG - PracticePage skip successful:', {
          nextQuestionId: nextQuestion.id,
          timestamp: new Date().toISOString()
        });
        setCurrentQuestion(createQuestionState(nextQuestion, currentQuestion || undefined));
      }
    } catch (err) {
      console.error('FORCE LOG - PracticePage skip failed:', err);
      setState(prev => ({ 
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to skip'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.filters, skipQuestion, setCurrentQuestion, createQuestionState, currentQuestion]);

  const handleNext = useCallback(async (filters?: FilterState) => {
    console.log('👤 USER ACTION - Next Question:', {
      providedFilters: filters,
      currentFilters: state.filters,
      currentQuestionId: currentQuestion?.question.id,
      hasAnswered: Boolean(currentQuestion?.practiceState.currentAnswer),
      timestamp: new Date().toISOString()
    });

    // Check guest limits before proceeding
    if (!checkAndShowGuestLimitIfNeeded()) {
      return; // Stop if guest has reached their limit
    }

    // Use provided filters or fall back to current state filters
    const filtersToUse = filters || state.filters;

    await handleQuestionTransition('next', filtersToUse, () => ({
      canProceed: Boolean(currentQuestion?.practiceState.currentAnswer),
      reason: !currentQuestion ? 'no current question' : 
              !currentQuestion.practiceState.currentAnswer ? 'question not completed' : undefined
    }));
  }, [currentQuestion, handleQuestionTransition, checkAndShowGuestLimitIfNeeded, state.filters]);

  const handleSubmit = useCallback(async (answer: QuestionAnswer) => {
    if (!currentQuestion || !prepId || !state.prep) return;

    try {
      // Log answer submission
      logger.info('Submitting answer', {
        questionId: currentQuestion.question.id,
        answerType: answer.type,
        currentStatus: currentQuestion.practiceState.status,
        timestamp: new Date().toISOString()
      });

      if (!currentQuestion || currentQuestion.practiceState.status !== 'idle' || !prepId) {
        console.log('⚠️ Cannot submit answer:', {
          reason: !currentQuestion ? 'no question active' : 
                 !prepId ? 'no prep id' : 
                 'question not in active state'
        });
        return;
      }

      // Convert QuestionAnswer to string format expected by backend
      const answerString = answer.type === 'multiple_choice' 
        ? answer.selectedOption.toString()
        : answer.type === 'code'
        ? answer.codeText
        : answer.markdownText;

      await submitAnswer(answerString, state.prep);

    } catch (error) {
      console.error('Error submitting answer:', error);
      // Handle error appropriately
    }
  }, [currentQuestion, prepId, submitAnswer, state.prep]);

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
      const nextQuestion = await getNextQuestion();
      if (nextQuestion) {
        setCurrentQuestion(createQuestionState(nextQuestion));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start practice'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.prep, getNextQuestion, setCurrentQuestion, createQuestionState]);

  // First effect: Handle prep loading
  useEffect(() => {
    const loadPrep = async () => {
      if (!prepId) return;

      console.log('FORCE LOG - Loading prep:', {
        prepId,
        hasInitialized: hasInitialized.current,
        timestamp: new Date().toISOString()
      });

      try {
        const prep = await getPrep(prepId);
        if (!prep) {
          console.error('Practice session not found');
          return;
        }

        setState(prev => ({ ...prev, prep }));
      } catch (error) {
        console.error('Failed to load practice session:', error);
        setState(prev => ({ 
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load practice session'
        }));
      }
    };

    loadPrep();
  }, [prepId, getPrep]);

  // Second effect: Handle question initialization after prep is loaded
  useEffect(() => {
    const initializeQuestion = async () => {
      // Only initialize if we have a prep and haven't initialized yet
      if (!state.prep || hasInitialized.current || state.isLoading) {
        return;
      }

      // Don't automatically load a question - wait for user to start
      hasInitialized.current = true;
    };

    initializeQuestion();
  }, [state.prep, state.isLoading]);

  return (
    <Layout className="practice-page">
      <PracticeHeader prepId={prepId || ''} />
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
              <QuestionInteractionContainer
                question={currentQuestion.question}
                onSubmit={handleSubmit}
                onSkip={handleSkip}
                onNext={handleNext}
                onPrevious={() => {}}
                filters={state.filters}
                onFiltersChange={(filters) => setState(prev => ({ ...prev, filters }))}
                prep={state.prep}
                isQuestionLoading={state.isLoading}
                showDetailedFeedback={shouldShowDetailedFeedback}
                state={currentQuestion.practiceState}
              />
            </div>
          </div>
        )}
      </Layout.Content>
    </Layout>
  );
};

export default memo(PracticePage); 