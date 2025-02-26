import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Space, Button, Layout, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { PracticeHeader } from '../components/PracticeHeader';
import QuestionInteractionContainer from '../components/practice/QuestionInteractionContainer';
import { WelcomeScreen } from '../components/practice/WelcomeScreen';
import type { PracticeQuestion, SkipReason } from '../types/prepUI';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { FilterState, Question } from '../types/question';
import type { QuestionStatus } from '../types/prepState';
import type { StudentPrep } from '../types/prepState';
import { logger, CRITICAL_SECTIONS } from '../utils/logger';
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
  const [state, setState] = useState<PageState>({
    filters: {},
    isLoading: false
  });
  const hasInitialized = useRef(false);

  // Helper function to create new question state
  const createQuestionState = useCallback((question: Question, prevQuestion?: PracticeQuestion): PracticeQuestion => {
    return {
      question,
      state: {
        status: 'active' as QuestionStatus,
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        helpRequests: [],
        correctAnswers: prevQuestion?.state.correctAnswers || 0,
        averageScore: prevQuestion?.state.averageScore || 0,
        questionIndex: (prevQuestion?.state.questionIndex || 0) + 1
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
      setCurrentQuestion(null); // Clear current question to show loading state
      
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
      filters,
      currentQuestionId: currentQuestion?.question.id,
      hasAnswered: Boolean(currentQuestion?.state.feedback),
      timestamp: new Date().toISOString()
    });
    await handleQuestionTransition('next', filters, () => ({
      canProceed: Boolean(currentQuestion?.state.feedback),
      reason: !currentQuestion ? 'no current question' : 
              !currentQuestion.state.feedback ? 'question not completed' : undefined
    }));
  }, [currentQuestion, handleQuestionTransition]);

  const handleRetry = useCallback(async () => {
    console.log('👤 USER ACTION - Retry Question:', {
      questionId: currentQuestion?.question.id,
      currentStatus: currentQuestion?.state.status,
      hasFeedback: Boolean(currentQuestion?.state.feedback),
      timestamp: new Date().toISOString()
    });

    if (!currentQuestion) {
      console.log('⚠️ Cannot retry: no current question');
      return;
    }

    // Instead of getting a new question, reset the current one
    setCurrentQuestion({
      question: currentQuestion.question,
      state: {
        status: 'active',
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        questionIndex: currentQuestion.state.questionIndex,
        correctAnswers: currentQuestion.state.correctAnswers,
        averageScore: currentQuestion.state.averageScore,
        helpRequests: []
      }
    });
  }, [currentQuestion, setCurrentQuestion]);

  const handleAnswerSubmit = useCallback(async (answer: string) => {
    console.log('👤 USER ACTION - Submit Answer:', {
      questionId: currentQuestion?.question.id,
      answerLength: answer.length,
      currentStatus: currentQuestion?.state.status,
      timestamp: new Date().toISOString()
    });

    if (!currentQuestion || currentQuestion.state.status !== 'active' || !prepId) {
      console.log('⚠️ Cannot submit answer:', {
        reason: !currentQuestion ? 'no question active' : 
                !prepId ? 'no prep id' :
                'question not in active state'
      });
      return;
    }

    try {
      console.log('📝 Submitting answer...');
      const prep = await getPrep(prepId);
      if (!prep) {
        throw new Error('Practice session not found');
      }
      await submitAnswer(answer, prep);
      console.log('✅ Answer submitted successfully');
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setState(prev => ({ 
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to submit answer'
      }));
    }
  }, [currentQuestion, prepId, getPrep, submitAnswer]);

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

  // Logger configuration effect remains the same
  useEffect(() => {
    logger.configure({
      filters: {
        minLevel: 'debug',
        showOnly: [],
        ignorePatterns: []
      },
      isDevelopment: true
    });
    
    logger.enableDebugging([
      CRITICAL_SECTIONS.EXAM_STATE,
      CRITICAL_SECTIONS.QUESTION_GENERATION,
      CRITICAL_SECTIONS.RACE_CONDITIONS,
      CRITICAL_SECTIONS.QUESTION_TYPE_SELECTION
    ]);

    return () => {
      logger.disableDebugging([
        CRITICAL_SECTIONS.EXAM_STATE,
        CRITICAL_SECTIONS.QUESTION_GENERATION,
        CRITICAL_SECTIONS.RACE_CONDITIONS,
        CRITICAL_SECTIONS.QUESTION_TYPE_SELECTION
      ]);
    };
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <PracticeHeader prepId={prepId || ''} />
      <Layout.Content style={{ padding: '24px' }}>
        {state.error ? (
          <Alert
            message="Error"
            description={state.error}
            type="error"
            showIcon
          />
        ) : !state.prep ? (
          <LoadingSpinner text="טוען..." />
        ) : !hasInitialized.current || (!currentQuestion && !state.isLoading) ? (
          <WelcomeScreen
            prep={state.prep}
            onStart={handleStartPractice}
            onExamDateChange={handleExamDateChange}
          />
        ) : currentQuestion ? (
          <div className="practice-container">
            <div className="practice-main">
              <QuestionInteractionContainer
                question={currentQuestion.question}
                onAnswer={handleAnswerSubmit}
                onSkip={handleSkip}
                onHelp={() => {}}
                onNext={() => handleNext()}
                onRetry={handleRetry}
                state={{
                  status: currentQuestion.state.status,
                  feedback: currentQuestion.state.feedback,
                  questionIndex: currentQuestion.state.questionIndex || 0,
                  correctAnswers: currentQuestion.state.correctAnswers || 0,
                  averageScore: currentQuestion.state.averageScore || 0
                }}
                filters={state.filters}
                onFiltersChange={(filters) => setState(prev => ({ ...prev, filters }))}
                prep={state.prep}
                isQuestionLoading={state.isLoading}
              />
            </div>
          </div>
        ) : (
          <LoadingSpinner text="טוען שאלה..." />
        )}
      </Layout.Content>
    </Layout>
  );
};

export default memo(PracticePage); 