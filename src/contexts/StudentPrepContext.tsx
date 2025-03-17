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
import { useLocation } from 'react-router-dom';

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
  setPrep: React.Dispatch<React.SetStateAction<StudentPrep | null>>;
}

const StudentPrepContext = createContext<StudentPrepContextType | undefined>(undefined);

export const StudentPrepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prep, setPrep] = useState<StudentPrep | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<DatabaseQuestion | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const prepStateManager = useRef<PrepStateManager | null>(null);
  const questionSequencer = useRef<QuestionSequencer | null>(null);
  
  // Add useLocation to get URL parameters
  const location = useLocation();
  const params = new URLSearchParams(location.pathname);
  const prepIdFromUrl = params.get('prepId');

  // Initialize prep from URL or localStorage
  useEffect(() => {
    const initializePrep = async () => {
      // If we already have a prep, don't reinitialize
      if (prep) return;

      // Try to get prep ID from URL path
      const pathParts = location.pathname.split('/');
      const prepIdIndex = pathParts.indexOf('practice') + 1;
      const prepId = pathParts[prepIdIndex];

      if (prepId && !prepId.startsWith('new/')) {
        console.log('Initializing prep from URL', { prepId });
        const storedPrep = PrepStateManager.getPrep(prepId);
        if (storedPrep) {
          console.log('Found stored prep', { prepId });
          setPrep(storedPrep);
          
          // Initialize managers
          prepStateManager.current = PrepStateManager.getInstance({ topics: storedPrep.exam.topics });
          questionSequencer.current = QuestionSequencer.getInstance();
          await questionSequencer.current.initialize(
            { subject: storedPrep.exam.subjectId, domain: storedPrep.exam.domainId },
            storedPrep.id
          );
        }
      }
    };

    initializePrep();
  }, [location.pathname, prep]);

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
        questionType: question?.data?.metadata?.type,
        subtopicId: question?.data?.metadata?.subtopicId
      });

      if (!question) {
        console.error('Question not found in storage', { questionId });
        return;
      }

      console.log('Setting question state', {
        questionId,
        hasQuestion: !!question,
        questionType: question?.data?.metadata?.type,
        subtopicId: question?.data?.metadata?.subtopicId
      });

      console.log('Setting new current question', { 
        questionId,
        type: question.data.metadata.type,
        subtopicId: question.data.metadata.subtopicId,
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
          currentQuestion.data, 
          answer,
          false,
          examContext
        );

        // Create submission object using the provided FullAnswer
        const submission = {
          questionId: currentQuestion.id,
          answer: answer,
          metadata: {
            ...currentQuestion.data.metadata,
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
        PrepStateManager.feedbackArrived(prep, currentQuestion.data, submission);

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
  }, [currentQuestion, prep, prepStateManager, questionState]);

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
      // Get the current prep's selection if it exists
      const currentSelection = prep?.selection;
      console.log('Current prep selection:', currentSelection);
      
      // Create prep state with existing selection
      const newPrep = await PrepStateManager.createPrep(exam, currentSelection);
      console.log('Created new prep', { 
        prepId: newPrep.id,
        selectedTopics: newPrep.selection.subTopics.length
      });
      
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
  }, [prep]);

  const handleGetPrep = useCallback(async (prepId: string): Promise<StudentPrep | null> => {
    // Try to get prep from storage first
    const storedPrep = PrepStateManager.getPrep(prepId);
    if (storedPrep) {
      // Initialize managers if needed
      if (!prepStateManager.current) {
        prepStateManager.current = PrepStateManager.getInstance({ topics: storedPrep.exam.topics });
      }
      if (!questionSequencer.current) {
        questionSequencer.current = QuestionSequencer.getInstance();
        await questionSequencer.current.initialize(
          { subject: storedPrep.exam.subjectId, domain: storedPrep.exam.domainId },
          storedPrep.id
        );
      }
      
      // Update current prep state
      setPrep(storedPrep);
      return storedPrep;
    }
    
    return null;
  }, []);

  const handleSetFocusedType = useCallback((type: QuestionType | null) => {
    if (!prep) return;
    
    setPrep(prev => {
      if (!prev) return null;
      const updatedPrep = {
        ...prev,
        focusedType: type
      };
      // Persist to storage like we do with subtopics
      PrepStateManager.updatePrep(updatedPrep);
      return updatedPrep;
    });
  }, [prep]);

  const handleSetFocusedSubTopic = useCallback((subtopicId: string | null) => {
    if (!prep) return;
    
    setPrep(prev => {
      if (!prev) return null;
      const updatedPrep = {
        ...prev,
        focusedSubTopic: subtopicId
      };
      // Persist to storage
      PrepStateManager.updatePrep(updatedPrep);
      return updatedPrep;
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
    startPractice,
    setPrep
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