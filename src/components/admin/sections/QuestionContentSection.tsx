import React from 'react';
import { Card, Space, Typography, Button, Divider } from 'antd';
import { EditOutlined, FileTextOutlined } from '@ant-design/icons';
import { Question, DatabaseQuestion } from '../../../types/question';
import { QuestionContent } from '../../question/QuestionContent';
import { QuestionAndOptionsDisplay } from '../../question/QuestionAndOptionsDisplay';
import { validateQuestion, ValidationError } from '../../../utils/questionValidator';
import { ValidationDisplay } from '../../validation/ValidationDisplay';
import styled from 'styled-components';

const { Title, Text } = Typography;

const ContentCard = styled(Card)`
  .ant-card-body {
    padding: 24px;
  }
`;

const QuestionName = styled(Title)`
  margin-bottom: 16px !important;
  color: #262626;
  font-size: 20px !important;
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

interface QuestionContentSectionProps {
  question: DatabaseQuestion;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<Question>) => Promise<void>;
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
      <QuestionText>
        <QuestionContent content={question.content} />
      </QuestionText>
      <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
        <QuestionAndOptionsDisplay 
          question={{
            options: question.content.options,
            correctOption: question.answer.finalAnswer.type === 'multiple_choice' ? 
              question.answer.finalAnswer.value : undefined
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