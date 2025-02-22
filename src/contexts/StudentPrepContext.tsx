import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { FormalExam } from '../types/shared/exam';
import type { StudentPrep, QuestionState, TopicSelection, PrepState, logPrepStateChange, logQuestionStateChange } from '../types/prepState';
import type { PracticeQuestion } from '../types/prepUI';
import type { Question, QuestionType, FilterState } from '../types/question';
import type { QuestionFeedback } from '../types/question';
import { PrepStateManager } from '../services/PrepStateManager';
import { questionService } from '../services/llm/questionGenerationService';
import { QuestionRotationManager } from '../services/QuestionRotationManager';
import { FeedbackService } from '../services/llm/feedbackGenerationService';
import { logger } from '../utils/logger';
import { ExamType } from '../types/exam';
import { examService } from '../services/examService';

interface StudentPrepContextType {
  activePrep: StudentPrep | null;
  currentQuestion: PracticeQuestion | null;
  startPrep: (exam: FormalExam, selection?: TopicSelection) => Promise<string>;
  pausePrep: (prepId: string) => void;
  completePrep: (prepId: string) => void;
  getNextQuestion: (filters?: FilterState) => Promise<Question>;
  submitAnswer: (answer: string) => Promise<void>;
  setCurrentQuestion: (question: PracticeQuestion | null) => void;
  getPrep: (prepId: string) => Promise<StudentPrep | null>;
  setActivePrep: (prep: StudentPrep | null) => void;
}

const StudentPrepContext = createContext<StudentPrepContextType | null>(null);

const QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'open', 'code', 'step_by_step'];
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;

const PREP_STORAGE_KEY = 'active_preps';
const CURRENT_QUESTION_KEY = 'current_question';

