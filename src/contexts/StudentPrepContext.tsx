import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ExamTemplate } from '../types/examTemplate';
import type { StudentPrep, QuestionState, TopicSelection, PrepState } from '../types/prepState';
import type { ActivePracticeQuestion, SkipReason, QuestionPracticeState } from '../types/prepUI';
import { QuestionType, QuestionFeedback, BasicQuestionFeedback, isSuccessfulAnswer, PublicationStatusEnum } from '../types/question';
import type { Question, FilterState, FullAnswer } from '../types/question';
import type { Topic } from '../types/subject';
import { PrepStateManager } from '../services/PrepStateManager';
import { questionService } from '../services/llm/questionGenerationService';
import { QuestionRotationManager } from '../services/QuestionRotationManager';
import { FeedbackService } from '../services/llm/feedbackGenerationService';
import { logger } from '../utils/logger';
import { ExamType } from '../types/examTemplate';
import { examService } from '../services/examService';
import { universalTopics } from '../services/universalTopics';
import { questionStorage } from '../services/admin/questionStorage';
import { getSupabase } from '../services/supabaseClient';

interface StudentPrepContextType {
  prep: StudentPrep | null;
  currentQuestion: ActivePracticeQuestion | null;
  filters: FilterState;
  isLoading: boolean;
  error: Error | null;
  setPrep: (prep: StudentPrep | null) => void;
  setCurrentQuestion: (question: ActivePracticeQuestion | null) => void;
  setFilters: (filters: FilterState) => void;
  getPrep: (prepId: string) => Promise<StudentPrep | null>;
  topics: Topic[];
  startPrep: (exam: ExamTemplate, selection?: TopicSelection) => Promise<string>;
  pausePrep: (prepId: string) => void;
  completePrep: (prepId: string) => void;
  getNextQuestion: (filters?: FilterState) => Promise<Question>;
  skipQuestion: (reason: SkipReason, filters?: FilterState) => Promise<Question>;
  submitAnswer: (answer: string, prep: StudentPrep) => Promise<void>;
  getRotationManager: () => QuestionRotationManager | null;
  updateUserFocus: (prepId: string, filters: FilterState) => Promise<void>;
  getUserFocus: (prepId: string) => Promise<FilterState | null>;
}

const StudentPrepContext = createContext<StudentPrepContextType | null>(null);

const QUESTION_TYPES = [
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.NUMERICAL,
  QuestionType.OPEN
] as const;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;

const PREP_STORAGE_KEY = 'active_preps';
const CURRENT_QUESTION_KEY = 'current_question';

const createAnswerObject = (type: QuestionType, value: string): FullAnswer => {
  const emptyMarkdownSolution = { text: '', format: 'markdown' as const, requiredSolution: false };
  
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      const numValue = parseInt(value, 10);
      if (numValue >= 1 && numValue <= 4) {
        return {
          finalAnswer: { type: 'multiple_choice', value: numValue as 1 | 2 | 3 | 4 },
          solution: emptyMarkdownSolution
        };
      }
      throw new Error('Multiple choice answer must be between 1 and 4');
      
    case QuestionType.OPEN:
      return {
        finalAnswer: { type: 'none' },
        solution: { text: value, format: 'markdown', requiredSolution: true }
      };
      
    case QuestionType.NUMERICAL:
      return {
        finalAnswer: { type: 'numerical', value: parseFloat(value), tolerance: 0 },
        solution: emptyMarkdownSolution
      };
      
    default:
      throw new Error(`Unsupported question type: ${type}`);
  }
};

