import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import styled from 'styled-components';
import { DatabaseQuestion, SaveQuestion, ValidationStatus, SourceType } from '../../../types/question';
import { validateQuestion, ValidationResult } from '../../../utils/questionValidator';
import { QuestionEditorHeader } from './QuestionEditorHeader';
import { QuestionContentSection, QuestionContentSectionHandle } from '../../../pages/admin/components/questions/editor/content/Content';
import { QuestionStatusHeader } from '../../../pages/admin/components/questions/editor/content/QuestionStatusHeader';
import { Space, Typography, Button, Input, Select, Rate } from 'antd';
import { EditableWrapper } from '../../../components/shared/EditableWrapper';
import LexicalEditor from '../../../components/editor/LexicalEditor';
import { questionStorage } from '../../../services/admin/questionStorage';
import { QuestionProvider } from '../../../contexts/QuestionContext';
import { PropertiesPanel } from './layout/PropertiesPanel';
import { useQuestion } from '../../../contexts/QuestionContext';
import { universalTopicsV2 } from '../../../services/universalTopics';
import { getQuestionSourceDisplay } from '../../../utils/translations';
import { MetadataSection, MetadataSectionHandle } from '../../../pages/admin/components/questions/editor/content/MetadataSection';

const { Text } = Typography;

const MetadataLabel = styled(Text)`
  font-size: 13px;
  color: #9ca3af;
  display: block;
  margin-bottom: 4px;
`;

const MetadataValue = styled(Text)`
  font-size: 15px;
  color: #000000;
  display: block;
  font-weight: 500;
`;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  width: 100%;
`;

const HeaderContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ContentContainer = styled.div`
  display: flex;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
`;

const MainPanel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const EditorPanel = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const QuestionHeader = styled.div`
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PropertiesSidebar = styled.div`
  width: 320px;
  flex-shrink: 0;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  align-self: flex-start;
  position: sticky;
  top: 24px;
`;

const PropertiesContent = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const MetadataItem = styled.div`
  &:not(:last-child) {
    margin-bottom: 24px;
  }
`;

const MainContent = styled.div`
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  .question-content-wrapper {
    font-size: 18px;
    line-height: 1.8;
    color: #000000;
  }

  .question-content-wrapper h1,
  .question-content-wrapper h2,
  .question-content-wrapper h3 {
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    color: #000000;
    font-size: 20px;
    font-weight: 600;
  }

  .question-content-wrapper p {
    margin-bottom: 1.25em;
    color: #000000;
  }
`;

const getDifficultyLabel = (difficulty: number): string => {
  switch (difficulty) {
    case 1:
      return 'קל מאוד';
    case 2:
      return 'קל';
    case 3:
      return 'בינוני';
    case 4:
      return 'קשה';
    case 5:
      return 'קשה מאוד';
    default:
      return 'לא מוגדר';
  }
};

interface QuestionEditorContainerProps {
  question: DatabaseQuestion;
  onSave: (data: SaveQuestion) => Promise<DatabaseQuestion>;
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
  const [providerKey, setProviderKey] = useState(0);
  const contentSectionRef = useRef<QuestionContentSectionHandle>(null);
  const metadataSectionRef = useRef<MetadataSectionHandle>(null);

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
    // Force QuestionProvider to re-mount with new question
    setProviderKey(prev => prev + 1);
  }, [initialQuestion]);

  const handleSave = async () => {
    try {
      const savedQuestion = await onSave(editedQuestion);
      // Update parent with saved question data
      onQuestionUpdated(savedQuestion);
      // Reset form state
      contentSectionRef.current?.resetChanges();
      metadataSectionRef.current?.resetChanges();
    } catch (error) {
      console.error('Failed to save question:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    // Reset to original question
    handleQuestionChange(initialQuestion);
    contentSectionRef.current?.resetChanges();
    metadataSectionRef.current?.resetChanges();
  };

  return (
    <QuestionProvider key={providerKey} question={initialQuestion}>
      <EditorContainer>
        <HeaderContainer>
          <QuestionStatusHeader
            question={editedQuestion}
            onBack={props.onNavigateBack}
            onPrevious={props.onPrevious}
            onNext={props.onNext}
            hasPrevious={props.hasPrevious}
            hasNext={props.hasNext}
            currentPosition={props.currentPosition}
            hasUnsavedChanges={isModified}
            onQuestionUpdated={onQuestionUpdated}
          />

          <QuestionEditorHeader
            isModified={isModified}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </HeaderContainer>

        <ContentContainer>
          <MainPanel>
            <EditorPanel>
              <MainContent>
                <QuestionContentSection
                  ref={contentSectionRef}
                  question={editedQuestion}
                  onContentChange={handleQuestionChange}
                  onFieldBlur={() => {}}
                />
              </MainContent>
            </EditorPanel>
          </MainPanel>

          <PropertiesSidebar>
            <PropertiesContent>
              <MetadataSection
                ref={metadataSectionRef}
                question={editedQuestion}
                onContentChange={handleQuestionChange}
                onFieldBlur={() => {}}
              />
            </PropertiesContent>
          </PropertiesSidebar>
        </ContentContainer>
      </EditorContainer>
    </QuestionProvider>
  );
}; 