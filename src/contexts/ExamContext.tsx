import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Exam, MahatExams, BagrutExams } from '../types/exam';
import { examService } from '../services/examService';

interface ExamContextType {
  loading: boolean;
  error: string | null;
  bagrutExams: Exam[];
  mahatExams: Exam[];
  selectedExam: Exam | null;
  setSelectedExam: (exam: Exam | null) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bagrutExams, setBagrutExams] = useState<Exam[]>([]);
  const [mahatExams, setMahatExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const [bagrutData, mahatData] = await Promise.all([
          examService.getBagrutExams(),
          examService.getMahatExams()
        ]);

        setBagrutExams(bagrutData.exams);
        setMahatExams(mahatData.exams);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exam data');
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  return (
    <ExamContext.Provider 
      value={{ 
        loading, 
        error, 
        bagrutExams, 
        mahatExams, 
        selectedExam, 
        setSelectedExam 
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