export const StudentPrepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prep, setPrep] = useState<StudentPrep | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ActivePracticeQuestion | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isGeneratingQuestion = useRef(false);
  const rotationManager = useRef<QuestionRotationManager | null>(null);
  const feedbackService = useRef<FeedbackService>(new FeedbackService());

  // Get prep by ID
  const getPrep = useCallback(async (prepId: string): Promise<StudentPrep | null> => {
    try {
      const prep = PrepStateManager.getPrep(prepId);
      
      if (!prep) {
        return null;
      }
      
      // Load or create rotation manager for this prep
      if (!rotationManager.current || rotationManager.current.getPrepId() !== prepId) {
        rotationManager.current = new QuestionRotationManager(prep.exam, prep.selection, prepId);
      }
      
      return prep;
    } catch (error) {
      throw new Error('שגיאה בטעינת נתוני התרגול');
    }
  }, []);

  // Start a new prep
  const startPrep = useCallback(async (exam: ExamTemplate, selection?: TopicSelection): Promise<string> => {
    try {
      // Ensure exam data is fully loaded
      if (!exam.topics || exam.topics.length === 0) {
        // Try to load exam data
        const loadedExam = await examService.getExamById(exam.id);
        if (!loadedExam) {
          throw new Error('Failed to load exam data');
        }
        exam = loadedExam;
      }

      // Validate exam has topics after loading
      if (!exam.topics || exam.topics.length === 0) {
        throw new Error('Cannot start prep: exam has no topics');
      }

      console.log('Starting new prep:', { 
        examId: exam.id,
        selection 
      });

      // Clear any stored questions
      localStorage.removeItem(CURRENT_QUESTION_KEY);
      setCurrentQuestion(null);

      // Create new prep in active state
      const prep = PrepStateManager.createPrep(exam, selection);
      
      // Create new rotation manager for this prep
      console.log('Creating new rotation manager for prep:', prep.id);
      rotationManager.current = new QuestionRotationManager(exam, prep.selection, prep.id);
      
      console.log('Prep created:', { 
        prepId: prep.id,
        status: prep.state.status
      });

      // Return prepId immediately
      return prep.id;
    } catch (error) {
      console.error('Error starting prep:', {
        error,
        examId: exam.id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('שגיאה בהתחלת התרגול');
    }
  }, []);

  // Pause prep
  const pausePrep = useCallback((prepId: string) => {
    const prep = PrepStateManager.getPrep(prepId);
    if (!prep) return;

    try {
      PrepStateManager.pause(prep);
    } catch (error) {
      PrepStateManager.setError(
        prep,
        error instanceof Error ? error.message : 'Error pausing prep'
      );
    }
  }, []);

  // Complete prep
  const completePrep = useCallback((prepId: string) => {
    const prep = PrepStateManager.getPrep(prepId);
    if (!prep) return;

    try {
      PrepStateManager.complete(prep);
    } catch (error) {
      PrepStateManager.setError(
        prep,
        error instanceof Error ? error.message : 'Error completing prep'
      );
    }
  }, []);

  /**
   * Handles feedback generation for all question types
   */
  const generateFeedback = async (question: Question, answer: string, prep: StudentPrep): Promise<QuestionFeedback> => {
    // Get subject name from universal topics
    const subject = universalTopics.getSubjectName(question.metadata.topicId);

    // Wrap feedback generation with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Feedback generation timed out after 10 seconds')), 10000);
    });

    try {
      // Race between feedback generation and timeout
      return await Promise.race([
        feedbackService.current.generateFeedback({
          question,
          studentAnswer: answer,
          formalExamName: prep.exam.names.full,
          examType: prep.exam.examType as ExamType,
          subject
        }),
        timeoutPromise
      ]);
    } catch (error) {
      logger.error('Failed to generate feedback:', {
        error,
        questionId: question.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('שגיאה בשליחת התשובה');
    }
  };

  const submitAnswer = useCallback(async (answer: string, prep: StudentPrep) => {
    if (!currentQuestion) {
      throw new Error('No active question');
    }

    try {
      // Create answer object based on question type
      const createAnswerObject = (type: QuestionType, value: string): FullAnswer => {
        const emptyMarkdownSolution = { text: '', format: 'markdown' as const, requiredSolution: false };
        
        switch (type) {
          case QuestionType.MULTIPLE_CHOICE:
            const numValue = parseInt(value, 10);
            if (numValue >= 1 && numValue <= 4) {
              return {
                finalAnswer: { type: 'multiple_choice', value: numValue as 1 | 2 | 3 | 4 },
                solution: emptyMarkdownSolution
              };
            }
            throw new Error('Multiple choice answer must be between 1 and 4');
            
          case QuestionType.OPEN:
            return {
              finalAnswer: { type: 'none' },
              solution: { text: value, format: 'markdown', requiredSolution: true }
            };
            
          case QuestionType.NUMERICAL:
            return {
              finalAnswer: { type: 'numerical', value: parseFloat(value), tolerance: 0 },
              solution: emptyMarkdownSolution
            };
            
          default:
            throw new Error(`Unsupported question type: ${type}`);
        }
      };

      // First update state to submitted without feedback
      const submittingState: QuestionPracticeState = {
        ...currentQuestion.practiceState,
        status: 'submitted',
        currentAnswer: createAnswerObject(currentQuestion.question.metadata.type, answer),
        lastSubmittedAt: Date.now()
      };

      setCurrentQuestion({
        question: currentQuestion.question,
        practiceState: submittingState
      });

      // Generate feedback with timeout handling
      try {
        const feedback = await generateFeedback(currentQuestion.question, answer, prep);

        // Update state with feedback
        const completedState: QuestionPracticeState = {
          ...submittingState,
          status: 'receivedFeedback',
          submissions: [
            ...submittingState.submissions,
            {
              answer: submittingState.currentAnswer!,
              feedback,
              submittedAt: Date.now()
            }
          ]
        };

        setCurrentQuestion({
          question: currentQuestion.question,
          practiceState: completedState
        });

        // Update prep state
        PrepStateManager.updateProgress(
          prep, 
          isSuccessfulAnswer(feedback.evalLevel),
          feedback.score,
          currentQuestion.question.id
        );

      } catch (error) {
        // Handle timeout or other feedback generation errors
        if (error instanceof Error && error.message.includes('timed out')) {
          throw new Error('התשובה לא נשלחה - תקלה בשרת. אנא נסה שוב');
        }
        throw error;
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error instanceof Error ? error : new Error('שגיאה בשליחת התשובה');
    }
  }, [currentQuestion, generateFeedback]);

  const getNextQuestion = useCallback(async (filters?: FilterState): Promise<Question> => {
    try {
      isGeneratingQuestion.current = true;

      // Get next parameters using rotation manager
      if (!rotationManager.current) {
        throw new Error('Question rotation manager not initialized');
      }

      const params = rotationManager.current.getNextParameters(filters);
      
      console.log('🔍 SEARCH PARAMS:', {
        params,
        timestamp: new Date().toISOString()
      });

      // Use questionStorage with the same filter structure as admin
      const questions = await questionStorage.getFilteredQuestions({
        topic: params.topic,
        type: params.type
      });

      console.log('📊 SEARCH RESULTS:', {
        found: questions ? questions.length : 0,
        params,
        firstQuestionId: questions?.[0]?.id,
        firstQuestionData: questions?.[0] ? {
          type: questions[0].metadata?.type,
          metadata: questions[0].metadata,
          status: questions[0].publication_status
        } : null,
        timestamp: new Date().toISOString()
      });

      // If we found matching questions, randomly select one
      if (questions && questions.length > 0) {
        const randomIndex = Math.floor(Math.random() * questions.length);
        const selectedQuestion = questions[randomIndex];
        console.log('✅ SELECTED QUESTION:', {
          id: selectedQuestion.id,
          type: selectedQuestion.metadata.type,
          topic: selectedQuestion.metadata.topicId,
          subtopic: selectedQuestion.metadata.subtopicId,
          timestamp: new Date().toISOString()
        });
        return selectedQuestion;
      }

      // If no existing questions found, generate a new one
      console.log('🆕 GENERATING NEW QUESTION:', {
        params,
        reason: 'No matching questions found in DB',
        timestamp: new Date().toISOString()
      });
      const question = await questionService.generateQuestion(params);
      return question;
    } catch (error) {
      console.error('❌ GET NEXT QUESTION ERROR:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      isGeneratingQuestion.current = false;
    }
  }, []);

  const skipQuestion = useCallback(async (reason: SkipReason, filters?: FilterState): Promise<Question> => {
    console.log('FORCE LOG - skipQuestion ENTRY:', {
      reason,
      filters,
      timestamp: new Date().toISOString()
    });

    if (!rotationManager.current) {
      throw new Error('Cannot skip question: rotation manager not initialized');
    }

    try {
      // Handle difficulty adjustment based on skip reason
      const currentSubtopic = currentQuestion?.question.metadata.subtopicId;
      if (currentSubtopic) {
        if (reason === 'too_easy') {
          console.log('FORCE LOG - Increasing difficulty due to too_easy skip');
          rotationManager.current.increaseDifficulty(currentSubtopic);
        } else if (reason === 'too_hard') {
          console.log('FORCE LOG - Decreasing difficulty due to too_hard skip');
          rotationManager.current.decreaseDifficulty(currentSubtopic);
        }
      }

      // Get next question with filters
      return getNextQuestion(filters);
    } catch (error) {
      console.error('Failed to skip question', { error, reason });
      throw error;
    }
  }, [currentQuestion, getNextQuestion]);

  const updateUserFocus = useCallback(async (prepId: string, filters: FilterState) => {
    PrepStateManager.updateUserFocus(prepId, filters);
  }, []);

  const getUserFocus = useCallback(async (prepId: string) => {
    return PrepStateManager.getUserFocus(prepId);
  }, []);

  // Add effect to restore state from localStorage on mount
  useEffect(() => {
    const storedQuestion = localStorage.getItem(CURRENT_QUESTION_KEY);
    if (storedQuestion) {
      try {
        const parsedQuestion = JSON.parse(storedQuestion);
        setCurrentQuestion(parsedQuestion);
      } catch (error) {
        console.error('Error parsing stored question:', error);
        localStorage.removeItem(CURRENT_QUESTION_KEY);
      }
    }
  }, []);

  // Update localStorage when current question changes
  useEffect(() => {
    if (currentQuestion) {
      localStorage.setItem(CURRENT_QUESTION_KEY, JSON.stringify(currentQuestion));
    } else {
      localStorage.removeItem(CURRENT_QUESTION_KEY);
    }
  }, [currentQuestion]);

  return (
    <StudentPrepContext.Provider value={{
      prep,
      currentQuestion,
      filters,
      isLoading,
      error,
      setPrep,
      setCurrentQuestion,
      setFilters,
      getPrep,
      topics: [],
      startPrep,
      pausePrep,
      completePrep,
      getNextQuestion,
      skipQuestion,
      submitAnswer,
      getRotationManager: () => rotationManager.current,
      updateUserFocus,
      getUserFocus
    }}>
      {children}
    </StudentPrepContext.Provider>
  );
};

export const useStudentPrep = () => {
  const context = useContext(StudentPrepContext);
  if (!context) {
    throw new Error('useStudentPrep must be used within StudentPrepProvider');
  }
  return context;
};

export default StudentPrepProvider; 