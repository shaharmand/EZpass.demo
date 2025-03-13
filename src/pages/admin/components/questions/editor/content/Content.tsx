import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, Space, Typography, Button, Input, Row, Col, Tag, Select, message } from 'antd';
import type { InputRef } from 'antd/lib/input';
import { EditOutlined, FileTextOutlined, SaveOutlined, WarningOutlined, CloseOutlined, FormOutlined } from '@ant-design/icons';
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
import { MarkdownRenderer } from '../../../../../../components/MarkdownRenderer';

const { Title, Text } = Typography;

const ContentCard = styled(Card)`
  .ant-card-body {
    padding: 12px;
    background: #ffffff;
  }
`;

const SectionDivider = styled.div`
  height: 1px;
  background: linear-gradient(to right, #f0f0f0 0%, #e6e6e6 50%, #f0f0f0 100%);
  margin: 16px 0;
  width: 100%;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  
  .icon {
    color: #8c8c8c;
    font-size: 14px;
  }
  
  .title {
    color: #262626;
    font-size: 14px;
    font-weight: 500;
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
  font-weight: 500;
  color: #000000;
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
  color: #000000;
  font-weight: 500;
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
    color: #000000;
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
    color: #000000;
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
  }
`;

const ContentDisplay = styled.div`
  padding: 8px 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  min-height: 80px;
  transition: all 0.2s;
  font-size: 15px;
  line-height: 1.5;
  
  &:hover {
    background: #f5f5f5;
    border-color: #d9d9d9;
  }
  
  &[data-placeholder]:empty:before {
    content: attr(data-placeholder);
    color: #bfbfbf;
    font-style: italic;
  }

  p {
    margin-bottom: 8px;
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

interface FormattedOption {
  text: string;
  format: "markdown";
}

type QuestionOption = string | FormattedOption;

interface QuestionContent {
  text: string;
  format: "markdown";
  options?: FormattedOption[];
  answer?: {
    correctOption: number;
  };
}

interface MultipleChoiceContent extends QuestionContent {
  options: FormattedOption[];
  answer?: {
    correctOption: number;
  };
}

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
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 4px;
`;

const EditFieldStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8c8c8c;
`;

const OptionInput = styled.input`
  width: 100%;
  font-size: 15px;
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

const OptionDisplayWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  
  &:hover {
    background: #f0f0f0;
  }
`;

const OptionItem = styled.div<{ isSelected?: boolean; isCorrect?: boolean; index: number }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: ${props => props.isCorrect ? '#f6ffed' : '#ffffff'};
  border: 1px solid ${props => props.isCorrect ? '#b7eb8f' : '#d9d9d9'};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.isCorrect ? '#b7eb8f' : '#40a9ff'};
    background: ${props => props.isCorrect ? '#f6ffed' : '#f6f6f6'};
  }
`;

const CorrectAnswerBadge = styled.div`
  background: #52c41a;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: auto;
`;

const OptionDisplayItem = styled.div<{ isSelected?: boolean; hasUnsavedChanges?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.hasUnsavedChanges ? '#fffbe6' : props.isSelected ? '#eff6ff' : '#ffffff'};
  border: 2px solid ${props => props.hasUnsavedChanges ? '#faad14' : props.isSelected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    border-color: ${props => props.hasUnsavedChanges ? '#faad14' : props.isSelected ? '#3b82f6' : '#3b82f6'};
    background: ${props => props.hasUnsavedChanges ? '#fff8e6' : props.isSelected ? '#eff6ff' : '#f8fafc'};
    transform: translateX(-2px);
  }

  ${props => props.isSelected && `
    &::before {
      content: '';
      position: absolute;
      right: -2px;
      top: -2px;
      bottom: -2px;
      width: 4px;
      background: ${props.hasUnsavedChanges ? '#faad14' : '#3b82f6'};
      border-radius: 0 8px 8px 0;
    }
  `}
`;

const OptionLabel = styled.div<{ index: number; isCorrect?: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${props => props.isCorrect ? '#3b82f6' : '#f3f4f6'};
  border: 2px solid ${props => props.isCorrect ? '#3b82f6' : '#e5e7eb'};
  color: ${props => props.isCorrect ? '#ffffff' : '#4b5563'};
  font-weight: 600;
  transition: all 0.2s;
  flex-shrink: 0;
`;

const EditModeOptionItem = styled.div<{ isSelected?: boolean; hasUnsavedChanges?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: ${props => props.hasUnsavedChanges ? '#fffbe6' : props.isSelected ? '#eff6ff' : '#ffffff'};
  border: 2px solid ${props => props.hasUnsavedChanges ? '#faad14' : props.isSelected ? '#3b82f6' : '#e5e7eb'};
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: ${props => props.hasUnsavedChanges ? '#faad14' : props.isSelected ? '#3b82f6' : '#3b82f6'};
    background: ${props => props.hasUnsavedChanges ? '#fff8e6' : props.isSelected ? '#eff6ff' : '#f8fafc'};
    transform: translateX(-2px);
  }

  ${props => props.isSelected && `
    &::before {
      content: '';
      position: absolute;
      right: -2px;
      top: -2px;
      bottom: -2px;
      width: 4px;
      background: ${props.hasUnsavedChanges ? '#faad14' : '#3b82f6'};
      border-radius: 0 8px 8px 0;
    }
  `}
`;

const RadioButton = styled.div<{ isSelected: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid ${props => props.isSelected ? '#3b82f6' : '#e5e7eb'};
  background: ${props => props.isSelected ? '#3b82f6' : '#ffffff'};
  cursor: pointer;
  transition: all 0.2s;
  margin-right: auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    border-color: #3b82f6;
    background: ${props => props.isSelected ? '#3b82f6' : '#eff6ff'};
  }

  &:after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    opacity: ${props => props.isSelected ? 1 : 0};
  }
`;

