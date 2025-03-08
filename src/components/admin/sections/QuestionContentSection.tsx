import React, { useState } from 'react';
import { Card, Space, Typography, Button, Input, Row, Col, Tag } from 'antd';
import type { InputRef } from 'antd/lib/input';
import { EditOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import { Question, DatabaseQuestion, SaveQuestion, ValidationStatus, PublicationStatusEnum } from '../../../types/question';
import { QuestionContent } from '../../question/QuestionContent';
import { QuestionAndOptionsDisplay } from '../../question/QuestionAndOptionsDisplay';
import { validateQuestion, ValidationError } from '../../../utils/questionValidator';
import { ValidationDisplay } from '../../validation/ValidationDisplay';
import { MarkdownEditor } from '../../MarkdownEditor';
import styled from 'styled-components';
import dayjs from 'dayjs';
import 'dayjs/locale/he';

const { Title, Text } = Typography;

const ContentCard = styled(Card)`
  .ant-card-body {
    padding: 24px;
  }
`;

const SectionLabel = styled(Text)`
  font-weight: 500;
  color: #262626;
  margin-left: 8px;
  white-space: nowrap;
`;

interface TitleSectionProps {
  isEditable?: boolean;
}

const ContentSection = styled.div<TitleSectionProps>`
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => !props.isEditable ? '#40a9ff' : '#f0f0f0'};
    cursor: ${props => !props.isEditable ? 'pointer' : 'default'};
    background: ${props => !props.isEditable ? '#fafafa' : '#fff'};
  }
`;

const TitleSection = styled.div<TitleSectionProps>`
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => !props.isEditable ? '#40a9ff' : '#f0f0f0'};
    cursor: ${props => !props.isEditable ? 'pointer' : 'default'};
    background: ${props => !props.isEditable ? '#fafafa' : '#fff'};
  }
`;

const EditableWrapper = styled.div<{ isEditable: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  
  &:hover:after {
    content: ${props => !props.isEditable ? '"ערוך"' : 'none'};
    position: absolute;
    top: -20px;
    right: 0;
    color: #40a9ff;
    font-size: 12px;
    background: #f0f7ff;
    padding: 2px 8px;
    border-radius: 4px;
    opacity: 1;
  }
`;

const TitleRow = styled(Row)`
  align-items: center;
`;

const TitleInput = styled(Input)`
  font-size: 16px;
  transition: all 0.2s ease;
  width: 100%;
  
  &.view-mode {
    color: #262626;
    background: #fafafa;
    border: none;
    cursor: pointer;
    padding: 8px 12px;
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
    padding: 8px 12px;
    cursor: text;
    
    &:hover {
      border-color: #40a9ff;
    }
    
    &:focus {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  &.has-changes {
    border-color: #faad14;
    
    &:hover, &:focus {
      border-color: #d48806;
      box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
    }
  }
`;

const UnsavedChangesText = styled(Text)`
  color: #faad14;
  font-size: 12px;
  margin-right: 8px;
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
    font-weight: 400;
    
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
    
    &:hover {
      border-color: #40a9ff;
    }
    
    &:focus {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  &.has-changes {
    border-color: #faad14;
    
    &:hover, &:focus {
      border-color: #d48806;
      box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
    }
  }
`;

const OptionsSection = styled.div<TitleSectionProps>`
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => !props.isEditable ? '#40a9ff' : '#f0f0f0'};
    cursor: ${props => !props.isEditable ? 'pointer' : 'default'};
    background: ${props => !props.isEditable ? '#fafafa' : '#fff'};
  }
`;

const OptionWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: #fafafa;

  &:hover {
    background: #f0f0f0;
  }
`;

const OptionLabel = styled.div`
  padding: 4px 8px;
  min-width: 24px;
  text-align: center;
  color: #262626;
  font-weight: 500;
`;

interface RadioButtonProps {
  isSelected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

const RadioButton = styled.div.attrs<RadioButtonProps>(props => ({
  onClick: props.onClick,
  style: props.style
}))<RadioButtonProps>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid ${props => props.isSelected ? '#52c41a' : '#d9d9d9'};
  margin: 0 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.isSelected ? '#52c41a' : 'transparent'};
  }

  &:hover {
    border-color: #52c41a;
  }
`;

const OptionInput = styled(Input)<{ isCorrect?: boolean }>`
  font-size: 16px;
  transition: all 0.2s ease;
  width: 100%;
  
  &.view-mode {
    color: #262626;
    background: ${props => props.isCorrect ? '#f6ffed' : '#fff'};
    border: none;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 6px;
    font-weight: 400;
    
    &:hover {
      border: none;
      background: ${props => props.isCorrect ? '#d9f7be' : '#f5f5f5'};
    }
  }

  &.edit-mode {
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: ${props => props.isCorrect ? '#f6ffed' : '#fff'};
    padding: 8px 12px;
    cursor: text;
    
    &:hover {
      border-color: #40a9ff;
    }
    
    &:focus {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  &.has-changes {
    border-color: #faad14;
    
    &:hover, &:focus {
      border-color: #d48806;
      box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
    }
  }
`;

interface FormattedOption {
  text: string;
  format: "markdown";
}

type QuestionOption = string | FormattedOption;

interface QuestionContentSectionProps {
  question: DatabaseQuestion;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: SaveQuestion) => Promise<void>;
}

interface ContentValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface MultipleChoiceAnswer {
  type: 'multiple_choice';
  value: 1 | 2 | 3 | 4;
}

export const QuestionContentSection: React.FC<QuestionContentSectionProps> = ({
  question,
  isEditing,
  onEdit,
  onSave
}) => {
  const [title, setTitle] = useState(question.data.name || '');
  const [content, setContent] = useState(question.data.content?.text || '');
  const [options, setOptions] = useState<FormattedOption[]>(
    (question.data.content?.options || ['', '', '', '']).map(opt => 
      typeof opt === 'string' ? { text: opt, format: 'markdown' } : opt
    )
  );
  const [correctOption, setCorrectOption] = useState<1 | 2 | 3 | 4 | undefined>(
    question.data.schoolAnswer?.finalAnswer?.type === 'multiple_choice' 
      ? question.data.schoolAnswer.finalAnswer.value as 1 | 2 | 3 | 4
      : undefined
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedContentChanges, setHasUnsavedContentChanges] = useState(false);
  const [hasUnsavedOptionsChanges, setHasUnsavedOptionsChanges] = useState(false);
  const inputRef = React.useRef<InputRef>(null);

  const validateQuestionContent = (updatedQuestion: DatabaseQuestion): ContentValidationResult => {
    const validationResult = validateContent(updatedQuestion);
    return validationResult;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setHasUnsavedChanges(newTitle !== question.data.name);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedContentChanges(newContent !== question.data.content?.text);
  };

  const handleContentClick = () => {
    if (!isEditing) {
      onEdit();
      setTimeout(() => {
        const textArea = document.querySelector('textarea.edit-mode') as HTMLTextAreaElement;
        if (textArea) {
          textArea.focus();
        }
      }, 100);
    }
  };

  const handleTitleClick = () => {
    if (!isEditing) {
      onEdit();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasUnsavedChanges) {
        handleSaveTitle();
      }
    }
  };

  const handleContentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (hasUnsavedContentChanges) {
        handleSaveContent();
      }
    }
  };

  const handleSaveTitle = async () => {
    try {
      const questionData: Question = {
        ...question.data,
        name: title
      };

      const saveOperation: SaveQuestion = {
        id: question.id,
        data: questionData,
        publication_status: question.publication_status,
        validation_status: question.validation_status,
        review_status: question.review_status
      };

      await onSave(saveOperation);
      setHasUnsavedChanges(false);
      if (isEditing) {
        onEdit();
      }
    } catch (error) {
      console.error('Failed to save title:', error);
    }
  };

  const handleSaveContent = async () => {
    try {
      const questionData: Question = {
        ...question.data,
        content: {
          ...question.data.content,
          text: content
        }
      };

      const saveOperation: SaveQuestion = {
        id: question.id,
        data: questionData,
        publication_status: question.publication_status,
        validation_status: question.validation_status,
        review_status: question.review_status
      };

      await onSave(saveOperation);
      setHasUnsavedContentChanges(false);
      if (isEditing) {
        onEdit();
      }
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  const validateContent = (question: DatabaseQuestion): ContentValidationResult => {
    const validationResult = validateQuestion(question.data);
    return {
      success: validationResult.errors.length === 0,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    };
  };

  const validationResult = validateContent(question);
  const contentErrors = validationResult.errors.filter(
    (err: ValidationError) => err.field.startsWith('content') || err.field === 'options'
  );

  const handleCancel = () => {
    setContent(question.data.content?.text || '');
    setHasUnsavedContentChanges(false);
    if (isEditing) {
      onEdit();
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { text: value, format: 'markdown' };
    setOptions(newOptions);
    setHasUnsavedOptionsChanges(
      !question.data.content?.options ||
      newOptions.some((opt, i) => {
        const existingOpt = question.data.content?.options?.[i];
        if (typeof existingOpt === 'object') {
          return opt.text !== existingOpt.text;
        }
        return opt.text !== existingOpt;
      })
    );
  };

  const handleOptionClick = (index: number) => {
    if (!isEditing) {
      onEdit();
      setTimeout(() => {
        const inputs = document.querySelectorAll('input.edit-mode');
        const optionInput = inputs[index] as HTMLInputElement;
        if (optionInput) {
          optionInput.focus();
        }
      }, 100);
    }
  };

  const handleCorrectOptionClick = (index: number) => {
    if (isEditing) {
      setCorrectOption((index + 1) as 1 | 2 | 3 | 4);
      setHasUnsavedOptionsChanges(true);
    }
  };

  const handleSaveOptions = async () => {
    if (!correctOption) return;

    try {
      const questionData: Question = {
        ...question.data,
        content: {
          ...question.data.content,
          text: content,
          options: options
        },
        schoolAnswer: {
          ...question.data.schoolAnswer,
          finalAnswer: {
            type: 'multiple_choice' as const,
            value: correctOption
          }
        }
      };

      const saveOperation: SaveQuestion = {
        id: question.id,
        data: questionData,
        publication_status: question.publication_status,
        validation_status: question.validation_status,
        review_status: question.review_status
      };

      await onSave(saveOperation);
      setHasUnsavedOptionsChanges(false);
      if (isEditing) {
        onEdit();
      }
    } catch (error) {
      console.error('Failed to save options:', error);
    }
  };

  const handleCancelTitle = () => {
    setTitle(question.data.name || '');
    setHasUnsavedChanges(false);
    if (isEditing) {
      onEdit();
    }
  };

  const handleCancelOptions = () => {
    setOptions((question.data.content?.options || ['', '', '', '']).map(opt => 
      typeof opt === 'string' ? { text: opt, format: 'markdown' } : opt
    ));
    setCorrectOption(
      question.data.schoolAnswer?.finalAnswer?.type === 'multiple_choice' 
        ? question.data.schoolAnswer.finalAnswer.value as 1 | 2 | 3 | 4
        : undefined
    );
    setHasUnsavedOptionsChanges(false);
    if (isEditing) {
      onEdit();
    }
  };

  if (!question?.data.content) {
    return (
      <Space direction="vertical" style={{ width: '100%', textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
        <FileTextOutlined style={{ fontSize: '24px', color: '#faad14' }} />
        <Text type="warning">תוכן השאלה חסר</Text>
        <Button 
          type="primary"
          icon={<EditOutlined />}
          onClick={onEdit}
        >
          הוסף תוכן
        </Button>
      </Space>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <TitleSection isEditable={isEditing}>
        <TitleRow>
          <Col flex="0 0 auto">
            <SectionLabel>שם השאלה:</SectionLabel>
          </Col>
          <Col flex="1">
            <EditableWrapper isEditable={isEditing} onClick={handleTitleClick}>
              <TitleInput
                ref={inputRef}
                value={title}
                onChange={handleTitleChange}
                onKeyPress={handleKeyPress}
                placeholder="לא הוגדר שם לשאלה"
                className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedChanges ? 'has-changes' : ''}`}
                readOnly={!isEditing}
              />
            </EditableWrapper>
          </Col>
          <Col flex="0 0 auto">
            <Space>
              {hasUnsavedChanges && (
                <>
                  <UnsavedChangesText>שינויים לא שמורים</UnsavedChangesText>
                  <Button onClick={handleCancelTitle}>
                    בטל
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveTitle}
                  >
                    שמור
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </TitleRow>
      </TitleSection>
      
      <ContentSection isEditable={isEditing}>
        <TitleRow>
          <Col flex="0 0 auto">
            <SectionLabel>תוכן השאלה:</SectionLabel>
          </Col>
          <Col flex="1">
            <EditableWrapper isEditable={isEditing} onClick={handleContentClick}>
              <ContentInput
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="הזן את תוכן השאלה"
                className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedContentChanges ? 'has-changes' : ''}`}
                autoSize={{ minRows: 3, maxRows: 10 }}
                onKeyPress={handleContentKeyPress}
                readOnly={!isEditing}
              />
            </EditableWrapper>
          </Col>
          <Col flex="0 0 auto">
            <Space>
              {hasUnsavedContentChanges && (
                <>
                  <UnsavedChangesText>שינויים לא שמורים</UnsavedChangesText>
                  <Button
                    onClick={handleCancel}
                  >
                    בטל
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveContent}
                  >
                    שמור
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </TitleRow>
      </ContentSection>

      <OptionsSection isEditable={isEditing}>
        <TitleRow>
          <Col flex="0 0 auto">
            <SectionLabel>אפשרויות:</SectionLabel>
          </Col>
          <Col flex="1">
            {options.map((option, index) => (
              <OptionWrapper key={index}>
                <OptionLabel>{String.fromCharCode(1488 + index)}.</OptionLabel>
                <RadioButton 
                  isSelected={correctOption === index + 1}
                  onClick={() => isEditing && handleCorrectOptionClick(index)}
                  style={{ cursor: isEditing ? 'pointer' : 'default' }}
                />
                <EditableWrapper 
                  isEditable={isEditing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionClick(index);
                  }}
                  style={{ flex: 1 }}
                >
                  <OptionInput
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`אפשרות ${index + 1}`}
                    className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedOptionsChanges ? 'has-changes' : ''}`}
                    readOnly={!isEditing}
                    onClick={(e) => e.stopPropagation()}
                    isCorrect={correctOption === index + 1}
                  />
                </EditableWrapper>
              </OptionWrapper>
            ))}
          </Col>
          <Col flex="0 0 auto">
            <Space>
              {hasUnsavedOptionsChanges && (
                <>
                  <UnsavedChangesText>שינויים לא שמורים</UnsavedChangesText>
                  <Button onClick={handleCancelOptions}>
                    בטל
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveOptions}
                  >
                    שמור
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </TitleRow>
      </OptionsSection>
    </Space>
  );
}; 