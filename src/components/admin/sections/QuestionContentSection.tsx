import React, { useState, useEffect, useRef } from 'react';
import { Card, Space, Typography, Button, Input, Row, Col, Tag, Select, message } from 'antd';
import type { InputRef } from 'antd/lib/input';
import { EditOutlined, FileTextOutlined, SaveOutlined, WarningOutlined, CloseOutlined } from '@ant-design/icons';
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
import LexicalEditor from '../../editor/LexicalEditor';

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

const EditableWrapper = styled.div<EditableWrapperProps>`
  position: relative;
  display: flex;
  align-items: center;
  cursor: ${props => !props.isEditable ? 'default' : 'pointer'};
  
  &:hover:after {
    content: ${props => props.isEditable && !props.globalEditing ? '"ערוך"' : 'none'};
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

  &.question-type-wrapper {
    cursor: pointer !important;
    
    &:hover:after {
      content: ${props => props.isEditable && !props.globalEditing ? '"שנה סוג שאלה"' : 'none'};
    }

    .ant-select-selector {
      cursor: pointer !important;
    }
  }
`;

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

const TitleInput = styled(Input)`
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  width: 400px;
  max-width: 100%;
  
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

// Add this interface before the QuestionContentSectionProps interface
export interface QuestionContentSectionHandle {
  handleSimpleSave: () => Promise<void>;
}

interface QuestionContentSectionProps {
  question: DatabaseQuestion;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: SaveQuestion) => Promise<void>;
  onExitEdit?: () => void;
  onModified?: (modified: boolean) => void;
  onCancel?: () => void;
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
`;

const QuestionTypeSelect = styled(Select)<{ isEditing: boolean }>`
  width: 210px;
  
  .ant-select-selector {
    color: #262626 !important;
    background: ${props => props.isEditing ? '#fff' : '#fafafa'} !important;
    border: ${props => props.isEditing ? '1px solid #d9d9d9' : 'none'} !important;
    cursor: pointer !important;
    padding: 8px 12px !important;
    border-radius: 6px !important;
    height: auto !important;
    min-height: 32px !important;
    font-weight: 600 !important;
    
    &:hover {
      background: ${props => props.isEditing ? '#fff' : '#f0f0f0'} !important;
      border-color: ${props => props.isEditing ? '#40a9ff' : 'none'} !important;
    }
  }

  .ant-select-selection-item {
    line-height: 1.5;
    padding: 4px 0;
    font-weight: 600;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: #40a9ff !important;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
  }

  &.has-changes .ant-select-selector {
    background: #fffbe6 !important;
    border-color: #faad14 !important;
    
    &:hover {
      border-color: #d48806 !important;
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

const QuestionTypeSection = styled(ContentSection)`
  &:hover {
    cursor: ${props => props.isEditable ? 'pointer' : 'default'} !important;
  }

  .ant-select-selector {
    cursor: ${props => props.isEditable ? 'pointer' : 'default'} !important;
  }
`;

const EditActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #f0f0f0;

  .action-bar-content {
    display: flex;
    align-items: center;
    gap: 8px;

    .unsaved-changes {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
`;

const ContentInputWrapper = styled(TitleInputWrapper)`
  position: relative;
  
  .lexical-editor-container {
    transition: all 0.2s ease;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: #fff;
    
    &.has-changes {
      background: #fffbe6;
      border-color: #faad14;
      
      &:hover, &:focus-within {
        border-color: #d48806;
        box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
      }
    }
  }
`;

const ContentInputRow = styled(TitleInputRow)`
  .close-button {
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
  }
`;

// Add debug helper at the top of the file, after imports
const debugLog = (section: string, data: any) => {
  console.log(`=== ${section} ===`);
  console.log(JSON.stringify(data, null, 2));
};

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

// Add after imports
interface UniversalTopics {
  topics: Topic[];
}

