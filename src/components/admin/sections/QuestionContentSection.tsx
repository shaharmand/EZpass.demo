import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Button, Input, Row, Col, Tag, Select } from 'antd';
import type { InputRef } from 'antd/lib/input';
import { EditOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import { Question, DatabaseQuestion, SaveQuestion, ValidationStatus, PublicationStatusEnum, QuestionType, NumericalAnswer, FinalAnswerType } from '../../../types/question';
import { universalTopics } from '../../../services/universalTopics';
import { Topic, SubTopic } from '../../../types/subject';
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

const MetadataSection = styled.div<TitleSectionProps>`
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

const MetadataField = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const MetadataLabel = styled(Text)`
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
`;

const MetadataInput = styled(Input)`
  width: 100%;
  
  &.view-mode {
    color: #262626;
    background: #fafafa;
    border: none;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 6px;
    
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

const QuestionTypeSelect = styled(Select<QuestionType>)`
  width: 100%;
  
  &.view-mode {
    .ant-select-selector {
      color: #262626;
      background: #fafafa !important;
      border: none !important;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
      height: auto !important;
      min-height: 32px;
    }
    
    .ant-select-selection-item {
      line-height: 1.5;
      padding: 4px 0;
    }
    
    &:hover .ant-select-selector {
      background: #f0f0f0 !important;
    }
  }

  &.edit-mode {
    .ant-select-selector {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      background: #fff;
      padding: 8px 12px;
      cursor: text;
      height: auto !important;
      min-height: 32px;
    }
    
    .ant-select-selection-item {
      line-height: 1.5;
      padding: 4px 0;
    }
    
    &:hover .ant-select-selector {
      border-color: #40a9ff;
    }
    
    &.ant-select-focused .ant-select-selector {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  &.has-changes {
    .ant-select-selector {
      border-color: #faad14 !important;
    }
    
    &:hover .ant-select-selector,
    &.ant-select-focused .ant-select-selector {
      border-color: #d48806 !important;
      box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
    }
  }
`;

const DifficultySelect = styled(Select<number>)`
  width: 100%;
  
  &.view-mode {
    .ant-select-selector {
      color: #262626;
      background: #fafafa !important;
      border: none !important;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
    }
    
    &:hover .ant-select-selector {
      background: #f0f0f0 !important;
    }
  }

  &.edit-mode {
    .ant-select-selector {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      background: #fff;
      padding: 8px 12px;
      cursor: text;
    }
    
    &:hover .ant-select-selector {
      border-color: #40a9ff;
    }
    
    &.ant-select-focused .ant-select-selector {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  &.has-changes {
    .ant-select-selector {
      border-color: #faad14 !important;
    }
    
    &:hover .ant-select-selector,
    &.ant-select-focused .ant-select-selector {
      border-color: #d48806 !important;
      box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
    }
  }
`;

const SourceSelect = styled(Select<string>)`
  width: 100%;
  
  &.view-mode {
    .ant-select-selector {
      color: #262626;
      background: #fafafa !important;
      border: none !important;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
    }
    
    &:hover .ant-select-selector {
      background: #f0f0f0 !important;
    }
  }

  &.edit-mode {
    .ant-select-selector {
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      background: #fff;
      padding: 8px 12px;
      cursor: text;
    }
    
    &:hover .ant-select-selector {
      border-color: #40a9ff;
    }
    
    &.ant-select-focused .ant-select-selector {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  &.has-changes {
    .ant-select-selector {
      border-color: #faad14 !important;
    }
    
    &:hover .ant-select-selector,
    &.ant-select-focused .ant-select-selector {
      border-color: #d48806 !important;
      box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
    }
  }
`;

const ReadOnlyField = styled.div`
  color: #262626;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 16px;
`;

const SolutionInput = styled(ContentInput)`
  min-height: 150px;
`;

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
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [availableSubtopics, setAvailableSubtopics] = useState<SubTopic[]>([]);
  const [correctOption, setCorrectOption] = useState<1 | 2 | 3 | 4 | undefined>(
    question.data.schoolAnswer?.finalAnswer?.type === 'multiple_choice' 
      ? question.data.schoolAnswer.finalAnswer.value as 1 | 2 | 3 | 4
      : undefined
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedContentChanges, setHasUnsavedContentChanges] = useState(false);
  const [hasUnsavedOptionsChanges, setHasUnsavedOptionsChanges] = useState(false);
  const [metadata, setMetadata] = useState(question.data.metadata);
  const [hasUnsavedMetadataChanges, setHasUnsavedMetadataChanges] = useState(false);
  const [solution, setSolution] = useState(question.data.schoolAnswer?.solution?.text || '');
  const [hasUnsavedSolutionChanges, setHasUnsavedSolutionChanges] = useState(false);
  const inputRef = React.useRef<InputRef>(null);
  const [validationResult, setValidationResult] = useState<ContentValidationResult>({
    success: true,
    errors: [],
    warnings: []
  });

  useEffect(() => {
    const validateData = async () => {
      const result = await validateQuestion(question.data);
      setValidationResult({
        success: result.errors.length === 0,
        errors: result.errors,
        warnings: result.warnings
      });
    };
    validateData();
  }, [question.data]);

  const contentErrors = validationResult.errors.filter(
    (err: ValidationError) => err.field.startsWith('content') || err.field === 'options'
  );

  // Load topics when subject and domain change
  useEffect(() => {
    if (metadata.subjectId && metadata.domainId) {
      const subject = universalTopics.getAllSubjects().find(s => s.id === metadata.subjectId);
      const domain = subject?.domains.find(d => d.id === metadata.domainId);
      if (domain) {
        setAvailableTopics(domain.topics);
        // If there's a selected topic, load its subtopics
        if (metadata.topicId) {
          const topic = domain.topics.find(t => t.id === metadata.topicId);
          if (topic) {
            setAvailableSubtopics(topic.subTopics);
          }
        }
      }
    }
  }, [metadata.subjectId, metadata.domainId, metadata.topicId]);

  const handleQuestionTypeChange = (value: unknown) => {
    const questionType = value as QuestionType;
    
    // Helper function to get the final answer type
    const getFinalAnswerType = (type: QuestionType): FinalAnswerType => {
      switch (type) {
        case QuestionType.MULTIPLE_CHOICE:
          return 'multiple_choice';
        case QuestionType.NUMERICAL:
          return 'numerical';
        default:
          return 'none';
      }
    };

    const newMetadata = {
      ...metadata,
      type: questionType,
      answerFormat: {
        hasFinalAnswer: questionType !== QuestionType.OPEN,
        finalAnswerType: getFinalAnswerType(questionType),
        requiresSolution: true
      }
    };

    // Update question data based on type
    let updatedQuestionData: Question = {
      ...question.data,
      metadata: newMetadata,
      content: {
        ...question.data.content,
        options: questionType === QuestionType.MULTIPLE_CHOICE ? ['', '', '', ''].map(opt => ({ text: opt, format: 'markdown' as const })) : []
      },
      schoolAnswer: questionType === QuestionType.MULTIPLE_CHOICE ? 
        {
          ...question.data.schoolAnswer,
          finalAnswer: { type: 'multiple_choice' as const, value: 1 }
        } :
        questionType === QuestionType.NUMERICAL ?
          {
            ...question.data.schoolAnswer,
            finalAnswer: { type: 'numerical', value: 0, tolerance: 0 }
          } :
          {
            solution: question.data.schoolAnswer?.solution || { text: '', format: 'markdown' }
          }
    };

    // Update local state
    setMetadata(newMetadata);
    setOptions(questionType === QuestionType.MULTIPLE_CHOICE ? ['', '', '', ''].map(opt => ({ text: '', format: 'markdown' })) : []);
    setCorrectOption(questionType === QuestionType.MULTIPLE_CHOICE ? 1 : undefined);
    setHasUnsavedMetadataChanges(true);

    // Save changes immediately
    const saveOperation: SaveQuestion = {
      id: question.id,
      data: updatedQuestionData,
      publication_status: question.publication_status,
      validation_status: question.validation_status,
      review_status: question.review_status
    };

    onSave(saveOperation);
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

  const handleMetadataChange = (field: string, value: any) => {
    const newMetadata = {
      ...metadata,
      [field]: value
    };

    // If topic changes, reset subtopic and update available subtopics
    if (field === 'topicId') {
      newMetadata.subtopicId = '';
      const topic = availableTopics.find(t => t.id === value);
      if (topic) {
        setAvailableSubtopics(topic.subTopics);
      } else {
        setAvailableSubtopics([]);
      }
    }

    setMetadata(newMetadata);
    setHasUnsavedMetadataChanges(true);
  };

  const handleSaveMetadata = async () => {
    try {
      const questionData: Question = {
        ...question.data,
        metadata: metadata
      };

      const saveOperation: SaveQuestion = {
        id: question.id,
        data: questionData,
        publication_status: question.publication_status,
        validation_status: question.validation_status,
        review_status: question.review_status
      };

      await onSave(saveOperation);
      setHasUnsavedMetadataChanges(false);
      if (isEditing) {
        onEdit();
      }
    } catch (error) {
      console.error('Failed to save metadata:', error);
    }
  };

  const handleCancelMetadata = () => {
    setMetadata(question.data.metadata);
    setHasUnsavedMetadataChanges(false);
    if (isEditing) {
      onEdit();
    }
  };

  const handleMetadataFieldClick = () => {
    if (!isEditing) {
      onEdit();
    }
  };

  const handleSolutionChange = (newSolution: string) => {
    setSolution(newSolution);
    setHasUnsavedSolutionChanges(newSolution !== question.data.schoolAnswer?.solution?.text);
  };

  const handleSaveSolution = async () => {
    try {
      const questionData: Question = {
        ...question.data,
        schoolAnswer: {
          ...question.data.schoolAnswer,
          solution: {
            text: solution,
            format: 'markdown'
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
      setHasUnsavedSolutionChanges(false);
      if (isEditing) {
        onEdit();
      }
    } catch (error) {
      console.error('Failed to save solution:', error);
    }
  };

  const handleCancelSolution = () => {
    setSolution(question.data.schoolAnswer?.solution?.text || '');
    setHasUnsavedSolutionChanges(false);
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
        <Space direction="vertical" style={{ width: '100%' }}>
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

          <TitleRow>
            <Col flex="0 0 auto">
              <SectionLabel>סוג שאלה:</SectionLabel>
            </Col>
            <Col flex="1">
              <EditableWrapper isEditable={isEditing} onClick={handleMetadataFieldClick}>
                <QuestionTypeSelect
                  value={metadata.type}
                  onChange={handleQuestionTypeChange}
                  className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedMetadataChanges ? 'has-changes' : ''}`}
                  disabled={!isEditing}
                  style={{ width: '300px' }}
                >
                  <Select.Option value={QuestionType.MULTIPLE_CHOICE}>שאלה סגורה</Select.Option>
                  <Select.Option value={QuestionType.OPEN}>שאלה פתוחה</Select.Option>
                  <Select.Option value={QuestionType.NUMERICAL}>שאלה חישובית</Select.Option>
                </QuestionTypeSelect>
              </EditableWrapper>
            </Col>
          </TitleRow>
        </Space>
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

      {metadata.type === QuestionType.MULTIPLE_CHOICE && (
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
      )}

      <MetadataSection isEditable={isEditing}>
        <TitleRow>
          <Col flex="0 0 auto">
            <SectionLabel>מטא-דאטה:</SectionLabel>
          </Col>
          <Col flex="1">
            <Space direction="vertical" style={{ width: '100%' }}>
              <MetadataField>
                <MetadataLabel>נושא</MetadataLabel>
                <ReadOnlyField>{metadata.subjectId}</ReadOnlyField>
              </MetadataField>

              <MetadataField>
                <MetadataLabel>תחום</MetadataLabel>
                <ReadOnlyField>{metadata.domainId}</ReadOnlyField>
              </MetadataField>

              <MetadataField>
                <MetadataLabel>רמת קושי</MetadataLabel>
                <EditableWrapper isEditable={isEditing} onClick={handleMetadataFieldClick}>
                  <DifficultySelect
                    value={metadata.difficulty}
                    onChange={(value) => handleMetadataChange('difficulty', value)}
                    className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedMetadataChanges ? 'has-changes' : ''}`}
                    disabled={!isEditing}
                    style={{ width: '200px' }}
                  >
                    <Select.Option value={1}>קל מאוד</Select.Option>
                    <Select.Option value={2}>קל</Select.Option>
                    <Select.Option value={3}>בינוני</Select.Option>
                    <Select.Option value={4}>קשה</Select.Option>
                    <Select.Option value={5}>קשה מאוד</Select.Option>
                  </DifficultySelect>
                </EditableWrapper>
              </MetadataField>

              <MetadataField>
                <MetadataLabel>נושא משנה</MetadataLabel>
                <EditableWrapper isEditable={isEditing} onClick={handleMetadataFieldClick}>
                  <Select
                    value={metadata.topicId}
                    onChange={(value) => handleMetadataChange('topicId', value)}
                    placeholder="בחר נושא משנה"
                    className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedMetadataChanges ? 'has-changes' : ''}`}
                    disabled={!isEditing}
                    style={{ width: '100%' }}
                  >
                    {availableTopics.map(topic => (
                      <Select.Option key={topic.id} value={topic.id}>
                        {topic.name}
                      </Select.Option>
                    ))}
                  </Select>
                </EditableWrapper>
              </MetadataField>

              <MetadataField>
                <MetadataLabel>תת-נושא</MetadataLabel>
                <EditableWrapper isEditable={isEditing} onClick={handleMetadataFieldClick}>
                  <Select
                    value={metadata.subtopicId}
                    onChange={(value) => handleMetadataChange('subtopicId', value)}
                    placeholder="בחר תת-נושא"
                    className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedMetadataChanges ? 'has-changes' : ''}`}
                    disabled={!isEditing || !metadata.topicId}
                    style={{ width: '100%' }}
                  >
                    {availableSubtopics.map(subtopic => (
                      <Select.Option key={subtopic.id} value={subtopic.id}>
                        {subtopic.name}
                      </Select.Option>
                    ))}
                  </Select>
                </EditableWrapper>
              </MetadataField>

              <MetadataField>
                <MetadataLabel>זמן מוערך (דקות)</MetadataLabel>
                <EditableWrapper isEditable={isEditing} onClick={handleMetadataFieldClick}>
                  <MetadataInput
                    type="number"
                    value={metadata.estimatedTime}
                    onChange={(e) => handleMetadataChange('estimatedTime', parseInt(e.target.value))}
                    placeholder="הזן זמן מוערך בדקות"
                    className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedMetadataChanges ? 'has-changes' : ''}`}
                    readOnly={!isEditing}
                  />
                </EditableWrapper>
              </MetadataField>

              {metadata.source && (
                <>
                  <MetadataField>
                    <MetadataLabel>מקור</MetadataLabel>
                    <EditableWrapper isEditable={isEditing} onClick={handleMetadataFieldClick}>
                      <SourceSelect
                        value={metadata.source.type}
                        onChange={(value: string) => handleMetadataChange('source', { ...metadata.source, type: value })}
                        className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedMetadataChanges ? 'has-changes' : ''}`}
                        disabled={!isEditing}
                      >
                        <Select.Option value="exam">מבחן</Select.Option>
                        <Select.Option value="ezpass">EZPass</Select.Option>
                      </SourceSelect>
                    </EditableWrapper>
                  </MetadataField>

                  {metadata.source.type === 'exam' && (
                    <>
                      <MetadataField>
                        <MetadataLabel>סמסטר</MetadataLabel>
                        <EditableWrapper isEditable={isEditing} onClick={handleMetadataFieldClick}>
                          <SourceSelect
                            value={metadata.source.period}
                            onChange={(value: string) => handleMetadataChange('source', { ...metadata.source, period: value })}
                            className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedMetadataChanges ? 'has-changes' : ''}`}
                            disabled={!isEditing}
                          >
                            <Select.Option value="spring">אביב</Select.Option>
                            <Select.Option value="summer">קיץ</Select.Option>
                            <Select.Option value="winter">חורף</Select.Option>
                            <Select.Option value="fall">סתיו</Select.Option>
                          </SourceSelect>
                        </EditableWrapper>
                      </MetadataField>

                      <MetadataField>
                        <MetadataLabel>מועד</MetadataLabel>
                        <EditableWrapper isEditable={isEditing} onClick={handleMetadataFieldClick}>
                          <SourceSelect
                            value={metadata.source.moed}
                            onChange={(value) => handleMetadataChange('source', { ...metadata.source, moed: value })}
                            className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedMetadataChanges ? 'has-changes' : ''}`}
                            disabled={!isEditing}
                          >
                            <Select.Option value="a">א׳</Select.Option>
                            <Select.Option value="b">ב׳</Select.Option>
                            <Select.Option value="c">ג׳</Select.Option>
                          </SourceSelect>
                        </EditableWrapper>
                      </MetadataField>
                    </>
                  )}
                </>
              )}
            </Space>
          </Col>
          <Col flex="0 0 auto">
            <Space>
              {hasUnsavedMetadataChanges && (
                <>
                  <UnsavedChangesText>שינויים לא שמורים</UnsavedChangesText>
                  <Button onClick={handleCancelMetadata}>
                    בטל
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveMetadata}
                  >
                    שמור
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </TitleRow>
      </MetadataSection>

      {(metadata.type === QuestionType.OPEN || metadata.type === QuestionType.NUMERICAL) && (
        <ContentSection isEditable={isEditing}>
          <TitleRow>
            <Col flex="0 0 auto">
              <SectionLabel>פתרון:</SectionLabel>
            </Col>
            <Col flex="1">
              <EditableWrapper isEditable={isEditing} onClick={handleMetadataFieldClick}>
                <SolutionInput
                  value={solution}
                  onChange={(e) => handleSolutionChange(e.target.value)}
                  placeholder="הזן את פתרון השאלה"
                  className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedSolutionChanges ? 'has-changes' : ''}`}
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  readOnly={!isEditing}
                />
              </EditableWrapper>
            </Col>
            <Col flex="0 0 auto">
              <Space>
                {hasUnsavedSolutionChanges && (
                  <>
                    <UnsavedChangesText>שינויים לא שמורים</UnsavedChangesText>
                    <Button onClick={handleCancelSolution}>
                      בטל
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSaveSolution}
                    >
                      שמור
                    </Button>
                  </>
                )}
              </Space>
            </Col>
          </TitleRow>
        </ContentSection>
      )}
    </Space>
  );
}; 