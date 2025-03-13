import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import styled from 'styled-components';
import { DatabaseQuestion, SaveQuestion, ValidationStatus } from '../../../types/question';
import { validateQuestion, ValidationResult } from '../../../utils/questionValidator';
import { QuestionEditorHeader } from './QuestionEditorHeader';
import { QuestionContentSection, QuestionContentSectionHandle } from '../../../pages/admin/components/questions/editor/content/Content';
import { QuestionStatusHeader } from '../../../pages/admin/components/questions/editor/content/QuestionStatusHeader';
import { Space } from 'antd';
import { EditableWrapper } from '../../../components/shared/EditableWrapper';
import LexicalEditor from '../../../components/editor/LexicalEditor';
import { questionStorage } from '../../../services/admin/questionStorage';
import { QuestionProvider } from '../../../contexts/QuestionContext';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const ContentContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

interface QuestionEditorContainerProps {
  question: DatabaseQuestion;
  onSave: (data: SaveQuestion) => Promise<void>;
  onQuestionUpdated: (updated: DatabaseQuestion) => void;
  onNavigateBack: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentPosition?: {
    current: number;
    filteredTotal: number;
  };
}

export const QuestionEditorContainer: React.FC<QuestionEditorContainerProps> = ({
  question: initialQuestion,
  onSave,
  onQuestionUpdated,
  ...props
}) => {
  const [editedQuestion, setEditedQuestion] = useState(initialQuestion);
  const [isModified, setIsModified] = useState(false);

  const handleQuestionChange = (updated: Partial<DatabaseQuestion>) => {
    // Ensure we have a complete question by merging with current
    const fullQuestion = { ...editedQuestion, ...updated };
    setEditedQuestion(fullQuestion);
    // Check if question has changed from initial
    setIsModified(JSON.stringify(fullQuestion.data) !== JSON.stringify(initialQuestion.data));
  };

  // Reset modified state when we get a new question
  useEffect(() => {
    setEditedQuestion(initialQuestion);
    setIsModified(false);
  }, [initialQuestion]);

  return (
    <QuestionProvider question={initialQuestion}>
      <QuestionEditorContent
        question={editedQuestion}
        onQuestionChange={handleQuestionChange}
        isModified={isModified}
        onSave={onSave}
        onQuestionUpdated={onQuestionUpdated}
        {...props}
      />
    </QuestionProvider>
  );
};

interface QuestionEditorContentProps {
  question: DatabaseQuestion;
  onQuestionChange: (updated: Partial<DatabaseQuestion>) => void;
  isModified: boolean;
  onSave: (data: SaveQuestion) => Promise<void>;
  onQuestionUpdated: (updated: DatabaseQuestion) => void;
  onNavigateBack: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentPosition?: {
    current: number;
    filteredTotal: number;
  };
}

const QuestionEditorContent: React.FC<QuestionEditorContentProps> = ({
  question,
  onQuestionChange,
  isModified,
  onSave,
  onQuestionUpdated,
  ...props
}) => {
  const contentSectionRef = useRef<QuestionContentSectionHandle>(null);
  const [resetKey, setResetKey] = useState(Date.now());

  const handleContentChange = async (changes: Partial<DatabaseQuestion>) => {
    if (!changes.data) return;
    onQuestionChange(changes);
  };

  const handleFieldBlur = async () => {
    // No need to do anything on blur - validation comes from DB
  };

  const handleSave = async () => {
    await onSave(question);
  };

  const handleCancel = () => {
    // Just exit edit mode - EditableWrapper will handle resetting values
    if (contentSectionRef.current) {
      contentSectionRef.current.resetChanges();
    }
    
    // Reset to original question
    onQuestionChange(question);
    setResetKey(Date.now());
  };

  return (
    <EditorContainer>
      <QuestionStatusHeader
        question={question}
        onBack={props.onNavigateBack}
        onPrevious={props.onPrevious}
        onNext={props.onNext}
        hasPrevious={props.hasPrevious}
        hasNext={props.hasNext}
        currentPosition={props.currentPosition}
        hasUnsavedChanges={isModified}
        onQuestionUpdated={onQuestionUpdated}
      />

      <ContentContainer>
        <QuestionEditorHeader
          isModified={isModified}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        <QuestionContentSection
          key={resetKey}
          ref={contentSectionRef}
          question={question}
          onContentChange={handleContentChange}
          onFieldBlur={handleFieldBlur}
        />
      </ContentContainer>
    </EditorContainer>
  );
}; 