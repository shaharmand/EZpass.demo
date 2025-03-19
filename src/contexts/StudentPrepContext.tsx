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
import { getUserActivePreparation } from '../services/preparationService';
import { saveSubmission } from '../services/submission/submissionService';
import { supabase } from '../lib/supabase';

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
  isLoadingPrep: boolean;
}

const StudentPrepContext = createContext<StudentPrepContextType | undefined>(undefined);

export const StudentPrepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prep, setPrep] = useState<StudentPrep | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<DatabaseQuestion | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isLoadingPrep, setIsLoadingPrep] = useState(false);
  const prepStateManager = useRef<PrepStateManager | null>(null);
  const questionSequencer = useRef<QuestionSequencer | null>(null);
  
  // Add useLocation to get URL parameters
  const location = useLocation();

  // Handle restoring active prep from database
  useEffect(() => {
    console.log('Current path check:', {
      path: location.pathname,
      isHomePath: location.pathname === '/' || location.pathname === '' || location.pathname === '/home',
      isPracticePath: location.pathname === '/practice',
      hasPrep: !!prep,
      prepId: prep?.id
    });

    // Extract prep ID from the current path
    const pathParts = location.pathname.split('/');
    const practiceIndex = pathParts.indexOf('practice');
    const pathPrepId = practiceIndex >= 0 && pathParts.length > practiceIndex + 1 
      ? pathParts[practiceIndex + 1] 
      : null;
      
    // If we're on a practice page with a different prep ID than the current one,
    // reset the prep state
    if (pathPrepId && prep && pathPrepId !== prep.id) {
      console.log('Detected navigation to different preparation:', {
        currentPrepId: prep.id,
        newPrepId: pathPrepId,
        timestamp: new Date().toISOString()
      });
      // Clear the current prep to allow loading the new one
      setPrep(null);
      setIsLoadingPrep(false);
      return;
    }

    // DEFENSIVE: Skip the entire effect for home page or main practice page
    if (location.pathname === '/' || 
        location.pathname === '' || 
        location.pathname === '/home' ||
        location.pathname === '/practice') {
      console.log('HOME OR PRACTICE PAGE DETECTED - COMPLETELY SKIPPING PREP RESTORATION');
      return;
    }

    const restoreActivePrep = async () => {
      console.log('Restoring active prep:', {
        path: location.pathname,
        isOnPracticePage: location.pathname.includes('/practice/'),
        hasPrep: !!prep,
        isLoading: isLoadingPrep,
        timestamp: new Date().toISOString()
      });
      
      try {
        // Don't run if we already have a prep loaded or are currently loading
        if (prep || isLoadingPrep) {
          console.log('Already has prep or is loading, skipping restore...');
          return;
        }
        
        // Try to restore from URL params ONLY if we're already on a practice page
        if (location.pathname.includes('/practice/')) {
          const params = new URLSearchParams(location.search);
          const prepPath = params.get('prepId');
          
          // Get prep ID from URL path if not in search params
          const pathParts = location.pathname.split('/');
          const practiceIndex = pathParts.indexOf('practice');
          const pathPrepId = practiceIndex >= 0 && pathParts.length > practiceIndex + 1 
            ? pathParts[practiceIndex + 1] 
            : null;
            
          const effectivePrepId = prepPath || pathPrepId;
          
          if (effectivePrepId) {
            // Validate that prepId is a string, not a Promise
            if (typeof effectivePrepId !== 'string' || String(effectivePrepId).includes('[object')) {
              console.error('Invalid prep ID in URL - appears to be a Promise object:', effectivePrepId);
              return;
            }
            
            console.log('Found prep ID in URL, attempting to load:', effectivePrepId);
            
            try {
              const urlPrep = await PrepStateManager.getPrep(effectivePrepId);
              if (urlPrep) {
                console.log('Successfully loaded prep from URL ID:', effectivePrepId);
                
                // Always verify the ID matches before accepting it
                if (urlPrep.id !== effectivePrepId) {
                  console.error(`CRITICAL ERROR: Loaded prep ID (${urlPrep.id}) does not match requested ID (${effectivePrepId})`);
                  return; // Don't load this prep if IDs don't match
                }
                
                // Initialize managers
                prepStateManager.current = PrepStateManager.getInstance({ topics: urlPrep.exam.topics });
                questionSequencer.current = QuestionSequencer.getInstance();
                await questionSequencer.current.initialize(
                  { subject: urlPrep.exam.subjectId, domain: urlPrep.exam.domainId },
                  urlPrep.id
                );
                
                // Set the prep and return - don't try to load anything else
                setPrep(urlPrep);
                return;
              } else {
                console.warn('Could not find prep with ID from URL:', effectivePrepId);
                // Do NOT continue to fallback methods unless explicitly requested
                return;
              }
            } catch (error) {
              console.error('Error loading prep from URL ID:', error);
              // Do NOT continue to fallback methods
              return;
            }
          }
        }
        
        // ONLY reach here if we're NOT on a practice page with an ID
        // Or if there's a specific reason to restore without an ID
      } catch (error) {
        console.error('Overall error in restoreActivePrep:', error);
      }
    };
    
    restoreActivePrep();
  }, [location.pathname, location.search, prep, isLoadingPrep]);

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
      
      console.log('Starting answer submission process', {
        questionId: currentQuestion.id,
        answerType: typeof answer === 'string' ? 'string' : 'object'
      });
      
      // Update UI state to submitted with the FullAnswer directly
      setQuestionState(prev => ({
        ...prev,
        status: 'submitted',
        currentAnswer: answer
      }));

      console.log('Creating feedback service...');
      // Create feedback service
      const feedbackService = new FeedbackService(new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY || ''));
      
      const examContext: ExamContext = {
        examType: prep.exam.examType,
        examName: prep.exam.names.full,
        subject: prep.exam.subjectId,
        prepId: prep.id
      };

      console.log('Generating feedback...', {
        questionType: currentQuestion.data.metadata.type,
        examContext
      });

      // Get feedback for the answer
      const feedback = await feedbackService.generateFeedback(
        currentQuestion.data, 
        answer,
        false,
        examContext
      );
      
      console.log('Received feedback:', {
        hasFeedback: !!feedback,
        feedbackScore: feedback?.score,
        feedbackType: feedback?.type
      });
      
      // Update the UI with feedback
      setQuestionState(prev => {
        console.log('Updating question state with feedback', {
          previousStatus: prev.status,
          newStatus: 'receivedFeedback'
        });
        return {
          ...prev,
          status: 'receivedFeedback',
          feedback,
          submittedAnswer: {
            text: typeof answer === 'string' ? answer : JSON.stringify(answer),
            timestamp: submissionTime,
            type: currentQuestion.data.metadata.type
          },
          submissions: [...prev.submissions, {
            questionId: currentQuestion.id,
            prepId: prep.id,
            answer: answer,
            feedback: {
              data: feedback,
              receivedAt: Date.now()
            },
            metadata: {
              submittedAt: submissionTime,
              timeSpentMs: submissionTime - startTime,
              helpRequested: questionState.helpRequests.length > 0
            }
          }]
        };
      });
      
      // Create submission object
      const questionSubmission: QuestionSubmission = {
        questionId: currentQuestion.id,
        prepId: prep.id,
        answer: answer,
        feedback: {
          data: feedback,
          receivedAt: Date.now()
        },
        metadata: {
          submittedAt: submissionTime,
          timeSpentMs: submissionTime - startTime,
          helpRequested: questionState.helpRequests.length > 0
        }
      };
      
      // Save submission to database and associate with prep
      const submissionId = await saveSubmission(questionSubmission, prep.id);
      console.log('Saved question submission', { 
        submissionId, 
        prepId: prep.id,
        questionId: currentQuestion.id
      });
      
      // Notify PrepStateManager about the feedback
      await PrepStateManager.feedbackArrived(prep, currentQuestion?.data as Question, questionSubmission);
      
      // Update prep state with the completed question and result
      // Update the prep instance with the new question history
      const detailedLevel = getEvalLevelFromScore(feedback?.score || 0);
      const wasCorrect = detailedLevel === DetailedEvalLevel.EXCELLENT || 
                       detailedLevel === DetailedEvalLevel.PERFECT ||
                       detailedLevel === DetailedEvalLevel.VERY_GOOD;
      
      const updatedPrep = await PrepStateManager.recordQuestionCompletion(
        prep, 
        currentQuestion?.data as Question, 
        wasCorrect,
        { question: currentQuestion?.data as Question, submission: questionSubmission }
      );
      
      setPrep(updatedPrep);
      
    } catch (error) {
      console.error('Error in submitAnswer', error);
      
      setQuestionState(prev => ({
        ...prev,
        status: 'receivedFeedback',
        error: typeof error === 'string' 
          ? error 
          : error instanceof Error 
            ? error.message 
            : 'Unknown error occurred while submitting your answer'
      }));
    }
  }, [currentQuestion, prep, questionState.practiceStartedAt, questionState.helpRequests, setPrep]);

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
      setIsLoadingPrep(true);
      
      // Check if the user already has an active preparation for this exam
      const userData = await supabase.auth.getUser();
      const userId = userData.data.user?.id;
      
      // Initialize prepId with a default empty value to satisfy TypeScript
      let prepId = '';
      
      if (userId && exam.id) {
        console.log('Checking for existing preparations for exam:', exam.id);
        
        // Use our database function to find any existing preparation
        const { data: existingPrep, error } = await supabase
          .rpc('find_preparation_by_exam_id', { 
            p_user_id: userId, 
            p_exam_text_id: exam.id 
          });
        
        if (error) {
          console.error('Error checking for existing preparations:', error);
        } else if (existingPrep && existingPrep.length > 0) {
          const existingPrepData = existingPrep[0];  // Get the first (most recent) preparation
          console.log(`Found existing preparation ${existingPrepData.id} (${existingPrepData.status}) for exam ${exam.id}, using it`);
          prepId = existingPrepData.id;
        } else {
          // No existing preparation, create a new one
          console.log('No existing preparation found, creating new one');
          prepId = await PrepStateManager.createPrep(null, exam, {});
        }
      } else {
        // User not logged in or no exam ID, create a new prep
        console.log('Creating new preparation (anonymous or no exam ID)');
        prepId = await PrepStateManager.createPrep(null, exam, {});
      }
      
      console.log('Using prep ID:', prepId);
      
      // Get the prep object
      const newPrep = await PrepStateManager.getPrep(prepId);
      if (!newPrep) {
        throw new Error('Failed to retrieve preparation');
      }

      console.log('Retrieved prep', { 
        prepId: newPrep.id,
        selectedTopics: newPrep.selection?.subTopics?.length || 0
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
      
      console.log('Initialized managers, returning prep ID:', newPrep.id);

      // Set prep state
      setPrep(newPrep);
      
      return newPrep.id;
    } catch (error) {
      console.error('Failed to start prep:', error);
      throw error;
    } finally {
      setIsLoadingPrep(false);
    }
  }, []);

  const handleGetPrep = useCallback(async (prepId: string) => {
    try {
      setIsLoadingPrep(true);
      console.log('StudentPrepContext - getPrep - Starting to load preparation:', {
        requestedId: prepId,
        timestamp: new Date().toISOString()
      });
      
      // Resolve prepId if it's a Promise  
      if (prepId && typeof prepId === 'object' && String(prepId).includes('[object Promise]')) {
        try {
          const resolvedId = await (prepId as Promise<string>);
          console.log('Resolved prepId from Promise:', { original: prepId, resolved: resolvedId });
          if (typeof resolvedId === 'string') {
            prepId = resolvedId;
          } else {
            throw new Error(`Could not resolve prep ID from Promise: ${prepId}`);
          }
        } catch (error) {
          console.error('Error resolving prep ID from Promise:', error);
          throw error;
        }
      }
      
      // Verify the prepId is valid
      if (!prepId || typeof prepId !== 'string') {
        console.error('Invalid prep ID provided to getPrep:', prepId);
        throw new Error('Invalid preparation ID format');
      }

      // Get prep from manager
      const retrievedPrep = await PrepStateManager.getPrep(prepId);
      
      if (!retrievedPrep) {
        console.error('Preparation not found in getPrep:', prepId);
        throw new Error(`Preparation not found: ${prepId}`);
      }
      
      // Double-check that the loaded preparation matches the requested ID
      console.log('PREPARATION VERIFICATION:', {
        requestedId: prepId,
        loadedId: retrievedPrep.id,
        isMatch: retrievedPrep.id === prepId,
        examId: retrievedPrep.exam?.id,
        examName: retrievedPrep.exam?.names?.medium || retrievedPrep.exam?.names?.full || 'Unknown',
        timestamp: new Date().toISOString()
      });
      
      if (retrievedPrep.id !== prepId) {
        console.error(`Critical Error: Loaded preparation ID (${retrievedPrep.id}) does not match requested ID (${prepId})`);
        throw new Error('Preparation ID mismatch');
      }

      // Initialize managers
      prepStateManager.current = PrepStateManager.getInstance({ topics: retrievedPrep.exam.topics });
      questionSequencer.current = QuestionSequencer.getInstance();
      await questionSequencer.current.initialize(
        { subject: retrievedPrep.exam.subjectId, domain: retrievedPrep.exam.domainId },
        retrievedPrep.id
      );

      setPrep(retrievedPrep);
      return retrievedPrep;
    } catch (error) {
      console.error('Error in getPrep:', error);
      throw error;
    } finally {
      setIsLoadingPrep(false);
    }
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
    setPrep,
    isLoadingPrep
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