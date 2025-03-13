import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, Space, Typography, Button, Input, Row, Col, Tag, Select, message } from 'antd';
import type { InputRef } from 'antd/lib/input';
import { EditOutlined, FileTextOutlined, SaveOutlined, WarningOutlined, CloseOutlined } from '@ant-design/icons';
import { Question, DatabaseQuestion, SaveQuestion, ValidationStatus, PublicationStatusEnum, QuestionType, NumericalAnswer, FinalAnswerType } from '../../../../../../types/question';
import { universalTopics } from '../../../../../../services/universalTopics';
import { Topic, SubTopic } from '../../../../../../types/subject';
import { QuestionContent } from '../../../../../../components/question/QuestionContent';
import { QuestionAndOptionsDisplay } from '../../../../../../components/question/QuestionAndOptionsDisplay';
import { validateQuestion, ValidationError } from '../../../../../../utils/questionValidator';
import { ValidationDisplay } from '../../../../../../components/validation/ValidationDisplay';
import { MarkdownEditor } from '../../../../../../components/MarkdownEditor';
import styled from 'styled-components';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import LexicalEditor from '../../../../../../components/editor/LexicalEditor';
import { EditableWrapper } from '../../../../../../components/shared/EditableWrapper';
import { EditorWrapper } from '../../../../../../styles/adminEditStyles';

const { Title, Text } = Typography;

const ContentCard = styled(Card)`
  .ant-card-body {
    padding: 24px;
  }
`;

const SectionLabel = styled(Text)`
  font-weight: 400;
  color: #666;
  margin-bottom: 8px;
  display: block;
`;

interface TitleSectionProps {
  isEditable?: boolean;
}

const ContentSection = styled.div<{ isEditable: boolean }>`
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.isEditable ? '#40a9ff' : '#f0f0f0'};
    cursor: ${props => props.isEditable ? 'pointer' : 'default'};
    background: ${props => props.isEditable ? '#fafafa' : '#fff'};
  }
`;

const TitleSection = styled.div<{ isEditable: boolean }>`
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.isEditable ? '#40a9ff' : '#f0f0f0'};
    cursor: ${props => props.isEditable ? 'pointer' : 'default'};
    background: ${props => props.isEditable ? '#fafafa' : '#fff'};
  }
`;

interface EditableWrapperProps {
  isEditable: boolean;
  isEditing?: boolean;
  globalEditing?: boolean;
}

const TitleRow = styled(Row)`
  width: 100%;
`;

const CloseButton = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8c8c8c;
  font-size: 12px;
  transition: all 0.2s;
  z-index: 1;
  
  &:hover {
    background: #d9d9d9;
    color: #595959;
  }
  
  &:active {
    background: #bfbfbf;
    color: #434343;
  }
`;

const TitleInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 4px;
  position: relative;
`;

const TitleInputRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
`;

const TitleStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface CharacterCountProps {
  count: number;
}

const CharacterCount = styled.span<CharacterCountProps>`
  font-size: 12px;
  color: ${props => props.count >= 50 ? '#ff4d4f' : '#8c8c8c'};
  margin-right: 8px;
  min-width: 40px;
  text-align: left;
`;

const EditModeButtons = styled(Space)`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const ButtonGroup = styled(Space)`
  display: flex;
  gap: 8px;
`;

const TitleInput = styled.input`
  width: 100%;
  font-size: 16px;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

const UnsavedChangesText = styled(Text)`
  color: #8c8c8c;
  font-size: 12px;
  margin-right: 8px;
  min-width: 100px;
  text-align: left;
`;

const QuestionText = styled.div`
  font-size: 16px;
  line-height: 1.6;
  color: #595959;
  margin: 16px 0 24px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
`;

const CompactTag = styled(Tag)`
  &&& {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    height: 24px;
    .anticon {
      margin-right: 0;
    }
  }
`;

const ActionButtons = styled(Space)`
  display: flex;
  justify-content: flex-start;
  margin-top: 16px;
  direction: rtl;
