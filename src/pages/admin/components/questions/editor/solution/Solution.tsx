import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Space, Typography } from 'antd';
import styled from 'styled-components';
import { DatabaseQuestion } from '../../../../../../types/question';
import { EditableWrapper } from '../../../../../../components/shared/EditableWrapper';
import LexicalEditor from '../../../../../../components/editor/LexicalEditor';
import { EditorWrapper } from '../../../../../../styles/adminEditStyles';

const { Text } = Typography;

const SectionLabel = styled(Text)`
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 4px;
  display: block;
`;

const ContentDisplay = styled.div`
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

export interface SolutionSectionHandle {
  resetChanges: () => void;
}

export interface SolutionSectionProps {
  question: DatabaseQuestion;
  onContentChange: (changes: Partial<DatabaseQuestion>) => void;
  onFieldBlur?: () => void;
}

export const SolutionSection = forwardRef<SolutionSectionHandle, SolutionSectionProps>(({
  question,
  onContentChange,
  onFieldBlur
}, ref) => {
  const [editableFields, setEditableFields] = useState({
    solution: false
  });

  useImperativeHandle(ref, () => ({
    resetChanges: () => {
      console.log('[Solution] Reset changes called');
      setEditableFields({
        solution: false
      });
    }
  }));

  const handleSolutionChange = (text: string) => {
    console.log('[Solution] Solution changed:', text.slice(0, 50) + '...');
    onContentChange({
      data: {
        ...question.data,
        solution: {
          text,
          format: 'markdown'
        }
      }
    });
  };

  const validateSolution = (value: string) => {
    return value && value.trim().length > 0;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <EditableWrapper
        label={<SectionLabel>פתרון השאלה</SectionLabel>}
        fieldPath="solution.text"
        placeholder="הזן את פתרון השאלה..."
        onValueChange={handleSolutionChange}
        onBlur={onFieldBlur}
        validate={validateSolution}
        isEditing={editableFields.solution}
        onStartEdit={() => {
          console.log('[Solution] Starting solution edit');
          setEditableFields(prev => ({ ...prev, solution: true }));
        }}
        onCancelEdit={() => {
          console.log('[Solution] Canceling solution edit');
          setEditableFields(prev => ({ ...prev, solution: false }));
        }}
        renderEditMode={(value, onChange) => (
          <EditorWrapper>
            <LexicalEditor
              initialValue={value || ''}
              onChange={onChange}
              editable={true}
              placeholder="הזן את פתרון השאלה..."
            />
          </EditorWrapper>
        )}
        renderDisplayMode={(value) => (
          <ContentDisplay>{value}</ContentDisplay>
        )}
      />
    </Space>
  );
}); 