import React, { createContext, useContext, useState } from 'react';
import { Prep } from '../types';

interface StudentPrepContextType {
  activePrep: Prep | null;
  setActivePrep: (prep: Prep | null) => void;
}

const StudentPrepContext = createContext<StudentPrepContextType | undefined>(undefined);

export const useStudentPrep = () => {
  const context = useContext(StudentPrepContext);
  if (!context) {
    throw new Error('useStudentPrep must be used within a StudentPrepProvider');
  }
  return context;
};

export const StudentPrepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePrep, setActivePrep] = useState<Prep | null>(null);

  return (
    <StudentPrepContext.Provider
      value={{
        activePrep,
        setActivePrep
      }}
    >
      {children}
    </StudentPrepContext.Provider>
  );
};

export default StudentPrepProvider; 