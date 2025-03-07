import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ExamTemplate } from '../types/examTemplate';
import type { StudentPrep } from '../types/prepState';
import type { QuestionPracticeState, SkipReason } from '../types/prepUI';
import type { Question, QuestionType, DatabaseQuestion } from '../types/question';
import { DetailedEvalLevel, getEvalLevelFromScore } from '../types/feedback/levels';
import { PrepStateManager } from '../services/PrepStateManager';
import { questionStorage } from '../services/admin/questionStorage';
import { logger } from '../utils/logger';
import { QuestionSequencer } from '../services/QuestionSequencer';
import { FeedbackService } from '../services/feedback/FeedbackService';
import { OpenAIService } from '../services/llm/openAIService';
import type { QuestionFeedback } from '../types/feedback/types';
import type { ExamContext } from '../services/feedback/types';
import type { QuestionSubmission } from '../types/submissionTypes';
import type { FullAnswer } from '../types/question';

interface StudentPrepContextType {
  prep: StudentPrep | null;
  currentQuestion: DatabaseQuestion | null;
  questionState: QuestionPracticeState;
  setQuestionState: React.Dispatch<React.SetStateAction<QuestionPracticeState>>;
  isQuestionLoading: boolean;
  submitAnswer: (answer: FullAnswer) => Promise<void>;
  skipQuestion: (reason: SkipReason) => Promise<void>;
  startPrep: (exam: ExamTemplate) => Promise<string>;
  getNext: () => Promise<void>;
  getPreviousQuestion: () => Promise<void>;
  getPrep: (prepId: string) => Promise<StudentPrep | null>;
  setFocusedType: (type: QuestionType | null) => void;
  setFocusedSubTopic: (subtopicId: string | null) => void;
  startPractice: () => Promise<void>;
}

const StudentPrepContext = createContext<StudentPrepContextType | undefined>(undefined);