export const QuestionContentSection = forwardRef<QuestionContentSectionHandle, QuestionContentSectionProps>(({
  question,
  onContentChange,
  onFieldBlur
}, ref) => {
  const [editableFields, setEditableFields] = useState({
    content: false,
    options: false
  });
  
  const [optionsTextChanges, setOptionsTextChanges] = useState(false);

  useEffect(() => {
    // Reset changes when question changes
    setOptionsTextChanges(false);
  }, [question.id]);

  const getCorrectOption = () => {
    const finalAnswer = question.data.schoolAnswer?.finalAnswer;
    return finalAnswer?.type === 'multiple_choice' ? finalAnswer.value : undefined;
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

  const validateContent = (value: string) => {
    if (!value || value.trim().length === 0) {
      return false;
    }
    return true;
  };

  return (
    <ContentCard>
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {/* Question Content Section */}
        <div>
          <SectionHeader>
            <FileTextOutlined className="icon" />
            <span className="title">שאלה</span>
          </SectionHeader>
          <EditableWrapper
            label={<span />}
            fieldPath="content.text"
            placeholder="הזן את תוכן השאלה..."
            onValueChange={handleContentChange}
            onBlur={onFieldBlur}
            validate={validateContent}
            isEditing={editableFields.content}
            onStartEdit={() => {
              setEditableFields(prev => ({ ...prev, content: true }));
            }}
            onCancelEdit={() => {
              setEditableFields(prev => ({ ...prev, content: false }));
            }}
            renderEditMode={(value, onChange) => (
              <LexicalEditor
                initialValue={value}
                onChange={onChange}
                placeholder="הזן את תוכן השאלה..."
                style={{ minHeight: '80px' }}
              />
            )}
            renderDisplayMode={(value) => (
              <ContentDisplay data-placeholder="לא הוזן תוכן">
                <MarkdownRenderer content={value || ''} />
              </ContentDisplay>
            )}
          />
        </div>

        {/* Options Section */}
        {question.data.metadata.type === QuestionType.MULTIPLE_CHOICE && (
          <>
            <SectionDivider />
            <div>
              <SectionHeader>
                <FormOutlined className="icon" />
                <span className="title">תשובות אפשריות</span>
              </SectionHeader>
              <EditableWrapper
                label={<span />}
                fieldPath="content.options"
                placeholder="הזן אפשרויות..."
                onValueChange={(value) => {
                  setOptionsTextChanges(true);
                  onContentChange({
                    data: {
                      ...question.data,
                      content: {
                        ...question.data.content,
                        options: value
                      }
                    }
                  });
                }}
                onBlur={() => {
                  setOptionsTextChanges(false);
                  onFieldBlur?.();
                }}
                validate={(value) => Array.isArray(value) && value.length > 0}
                isEditing={editableFields.options}
                onStartEdit={() => {
                  setEditableFields(prev => ({ ...prev, options: true }));
                }}
                onCancelEdit={() => {
                  setOptionsTextChanges(false);
                  setEditableFields(prev => ({ ...prev, options: false }));
                }}
                renderEditMode={(value, onChange) => (
                  <Space direction="vertical" style={{ width: '100%' }} size={6}>
                    {[0, 1, 2, 3].map((index) => {
                      const isSelected = getCorrectOption() === index + 1;
                      return (
                        <EditModeOptionItem 
                          key={index} 
                          isSelected={isSelected}
                          hasUnsavedChanges={optionsTextChanges}
                        >
                          <OptionLabel 
                            index={index}
                            isCorrect={isSelected}
                          >
                            {['א', 'ב', 'ג', 'ד'][index]}
                          </OptionLabel>
                          <OptionInput
                            value={value?.[index]?.text || ''}
                            onChange={(e) => {
                              setOptionsTextChanges(true);
                              const newOptions = [...(value || [])];
                              newOptions[index] = { text: e.target.value, format: 'markdown' };
                              onChange(newOptions);
                            }}
                            placeholder={`הזן את אפשרות ${['א', 'ב', 'ג', 'ד'][index]}...`}
                            style={{ direction: 'rtl' }}
                          />
                          <RadioButton
                            isSelected={isSelected}
                            onClick={() => {
                              onContentChange({
                                data: {
                                  ...question.data,
                                  schoolAnswer: {
                                    ...question.data.schoolAnswer,
                                    finalAnswer: {
                                      type: 'multiple_choice',
                                      value: index + 1 as 1 | 2 | 3 | 4
                                    }
                                  }
                                }
                              });
                            }}
                          />
                        </EditModeOptionItem>
                      );
                    })}
                  </Space>
                )}
                renderDisplayMode={(value) => (
                  <Space direction="vertical" style={{ width: '100%' }} size={6}>
                    {value?.map((option: FormattedOption, index: number) => {
                      const isSelected = getCorrectOption() === index + 1;
                      return (
                        <OptionDisplayItem 
                          key={index} 
                          isSelected={isSelected}
                          hasUnsavedChanges={optionsTextChanges}
                        >
                          <OptionLabel
                            index={index}
                            isCorrect={isSelected}
                          >
                            {['א', 'ב', 'ג', 'ד'][index]}
                          </OptionLabel>
                          <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.4' }}>
                            <MarkdownRenderer content={option.text} />
                          </div>
                        </OptionDisplayItem>
                      );
                    })}
                  </Space>
                )}
              />
            </div>
          </>
        )}
      </Space>
    </ContentCard>
  );
}); 