export const StudentPrepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePrep, setActivePrep] = useState<StudentPrep | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const timeInterval = useRef<NodeJS.Timeout | null>(null);
  const isGeneratingQuestion = useRef(false);
  const rotationManager = useRef<QuestionRotationManager | null>(null);
  const feedbackService = useRef<FeedbackService>(new FeedbackService());

  // Get prep by ID and load first question if needed
  const getPrep = useCallback(async (prepId: string): Promise<StudentPrep | null> => {
    try {
      console.log('Getting prep:', { prepId });
      const prep = PrepStateManager.getPrep(prepId);
      
      if (!prep) {
        console.warn('Prep not found:', { prepId });
        return null;
      }

      console.log('Found prep:', { 
        prepId, 
        status: prep.state.status,
        exam: prep.exam.id 
      });
      
      setActivePrep(prep);
      return prep;
    } catch (error) {
      console.error('Error getting prep:', {
        error,
        prepId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('שגיאה בטעינת נתוני התרגול');
    }
  }, []);

  // Get next question
  const getNextQuestion = useCallback(async (filters?: FilterState): Promise<Question> => {
    if (!activePrep) {
      throw new Error('No active prep session');
    }

    if (isGeneratingQuestion.current) {
      // Wait for current generation with timeout
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds total wait time
      
      await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          attempts++;
          if (!isGeneratingQuestion.current) {
            clearInterval(checkInterval);
            resolve(null);
          }
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            reject(new Error('Timeout waiting for question generation'));
          }
        }, 1000);
      });
    }

    try {
      isGeneratingQuestion.current = true;

      // Initialize rotation manager if needed
      if (!rotationManager.current && activePrep) {
        rotationManager.current = new QuestionRotationManager(
          activePrep.exam,
          activePrep.selection
        );
      }

      // Get next parameters using rotation manager
      if (!rotationManager.current) {
        throw new Error('Question rotation manager not initialized');
      }

      // Set current filters
      if (filters) {
        console.log('Setting filters in rotation manager:', filters);
        rotationManager.current.setFilter(filters);
      }

      const params = rotationManager.current.getNextParameters();

      // Generate question with rotated parameters
      try {
        const question = await questionService.generateQuestion(params);
        return question;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error generating question';
        const isRateLimit = errorMessage.toLowerCase().includes('rate limit') || 
                           errorMessage.toLowerCase().includes('429');
        
        throw new Error(isRateLimit ? 
          'המערכת עמוסה כרגע. אנא המתן מספר דקות ונסה שוב.' :
          'אירעה שגיאה בטעינת השאלה. אנא נסה שוב.'
        );
      }
    } finally {
      isGeneratingQuestion.current = false;
    }
  }, [activePrep]);

  // Start a new prep
  const startPrep = useCallback(async (exam: FormalExam, selection?: TopicSelection): Promise<string> => {
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
      
      // Initialize rotation manager with the actual selection from the prep
      rotationManager.current = new QuestionRotationManager(exam, prep.selection);

      // Set active prep state immediately
      setActivePrep(prep);
      
      console.log('Prep created:', { 
        prepId: prep.id,
        status: prep.state.status
      });

      // Start question generation in background
      queueMicrotask(async () => {
        try {
          if (!rotationManager.current) {
            console.error('Question rotation manager not initialized');
            return;
          }

          const params = rotationManager.current.getNextParameters();
          const firstQuestion = await questionService.generateQuestion(params);
          
          if (firstQuestion) {
            console.log('First question generated:', {
              questionId: firstQuestion.id,
              type: firstQuestion.type,
              prepId: prep.id
            });

            const practiceQuestion: PracticeQuestion = {
              question: firstQuestion,
              state: {
                status: 'active',
                startedAt: Date.now(),
                lastUpdatedAt: Date.now(),
                helpRequests: [],
                questionIndex: 0,
                correctAnswers: 0,
                averageScore: 0
              }
            };
            setCurrentQuestion(practiceQuestion);
            localStorage.setItem(CURRENT_QUESTION_KEY, JSON.stringify(practiceQuestion));
          }
        } catch (error) {
          console.error('Error generating first question:', {
            error,
            prepId: prep.id,
            stack: error instanceof Error ? error.stack : undefined
          });
        }
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

  // Pause prep
  const pausePrep = useCallback((prepId: string) => {
    const prep = PrepStateManager.getPrep(prepId);
    if (!prep) return;

    try {
      const pausedPrep = PrepStateManager.pause(prep);
      setActivePrep(pausedPrep);
    } catch (error) {
      const errorPrep = PrepStateManager.setError(
        prep,
        error instanceof Error ? error.message : 'Error pausing prep'
      );
      setActivePrep(errorPrep);
    }
  }, []);

  // Complete prep
  const completePrep = useCallback((prepId: string) => {
    const prep = PrepStateManager.getPrep(prepId);
    if (!prep) return;

    try {
      const completedPrep = PrepStateManager.complete(prep);
      setActivePrep(completedPrep);
    } catch (error) {
      const errorPrep = PrepStateManager.setError(
        prep,
        error instanceof Error ? error.message : 'Error completing prep'
      );
      setActivePrep(errorPrep);
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
  const generateFeedback = async (question: Question, answer: string): Promise<QuestionFeedback> => {
    // For multiple choice questions, handle feedback directly
    if (question.type === 'multiple_choice') {
      const selectedOption = parseInt(answer);
      if (isNaN(selectedOption) || selectedOption < 1 || selectedOption > 4) {
        throw new Error('Invalid multiple choice answer');
      }
      return generateMultipleChoiceFeedback(question, selectedOption);
    }

    if (!activePrep?.exam) {
      throw new Error('No active exam in prep session');
    }

    // For other question types, use the feedback service directly
    const topicId = question.metadata.topicId;
    let subject = 'Mathematics'; // Default fallback

    try {
      const topicData = await examService.getTopicData(topicId);
      subject = topicData.subject.name; // Use the name directly from the subject data
    } catch (error) {
      logger.warn('Failed to get subject from topic ID, using default', {
        topicId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return feedbackService.current.generateFeedback({
      question,
      studentAnswer: answer,
      formalExamName: activePrep.exam.names.full,
      examType: activePrep.exam.examType as ExamType,
      subject
    });
  };

  const submitAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || !activePrep) {
      throw new Error('No active question or prep session');
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
      const feedback = await generateFeedback(currentQuestion.question, answer);

      // Update prep progress with the score and question ID
      const updatedPrep = PrepStateManager.updateProgress(
        activePrep, 
        feedback.isCorrect,
        feedback.score,
        currentQuestion.question.id
      );
      setActivePrep(updatedPrep);

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
  }, [activePrep, currentQuestion, generateFeedback]);

  // Time tracking effect
  useEffect(() => {
    if (!activePrep || activePrep.state.status !== 'active') {
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
      }
      return;
    }

    timeInterval.current = setInterval(() => {
      const updatedPrep = PrepStateManager.updateTime(activePrep);
      setActivePrep(updatedPrep);
    }, 1000);

    return () => {
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
      }
    };
  }, [activePrep]);

  // Update localStorage when current question changes
  useEffect(() => {
    if (currentQuestion) {
      localStorage.setItem(CURRENT_QUESTION_KEY, JSON.stringify(currentQuestion));
    } else {
      localStorage.removeItem(CURRENT_QUESTION_KEY);
    }
  }, [currentQuestion]);

  // Clear current question when practice completes or errors
  useEffect(() => {
    if (activePrep?.state.status === 'completed' || activePrep?.state.status === 'error') {
      setCurrentQuestion(null);
      localStorage.removeItem(CURRENT_QUESTION_KEY);
    }
  }, [activePrep?.state.status]);

  return (
    <StudentPrepContext.Provider value={{
      activePrep,
      currentQuestion,
      startPrep,
      pausePrep,
      completePrep,
      getNextQuestion,
      submitAnswer,
      setCurrentQuestion,
      getPrep,
      setActivePrep
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