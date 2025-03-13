import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Card, Space, Typography, Button } from 'antd';
import { EditOutlined, CheckOutlined, SolutionOutlined } from '@ant-design/icons';
import { Question, DatabaseQuestion, SaveQuestion, QuestionType } from '../../../../../../types/question';
import { QuestionSolution } from '../../../../../../components/question/QuestionSolution';
import { QuestionEvaluation } from '../../../../../../components/question/QuestionEvaluation';
import { validateQuestion, ValidationError, ValidationResult } from '../../../../../../utils/questionValidator';
import { ValidationDisplay } from '../../../../../../components/validation/ValidationDisplay';

const { Text } = Typography;

interface SolutionAndEvaluationSectionProps {
  question: DatabaseQuestion;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: SaveQuestion) => Promise<void>;
  onModified?: (modified: boolean) => void;
}

export interface SolutionAndEvaluationSectionHandle {
  collectChanges: () => Promise<{ schoolAnswer?: Partial<Question['schoolAnswer']> }>;
  resetChanges: () => void;
}

export const SolutionAndEvaluationSection = forwardRef<SolutionAndEvaluationSectionHandle, SolutionAndEvaluationSectionProps>(({
  question,
  isEditing,
  onEdit,
  onSave,
  onModified
}, ref) => {
  const [solutionValidationErrors, setSolutionValidationErrors] = useState<ValidationError[]>([]);
  const [evaluationValidationErrors, setEvaluationValidationErrors] = useState<ValidationError[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [solution, setSolution] = useState(question.data.schoolAnswer?.solution?.text || '');
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    collectChanges: async () => {
      if (changedFields.size === 0) return { schoolAnswer: {} };

      return {
        schoolAnswer: {
          ...question.data.schoolAnswer,
          solution: {
            text: solution,
            format: 'markdown'
          }
        }
      };
    },
    resetChanges: () => {
      setSolution(question.data.schoolAnswer?.solution?.text || '');
      setChangedFields(new Set());
      setIsModified(false);
    }
  }));

  useEffect(() => {
    onModified?.(isModified);
  }, [isModified, onModified]);

  // Add effect to reset state when editing is cancelled
  useEffect(() => {
    if (!isEditing) {
      setSolution(question.data.schoolAnswer?.solution?.text || '');
      setChangedFields(new Set());
      setIsModified(false);
    }
  }, [isEditing, question.data.schoolAnswer?.solution?.text]);

  const handleSolutionChange = (value: string) => {
    setSolution(value);
    setIsModified(true);
    setChangedFields(prev => {
      const next = new Set(prev);
      if (value !== question.data.schoolAnswer?.solution?.text) {
        next.add('solution');
      } else {
        next.delete('solution');
      }
      return next;
    });
  };

  const validateSolutionAndEvaluation = async () => {
    const result = await validateQuestion(question.data);
    const validationResult = result as ValidationResult;
    // Separate solution and evaluation errors
    const solutionErrors = validationResult.errors.filter((err: ValidationError) => 
      err.field.startsWith('solution')
    );
    const evaluationErrors = validationResult.errors.filter((err: ValidationError) => 
      err.field.startsWith('evaluation')
    );

    return {
      solutionErrors,
      evaluationErrors
    };
  };

  useEffect(() => {
    const validate = async () => {
      const result = await validateSolutionAndEvaluation();
      setSolutionValidationErrors(result.solutionErrors);
      setEvaluationValidationErrors(result.evaluationErrors);
    };
    validate();
  }, [question]);

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

  if (!question?.data?.schoolAnswer?.solution) {
    return renderEmptyState();
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Solution */}
      <div style={{ 
        padding: '12px',
        border: `1px solid ${solutionValidationErrors.length > 0 ? '#ff4d4f' : '#d9d9d9'}`,
        borderRadius: '6px'
      }}>
        {!question.data.schoolAnswer.solution?.text ? renderEmptyState() : (
          <QuestionSolution solution={question.data.schoolAnswer.solution} showCard={false} />
        )}
      </div>

      {/* Evaluation - only show for non-multiple choice questions */}
      {question.data.metadata.type !== QuestionType.MULTIPLE_CHOICE && (
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
            border: `1px solid ${evaluationValidationErrors.length > 0 ? '#ff4d4f' : '#d9d9d9'}`,
            borderRadius: '6px'
          }}>
            {!question.data.evaluationGuidelines || !question.data.evaluationGuidelines.requiredCriteria?.length ? (
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
              <QuestionEvaluation evaluation={question.data.evaluationGuidelines} />
            )}
          </div>
        </Card>
      )}
    </Space>
  );
}); 