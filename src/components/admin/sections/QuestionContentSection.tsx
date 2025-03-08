import React, { useState } from 'react';
import { Card, Space, Typography, Button, Input, Row, Col, Tag } from 'antd';
import type { InputRef } from 'antd/lib/input';
import { EditOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import { Question, DatabaseQuestion, SaveQuestion, ValidationStatus, PublicationStatusEnum } from '../../../types/question';
import { QuestionContent } from '../../question/QuestionContent';
import { QuestionAndOptionsDisplay } from '../../question/QuestionAndOptionsDisplay';
import { validateQuestion, ValidationError } from '../../../utils/questionValidator';
import { ValidationDisplay } from '../../validation/ValidationDisplay';
import styled from 'styled-components';
import dayjs from 'dayjs';
import 'dayjs/locale/he';

const { Title, Text } = Typography;

const ContentCard = styled(Card)`
  .ant-card-body {
    padding: 24px;
  }
`;

interface TitleSectionProps {
  isEditable?: boolean;
}

const StatusItem = styled.div`
  .status-header {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    
    .label {
      margin-left: 8px;
      color: #262626;
      font-weight: 500;
    }
  }
`;

const MetadataItem = styled(Text)`
  display: block;
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 8px;
  
  .metadata-separator {
    margin: 0 8px;
    opacity: 0.5;
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
    border-color: ${props => props.isEditable ? '#40a9ff' : '#f0f0f0'};
    cursor: ${props => props.isEditable ? 'pointer' : 'default'};
    background: ${props => props.isEditable ? '#fafafa' : '#fff'};
  }
`;

const EditableWrapper = styled.div<{ isEditable: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  
  &:hover:after {
    content: ${props => props.isEditable ? '"ערוך"' : 'none'};
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

const TitleLabel = styled(Text)`
  font-weight: 500;
  color: #262626;
  margin-left: 8px;
`;

const TitleInput = styled(Input)`
  font-size: 16px;
  transition: all 0.2s ease;
  width: 100%;
  
  &.view-mode {
    color: #262626;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    
    &:hover {
      border: none;
    }
  }

  &.edit-mode {
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: #fff;
    padding: 4px 11px;
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

export const QuestionContentSection: React.FC<QuestionContentSectionProps> = ({
  question,
  isEditing,
  onEdit,
  onSave
}) => {
  const [title, setTitle] = useState(question.name || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const inputRef = React.useRef<InputRef>(null);

  const validateQuestionTitle = (updatedQuestion: DatabaseQuestion): ContentValidationResult => {
    const validationResult = validateContent(updatedQuestion);
    return validationResult;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setHasUnsavedChanges(newTitle !== question.name);
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
    if (e.key === 'Enter') {
      handleSaveTitle();
    }
  };

  const handleSaveTitle = async () => {
    try {
      // Create updated question for validation
      const updatedQuestion: DatabaseQuestion = {
        ...question,
        name: title
      };

      // Validate the updated question
      const validationResult = validateQuestionTitle(updatedQuestion);
      
      // Update validation status based on validation result
      const newValidationStatus = validationResult.success ? 
        ValidationStatus.VALID : 
        validationResult.errors.length > 0 ? 
          ValidationStatus.ERROR : 
          ValidationStatus.WARNING;

      await onSave({
        id: question.id,
        data: {
          ...question,
          name: title
        },
        publication_status: question.publication_status,
        validation_status: newValidationStatus,
        review_status: question.review_status
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save title:', error);
    }
  };

  if (!question?.content) {
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

  const validateContent = (question: DatabaseQuestion): ContentValidationResult => {
    const validationResult = validateQuestion(question);
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

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <TitleSection isEditable={!isEditing}>
        <TitleRow>
          <Col flex="0 0 auto">
            <TitleLabel>שם השאלה:</TitleLabel>
          </Col>
          <Col flex="1">
            <EditableWrapper isEditable={!isEditing} onClick={handleTitleClick}>
              <TitleInput
                ref={inputRef}
                value={title}
                onChange={handleTitleChange}
                onKeyPress={handleKeyPress}
                placeholder="לא הוגדר שם לשאלה"
                className={`${isEditing ? 'edit-mode' : 'view-mode'} ${hasUnsavedChanges ? 'has-changes' : ''}`}
              />
            </EditableWrapper>
            {question.publication_metadata?.publishedAt && (
              <StatusItem>
                <div className="status-header">
                  <span className="label">סטטוס פרסום:</span>
                  <CompactTag color={question.publication_status === PublicationStatusEnum.DRAFT ? 'default' : 'success'}>
                    {question.publication_status === PublicationStatusEnum.DRAFT ? 'טיוטה' : 'מפורסם'}
                  </CompactTag>
                </div>
                <MetadataItem>
                  פורסם על ידי {question.publication_metadata.publishedBy}
                  <span className="metadata-separator">ב-</span>
                  {dayjs(question.publication_metadata.publishedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                </MetadataItem>
              </StatusItem>
            )}
          </Col>
          <Col flex="0 0 auto">
            <Space>
              {hasUnsavedChanges && (
                <>
                  <UnsavedChangesText>שינויים לא שמורים</UnsavedChangesText>
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
      <QuestionText>
        <QuestionContent content={question.content} />
      </QuestionText>
      <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
        <QuestionAndOptionsDisplay 
          question={{
            options: question.content.options,
            correctOption: question.schoolAnswer?.finalAnswer?.type === 'multiple_choice' ? 
              question.schoolAnswer.finalAnswer.value : undefined
          }}
          showCorrectAnswer={true}
        />
        {!isEditing && (
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={onEdit}
            style={{ marginTop: '16px' }}
          >
            ערוך תוכן
          </Button>
        )}
      </div>
    </Space>
  );
}; 