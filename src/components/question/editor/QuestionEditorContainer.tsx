import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import styled from 'styled-components';
import { DatabaseQuestion, SaveQuestion, ValidationStatus, SourceType } from '../../../types/question';
import { validateQuestion, ValidationResult } from '../../../utils/questionValidator';
import { QuestionStatusHeader } from '../../../pages/admin/components/questions/editor/content/QuestionStatusHeader';
import { QuestionContentSection, QuestionContentSectionHandle } from '../../../pages/admin/components/questions/editor/content/Content';
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
import { SchoolAnswerSection, SchoolAnswerSectionHandle } from '../../../pages/admin/components/questions/editor/solution/SchoolAnswer';
import { EvaluationSection, EvaluationSectionHandle } from '../../../pages/admin/components/questions/editor/evaluation/Evaluation';
import { QuestionEditorActionBar } from '../../../pages/admin/components/questions/editor/toolbar/QuestionEditorActionBar';
import { MenuUnfoldOutlined, MenuFoldOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

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
  position: relative;
`;

const MainPanel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 32px;
  position: relative;
  z-index: 1;

  > * {
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    overflow: hidden;
  }

  > *:not(:last-child)::after {
    content: '';
    display: block;
    height: 1px;
    margin: 0 24px;
    background: #e5e7eb;
  }
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
  overflow: hidden;
  z-index: 2;
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
`;

const PropertiesHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  background: #f8fafc;
  flex-shrink: 0;
  gap: 8px;
`;

const PropertiesTitle = styled.div`
  font-weight: 500;
  color: #374151;
  font-size: 15px;
  
  .anticon {
    margin-left: 8px;
    color: #6b7280;
  }
`;

const PropertiesContent = styled.div`
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
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

const SectionHeader = styled.div`
  padding: 20px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionContent = styled.div`
  padding: 24px;
`;

const TitleInput = styled.input`
  width: 100%;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

const TitleDisplay = styled.div`
  font-size: 16px;
  line-height: 1.6;
  color: #000000;
  font-weight: 500;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  min-height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f0;
  }

  &:empty:before {
    content: attr(data-placeholder);
    color: #bfbfbf;
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
  question,
  onSave,
  onQuestionUpdated,
  onNavigateBack,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  currentPosition
}) => {
  const [editedQuestion, setEditedQuestion] = useState<DatabaseQuestion>(question);
  const [isModified, setIsModified] = useState(false);
  const [providerKey, setProviderKey] = useState(0);
  const [editableFields, setEditableFields] = useState({
    title: false,
    content: false,
    options: false
  });
  const contentSectionRef = useRef<QuestionContentSectionHandle>(null);
  const metadataSectionRef = useRef<MetadataSectionHandle>(null);
  const schoolAnswerSectionRef = useRef<SchoolAnswerSectionHandle>(null);
  const evaluationSectionRef = useRef<EvaluationSectionHandle>(null);

  const handleQuestionChange = (changes: Partial<DatabaseQuestion>) => {
    setEditedQuestion(prev => ({
      ...prev,
      ...changes
    }));
    setIsModified(true);
  };

  // Reset modified state when we get a new question
  useEffect(() => {
    setEditedQuestion(question);
    setIsModified(false);
    // Force QuestionProvider to re-mount with new question
    setProviderKey(prev => prev + 1);
  }, [question]);

  const handleSave = async () => {
    try {
      const savedQuestion = await onSave(editedQuestion);
      // Update parent with saved question data
      onQuestionUpdated(savedQuestion);
      // Reset form state
      contentSectionRef.current?.resetChanges();
      metadataSectionRef.current?.resetChanges();
      schoolAnswerSectionRef.current?.resetChanges();
      evaluationSectionRef.current?.resetChanges();
      setIsModified(false);
    } catch (error) {
      console.error('Failed to save question:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    setEditedQuestion(question);
    setIsModified(false);
    setEditableFields({
      title: false,
      content: false,
      options: false
    });
    contentSectionRef.current?.resetChanges();
    metadataSectionRef.current?.resetChanges();
    schoolAnswerSectionRef.current?.resetChanges();
    evaluationSectionRef.current?.resetChanges();
    setProviderKey(prev => prev + 1);
  };

  const validateTitle = (value: string) => {
    if (!value || value.trim().length === 0) {
      return false;
    }
    if (value.length > 100) {
      return false;
    }
    return true;
  };

  return (
    <QuestionProvider key={providerKey} question={question}>
      <EditorContainer>
        <HeaderContainer>
          <QuestionStatusHeader
            question={editedQuestion}
            onBack={onNavigateBack}
            onPrevious={onPrevious}
            onNext={onNext}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            currentPosition={currentPosition}
            hasUnsavedChanges={isModified}
            onQuestionUpdated={onQuestionUpdated}
          />
        </HeaderContainer>

        <ContentContainer>
          <MainPanel>
            {/* Title Section */}
            <div>
              <SectionHeader>
                <SectionTitle>שם השאלה</SectionTitle>
              </SectionHeader>
              <SectionContent>
                <EditableWrapper
                  label={<span />}
                  fieldPath="name"
                  placeholder="הזן שם לשאלה..."
                  onValueChange={(value) => {
                    handleQuestionChange({
                      data: {
                        ...editedQuestion.data,
                        name: value
                      }
                    });
                  }}
                  validate={validateTitle}
                  isEditing={editableFields.title}
                  onStartEdit={() => {
                    console.log('[QuestionEditor] Starting title edit');
                    setEditableFields(prev => ({ ...prev, title: true }));
                  }}
                  onCancelEdit={() => {
                    console.log('[QuestionEditor] Canceling title edit');
                    setEditableFields(prev => ({ ...prev, title: false }));
                  }}
                  renderEditMode={(value, onChange) => (
                    <TitleInput
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder="הזן שם לשאלה..."
                      style={{ direction: 'rtl' }}
                      maxLength={100}
                    />
                  )}
                  renderDisplayMode={(value) => (
                    <TitleDisplay data-placeholder="לא הוזן שם">{value}</TitleDisplay>
                  )}
                />
              </SectionContent>
            </div>

            {/* Content Section */}
            <div>
              <SectionHeader>
                <SectionTitle>תוכן השאלה</SectionTitle>
              </SectionHeader>
              <SectionContent>
                <QuestionContentSection
                  ref={contentSectionRef}
                  question={editedQuestion}
                  onContentChange={handleQuestionChange}
                />
              </SectionContent>
            </div>

            <div>
              <SectionHeader>
                <SectionTitle>פתרון מלא</SectionTitle>
              </SectionHeader>
              <SectionContent>
                <SchoolAnswerSection
                  ref={schoolAnswerSectionRef}
                  question={editedQuestion}
                  onContentChange={handleQuestionChange}
                />
              </SectionContent>
            </div>

            <div>
              <SectionHeader>
                <SectionTitle>קריטריוני הערכה</SectionTitle>
              </SectionHeader>
              <SectionContent>
                <EvaluationSection
                  ref={evaluationSectionRef}
                  question={editedQuestion}
                  onContentChange={handleQuestionChange}
                />
              </SectionContent>
            </div>
          </MainPanel>
          <PropertiesSidebar>
            <PropertiesHeader>
              <PropertiesTitle>
                <DatabaseOutlined />
                פרטי השאלה
              </PropertiesTitle>
            </PropertiesHeader>
            <PropertiesContent>
              <MetadataSection
                ref={metadataSectionRef}
                question={editedQuestion}
                onContentChange={handleQuestionChange}
              />
            </PropertiesContent>
          </PropertiesSidebar>
        </ContentContainer>

        <QuestionEditorActionBar
          hasUnsavedChanges={isModified}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </EditorContainer>
    </QuestionProvider>
  );
}; 