import React, { createContext, useContext, useEffect, useState } from 'react';
import type { FormalExam } from '../types/shared/exam';
import type { Question } from '../types/question';
import { examService } from '../services/examService';
import { questionService } from '../services/llm/service';
import { ExamType } from '../types/exam';

interface PracticeState {
  exam: FormalExam;
  selectedTopics: string[];
  difficulty: number;
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
  startPractice: (exam: FormalExam, topics: string[], difficulty: number) => Promise<void>;
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

  const startPractice = async (exam: FormalExam, topics: string[], difficulty: number) => {
    setPracticeState({
      exam,
      selectedTopics: topics,
      difficulty,
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now()
    });

    // Generate first question
    try {
      const question = await questionService.generateQuestion({
        topic: topics[0],
        difficulty,
        type: 'multiple_choice',
        subject: exam.title,
        educationType: exam.examType === 'bagrut' ? 'high_school' : 'technical_college'
      });
      setCurrentQuestion(question);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate question');
      endPractice();
    }
  };

  const submitPracticeAnswer = async (answer: string, isCorrect: boolean) => {
    if (!practiceState || !currentQuestion) return;

    // Record answer
    const timeTaken = (Date.now() - practiceState.startTime) / 1000; // in seconds
    setPracticeState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        answers: [...prev.answers, {
          questionId: currentQuestion.id,
          answer,
          isCorrect,
          timeTaken
        }],
        currentQuestionIndex: prev.currentQuestionIndex + 1
      };
    });

    // Get next question
    try {
      const nextTopicIndex = Math.floor(practiceState.currentQuestionIndex / 3); // 3 questions per topic
      const nextTopic = practiceState.selectedTopics[nextTopicIndex];
      
      if (nextTopic) {
        const question = await questionService.generateQuestion({
          topic: nextTopic,
          difficulty: practiceState.difficulty,
          type: 'multiple_choice',
          subject: practiceState.exam.title,
          educationType: practiceState.exam.examType === 'bagrut' ? 'high_school' : 'technical_college'
        });
        setCurrentQuestion(question);
      } else {
        // Practice complete
        endPractice();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate next question');
    }
  };

  const endPractice = () => {
    setPracticeState(null);
    setCurrentQuestion(null);
  };

  const getNextPracticeQuestion = async () => {
    if (!practiceState) throw new Error('No active practice session');

    const nextTopicIndex = Math.floor(practiceState.currentQuestionIndex / 3);
    const nextTopic = practiceState.selectedTopics[nextTopicIndex];
    
    if (!nextTopic) {
      throw new Error('No more questions available');
    }

    return questionService.generateQuestion({
      topic: nextTopic,
      difficulty: practiceState.difficulty,
      type: 'multiple_choice',
      subject: practiceState.exam.title,
      educationType: practiceState.exam.examType === 'bagrut' ? 'high_school' : 'technical_college'
    });
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