export const StudentPrepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prep, setPrep] = useState<StudentPrep | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<DatabaseQuestion | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const prepStateManager = useRef<PrepStateManager | null>(null);
  const questionSequencer = useRef<QuestionSequencer | null>(null);
  
  const [questionState, setQuestionState] = useState<QuestionPracticeState>({
    status: 'moved_on',
    currentAnswer: null,
    practiceStartedAt: Date.now(),
    submissions: [],
    helpRequests: []
  });

  const handleGetNext = useCallback(async () => {
    if (!prep?.id || !prepStateManager.current || !questionSequencer.current) {
      console.log('Cannot get next question - missing required data', {
        hasPrep: !!prep,
        hasPrepId: !!prep?.id,
        hasPrepStateManager: !!prepStateManager.current,
        hasQuestionSequencer: !!questionSequencer.current
      });
      return;
    }

    try {
      setIsQuestionLoading(true);
      console.log('=== Starting handleGetNext ===', {
        prepId: prep.id,
        currentQuestionId: currentQuestion?.id,
        questionState: questionState.status
      });

      const questionId = await questionSequencer.current.next();
      console.log('Sequencer returned question ID', {
        questionId,
        prepId: prep.id,
        currentQuestionId: currentQuestion?.id
      });

      if (!questionId) {
        console.warn('No question ID returned from sequencer', {
          prepId: prep.id,
          currentQuestionId: currentQuestion?.id
        });
        return;
      }

      console.log('Fetching question from storage', { 
        questionId,
        storageInstance: questionStorage.constructor.name
      });
      const question = await questionStorage.getQuestion(questionId);
      console.log('Storage returned question', { 
        questionId,
        hasQuestion: !!question,
        questionType: question?.metadata?.type,
        subtopicId: question?.metadata?.subtopicId
      });

      if (!question) {
        console.error('Question not found in storage', { questionId });
        return;
      }

      console.log('Setting new current question', { 
        questionId,
        type: question.metadata.type,
        subtopicId: question.metadata.subtopicId,
        previousQuestionId: currentQuestion?.id
      });
      setCurrentQuestion(question);
      setQuestionState({
        status: 'idle',
        currentAnswer: null,
        practiceStartedAt: Date.now(),
        submissions: [],
        helpRequests: []
      });

      console.log('Notifying SetTracker of new question', {
        prepId: prep.id,
        questionId,
        previousQuestionId: currentQuestion?.id
      });
      // Notify SetTracker of new question
      PrepStateManager.getSetTracker().handleNewQuestion(prep.id);

    } catch (error) {
      console.error('Error getting next question:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        prepId: prep?.id,
        currentQuestionId: currentQuestion?.id,
        questionState: questionState.status
      });
    } finally {
      setIsQuestionLoading(false);
    }
  }, [prep, currentQuestion?.id, questionState.status, questionStorage]);

  const handleSubmitAnswer = useCallback(async (answer: FullAnswer) => {
    if (!currentQuestion || !prep || !prepStateManager.current) {
      console.error('Cannot submit answer - missing required data', {
        hasCurrentQuestion: !!currentQuestion,
        hasPrep: !!prep,
        hasPrepStateManager: !!prepStateManager.current,
        currentQuestionId: currentQuestion?.id,
        prepId: prep?.id
      });
      return;
    }

    try {
      const startTime = questionState.practiceStartedAt;
      const submissionTime = Date.now();
      
      // Update UI state to submitted with the FullAnswer directly
      setQuestionState(prev => ({
        ...prev,
        status: 'submitted',
        currentAnswer: answer
      }));

      // Create feedback service
      const feedbackService = new FeedbackService(new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY || ''));
      
      const examContext: ExamContext = {
        examType: prep.exam.examType,
        examName: prep.exam.names.full,
        subject: prep.exam.subjectId,
        prepId: prep.id
      };

      try {
        const feedback = await feedbackService.generateFeedback(
          currentQuestion, 
          answer, // Extract text for feedback service
          false,
          examContext
        );

        // Create submission object using the provided FullAnswer
        const submission = {
          questionId: currentQuestion.id,
          answer: answer, // Use the FullAnswer directly
          metadata: {
            ...currentQuestion.metadata,
            submittedAt: submissionTime,
            timeSpentMs: submissionTime - startTime,
            helpRequested: questionState.helpRequests.length > 0
          },
          feedback: {
            data: feedback,
            receivedAt: Date.now()
          }
        } satisfies QuestionSubmission;

        // Update PrepStateManager
        PrepStateManager.feedbackArrived(prep, currentQuestion, submission);

        // Update question state
        setQuestionState(prev => ({
          ...prev,
          status: 'receivedFeedback',
          lastSubmittedAt: submissionTime,
          submissions: [...prev.submissions, submission]
        }));

        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Error getting feedback:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          questionId: currentQuestion.id,
          prepId: prep.id
        });

        // Update state to show error
        setQuestionState(prev => ({
          ...prev,
          status: 'receivedFeedback',
          error: error instanceof Error ? error.message : 'Unknown error in submission'
        }));

        // Wait before getting next question
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      console.log('=== Completed handleSubmitAnswer ===', {
        questionId: currentQuestion.id,
        prepId: prep.id,
        questionState: questionState.status
      });
    } catch (error) {
      console.error('Error in answer submission:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        questionId: currentQuestion?.id,
        prepId: prep?.id,
        questionState: questionState.status
      });
      setQuestionState(prev => ({
        ...prev,
        status: 'receivedFeedback',
        error: error instanceof Error ? error.message : 'Unknown error in submission'
      }));
    }
  }, [currentQuestion, prep, questionState.helpRequests, questionState.practiceStartedAt, questionState.status]);

  const handleSkipQuestion = useCallback(async (reason: SkipReason) => {
    if (!prep?.id) return;
    
    try {
      // Let external logic handle what happens on skip
      await handleGetNext();
    } catch (error) {
      console.error('Error skipping question:', error);
    }
  }, [handleGetNext, prep?.id]);

  const handleStartPrep = useCallback(async (exam: ExamTemplate): Promise<string> => {
    console.log('Starting new prep session', { examId: exam.id });
    
    try {
      // Create prep state
      const newPrep = await PrepStateManager.createPrep(exam);
      console.log('Created new prep', { prepId: newPrep.id });
      
      // Initialize managers
      prepStateManager.current = PrepStateManager.getInstance({ topics: exam.topics });
      questionSequencer.current = QuestionSequencer.getInstance();
      console.log('Initializing QuestionSequencer', {
        subject: exam.subjectId,
        domain: exam.domainId,
        prepId: newPrep.id
      });
      await questionSequencer.current.initialize(
        { subject: exam.subjectId, domain: exam.domainId },
        newPrep.id
      );
      
      // Clear SetTracker for new prep
      PrepStateManager.getSetTracker().clearSet(newPrep.id);
      
      console.log('Initialized managers');

      // Set prep state
      setPrep(newPrep);
      
      return newPrep.id;
    } catch (error) {
      console.error('Failed to start prep:', error);
      throw error;
    }
  }, []);

  const handleGetPrep = useCallback(async (prepId: string): Promise<StudentPrep | null> => {
    if (!prep || prep.id !== prepId) {
      return null;
    }
    return prep;
  }, [prep]);

  const handleSetFocusedType = useCallback((type: QuestionType | null) => {
    if (!prep) return;
    
    setPrep(prev => {
      if (!prev) return null;
      return {
        ...prev,
        focusedType: type
      };
    });
  }, [prep]);

  const handleSetFocusedSubTopic = useCallback((subtopicId: string | null) => {
    if (!prep) return;
    
    setPrep(prev => {
      if (!prev) return null;
      return {
        ...prev,
        focusedSubTopic: subtopicId
      };
    });
  }, [prep]);

  const startPractice = useCallback(async () => {
    if (!prep?.id || !prepStateManager.current || !questionSequencer.current) {
      console.error('Cannot start practice - missing required data', {
        hasPrep: !!prep,
        hasPrepId: !!prep?.id,
        hasPrepStateManager: !!prepStateManager.current,
        hasQuestionSequencer: !!questionSequencer.current
      });
      return;
    }

    try {
      setIsQuestionLoading(true);
      await handleGetNext();
    } catch (error) {
      console.error('Error starting practice:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        prepId: prep.id
      });
    } finally {
      setIsQuestionLoading(false);
    }
  }, [prep, handleGetNext]);

  const contextValue: StudentPrepContextType = {
    prep,
    currentQuestion,
    questionState,
    setQuestionState,
    isQuestionLoading,
    submitAnswer: handleSubmitAnswer,
    skipQuestion: handleSkipQuestion,
    startPrep: handleStartPrep,
    getNext: handleGetNext,
    getPreviousQuestion: () => Promise.resolve(),
    getPrep: handleGetPrep,
    setFocusedType: handleSetFocusedType,
    setFocusedSubTopic: handleSetFocusedSubTopic,
    startPractice
  };

  return (
    <StudentPrepContext.Provider value={contextValue}>
      {children}
    </StudentPrepContext.Provider>
  );
};

export const useStudentPrep = () => {
  const context = useContext(StudentPrepContext);
  if (context === undefined) {
    throw new Error('useStudentPrep must be used within a StudentPrepProvider');
  }
  return context;
};