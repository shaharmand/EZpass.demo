import React, { useState } from 'react';
import styled from 'styled-components';
import { Space, Button, Affix } from 'antd';
import { DatabaseQuestion, SaveQuestion } from '../../../types/question';
import { PropertiesPanel } from './layout/PropertiesPanel';
import { BasicQuestionEditor } from './BasicQuestionEditor';
import { WarningOutlined } from '@ant-design/icons';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  padding: 24px;
  gap: 24px;
`;

const PropertiesPanelContainer = styled.div`
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: fit-content;
  position: sticky;
  top: 88px;
`;

const MainContentContainer = styled.div`
  flex: 1;
`;

const ActionBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  
  .unsaved-changes {
    margin-right: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #faad14;
  }
`;

interface QuestionEditorProps {
  question: DatabaseQuestion;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: SaveQuestion) => Promise<void>;
  onExitEdit?: () => void;
  onModified?: (modified: boolean) => void;
  onCancel?: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  isEditing,
  onEdit,
  onSave,
  onExitEdit,
  onModified,
  onCancel
}) => {
  const [isModified, setIsModified] = useState(false);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  const handlePropertyChange = (property: string, value: any) => {
    setChangedFields(prev => {
      const next = new Set(prev);
      next.add(property);
      return next;
    });
    setIsModified(true);
    onModified?.(true);
  };

  const handleContentChange = (field: string, value: any) => {
    setChangedFields(prev => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
    setIsModified(true);
    onModified?.(true);
  };

  const handleSave = async () => {
    if (!question) return;

    try {
      // Collect all modified fields
      const updatedData = {
        ...question.data
      };

      // Update modified fields
      changedFields.forEach(field => {
        if (field === 'name') {
          updatedData.name = question.data.name;
        } else if (field === 'content.text') {
          updatedData.content = {
            ...updatedData.content,
            text: question.data.content.text
          };
        }
        // Add other field updates as needed
      });

      // Prepare the save operation with all required fields
      const saveOperation: SaveQuestion = {
        id: question.id,
        data: updatedData,
        publication_status: question.publication_status,
        validation_status: question.validation_status,
        review_status: question.review_status
      };

      await onSave(saveOperation);
      setIsModified(false);
      setChangedFields(new Set());
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  return (
    <EditorContainer>
      <ContentContainer>
        <PropertiesPanelContainer>
          <PropertiesPanel
            type={question.data.metadata.type}
            topicId={question.data.metadata.topicId}
            subtopicId={question.data.metadata.subtopicId}
            difficulty={question.data.metadata.difficulty}
            estimatedTime={question.data.metadata.estimatedTime}
            source={question.data.metadata.source}
            subjectId={question.data.metadata.subjectId}
            domainId={question.data.metadata.domainId}
            isEditing={isEditing}
            onPropertyChange={handlePropertyChange}
          />
        </PropertiesPanelContainer>
        
        <MainContentContainer>
          <BasicQuestionEditor
            question={question}
            isEditing={isEditing}
            onContentChange={handleContentChange}
          />
        </MainContentContainer>
      </ContentContainer>

      {isEditing && (
        <ActionBar>
          {isModified && (
            <div className="unsaved-changes">
              <WarningOutlined />
              <span>יש שינויים שלא נשמרו</span>
            </div>
          )}
          <Button onClick={onCancel} disabled={!isModified}>
            בטל
          </Button>
          <Button 
            type="primary"
            onClick={handleSave}
            disabled={!isModified}
          >
            שמור שינויים
          </Button>
        </ActionBar>
      )}
    </EditorContainer>
  );
}; 