export const QuestionContentSection = React.forwardRef<QuestionContentSectionHandle, QuestionContentSectionProps>(({
  question,
  isEditing,
  onEdit,
  onSave,
  onExitEdit,
  onModified,
  onCancel
}, ref) => {
  const inputRef = React.useRef<InputRef>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<{ reset: (text: string) => void }>(null);
  
  // Individual editing states
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isTypeEditing, setIsTypeEditing] = useState(false);
  const [isContentEditing, setIsContentEditing] = useState(false);
  const [isOptionsEditing, setIsOptionsEditing] = useState(false);
  const [isMetadataEditing, setIsMetadataEditing] = useState(false);
  const [isSolutionEditing, setIsSolutionEditing] = useState(false);

  // Individual field states
  const [title, setTitle] = useState(question.data.name || '');
  const [content, setContent] = useState(question.data.content?.text || '');
  const [questionType, setQuestionType] = useState(question.data.metadata.type);
  const [options, setOptions] = useState((question.data.content?.options || ['', '', '', '']).map(opt => 
    typeof opt === 'string' ? { text: opt, format: 'markdown' as const } : opt
  ));
  const [correctOption, setCorrectOption] = useState<1 | 2 | 3 | 4 | undefined>(
    question.data.schoolAnswer?.finalAnswer?.type === 'multiple_choice' 
      ? question.data.schoolAnswer.finalAnswer.value as 1 | 2 | 3 | 4
      : undefined
  );
  const [metadata, setMetadata] = useState(question.data.metadata);
  const [solution, setSolution] = useState(question.data.schoolAnswer?.solution?.text || '');
  const [availableSubtopics, setAvailableSubtopics] = useState<SubTopic[]>([]);

  // Track changes for each field
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [isModified, setIsModified] = useState(false);

  // Initialize subtopics when component mounts or topic changes
  useEffect(() => {
    if (metadata.topicId) {
      const topic = universalTopics.getTopic(metadata.topicId);
      if (topic) {
        setAvailableSubtopics(topic.subTopics || []);
      }
    }
  }, [metadata.topicId]);

  useEffect(() => {
    onModified?.(changedFields.size > 0);
    setIsModified(changedFields.size > 0);
  }, [changedFields, onModified]);

  // Reset states when editing mode changes
  useEffect(() => {
    if (!isEditing) {
      console.log('=== QuestionContentSection - Cancel Chain ===');
      console.log('QuestionContentSection - useEffect triggered by isEditing=false');
      console.log('QuestionContentSection - Current state:', {
        title,
        content,
        questionType,
        isModified,
        changedFields: Array.from(changedFields)
      });
      
      setTitle(question.data.name || '');
      setContent(question.data.content?.text || '');
      setQuestionType(question.data.metadata.type);
      setOptions((question.data.content?.options || ['', '', '', '']).map(opt => 
        typeof opt === 'string' ? { text: opt, format: 'markdown' as const } : opt
      ));
      setCorrectOption(
        question.data.schoolAnswer?.finalAnswer?.type === 'multiple_choice' 
          ? question.data.schoolAnswer.finalAnswer.value as 1 | 2 | 3 | 4
          : undefined
      );
      setMetadata(question.data.metadata);
      setSolution(question.data.schoolAnswer?.solution?.text || '');
      
      // Reset editor content
      if (editorRef.current?.reset) {
        console.log('QuestionContentSection - Calling editor reset');
        editorRef.current.reset(question.data.content?.text || '');
      }
      
      setChangedFields(new Set());
      setIsTitleEditing(false);
      setIsTypeEditing(false);
      setIsContentEditing(false);
      setIsOptionsEditing(false);
      setIsMetadataEditing(false);
      setIsSolutionEditing(false);
      
      console.log('QuestionContentSection - States reset completed');
      console.log('=== QuestionContentSection - Cancel Chain End ===');
    }
  }, [isEditing, question]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setChangedFields(prev => {
      const next = new Set(prev);
      if (newTitle !== question.data.name) {
        next.add('title');
      } else {
        next.delete('title');
      }
      return next;
    });
  };

  const handleQuestionTypeChange = (value: unknown) => {
    const newType = value as QuestionType;
    setQuestionType(newType);
    
    // Update metadata with new type
    const newMetadata = {
      ...metadata,
      type: newType,
      answerFormat: {
        hasFinalAnswer: newType !== QuestionType.OPEN,
        finalAnswerType: getFinalAnswerType(newType),
        requiresSolution: true
      }
    };
    setMetadata(newMetadata);
    
    setChangedFields(prev => {
      const next = new Set(prev);
      if (newType !== question.data.metadata.type) {
        next.add('metadata');
      } else {
        next.delete('metadata');
      }
      return next;
    });
  };

  const handleSimpleSave = async () => {
    try {
      const updatedQuestionData: Question = {
        ...question.data,
        name: title,
        content: {
          text: content,
          format: 'markdown',
          options: questionType === QuestionType.MULTIPLE_CHOICE ? options : undefined
        },
        metadata: {
          ...metadata,
          type: questionType,
          answerFormat: {
            hasFinalAnswer: questionType !== QuestionType.OPEN,
            finalAnswerType: getFinalAnswerType(questionType),
            requiresSolution: true
          }
        },
        schoolAnswer: {
          finalAnswer: questionType === QuestionType.MULTIPLE_CHOICE && correctOption 
            ? {
                type: 'multiple_choice' as const,
                value: correctOption
              }
            : question.data.schoolAnswer?.finalAnswer,
          solution: {
            text: solution,
            format: 'markdown'
          }
        }
      };

      const saveOperation: SaveQuestion = {
        id: question.id,
        data: updatedQuestionData,
        publication_status: question.publication_status,
        validation_status: question.validation_status,
        review_status: question.review_status
      };

      await onSave(saveOperation);
      
      // Reset editing states after successful save
      setChangedFields(new Set());
      setIsModified(false);
      setIsTitleEditing(false);
      setIsTypeEditing(false);
      setIsContentEditing(false);
      setIsOptionsEditing(false);
      setIsMetadataEditing(false);
      setIsSolutionEditing(false);
      
      onExitEdit?.();
    } catch (error) {
      console.error('Failed to save changes:', error);
      message.error('Failed to save changes');
    }
  };

  const handleCancelAll = () => {
    console.log('=== QuestionContentSection - Cancel Chain ===');
    console.log('QuestionContentSection - handleCancelAll started');
    console.log('QuestionContentSection - Current state:', {
      title,
      content,
      questionType,
      isModified,
      changedFields: Array.from(changedFields)
    });
    
    // Reset all field states to original values
    setTitle(question.data.name || '');
    setContent(question.data.content?.text || '');
    setQuestionType(question.data.metadata.type);
    setOptions((question.data.content?.options || ['', '', '', '']).map(opt => 
      typeof opt === 'string' ? { text: opt, format: 'markdown' as const } : opt
    ));
    setCorrectOption(
      question.data.schoolAnswer?.finalAnswer?.type === 'multiple_choice' 
        ? question.data.schoolAnswer.finalAnswer.value as 1 | 2 | 3 | 4
        : undefined
    );
    setMetadata(question.data.metadata);
    setSolution(question.data.schoolAnswer?.solution?.text || '');
    
    // Reset editor content
    if (editorRef.current?.reset) {
      console.log('QuestionContentSection - Calling editor reset');
      editorRef.current.reset(question.data.content?.text || '');
    }

    // Reset all editing states
    setIsTitleEditing(false);
    setIsTypeEditing(false);
    setIsContentEditing(false);
    setIsOptionsEditing(false);
    setIsMetadataEditing(false);
    setIsSolutionEditing(false);
    
    // Clear changed fields
    setChangedFields(new Set());
    setIsModified(false);
    
    // Call parent cancel handler
    console.log('QuestionContentSection - Calling parent onCancel');
    onCancel?.();
    
    console.log('QuestionContentSection - handleCancelAll completed');
    console.log('=== QuestionContentSection - Cancel Chain End ===');
  };

  const handleContentKeyPress = (e: React.KeyboardEvent) => {
    console.log('handleContentKeyPress triggered, key:', e.key);
    if (e.key === 'Enter' && e.ctrlKey) {
      console.log('Ctrl+Enter pressed, saving changes');
      e.preventDefault();
      if (changedFields.size > 0) {
        handleSimpleSave();
      } else {
        onExitEdit?.();
      }
    } else if (e.key === 'Escape') {
      console.log('Escape pressed, cancelling changes');
      handleCancelAll();
    }
  };

  const handleContentChange = (value: string) => {
    if (question.data.content?.text !== value) {
      const newContent = { ...question.data.content, text: value };
      onModified?.(true);
      setContent(newContent.text);
      setChangedFields(prev => {
        const next = new Set(prev);
        next.add('content');
        return next;
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { text: value, format: 'markdown' as const };
    setOptions(newOptions);
    setChangedFields(prev => {
      const next = new Set(prev);
      if (!question.data.content?.options || 
          newOptions.some((opt, i) => {
            const existingOpt = question.data.content?.options?.[i];
            if (typeof existingOpt === 'object') {
              return opt.text !== existingOpt.text;
            }
            return opt.text !== existingOpt;
          })) {
        next.add('options');
      } else {
        next.delete('options');
      }
      return next;
    });
  };

  const handleCorrectOptionClick = (index: number) => {
    if (isEditing) {
      const newCorrectOption = (index + 1) as 1 | 2 | 3 | 4;
      setCorrectOption(newCorrectOption);
      setChangedFields(prev => {
        const next = new Set(prev);
        if (newCorrectOption !== question.data.schoolAnswer?.finalAnswer?.value) {
          next.add('correctOption');
        } else {
          next.delete('correctOption');
        }
        return next;
      });
    }
  };

  const handleOptionClick = (index: number) => {
    if (!isEditing) {
      onEdit();
      setIsOptionsEditing(true);
      setTimeout(() => {
        const inputs = document.querySelectorAll('input.edit-mode');
        const optionInput = inputs[index] as HTMLInputElement;
        if (optionInput) {
          optionInput.focus();
        }
      }, 100);
    }
  };

  const handleMetadataChange = (field: string, value: any) => {
    const newMetadata = {
      ...metadata,
      [field]: value
    };

    // If topic changes, reset subtopic
    if (field === 'topicId') {
      newMetadata.subtopicId = '';
      const topic = universalTopics.getTopic(value);
      if (topic) {
        setAvailableSubtopics(topic.subTopics || []);
      } else {
        setAvailableSubtopics([]);
      }
    }

    setMetadata(newMetadata);
    setChangedFields(prev => {
      const next = new Set(prev);
      next.add('metadata');
      return next;
    });
  };

  const handleSolutionChange = (newSolution: string) => {
    setSolution(newSolution);
    setChangedFields(prev => {
      const next = new Set(prev);
      if (newSolution !== question.data.schoolAnswer?.solution?.text) {
        next.add('solution');
      } else {
        next.delete('solution');
      }
      return next;
    });
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
    <div ref={divRef} data-section="content">
      <Space direction="vertical" style={{ width: '100%' }}>
        <TitleSection isEditable={!isTitleEditing}>
          <TitleRow>
            <Col span={24}>
              <SectionLabel>שם השאלה:</SectionLabel>
              <TitleInputWrapper>
                <TitleInputRow>
                  <EditableWrapper 
                    isEditable={!isTitleEditing} 
                    isEditing={isEditing}
                    globalEditing={isTitleEditing}
                    onClick={() => {
                      if (!isTitleEditing) {
                        onEdit();
                        setIsTitleEditing(true);
                        setTimeout(() => {
                          inputRef.current?.focus();
                        }, 100);
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    <TitleInput
                      ref={inputRef}
                      value={title}
                      onChange={handleTitleChange}
                      onKeyDown={handleContentKeyPress}
                      placeholder="לא הוגדר שם לשאלה"
                      className={`${isTitleEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('title') ? 'has-changes' : ''}`}
                      readOnly={!isTitleEditing}
                      maxLength={50}
                    />
                  </EditableWrapper>
                  {isTitleEditing && (
                    <CloseButton onClick={() => {
                      setTitle(question.data.name || '');
                      setChangedFields(prev => {
                        const next = new Set(prev);
                        next.delete('title');
                        return next;
                      });
                      setIsTitleEditing(false);
                    }}>
                      ✕
                    </CloseButton>
                  )}
                </TitleInputRow>
                {isTitleEditing && (
                  <TitleStatusRow>
                    <CharacterCount count={title.length}>
                      {title.length}/50
                    </CharacterCount>
                  </TitleStatusRow>
                )}
              </TitleInputWrapper>
            </Col>
          </TitleRow>
        </TitleSection>

        <QuestionTypeSection isEditable={!isTypeEditing}>
          <TitleRow>
            <Col span={24}>
              <SectionLabel>סוג שאלה:</SectionLabel>
              <EditableWrapper 
                isEditable={!isTypeEditing} 
                isEditing={isEditing}
                globalEditing={isTypeEditing}
                onClick={() => {
                  if (!isTypeEditing) {
                    onEdit();
                    setIsTypeEditing(true);
                  }
                }}
                style={{ cursor: 'pointer' }}
                className="question-type-wrapper"
              >
                <QuestionTypeSelect
                  value={questionType}
                  onChange={handleQuestionTypeChange}
                  isEditing={isTypeEditing}
                  disabled={!isTypeEditing}
                  className={`${changedFields.has('metadata') ? 'has-changes' : ''}`}
                >
                  <Select.Option value={QuestionType.MULTIPLE_CHOICE}>שאלה סגורה</Select.Option>
                  <Select.Option value={QuestionType.OPEN}>שאלה פתוחה</Select.Option>
                  <Select.Option value={QuestionType.NUMERICAL}>שאלה חישובית</Select.Option>
                </QuestionTypeSelect>
              </EditableWrapper>
            </Col>
          </TitleRow>
        </QuestionTypeSection>
        
        <ContentSection isEditable={!isContentEditing}>
          <TitleRow>
            <Col span={24}>
              <SectionLabel>תוכן השאלה:</SectionLabel>
              <ContentInputWrapper>
                <ContentInputRow>
                  <EditableWrapper 
                    isEditable={!isContentEditing} 
                    isEditing={isEditing} 
                    globalEditing={isContentEditing} 
                    onClick={() => {
                      if (!isContentEditing) {
                        onEdit?.();
                        setIsContentEditing(true);
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    {isContentEditing ? (
                      <div style={{ position: 'relative', width: '100%' }}>
                        <LexicalEditor
                          ref={editorRef}
                          initialValue={content}
                          onChange={handleContentChange}
                          placeholder="הזן את תוכן השאלה..."
                          hasChanges={changedFields.has('content')}
                        />
                        <div 
                          className="close-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editorRef.current?.reset) {
                              editorRef.current.reset(question.data.content?.text || '');
                            }
                            setContent(question.data.content?.text || '');
                            setChangedFields(prev => {
                              const next = new Set(prev);
                              next.delete('content');
                              return next;
                            });
                            setIsContentEditing(false);
                            if (!changedFields.size) {
                              onExitEdit?.();
                            }
                          }}
                        >
                          ✕
                        </div>
                      </div>
                    ) : (
                      <div style={{ minHeight: '100px', padding: '12px', width: '100%' }}>
                        {content || 'הזן את תוכן השאלה...'}
                      </div>
                    )}
                  </EditableWrapper>
                </ContentInputRow>
              </ContentInputWrapper>
            </Col>
          </TitleRow>
        </ContentSection>

        {questionType === QuestionType.MULTIPLE_CHOICE && (
          <OptionsSection isEditable={isEditing}>
            <TitleRow>
              <Col flex="0 0 auto">
                <SectionLabel>אפשרויות:</SectionLabel>
              </Col>
              <Col flex="1">
                <ContentInputWrapper>
                  <ContentInputRow>
                    <div style={{ width: '100%' }}>
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
                            isEditing={isEditing}
                            globalEditing={isOptionsEditing}
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
                              className={`${isEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('options') ? 'has-changes' : ''}`}
                              readOnly={!isEditing}
                              onClick={(e) => e.stopPropagation()}
                              isCorrect={correctOption === index + 1}
                            />
                          </EditableWrapper>
                        </OptionWrapper>
                      ))}
                    </div>
                    {isOptionsEditing && (
                      <CloseButton onClick={() => {
                        setOptions((question.data.content?.options || ['', '', '', '']).map(opt => 
                          typeof opt === 'string' ? { text: opt, format: 'markdown' } : opt
                        ));
                        setChangedFields(prev => {
                          const next = new Set(prev);
                          next.delete('options');
                          return next;
                        });
                        setIsOptionsEditing(false);
                      }}>
                        ✕
                      </CloseButton>
                    )}
                  </ContentInputRow>
                </ContentInputWrapper>
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
                  <MetadataLabel>רמת קושי</MetadataLabel>
                  <EditableWrapper isEditable={!isMetadataEditing} isEditing={isEditing} globalEditing={isMetadataEditing} onClick={() => {
                    if (!isEditing) {
                      onEdit();
                      setIsMetadataEditing(true);
                    }
                  }}>
                    <DifficultySelect
                      value={metadata.difficulty}
                      onChange={(value) => handleMetadataChange('difficulty', value)}
                      className={`${isMetadataEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('difficulty') ? 'has-changes' : ''}`}
                      disabled={!isMetadataEditing}
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
                  <EditableWrapper isEditable={!isMetadataEditing} isEditing={isEditing} globalEditing={isMetadataEditing} onClick={() => {
                    if (!isEditing) {
                      onEdit();
                      setIsMetadataEditing(true);
                    }
                  }}>
                    <Select
                      value={metadata.topicId}
                      onChange={(value) => handleMetadataChange('topicId', value)}
                      placeholder="בחר נושא משנה"
                      className={`${isMetadataEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('topicId') ? 'has-changes' : ''}`}
                      disabled={!isMetadataEditing}
                      style={{ width: '100%' }}
                    >
                      {universalTopics.getAllSubjects().flatMap(subject => 
                        subject.domains.flatMap(domain => 
                          domain.topics.map((topic: Topic) => (
                            <Select.Option key={topic.id} value={topic.id}>
                              {topic.name}
                            </Select.Option>
                          ))
                        )
                      )}
                    </Select>
                  </EditableWrapper>
                </MetadataField>

                <MetadataField>
                  <MetadataLabel>תת-נושא</MetadataLabel>
                  <EditableWrapper isEditable={!isMetadataEditing} isEditing={isEditing} globalEditing={isMetadataEditing} onClick={() => {
                    if (!isEditing) {
                      onEdit();
                      setIsMetadataEditing(true);
                    }
                  }}>
                    <Select
                      value={metadata.subtopicId}
                      onChange={(value) => handleMetadataChange('subtopicId', value)}
                      placeholder="בחר תת-נושא"
                      className={`${isMetadataEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('subtopicId') ? 'has-changes' : ''}`}
                      disabled={!isMetadataEditing || !metadata.topicId}
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
                  <EditableWrapper isEditable={!isMetadataEditing} isEditing={isEditing} globalEditing={isMetadataEditing} onClick={() => {
                    if (!isEditing) {
                      onEdit();
                      setIsMetadataEditing(true);
                    }
                  }}>
                    <MetadataInput
                      type="number"
                      value={metadata.estimatedTime}
                      onChange={(e) => handleMetadataChange('estimatedTime', parseInt(e.target.value))}
                      placeholder="הזן זמן מוערך בדקות"
                      className={`${isMetadataEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('estimatedTime') ? 'has-changes' : ''}`}
                      readOnly={!isMetadataEditing}
                    />
                  </EditableWrapper>
                </MetadataField>

                {metadata.source && (
                  <>
                    <MetadataField>
                      <MetadataLabel>מקור</MetadataLabel>
                      <EditableWrapper isEditable={!isMetadataEditing} isEditing={isEditing} globalEditing={isMetadataEditing} onClick={() => {
                        if (!isEditing) {
                          onEdit();
                          setIsMetadataEditing(true);
                        }
                      }}>
                        <SourceSelect
                          value={metadata.source.type}
                          onChange={(value: string) => handleMetadataChange('source', { ...metadata.source, type: value })}
                          className={`${isMetadataEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('source') ? 'has-changes' : ''}`}
                          disabled={!isMetadataEditing}
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
                          <EditableWrapper isEditable={!isMetadataEditing} isEditing={isEditing} globalEditing={isMetadataEditing} onClick={() => {
                            if (!isEditing) {
                              onEdit();
                              setIsMetadataEditing(true);
                            }
                          }}>
                            <SourceSelect
                              value={metadata.source.period}
                              onChange={(value: string) => handleMetadataChange('source', { ...metadata.source, period: value })}
                              className={`${isMetadataEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('source') ? 'has-changes' : ''}`}
                              disabled={!isMetadataEditing}
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
                          <EditableWrapper isEditable={!isMetadataEditing} isEditing={isEditing} globalEditing={isMetadataEditing} onClick={() => {
                            if (!isEditing) {
                              onEdit();
                              setIsMetadataEditing(true);
                            }
                          }}>
                            <SourceSelect
                              value={metadata.source.moed}
                              onChange={(value) => handleMetadataChange('source', { ...metadata.source, moed: value })}
                              className={`${isMetadataEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('source') ? 'has-changes' : ''}`}
                              disabled={!isMetadataEditing}
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
              {isMetadataEditing && changedFields.has('metadata') && (
                <EditModeButtons>
                  <Button onClick={() => {
                    setMetadata(question.data.metadata);
                    setChangedFields(prev => {
                      const next = new Set(prev);
                      next.delete('metadata');
                      return next;
                    });
                  }}>
                    בטל
                  </Button>
                </EditModeButtons>
              )}
            </Col>
          </TitleRow>
        </MetadataSection>

        {(questionType === QuestionType.OPEN || questionType === QuestionType.NUMERICAL) && (
          <ContentSection isEditable={isEditing}>
            <TitleRow>
              <Col flex="0 0 auto">
                <SectionLabel>פתרון:</SectionLabel>
              </Col>
              <Col flex="1">
                <EditableWrapper isEditable={!isSolutionEditing} isEditing={isEditing} globalEditing={isSolutionEditing} onClick={() => {
                  if (!isEditing) {
                    onEdit();
                    setIsSolutionEditing(true);
                  }
                }}>
                  <SolutionInput
                    value={solution}
                    onChange={(e) => handleSolutionChange(e.target.value)}
                    placeholder="הזן את פתרון השאלה"
                    className={`${isSolutionEditing ? 'edit-mode' : 'view-mode'} ${changedFields.has('solution') ? 'has-changes' : ''}`}
                    autoSize={{ minRows: 3, maxRows: 10 }}
                    readOnly={!isSolutionEditing}
                  />
                </EditableWrapper>
              </Col>
              <Col flex="0 0 auto">
                {isSolutionEditing && changedFields.has('solution') && (
                  <EditModeButtons>
                    <Button onClick={() => {
                      setSolution(question.data.schoolAnswer?.solution?.text || '');
                      setChangedFields(prev => {
                        const next = new Set(prev);
                        next.delete('solution');
                        return next;
                      });
                    }}>
                      בטל
                    </Button>
                  </EditModeButtons>
                )}
              </Col>
            </TitleRow>
          </ContentSection>
        )}

        <EditActionBar>
          <div className="action-bar-content">
            <div className="unsaved-changes">
              {isEditing ? (
                isModified ? (
                  <>
                    <WarningOutlined />
                    <span>יש שינויים שלא נשמרו</span>
                  </>
                ) : (
                  <span style={{ color: '#8c8c8c' }}>אין שינויים</span>
                )
              ) : (
                <span style={{ color: '#595959', fontSize: '14px' }}>
                  לחץ על שדה כדי לערוך
                </span>
              )}
            </div>
            <div className="action-buttons">
              <Button 
                onClick={() => {
                  console.log('Cancel button clicked');
                  handleCancelAll();
                }}
                disabled={!isEditing || !isModified}
              >
                בטל
              </Button>
              <Button 
                type="primary"
                onClick={handleSimpleSave}
                disabled={!isEditing || !isModified}
              >
                שמור שינויים
              </Button>
            </div>
          </div>
        </EditActionBar>
      </Space>
    </div>
  );
}); 