`;

const ContentInput = styled(Input.TextArea)`
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  width: 100%;
  resize: vertical;
  min-height: 100px;
  
  &.view-mode {
    color: #262626;
    background: #fafafa;
    border: none;
    cursor: pointer;
    padding: 12px;
    resize: none;
    border-radius: 6px;
    font-weight: 500;
    
    &:hover {
      background: #f0f0f0;
      border: none;
    }
  }

  &.edit-mode {
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: #fff;
    padding: 12px;
    cursor: text;
    font-weight: 500;
    
    &:hover {
      border-color: #40a9ff;
    }
    
    &:focus {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  &.has-changes {
    background: #fffbe6;
    border-color: #faad14;
    
    &:hover, &:focus {
      border-color: #d48806;
      box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
    }
  }
`;

const ContentDisplay = styled.div`
  font-size: 16px;
  line-height: 1.6;
  color: #595959;
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

interface FormattedOption {
  text: string;
  format: "markdown";
}

type QuestionOption = string | FormattedOption;

export interface QuestionContentSectionHandle {
  resetChanges: () => void;
}

export interface QuestionContentSectionProps {
  question: DatabaseQuestion;
  onContentChange: (changes: Partial<DatabaseQuestion>) => void;
  onFieldBlur?: () => void;
}

const EditableFieldContainer = styled.div`
  position: relative;
  width: 100%;

  .edit-field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .edit-field-content {
    position: relative;
    width: 100%;
  }

  .edit-field-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    min-height: 24px;
  }
`;

const EditFieldCancelButton = styled(Button)`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  min-width: 24px;
  padding: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
  z-index: 1;

  &:hover {
    background: #fafafa;
    border-color: #40a9ff;
    color: #40a9ff;
  }

  .anticon {
    font-size: 12px;
    line-height: 1;
  }
`;

const EditFieldLabel = styled.div`
  font-size: 14px;
  color: #262626;
  margin-bottom: 4px;
`;

const EditFieldStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8c8c8c;
`;

export const QuestionContentSection = forwardRef<QuestionContentSectionHandle, QuestionContentSectionProps>(({
  question,
  onContentChange,
  onFieldBlur
}, ref) => {
  const [editableFields, setEditableFields] = useState({
    title: false,
    content: false
  });

  // Expose reset method that just exits edit mode
  useImperativeHandle(ref, () => ({
    resetChanges: () => {
      console.log('[Content] Header cancel - resetChanges called');
      setEditableFields({
        title: false,
        content: false
      });
    }
  }));

  const handleTitleChange = (value: string) => {
    console.log('[Content] Title changed:', value);
    onContentChange({
      data: {
        ...question.data,
        name: value
      }
    });
  };

  const handleContentChange = (text: string) => {
    console.log('[Content] Content changed:', text.slice(0, 50) + '...');
    onContentChange({
      data: {
        ...question.data,
        content: {
          ...question.data.content,
          text
        }
      }
    });
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

  const validateContent = (value: string) => {
    if (!value || value.trim().length === 0) {
      return false;
    }
    return true;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <EditableWrapper
        label="כותרת השאלה"
        fieldPath="name"
        placeholder="הזן כותרת..."
        onValueChange={handleTitleChange}
        onBlur={onFieldBlur}
        validate={validateTitle}
        isEditing={editableFields.title}
        onStartEdit={() => {
          console.log('[Content] Starting title edit');
          setEditableFields(prev => ({ ...prev, title: true }));
        }}
        onCancelEdit={() => {
          console.log('[Content] Canceling title edit');
          setEditableFields(prev => ({ ...prev, title: false }));
        }}
        renderEditMode={(value, onChange) => (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="הזן כותרת..."
            style={{
              width: '100%',
              fontSize: '16px',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              direction: 'rtl'
            }}
          />
        )}
      />

      <EditableWrapper
        label="תוכן השאלה"
        fieldPath="content.text"
        placeholder="הזן את תוכן השאלה..."
        onValueChange={handleContentChange}
        onBlur={onFieldBlur}
        validate={validateContent}
        isEditing={editableFields.content}
        onStartEdit={() => {
          console.log('[Content] Starting content edit');
          setEditableFields(prev => ({ ...prev, content: true }));
        }}
        onCancelEdit={() => {
          console.log('[Content] Canceling content edit');
          setEditableFields(prev => ({ ...prev, content: false }));
        }}
        renderEditMode={(value, onChange) => (
          <EditorWrapper>
            <LexicalEditor
              initialValue={value || ''}
              onChange={onChange}
              editable={true}
              placeholder="הזן את תוכן השאלה..."
            />
          </EditorWrapper>
        )}
      />
    </Space>
  );
}); 