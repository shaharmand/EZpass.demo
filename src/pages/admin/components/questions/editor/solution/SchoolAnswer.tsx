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

export interface SchoolAnswerSectionHandle {
  resetChanges: () => void;
}

export interface SchoolAnswerSectionProps {
  question: DatabaseQuestion;
  onContentChange: (changes: Partial<DatabaseQuestion>) => void;
  onFieldBlur?: () => void;
}

export const SchoolAnswerSection = forwardRef<SchoolAnswerSectionHandle, SchoolAnswerSectionProps>(({
  question,
  onContentChange,
  onFieldBlur
}, ref) => {
  const [editableFields, setEditableFields] = useState({
    schoolAnswer: false
  });

  useImperativeHandle(ref, () => ({
    resetChanges: () => {
      console.log('[SchoolAnswer] Reset changes called');
      setEditableFields({
        schoolAnswer: false
      });
    }
  }));

  const handleSchoolAnswerChange = (text: string) => {
    console.log('[SchoolAnswer] School answer changed:', text.slice(0, 50) + '...');
    onContentChange({
      data: {
        ...question.data,
        schoolAnswer: {
          ...question.data.schoolAnswer,
          solution: {
            text,
            format: 'markdown'
          }
        }
      }
    });
  };

  const validateSchoolAnswer = (value: string) => {
    return Boolean(value && value.trim().length > 0);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <EditableWrapper
        label={<SectionLabel>פתרון מלא</SectionLabel>}
        fieldPath="schoolAnswer.solution.text"
        placeholder="הזן את הפתרון המלא..."
        onValueChange={handleSchoolAnswerChange}
        onBlur={onFieldBlur}
        validate={validateSchoolAnswer}
        isEditing={editableFields.schoolAnswer}
        onStartEdit={() => {
          console.log('[SchoolAnswer] Starting school answer edit');
          setEditableFields(prev => ({ ...prev, schoolAnswer: true }));
        }}
        onCancelEdit={() => {
          console.log('[SchoolAnswer] Canceling school answer edit');
          setEditableFields(prev => ({ ...prev, schoolAnswer: false }));
        }}
        renderEditMode={(value, onChange) => (
          <EditorWrapper>
            <LexicalEditor
              initialValue={value || ''}
              onChange={onChange}
              editable={true}
              placeholder="הזן את הפתרון המלא..."
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