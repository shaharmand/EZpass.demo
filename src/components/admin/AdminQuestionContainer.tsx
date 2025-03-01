import React, { useState } from 'react';
import { Space } from 'antd';
import { Question, QuestionStatus, DatabaseQuestion } from '../../types/question';
import { QuestionMetadataSection } from './sections/QuestionMetadataSection';
import { QuestionContentSection } from './sections/QuestionContentSection';
import { SolutionAndEvaluationSection } from './sections/SolutionAndEvaluationSection';

interface AdminQuestionContainerProps {
  question: DatabaseQuestion;
  onSave?: (updatedQuestion: DatabaseQuestion) => Promise<void>;
}

export const AdminQuestionContainer: React.FC<AdminQuestionContainerProps> = ({
  question,
  onSave
}) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleSectionEdit = (sectionId: string) => {
    setEditingSection(sectionId);
  };

  const handleSectionSave = async (sectionId: string, sectionData: any) => {
    if (onSave) {
      const updatedQuestion = {
        ...question,
        ...sectionData
      };
      await onSave(updatedQuestion);
    }
    setEditingSection(null);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Metadata Section */}
      <QuestionMetadataSection
        question={question}
        isEditing={editingSection === 'metadata'}
        onEdit={() => handleSectionEdit('metadata')}
        onSave={(data) => handleSectionSave('metadata', data)}
      />

      {/* Content Section */}
      <QuestionContentSection
        question={question}
        isEditing={editingSection === 'content'}
        onEdit={() => handleSectionEdit('content')}
        onSave={(data) => handleSectionSave('content', data)}
      />

      {/* Solution and Evaluation Section */}
      <SolutionAndEvaluationSection
        question={question}
        isEditing={editingSection === 'solution'}
        onEdit={() => handleSectionEdit('solution')}
        onSave={(data) => handleSectionSave('solution', data)}
      />
    </Space>
  );
}; 