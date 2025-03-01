import React from 'react';
import { Card, Space, Typography, Button } from 'antd';
import { EditOutlined, FileTextOutlined } from '@ant-design/icons';
import { Question, DatabaseQuestion } from '../../../types/question';
import { QuestionContent } from '../../question/QuestionContent';
import { QuestionAndOptionsDisplay } from '../../question/QuestionAndOptionsDisplay';
import { validateQuestion, ValidationError } from '../../../utils/questionValidator';
import { ValidationDisplay } from '../../validation/ValidationDisplay';

const { Text } = Typography;

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
      <Card style={{ direction: 'rtl' }}>
        <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
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
      </Card>
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

  const renderSectionHeader = (icon: React.ReactNode, title: string) => (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space>
        {icon}
        <Text strong>{title}</Text>
      </Space>
      <Button 
        type="text" 
        icon={<EditOutlined />}
        onClick={onEdit}
      >
        ערוך
      </Button>
    </Space>
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <ValidationDisplay errors={contentErrors} section="content" />
      
      {/* Question Content */}
      <Card size="small">
        {renderSectionHeader(<FileTextOutlined />, "תוכן השאלה")}
        <div style={{ 
          marginTop: '1rem',
          padding: '12px',
          border: `1px solid ${contentErrors.length > 0 ? '#ff4d4f' : '#d9d9d9'}`,
          borderRadius: '6px'
        }}>
          {!question.content?.text ? (
            <Space direction="vertical" style={{ width: '100%', textAlign: 'center', padding: '20px' }}>
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
          ) : (
            <>
              <QuestionContent content={question.content.text} />
              {question.type === 'multiple_choice' && (
                <div style={{ marginTop: '1rem' }}>
                  <QuestionAndOptionsDisplay 
                    question={question}
                    showCorrectAnswer={true}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </Space>
  );
}; 