import React from 'react';
import { AdminQuestionContainer } from '../../components/admin/AdminQuestionContainer';

export const QuestionLibrary: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Question Library</h1>
      <AdminQuestionContainer />
    </div>
  );
}; 