import React, { useState } from 'react';
import { Space, Typography } from 'antd';
import { Question, QuestionStatus, DatabaseQuestion } from '../../../../../types/question';
import { QuestionMetadataSection } from './content/Metadata';
import { QuestionContentSection } from './content/Content';
import { SolutionAndEvaluationSection } from './content/Solution';

interface QuestionContainerProps {
  question?: DatabaseQuestion;
  onSave?: (updatedQuestion: DatabaseQuestion) => Promise<void>;
}

export const QuestionContainer: React.FC<QuestionContainerProps> = ({
  question,
  onSave
}) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleSectionEdit = (sectionId: string) => {
    if (editingSection === sectionId) {
      setEditingSection(null);
    } else {
      setEditingSection(sectionId);
    }
  };

  const handleSectionSave = async (sectionId: string, sectionData: any) => {
    if (onSave && question) {
      const updatedQuestion = {
        ...question,
        ...sectionData
      };
      await onSave(updatedQuestion);
    }
    if (editingSection === sectionId) {
      setEditingSection(null);
    }
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
        key="metadata"
        question={question}
        isEditing={editingSection === 'metadata'}
        onEdit={() => handleSectionEdit('metadata')}
        onSave={(data) => handleSectionSave('metadata', data)}
      />

      {/* Content Section */}
      <QuestionContentSection
        key="content"
        question={question}
        onEdit={() => handleSectionEdit('content')}
        onSave={(data) => handleSectionSave('content', data)}
      />

      {/* Solution and Evaluation Section */}
      <SolutionAndEvaluationSection
        key="solution"
        question={question}
        isEditing={editingSection === 'solution'}
        onEdit={() => handleSectionEdit('solution')}
        onSave={(data) => handleSectionSave('solution', data)}
      />
    </Space>
  );
}; 