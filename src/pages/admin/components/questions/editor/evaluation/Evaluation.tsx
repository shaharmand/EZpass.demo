import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Space, Typography, List, Button, Input, InputNumber, Form, Progress, Tooltip } from 'antd';
import styled from 'styled-components';
import { DatabaseQuestion } from '../../../../../../types/question';
import { EditableWrapper } from '../../../../../../components/shared/EditableWrapper';
import { EditorWrapper } from '../../../../../../styles/adminEditStyles';

const { Text } = Typography;

const SectionLabel = styled(Text)`
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 4px;
  display: block;
`;

const CriterionItem = styled.div`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const CriterionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const CriterionName = styled.div`
  font-weight: 500;
  color: #111827;
  font-size: 14px;
  flex: 1;
`;

const CriterionWeight = styled.div`
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CriterionDescription = styled.div`
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 12px;
`;

const ProgressWrapper = styled.div`
  margin-top: 8px;
`;

const TotalProgress = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const TotalLabel = styled.div`
  font-weight: 500;
  color: #374151;
`;

const EditForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 12px;
  }
  
  .ant-form-item:last-child {
    margin-bottom: 0;
  }
`;

interface CriterionFormValues {
  criteria: Array<{
    name: string;
    description: string;
    weight: number;
  }>;
}

export interface EvaluationSectionHandle {
  resetChanges: () => void;
}

export interface EvaluationSectionProps {
  question: DatabaseQuestion;
  onContentChange: (changes: Partial<DatabaseQuestion>) => void;
  onFieldBlur?: () => void;
}

export const EvaluationSection = forwardRef<EvaluationSectionHandle, EvaluationSectionProps>(({
  question,
  onContentChange,
  onFieldBlur
}, ref) => {
  const [editableFields, setEditableFields] = useState({
    criteria: false
  });

  const [form] = Form.useForm<CriterionFormValues>();

  useImperativeHandle(ref, () => ({
    resetChanges: () => {
      console.log('[Evaluation] Reset changes called');
      setEditableFields({
        criteria: false
      });
      form.resetFields();
    }
  }));

  const handleCriteriaChange = (criteria: Array<{ name: string; description: string; weight: number }>) => {
    console.log('[Evaluation] Criteria changed:', criteria);
    onContentChange({
      data: {
        ...question.data,
        evaluationGuidelines: {
          requiredCriteria: criteria
        }
      }
    });
  };

  const validateCriteria = (criteria: Array<{ name: string; description: string; weight: number }> | undefined): boolean => {
    if (!criteria || criteria.length === 0) return false;
    
    // Check if all required fields are present and valid
    const isValid = criteria.every(criterion => 
      criterion.name && 
      criterion.name.trim().length > 0 && 
      criterion.description && 
      criterion.description.trim().length > 0 &&
      criterion.weight >= 0 &&
      criterion.weight <= 100
    );

    // Check if weights sum to 100
    const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    
    return isValid && Math.abs(totalWeight - 100) < 0.01; // Allow for small floating point differences
  };

  const renderEditMode = () => {
    const criteria = question.data.evaluationGuidelines?.requiredCriteria || [];
    
    return (
      <EditForm
        form={form} 
        initialValues={{ criteria }} 
        onValuesChange={(_, allValues) => {
          const values = allValues as CriterionFormValues;
          handleCriteriaChange(values.criteria);
        }}
      >
        <Form.List name="criteria">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <CriterionItem key={field.key}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'name']}
                      rules={[{ required: true, message: 'שם הקריטריון נדרש' }]}
                    >
                      <Input placeholder="שם הקריטריון" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'description']}
                      rules={[{ required: true, message: 'תיאור הקריטריון נדרש' }]}
                    >
                      <Input.TextArea placeholder="תיאור הקריטריון" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'weight']}
                      rules={[{ required: true, message: 'משקל נדרש' }]}
                    >
                      <InputNumber
                        min={0}
                        max={100}
                        formatter={(value?: number) => value ? `${value}%` : ''}
                        parser={(value?: string) => value ? parseFloat(value.replace('%', '')) : 0}
                        style={{ width: '100px' }}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="text" danger onClick={() => remove(field.name)}>
                        הסר קריטריון
                      </Button>
                    )}
                  </Space>
                </CriterionItem>
              ))}
              <Button type="dashed" onClick={() => add({ name: '', description: '', weight: 0 })} block>
                הוסף קריטריון
              </Button>
            </>
          )}
        </Form.List>
      </EditForm>
    );
  };

  const renderDisplayMode = () => {
    const criteria = question.data.evaluationGuidelines?.requiredCriteria || [];
    
    const renderCriterion = (criterion: any, index: number) => (
      <CriterionItem key={index}>
        <CriterionHeader>
          <CriterionName>{criterion.name}</CriterionName>
          <Tooltip title="משקל הקריטריון מתוך 100%">
            <CriterionWeight>
              {criterion.weight}%
            </CriterionWeight>
          </Tooltip>
        </CriterionHeader>
        <CriterionDescription>{criterion.description}</CriterionDescription>
        <ProgressWrapper>
          <Progress 
            percent={criterion.weight} 
            size="small" 
            strokeColor="#2563eb"
            trailColor="#e5e7eb"
          />
        </ProgressWrapper>
      </CriterionItem>
    );

    const calculateTotalWeight = (criteria: Array<{ weight: number }>) => {
      return criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    };

    return (
      <div>
        {question.data.evaluationGuidelines?.requiredCriteria && (
          <>
            <TotalProgress>
              <TotalLabel>סה"כ משקל הקריטריונים</TotalLabel>
              <Progress 
                type="circle" 
                percent={calculateTotalWeight(question.data.evaluationGuidelines.requiredCriteria)}
                width={60}
                strokeColor={{
                  '0%': '#2563eb',
                  '100%': '#3b82f6',
                }}
              />
            </TotalProgress>
            {question.data.evaluationGuidelines.requiredCriteria.map(renderCriterion)}
          </>
        )}
      </div>
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <EditableWrapper
        label={<SectionLabel>קריטריוני הערכה</SectionLabel>}
        fieldPath="evaluationGuidelines.requiredCriteria"
        placeholder="הזן קריטריוני הערכה..."
        onValueChange={handleCriteriaChange}
        onBlur={onFieldBlur}
        validate={validateCriteria}
        isEditing={editableFields.criteria}
        onStartEdit={() => {
          console.log('[Evaluation] Starting criteria edit');
          setEditableFields(prev => ({ ...prev, criteria: true }));
        }}
        onCancelEdit={() => {
          console.log('[Evaluation] Canceling criteria edit');
          setEditableFields(prev => ({ ...prev, criteria: false }));
          form.resetFields();
        }}
        renderEditMode={renderEditMode}
        renderDisplayMode={renderDisplayMode}
      />
    </Space>
  );
}); 