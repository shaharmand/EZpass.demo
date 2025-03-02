import React from 'react';
import { Card, Space, Typography, Button } from 'antd';
import { EditOutlined, CheckOutlined, SolutionOutlined } from '@ant-design/icons';
import { Question, DatabaseQuestion } from '../../../types/question';
import { QuestionSolution } from '../../question/QuestionSolution';
import { QuestionEvaluation } from '../../question/QuestionEvaluation';
import { validateQuestion, ValidationError } from '../../../utils/questionValidator';
import { ValidationDisplay } from '../../validation/ValidationDisplay';

const { Text } = Typography;

interface SolutionAndEvaluationSectionProps {
  question: DatabaseQuestion;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<Question>) => Promise<void>;
}

export const SolutionAndEvaluationSection: React.FC<SolutionAndEvaluationSectionProps> = ({
  question,
  isEditing,
  onEdit,
  onSave
}) => {
  const validationResult = validateQuestion(question);
  // Separate solution and evaluation errors
  const solutionErrors = validationResult.errors.filter((err: ValidationError) => 
    err.field.startsWith('solution')
  );
  const evaluationErrors = validationResult.errors.filter((err: ValidationError) => 
    err.field.startsWith('evaluation')
  );

  const renderEmptyState = () => (
    <Space direction="vertical" style={{ width: '100%', textAlign: 'center', padding: '20px' }}>
      <Text type="secondary" italic>לא הוזן תוכן</Text>
      <Button 
        type="primary"
        icon={<EditOutlined />}
        onClick={onEdit}
      >
        הוסף תוכן
      </Button>
    </Space>
  );

  if (!question?.answer?.solution) {
    return renderEmptyState();
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Solution */}
      <div style={{ 
        padding: '12px',
        border: `1px solid ${solutionErrors.length > 0 ? '#ff4d4f' : '#d9d9d9'}`,
        borderRadius: '6px'
      }}>
        {!question.answer.solution?.text ? renderEmptyState() : (
          <QuestionSolution solution={question.answer.solution} showCard={false} />
        )}
      </div>

      {/* Evaluation - only show for non-multiple choice questions */}
      {question.metadata.type !== 'multiple_choice' && (
        <Card size="small">
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <CheckOutlined />
              <Text strong>הערכה</Text>
            </Space>
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={onEdit}
            >
              ערוך
            </Button>
          </Space>
          <div style={{ 
            marginTop: '1rem',
            padding: '12px',
            border: `1px solid ${evaluationErrors.length > 0 ? '#ff4d4f' : '#d9d9d9'}`,
            borderRadius: '6px'
          }}>
            {!question.evaluation || (!question.evaluation.rubricAssessment?.criteria?.length && !question.evaluation.answerRequirements?.requiredElements?.length) ? (
              <Space direction="vertical" style={{ width: '100%', textAlign: 'center', padding: '20px' }}>
                <CheckOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                <Text type="danger">הערכה חסרה</Text>
                <Text type="secondary">יש להוסיף קריטריונים להערכה ודרישות מהתשובה</Text>
                <Button 
                  type="primary"
                  danger
                  icon={<EditOutlined />}
                  onClick={onEdit}
                >
                  הוסף הערכה
                </Button>
              </Space>
            ) : (
              <QuestionEvaluation evaluation={question.evaluation} />
            )}
          </div>
        </Card>
      )}
    </Space>
  );
}; 