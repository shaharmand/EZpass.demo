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
    padding: 24px;
    background: #ffffff;
  }
`;

const SectionDivider = styled.div`
  height: 1px;
  background: linear-gradient(to right, #f0f0f0 0%, #e6e6e6 50%, #f0f0f0 100%);
  margin: 32px 0;
  width: 100%;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  
  .icon {
    color: #8c8c8c;
    font-size: 16px;
  }
  
  .title {
    color: #262626;
    font-size: 16px;
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
  padding: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  min-height: 120px;
  transition: all 0.2s;
  
  &:hover {
    background: #f5f5f5;
    border-color: #d9d9d9;
  }
  
  &[data-placeholder]:empty:before {
    content: attr(data-placeholder);
    color: #bfbfbf;
    font-style: italic;
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

const RadioButton = styled.div<{ isSelected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${props => props.isSelected ? '#52c41a' : '#d9d9d9'};
  background: ${props => props.isSelected ? '#52c41a' : '#ffffff'};
  cursor: pointer;
  transition: all 0.2s;
  margin-right: auto;
  position: relative;

  &:hover {
    border-color: #52c41a;
  }

  &:after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: ${props => props.isSelected ? 1 : 0};
  }
`;

const OptionLabel = styled.div<{ index: number; isCorrect?: boolean }>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.isCorrect ? '#52c41a' : '#f5f5f5'};
  color: ${props => props.isCorrect ? '#ffffff' : '#262626'};
  border-radius: 4px;
  font-weight: bold;
`;

const OptionText = styled.div`
  flex: 1;
  font-size: 15px;
  color: #262626;
`;

const EditModeOptionItem = styled.div<{ isSelected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: ${props => props.isSelected ? '#f6ffed' : '#ffffff'};
  border: 1px solid ${props => props.isSelected ? '#b7eb8f' : '#d9d9d9'};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.isSelected ? '#b7eb8f' : '#40a9ff'};
    background: ${props => props.isSelected ? '#f6ffed' : '#f6f6f6'};
  }
`;

const OptionDisplayItem = styled.div<{ isSelected?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid ${props => props.isSelected ? '#52c41a' : '#f0f0f0'};
  border-radius: 4px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  
  &:hover {
    border-color: ${props => props.isSelected ? '#73d13d' : '#d9d9d9'};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
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

  // Expose reset method that just exits edit mode
  useImperativeHandle(ref, () => ({
    resetChanges: () => {
      console.log('[Content] Header cancel - resetChanges called');
      setEditableFields({
        content: false,
        options: false
      });
    }
  }));

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
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
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
                onBlur={onFieldBlur}
                validate={(value) => Array.isArray(value) && value.length > 0}
                isEditing={editableFields.options}
                onStartEdit={() => {
                  setEditableFields(prev => ({ ...prev, options: true }));
                }}
                onCancelEdit={() => {
                  setEditableFields(prev => ({ ...prev, options: false }));
                }}
                renderEditMode={(value, onChange) => (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {[0, 1, 2, 3].map((index) => {
                      const isSelected = (question.data.content as MultipleChoiceContent).answer?.correctOption === index;
                      return (
                        <EditModeOptionItem key={index} isSelected={isSelected}>
                          <OptionLabel 
                            index={index}
                            isCorrect={isSelected}
                          >
                            {['א', 'ב', 'ג', 'ד'][index]}
                          </OptionLabel>
                          <OptionInput
                            value={value?.[index]?.text || ''}
                            onChange={(e) => {
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
                              const content = question.data.content as MultipleChoiceContent;
                              onContentChange({
                                data: {
                                  ...question.data,
                                  content: {
                                    ...content,
                                    answer: {
                                      correctOption: index
                                    }
                                  } as MultipleChoiceContent
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
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {value?.map((option: FormattedOption, index: number) => {
                      const isSelected = (question.data.content as MultipleChoiceContent).answer?.correctOption === index;
                      return (
                        <OptionDisplayItem key={index} isSelected={isSelected}>
                          <OptionLabel
                            index={index}
                            isCorrect={isSelected}
                          >
                            {['א', 'ב', 'ג', 'ד'][index]}
                          </OptionLabel>
                          <div style={{ flex: 1 }}>
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