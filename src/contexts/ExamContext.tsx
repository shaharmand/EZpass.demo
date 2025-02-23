import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ExamTemplate } from '../types/examTemplate';
import { examService } from '../services/examService';
import { ExamType } from '../types/examTemplate';

interface ExamContextType {
  loading: boolean;
  error: string | null;
  bagrutExams: ExamTemplate[];
  mahatExams: ExamTemplate[];
  selectedExam: ExamTemplate | null;
  setSelectedExam: (exam: ExamTemplate | null) => void;
  findExamById: (examId: string) => ExamTemplate | undefined;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bagrutExams, setBagrutExams] = useState<ExamTemplate[]>([]);
  const [mahatExams, setMahatExams] = useState<ExamTemplate[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamTemplate | null>(null);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const [bagrutData, mahatData] = await Promise.all([
          examService.getExamsByType(ExamType.BAGRUT_EXAM),
          examService.getExamsByType(ExamType.MAHAT_EXAM)
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

  const findExamById = (examId: string) => {
    return [...bagrutExams, ...mahatExams].find(exam => exam.id === examId);
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
        findExamById
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within ExamProvider');
  }
  return context;
}; 