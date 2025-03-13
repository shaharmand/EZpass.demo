import React from 'react';
import { QuestionContainer } from './components/questions/editor/QuestionContainer';

export const QuestionLibrary: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Question Library</h1>
      <QuestionContainer />
    </div>
  );
}; 