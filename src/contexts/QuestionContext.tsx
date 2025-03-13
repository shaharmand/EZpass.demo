import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { DatabaseQuestion } from '../types/question';

interface QuestionContextValue {
  originalQuestion: React.RefObject<DatabaseQuestion>;
  onQuestionChange: (listener: (question: DatabaseQuestion) => void) => () => void;
}

const QuestionContext = createContext<QuestionContextValue | null>(null);

export const useQuestion = () => {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error('useQuestion must be used within QuestionProvider');
  }
  return context;
};

interface QuestionProviderProps {
  question: DatabaseQuestion;
  children: React.ReactNode;
}

export const QuestionProvider: React.FC<QuestionProviderProps> = ({
  question,
  children
}) => {
  const originalQuestionRef = useRef(question);
  const listenersRef = useRef(new Set<(q: DatabaseQuestion) => void>());

  // Update ref and notify when question changes
  useEffect(() => {
    originalQuestionRef.current = question;
    listenersRef.current.forEach(listener => listener(question));
  }, [question]);

  const addListener = useCallback((listener: (q: DatabaseQuestion) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return (
    <QuestionContext.Provider value={{
      originalQuestion: originalQuestionRef,
      onQuestionChange: addListener
    }}>
      {children}
    </QuestionContext.Provider>
  );
}; 