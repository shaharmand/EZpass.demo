import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ExamTemplate } from '../types/examTemplate';
import type { StudentPrep, QuestionState, TopicSelection, PrepState } from '../types/prepState';
import type { PracticeQuestion, SkipReason } from '../types/prepUI';
import type { Question, QuestionType, FilterState } from '../types/question';
import type { QuestionFeedback } from '../types/question';
import type { Topic } from '../types/subject';
import { PrepStateManager } from '../services/PrepStateManager';
import { questionService } from '../services/llm/questionGenerationService';
import { QuestionRotationManager } from '../services/QuestionRotationManager';
import { FeedbackService } from '../services/llm/feedbackGenerationService';
import { logger, CRITICAL_SECTIONS } from '../utils/logger';
import { ExamType } from '../types/examTemplate';
import { examService } from '../services/examService';
import { universalTopics } from '../services/universalTopics';

interface StudentPrepContextType {
  currentQuestion: PracticeQuestion | null;
  topics: Topic[];
  startPrep: (exam: ExamTemplate, selection?: TopicSelection) => Promise<string>;
  pausePrep: (prepId: string) => void;
  completePrep: (prepId: string) => void;
  getNextQuestion: (filters?: FilterState) => Promise<Question>;
  skipQuestion: (reason: SkipReason, filters?: FilterState) => Promise<Question>;
  submitAnswer: (answer: string, prep: StudentPrep) => Promise<void>;
  setCurrentQuestion: (question: PracticeQuestion | null) => void;
  getPrep: (prepId: string) => Promise<StudentPrep | null>;
  getRotationManager: () => QuestionRotationManager | null;
}

const StudentPrepContext = createContext<StudentPrepContextType | null>(null);

const QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'open', 'code', 'step_by_step'];
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;

const PREP_STORAGE_KEY = 'active_preps';
const CURRENT_QUESTION_KEY = 'current_question';

export const StudentPrepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const isGeneratingQuestion = useRef(false);
  const rotationManager = useRef<QuestionRotationManager | null>(null);
  const feedbackService = useRef<FeedbackService>(new FeedbackService());

  // Enable critical logging sections
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
   * Handles feedback generation for multiple choice questions
   */
  const generateMultipleChoiceFeedback = (
    question: Question,
    selectedOption: number
  ): QuestionFeedback => {
    const isCorrect = selectedOption === question.correctOption;
    
    logger.info('Generating multiple choice feedback', {
      questionId: question.id,
      selectedOption,
      correctOption: question.correctOption,
      isCorrect
    });

    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      assessment: isCorrect ? 'תשובה נכונה' : 'תשובה לא נכונה',
      coreFeedback: question.solution.text,
      detailedFeedback: undefined // Not used for multiple choice
    };
  };

  /**
   * Handles feedback generation for all question types
   */
  const generateFeedback = async (question: Question, answer: string, prep: StudentPrep): Promise<QuestionFeedback> => {
    // For multiple choice questions, handle feedback directly
    if (question.type === 'multiple_choice') {
      const selectedOption = parseInt(answer);
      if (isNaN(selectedOption) || selectedOption < 1 || selectedOption > 4) {
        throw new Error('Invalid multiple choice answer');
      }
      return generateMultipleChoiceFeedback(question, selectedOption);
    }

    if (!prep?.exam) {
      throw new Error('No exam in prep session');
    }

    // For other question types, use the feedback service directly
    const topicId = question.metadata.topicId;
    let subject: string;

    try {
      subject = universalTopics.getSubjectName(topicId);
      logger.info('Successfully retrieved subject name:', {
        topicId,
        subjectName: subject
      });
    } catch (error) {
      logger.error('Failed to get subject name:', {
        error,
        topicId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }

    return feedbackService.current.generateFeedback({
      question,
      studentAnswer: answer,
      formalExamName: prep.exam.names.full,
      examType: prep.exam.examType as ExamType,
      subject
    });
  };

  const submitAnswer = useCallback(async (answer: string, prep: StudentPrep) => {
    if (!currentQuestion) {
      throw new Error('No active question');
    }

    try {
      // First update state to submitted without feedback
      const submittingState: QuestionState = {
        ...currentQuestion.state,
        status: 'submitted',
        submittedAnswer: {
          text: answer,
          timestamp: Date.now()
        },
        lastUpdatedAt: Date.now()
      };

      setCurrentQuestion({
        ...currentQuestion,
        state: submittingState
      });

      // Generate feedback using our feedback service
      const feedback = await generateFeedback(currentQuestion.question, answer, prep);

      // Update prep progress with the score and question ID
      PrepStateManager.updateProgress(
        prep, 
        feedback.isCorrect,
        feedback.score,
        currentQuestion.question.id
      );

      // Update question state with feedback
      const updatedState: QuestionState = {
        ...submittingState,
        feedback
      };

      setCurrentQuestion({
        ...currentQuestion,
        state: updatedState
      });

      logger.info('Answer submitted and feedback generated', {
        questionId: currentQuestion.question.id,
        isCorrect: feedback.isCorrect,
        score: feedback.score
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }, [currentQuestion]);

  const getNextQuestion = useCallback(async (filters?: FilterState): Promise<Question> => {
    try {
      isGeneratingQuestion.current = true;

      // Get next parameters using rotation manager
      if (!rotationManager.current) {
        throw new Error('Question rotation manager not initialized');
      }

      const params = rotationManager.current.getNextParameters(filters);

      // Generate question with rotated parameters
      const question = await questionService.generateQuestion(params);
      
      return question;
    } catch (error) {
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
      currentQuestion,
      topics: [],
      startPrep,
      pausePrep,
      completePrep,
      getNextQuestion,
      skipQuestion,
      submitAnswer,
      setCurrentQuestion,
      getPrep,
      getRotationManager: () => rotationManager.current
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