import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { FormalExam } from '../types/shared/exam';
import type { Question } from '../types/question';
import { examService } from '../services/examService';
import { questionService } from '../services/llm/service';
import { ExamType } from '../types/exam';

interface PracticeState {
  exam: FormalExam;
  selectedTopics: string[];
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeTaken: number;
  }>;
  startTime: number;
}

interface ExamContextType {
  loading: boolean;
  error: string | null;
  bagrutExams: FormalExam[];
  mahatExams: FormalExam[];
  selectedExam: FormalExam | null;
  setSelectedExam: (exam: FormalExam | null) => void;
  
  // Practice state
  practiceState: PracticeState | null;
  currentQuestion: Question | null;
  startPractice: (exam: FormalExam, topics: string[]) => Promise<void>;
  submitPracticeAnswer: (answer: string, isCorrect: boolean) => Promise<void>;
  endPractice: () => void;
  getNextPracticeQuestion: () => Promise<Question>;
  setCurrentQuestion: (question: Question | null) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bagrutExams, setBagrutExams] = useState<FormalExam[]>([]);
  const [mahatExams, setMahatExams] = useState<FormalExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<FormalExam | null>(null);
  
  // Practice state
  const [practiceState, setPracticeState] = useState<PracticeState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // Request locking mechanism
  const isGeneratingQuestion = useRef(false);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const [bagrutData, mahatData] = await Promise.all([
          examService.getExamsByType(ExamType.BAGRUT),
          examService.getExamsByType(ExamType.MAHAT)
        ]);

        // Filter out any null values that might have occurred due to errors
        setBagrutExams(bagrutData.filter(Boolean));
        setMahatExams(mahatData.filter(Boolean));
      } catch (err) {
        // Log error but don't show to user unless critical
        console.error('%cError loading exams:', 'color: red', err);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  const startPractice = async (exam: FormalExam, topics: string[]) => {
    if (isGeneratingQuestion.current) {
      console.warn('🔒 Question generation already in progress');
      return;
    }

    console.log('🎯 Starting practice:', {
      examId: exam.id,
      topics,
      practiceStateExists: !!practiceState
    });

    isGeneratingQuestion.current = true;

    try {
      console.log('📝 Generating first question:', {
        topic: topics[0],
        examTitle: exam.title,
        examType: exam.examType
      });

      const question = await questionService.generateQuestion({
        topic: topics[0],
        difficulty: 3, // Default difficulty
        type: 'multiple_choice',
        subject: exam.title,
        educationType: exam.examType === 'bagrut' ? 'high_school' : 'technical_college'
      });
      
      console.log('✅ First question generated:', {
        questionId: question.id,
        type: question.type,
        topic: question.metadata?.topicId,
        hasContent: !!question.content
      });

      setPracticeState({
        exam,
        selectedTopics: topics,
        currentQuestionIndex: 0,
        answers: [],
        startTime: Date.now()
      });

      setCurrentQuestion(question);
    } catch (err) {
      console.error('❌ Error generating question:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate question');
      console.log('🛑 Ending practice due to error');
      endPractice();
    } finally {
      isGeneratingQuestion.current = false;
    }
  };

  const submitPracticeAnswer = async (answer: string, isCorrect: boolean) => {
    if (!practiceState || !currentQuestion) return;
    if (isGeneratingQuestion.current) {
      console.warn('Question generation already in progress');
      return;
    }

    console.log('Submitting answer:', {
      questionId: currentQuestion.id,
      isCorrect,
      currentIndex: practiceState.currentQuestionIndex
    });

    isGeneratingQuestion.current = true;

    // Record answer
    const timeTaken = (Date.now() - practiceState.startTime) / 1000;
    setPracticeState(prev => {
      if (!prev) return null;
      const newState = {
        ...prev,
        answers: [...prev.answers, {
          questionId: currentQuestion.id,
          answer,
          isCorrect,
          timeTaken
        }],
        currentQuestionIndex: prev.currentQuestionIndex + 1
      };

      console.log('Updated practice state:', {
        answersCount: newState.answers.length,
        currentIndex: newState.currentQuestionIndex
      });

      return newState;
    });

    try {
      const nextTopicIndex = Math.floor(practiceState.currentQuestionIndex / 3);
      const nextTopic = practiceState.selectedTopics[nextTopicIndex];
      
      if (nextTopic) {
        console.log('Generating next question for topic:', nextTopic);
        const question = await questionService.generateQuestion({
          topic: nextTopic,
          difficulty: 3, // Default difficulty
          type: 'multiple_choice',
          subject: practiceState.exam.title,
          educationType: practiceState.exam.examType === 'bagrut' ? 'high_school' : 'technical_college'
        });
        
        console.log('Next question generated:', {
          questionId: question.id,
          type: question.type,
          topic: question.metadata?.topicId
        });

        setCurrentQuestion(question);
      } else {
        console.log('No more topics, ending practice');
        endPractice();
      }
    } catch (err) {
      console.error('Error generating next question:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate next question');
    } finally {
      isGeneratingQuestion.current = false;
    }
  };

  const endPractice = () => {
    console.log('🔄 Ending practice:', {
      hadPracticeState: !!practiceState,
      hadCurrentQuestion: !!currentQuestion
    });
    setPracticeState(null);
    setCurrentQuestion(null);
    isGeneratingQuestion.current = false;
  };

  const getNextPracticeQuestion = async () => {
    console.log('🔍 Getting next question:', {
      hasPracticeState: !!practiceState,
      isGenerating: isGeneratingQuestion.current
    });

    if (!practiceState) {
      console.error('❌ No active practice session');
      throw new Error('No active practice session');
    }
    if (isGeneratingQuestion.current) {
      console.warn('🔒 Question generation already in progress');
      throw new Error('Question generation already in progress');
    }

    isGeneratingQuestion.current = true;

    try {
      const nextTopicIndex = Math.floor(practiceState.currentQuestionIndex / 3);
      const nextTopic = practiceState.selectedTopics[nextTopicIndex];
      
      console.log('📊 Next question details:', {
        nextTopicIndex,
        nextTopic,
        currentIndex: practiceState.currentQuestionIndex
      });

      if (!nextTopic) {
        console.warn('⚠️ No more questions available');
        throw new Error('No more questions available');
      }

      const question = await questionService.generateQuestion({
        topic: nextTopic,
        difficulty: 3, // Default difficulty
        type: 'multiple_choice',
        subject: practiceState.exam.title,
        educationType: practiceState.exam.examType === 'bagrut' ? 'high_school' : 'technical_college'
      });

      console.log('✅ Next question generated:', {
        questionId: question.id,
        type: question.type,
        topic: question.metadata?.topicId
      });

      return question;
    } finally {
      isGeneratingQuestion.current = false;
    }
  };

  return (
    <ExamContext.Provider 
      value={{ 
        loading, 
        error, 
        bagrutExams, 
        mahatExams, 
        selectedExam, 
        setSelectedExam,
        practiceState,
        currentQuestion,
        startPractice,
        submitPracticeAnswer,
        endPractice,
        getNextPracticeQuestion,
        setCurrentQuestion
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
}; 