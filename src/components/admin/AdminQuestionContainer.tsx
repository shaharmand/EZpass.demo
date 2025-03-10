import React, { useState } from 'react';
import { Space, Typography } from 'antd';
import { Question, QuestionStatus, DatabaseQuestion } from '../../types/question';
import { QuestionMetadataSection } from './sections/QuestionMetadataSection';
import { QuestionContentSection } from './sections/QuestionContentSection';
import { SolutionAndEvaluationSection } from './sections/SolutionAndEvaluationSection';

interface AdminQuestionContainerProps {
  question?: DatabaseQuestion;
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
    if (onSave && question) {
      const updatedQuestion = {
        ...question,
        ...sectionData
      };
      await onSave(updatedQuestion);
    }
    setEditingSection(null);
  };

  if (!question) {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>
        <Typography.Text type="secondary">No question selected</Typography.Text>
      </Space>
    );
  }

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