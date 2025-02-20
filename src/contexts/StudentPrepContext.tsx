import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { FormalExam } from '../types/shared/exam';
import type { StudentPrep, QuestionState, TopicSelection, PrepState, logPrepStateChange, logQuestionStateChange } from '../types/prepState';
import type { PracticeQuestion } from '../types/prepUI';
import type { Question, QuestionType, QuestionFeedback, FilterState } from '../types/question';
import { PrepStateManager } from '../services/PrepStateManager';
import { questionService } from '../services/llm/service';
import { QuestionRotationManager } from '../services/QuestionRotationManager';

interface StudentPrepContextType {
  activePrep: StudentPrep | null;
  currentQuestion: PracticeQuestion | null;
  startPrep: (exam: FormalExam, selection?: TopicSelection) => Promise<string>;
  pausePrep: (prepId: string) => void;
  completePrep: (prepId: string) => void;
  getNextQuestion: (filters?: FilterState) => Promise<Question>;
  submitAnswer: (answer: string, isCorrect: boolean) => Promise<void>;
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
  const timeInterval = useRef<NodeJS.Timeout>();
  const isGeneratingQuestion = useRef(false);
  const rotationManager = useRef<QuestionRotationManager | null>(null);

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

  // Submit answer
  const submitAnswer = useCallback(async (answer: string, isCorrect: boolean) => {
    if (!activePrep || !currentQuestion) return;

    try {
      // Generate feedback based on question type
      let score: number;
      switch (currentQuestion.question.type) {
        case 'multiple_choice':
          score = isCorrect ? 100 : 0; // Binary scoring for multiple choice
          break;
        case 'open':
        case 'step_by_step':
          // For open questions, score should come from the question's evaluation criteria
          // This is a mock - in reality this should come from the question service
          score = isCorrect ? 100 : 0; // TODO: Replace with actual scoring logic
          break;
        case 'code':
          // For code questions, score should be based on test cases and code quality
          // This is a mock - in reality this should come from the code evaluation service
          score = isCorrect ? 100 : 0; // TODO: Replace with actual code evaluation
          break;
        default:
          score = isCorrect ? 100 : 0;
      }

      const feedback: QuestionFeedback = {
        isCorrect,
        score,
        type: currentQuestion.question.type,
        assessment: isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה. נסה שוב.',
        explanation: isCorrect 
          ? 'כל הכבוד! התשובה שלך מדויקת ומראה הבנה טובה של החומר. המשך כך!'
          : 'אני רואה שיש מקום לשיפור. נסה לחשוב על הבעיה שוב, ואם צריך, אפשר לבקש רמז או הסבר נוסף.',
        solution: isCorrect 
          ? 'הפתרון שלך נכון ומדויק.'
          : 'נסה לחשוב על הבעיה שוב ולפתור אותה צעד אחר צעד.'
      };

      // Update prep progress with the score and question ID
      const updatedPrep = PrepStateManager.updateProgress(
        activePrep, 
        isCorrect, 
        score,
        currentQuestion.question.id
      );
      setActivePrep(updatedPrep);

      // Update question state with feedback
      const updatedState: QuestionState = {
        ...currentQuestion.state,
        status: 'submitted',
        submittedAnswer: {
          text: answer,
          timestamp: Date.now()
        },
        lastUpdatedAt: Date.now(),
        feedback
      };

      setCurrentQuestion({
        ...currentQuestion,
        state: updatedState
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }, [activePrep, currentQuestion]);

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

  // Auto-pause on window events
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activePrep?.state.status === 'active') {
        pausePrep(activePrep.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activePrep, pausePrep]);

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