import React, { createContext, useContext, useState } from 'react';
import type { Prep } from '../types/prep';

interface StudentPrepContextType {
  activePrep: Prep | null;
  setActivePrep: (prep: Prep | null) => void;
  getStoredPrep: (prepId: string) => Promise<Prep | null>;
}

export const StudentPrepContext = createContext<StudentPrepContextType>({
  activePrep: null,
  setActivePrep: () => {},
  getStoredPrep: async () => null
});

export const useStudentPrep = () => {
  const context = useContext(StudentPrepContext);
  if (!context) {
    throw new Error('useStudentPrep must be used within a StudentPrepProvider');
  }
  return context;
};

export const StudentPrepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePrep, setActivePrep] = useState<Prep | null>(null);

  const getStoredPrep = async (prepId: string): Promise<Prep | null> => {
    // TODO: Implement actual storage logic
    // For now, just return null to indicate prep not found
    return null;
  };

  return (
    <StudentPrepContext.Provider value={{ 
      activePrep, 
      setActivePrep,
      getStoredPrep
    }}>
      {children}
    </StudentPrepContext.Provider>
  );
};

export default StudentPrepProvider; 