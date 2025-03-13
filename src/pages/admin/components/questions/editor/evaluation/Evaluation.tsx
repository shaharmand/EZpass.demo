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

export interface EvaluationSectionHandle {
  resetChanges: () => void;
}

export interface EvaluationSectionProps {
  question: DatabaseQuestion;
  onContentChange: (changes: Partial<DatabaseQuestion>) => void;
  onFieldBlur?: () => void;
}

export const EvaluationSection = forwardRef<EvaluationSectionHandle, EvaluationSectionProps>(({
  question,
  onContentChange,
  onFieldBlur
}, ref) => {
  const [editableFields, setEditableFields] = useState({
    evaluation: false
  });

  useImperativeHandle(ref, () => ({
    resetChanges: () => {
      console.log('[Evaluation] Reset changes called');
      setEditableFields({
        evaluation: false
      });
    }
  }));

  const handleEvaluationChange = (text: string) => {
    console.log('[Evaluation] Evaluation changed:', text.slice(0, 50) + '...');
    onContentChange({
      data: {
        ...question.data,
        evaluation: {
          text,
          format: 'markdown'
        }
      }
    });
  };

  const validateEvaluation = (value: string) => {
    return value && value.trim().length > 0;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <EditableWrapper
        label={<SectionLabel>הערכה ומשוב</SectionLabel>}
        fieldPath="evaluation.text"
        placeholder="הזן הערכה ומשוב..."
        onValueChange={handleEvaluationChange}
        onBlur={onFieldBlur}
        validate={validateEvaluation}
        isEditing={editableFields.evaluation}
        onStartEdit={() => {
          console.log('[Evaluation] Starting evaluation edit');
          setEditableFields(prev => ({ ...prev, evaluation: true }));
        }}
        onCancelEdit={() => {
          console.log('[Evaluation] Canceling evaluation edit');
          setEditableFields(prev => ({ ...prev, evaluation: false }));
        }}
        renderEditMode={(value, onChange) => (
          <EditorWrapper>
            <LexicalEditor
              initialValue={value || ''}
              onChange={onChange}
              editable={true}
              placeholder="הזן הערכה ומשוב..."
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