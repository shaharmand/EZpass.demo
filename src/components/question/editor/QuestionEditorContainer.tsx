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
import { QuestionProvider, useQuestion } from '../../../contexts/QuestionContext';
import { PropertiesPanel } from './layout/PropertiesPanel';
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
  gap: 8px;
  padding: 0;
  width: 100%;
  position: relative;
  overflow: visible;

  // Ensure tooltips are visible globally
  .ant-tooltip {
    z-index: 1500 !important;
  }
`;

const HeaderContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  z-index: 100;
`;

const ContentContainer = styled.div`
  display: flex;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
  height: auto;
  min-height: 100%;
  padding-bottom: 300px; /* Added more padding to ensure we can scroll past the bottom content */

  @media (max-width: 1024px) {
    flex-direction: column;
    padding-bottom: 300px;
  }
`;

const MainPanel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  margin-bottom: 100px;
  height: calc(100vh - 200px);
  padding-right: 16px;
  margin-top: 0;

  > * {
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    overflow: visible;
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
  z-index: 2;
  overflow-y: auto;
  max-height: calc(100vh - 100px);
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
  width: 100%;
  height: auto;
  overflow: visible;

  .question-content-wrapper {
    font-size: 18px;
    line-height: 1.8;
    color: #000000;
    width: 100%;
    height: auto;
    overflow: visible;
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
  overflow: visible;
  height: auto;
  width: 100%;
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

// Add metadata field definitions
const METADATA_FIELDS = {
  // Basic info
  type: { path: 'data.metadata.type' },
  subjectId: { path: 'data.metadata.subjectId' },
  domainId: { path: 'data.metadata.domainId' },
  
  // Topic classification
  topicId: { path: 'data.metadata.topicId' },
  subtopicId: { path: 'data.metadata.subtopicId' },
  
  // Characteristics
  difficulty: { path: 'data.metadata.difficulty' },
  estimatedTime: { path: 'data.metadata.estimatedTime' },
  
  // Source
  source: { path: 'data.metadata.source' },
} as const;

// Add type for metadata field keys
type MetadataField = keyof typeof METADATA_FIELDS;

// Helper functions
const getValueByPath = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

const setValueByPath = (obj: any, path: string, value: any) => {
  const parts = path.split('.');
  const lastPart = parts.pop()!;
  const target = parts.reduce((acc, part) => {
    if (!acc[part]) acc[part] = {};
    return acc[part];
  }, obj);
  target[lastPart] = value;
  return obj;
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

const QuestionEditorInner: React.FC<{
  editedQuestion: DatabaseQuestion;
  onQuestionChange: (changes: Partial<DatabaseQuestion>) => void;
  contentSectionRef: React.RefObject<QuestionContentSectionHandle>;
  metadataSectionRef: React.RefObject<MetadataSectionHandle>;
  schoolAnswerSectionRef: React.RefObject<SchoolAnswerSectionHandle>;
  evaluationSectionRef: React.RefObject<EvaluationSectionHandle>;
  editableFields: {
    title: boolean;
    content: boolean;
    options: boolean;
  };
  setEditableFields: React.Dispatch<React.SetStateAction<{
    title: boolean;
    content: boolean;
    options: boolean;
  }>>;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onBack: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentPosition?: {
    current: number;
    filteredTotal: number;
  };
  onQuestionUpdated: (updated: DatabaseQuestion) => void;
}> = ({
  editedQuestion,
  onQuestionChange,
  contentSectionRef,
  metadataSectionRef,
  schoolAnswerSectionRef,
  evaluationSectionRef,
  editableFields,
  setEditableFields,
  onSave,
  onCancel,
  onBack,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  currentPosition,
  onQuestionUpdated
}) => {
  const { originalQuestion } = useQuestion();

  const hasUnsavedChanges = () => {
    if (!originalQuestion?.current || !editedQuestion) {
      console.log('Missing original or edited question');
      return false;
    }

    const original = originalQuestion.current;
    
    // Define paths to compare
    const pathsToCompare = [
      // Basic fields
      'data.name',
      'data.content.text',
      // Metadata fields - use our field definitions
      ...Object.values(METADATA_FIELDS).map(field => field.path),
      // School answer fields
      'data.schoolAnswer.finalAnswer',
      'data.schoolAnswer.solution',
      'data.schoolAnswer.explanation',
      // Content fields
      'data.content.options'
    ];

    // Compare each path
    for (const path of pathsToCompare) {
      const originalValue = getValueByPath(original, path);
      const currentValue = getValueByPath(editedQuestion, path);

      // Log the comparison
      console.log(`Comparing ${path}:`, {
        original: originalValue,
        current: currentValue
      });

      // Special handling for arrays (topics, tags, options)
      if (Array.isArray(originalValue) || Array.isArray(currentValue)) {
        const origStr = JSON.stringify(originalValue || []);
        const currStr = JSON.stringify(currentValue || []);
        if (origStr !== currStr) {
          console.log(`Change detected in ${path}:`, {
            original: originalValue,
            current: currentValue
          });
          return true;
        }
        continue;
      }

      // Special handling for final answer
      if (path === 'data.schoolAnswer.finalAnswer' && originalValue && currentValue) {
        if (originalValue.type !== currentValue.type) {
          console.log('Final answer type changed');
          return true;
        }
        if (originalValue.type === 'multiple_choice' && currentValue.type === 'multiple_choice') {
          if (originalValue.value !== currentValue.value) {
            console.log('Multiple choice value changed');
            return true;
          }
        }
        if (originalValue.type === 'numerical' && currentValue.type === 'numerical') {
          if (originalValue.value !== currentValue.value || 
              originalValue.tolerance !== currentValue.tolerance) {
            console.log('Numerical value or tolerance changed');
            return true;
          }
        }
        continue;
      }

      // Regular value comparison
      if (JSON.stringify(originalValue) !== JSON.stringify(currentValue)) {
        console.log(`Change detected in ${path}:`, {
          original: originalValue,
          current: currentValue
        });
        return true;
      }
    }

    console.log('No changes detected');
    return false;
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
    <EditorContainer>
      <HeaderContainer>
        <QuestionStatusHeader
          question={editedQuestion}
          hasUnsavedChanges={hasUnsavedChanges()}
          onQuestionUpdated={onQuestionUpdated}
          onBack={() => {}}
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
                  onQuestionChange({
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
                onEdit={() => {
                  // This is called when editing starts/ends
                  setEditableFields(prev => ({ ...prev, content: !prev.content }));
                }}
                onSave={async (changes) => {
                  // This is called when content changes
                  onQuestionChange(changes);
                }}
              />
            </SectionContent>
          </div>

          <div>
            <SectionHeader>
              <SectionTitle>פתרון בית ספר</SectionTitle>
            </SectionHeader>
            <SectionContent>
              <SchoolAnswerSection
                ref={schoolAnswerSectionRef}
                question={editedQuestion}
                onContentChange={onQuestionChange}
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
                onContentChange={onQuestionChange}
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
              onContentChange={(changes: Partial<DatabaseQuestion>) => {
                console.log('Metadata changes:', changes);
                onQuestionChange(changes);
              }}
            />
          </PropertiesContent>
        </PropertiesSidebar>
      </ContentContainer>

      <QuestionEditorActionBar
        hasUnsavedChanges={hasUnsavedChanges()}
        onSave={onSave}
        onCancel={onCancel}
      />
    </EditorContainer>
  );
};

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

  useEffect(() => {
    setEditedQuestion(question);
  }, [question]);

  const handleQuestionChange = (changes: Partial<DatabaseQuestion>) => {
    console.log('[QuestionEditorContainer] Handling question change:', changes);
    
    setEditedQuestion(prev => {
      if (!prev) return prev;
      
      // Deep merge all sections
      return {
        ...prev,
        ...changes,
        data: {
          ...prev.data,
          ...changes.data,
          // Preserve and merge content section
          content: {
            ...prev.data?.content,
            ...changes.data?.content
          },
          // Preserve and merge metadata section
          metadata: {
            ...prev.data?.metadata,
            ...changes.data?.metadata
          },
          // Preserve and merge school answer section
          schoolAnswer: {
            ...prev.data?.schoolAnswer,
            ...changes.data?.schoolAnswer
          },
          // Preserve and merge evaluation section
          evaluationGuidelines: {
            ...prev.data?.evaluationGuidelines,
            ...changes.data?.evaluationGuidelines
          }
        }
      };
    });
  };

  // Reset state when we get a new question
  useEffect(() => {
    console.log('Question prop changed:', question);
    setEditedQuestion(question);
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
    } catch (error) {
      console.error('Failed to save question:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    setEditedQuestion(question);
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

  return (
    <QuestionProvider key={providerKey} question={question}>
      <QuestionEditorInner
        editedQuestion={editedQuestion}
        onQuestionChange={handleQuestionChange}
        contentSectionRef={contentSectionRef}
        metadataSectionRef={metadataSectionRef}
        schoolAnswerSectionRef={schoolAnswerSectionRef}
        evaluationSectionRef={evaluationSectionRef}
        editableFields={editableFields}
        setEditableFields={setEditableFields}
        onSave={handleSave}
        onCancel={handleCancel}
        onBack={onNavigateBack}
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        currentPosition={currentPosition}
        onQuestionUpdated={onQuestionUpdated}
      />
    </QuestionProvider>
  );
};

// Add this styled component definition before the component
const QuestionEditorActionBarWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 16px;
`; 