import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Space, Typography, Input, Select } from 'antd';
import styled from 'styled-components';
import { DatabaseQuestion } from '../../../../../../types/question';
import { EditableWrapper } from '../../../../../../components/shared/EditableWrapper';
import LexicalEditor from '../../../../../../components/editor/LexicalEditor';
import { EditorWrapper } from '../../../../../../styles/adminEditStyles';
import { MarkdownRenderer } from '../../../../../../components/MarkdownRenderer';
import { useQuestion } from '../../../../../../contexts/QuestionContext';

const { Text } = Typography;

const SectionLabel = styled(Text)`
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 4px;
  display: block;
`;

const ContentDisplay = styled.div<{ hasUnsavedChanges?: boolean }>`
  font-size: 16px;
  line-height: 1.6;
  color: #000000;
  font-weight: 500;
  padding: 12px;
  background: ${props => props.hasUnsavedChanges ? '#fffbe6' : '#fafafa'};
  border-radius: 6px;
  min-height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.hasUnsavedChanges ? '#faad14' : '#f0f0f0'};

  &:hover {
    background: ${props => props.hasUnsavedChanges ? '#fff8e6' : '#f0f0f0'};
  }

  &:empty:before {
    content: attr(data-placeholder);
    color: #bfbfbf;
  }
`;

export interface SchoolAnswerSectionHandle {
  resetChanges: () => void;
}

export interface SchoolAnswerSectionProps {
  question: DatabaseQuestion;
  onContentChange: (changes: Partial<DatabaseQuestion>) => void;
  onFieldBlur?: () => void;
}

export const SchoolAnswerSection = forwardRef<SchoolAnswerSectionHandle, SchoolAnswerSectionProps>(({
  question,
  onContentChange,
  onFieldBlur
}, ref) => {
  const [editableFields, setEditableFields] = useState({
    schoolAnswer: false,
    finalAnswer: false
  });
  
  const { originalQuestion } = useQuestion();

  const hasFinalAnswerChanged = () => {
    if (!originalQuestion?.current || !question) return false;

    const originalFinalAnswer = originalQuestion.current.data.schoolAnswer?.finalAnswer;
    const currentFinalAnswer = question.data.schoolAnswer?.finalAnswer;

    if (!originalFinalAnswer && !currentFinalAnswer) return false;
    if (!originalFinalAnswer || !currentFinalAnswer) return true;

    if (originalFinalAnswer.type !== currentFinalAnswer.type) return true;

    if (originalFinalAnswer.type === 'multiple_choice' && currentFinalAnswer.type === 'multiple_choice') {
      return originalFinalAnswer.value !== currentFinalAnswer.value;
    }

    if (originalFinalAnswer.type === 'numerical' && currentFinalAnswer.type === 'numerical') {
      return originalFinalAnswer.value !== currentFinalAnswer.value || 
             originalFinalAnswer.tolerance !== currentFinalAnswer.tolerance;
    }

    return false;
  };

  useImperativeHandle(ref, () => ({
    resetChanges: () => {
      console.log('[SchoolAnswer] Reset changes called');
      setEditableFields({
        schoolAnswer: false,
        finalAnswer: false
      });
    }
  }));

  const handleSchoolAnswerChange = (text: string) => {
    console.log('[SchoolAnswer] School answer changed:', text.slice(0, 50) + '...');
    onContentChange({
      data: {
        ...question.data,
        schoolAnswer: {
          ...question.data.schoolAnswer,
          solution: {
            text,
            format: 'markdown'
          }
        }
      }
    });
  };

  const validateSchoolAnswer = (value: string) => {
    return Boolean(value && value.trim().length > 0);
  };

  const getHebrewLetter = (num: number) => {
    const letters = ['א', 'ב', 'ג', 'ד'];
    return letters[num - 1] || '';
  };

  const getOptionText = (optionNumber: number) => {
    const options = question.data.content.options;
    if (!options || optionNumber < 1 || optionNumber > options.length) return '';
    return options[optionNumber - 1]?.text || '';
  };

  const handleFinalAnswerChange = (value: string) => {
    if (question.data.metadata.type === 'multiple_choice') {
      const num = parseInt(value);
      if (!isNaN(num) && num >= 1 && num <= 4) {
        onContentChange({
          data: {
            ...question.data,
            schoolAnswer: {
              ...question.data.schoolAnswer,
              finalAnswer: {
                type: 'multiple_choice',
                value: num as 1 | 2 | 3 | 4
              }
            }
          }
        });
      }
    } else if (question.data.metadata.type === 'numerical') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        onContentChange({
          data: {
            ...question.data,
            schoolAnswer: {
              ...question.data.schoolAnswer,
              finalAnswer: {
                type: 'numerical',
                value: num,
                tolerance: question.data.schoolAnswer?.finalAnswer?.type === 'numerical' ? 
                  question.data.schoolAnswer.finalAnswer.tolerance : 0,
                unit: ''
              }
            }
          }
        });
      }
    }
  };

  const renderMultipleChoiceInput = (value: string, onChange: (value: string) => void) => {
    const currentValue = question.data.schoolAnswer?.finalAnswer?.type === 'multiple_choice' ? 
      question.data.schoolAnswer.finalAnswer.value : undefined;

    return (
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Select
          value={currentValue}
          onChange={(num) => onChange(num?.toString() || '')}
          style={{ width: '100%' }}
          placeholder="בחר תשובה נכונה..."
        >
          {[1, 2, 3, 4].map((num) => (
            <Select.Option key={num} value={num}>
              {getHebrewLetter(num)} - {getOptionText(num)}
            </Select.Option>
          ))}
        </Select>
      </Space>
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {(question.data.metadata.type === 'multiple_choice' || question.data.metadata.type === 'numerical') && (
        <EditableWrapper
          label={<SectionLabel>תשובה סופית</SectionLabel>}
          fieldPath="schoolAnswer.finalAnswer"
          placeholder={question.data.metadata.type === 'multiple_choice' ? 
            "בחר את התשובה הנכונה..." : 
            "הזן את התשובה המספרית..."}
          onValueChange={handleFinalAnswerChange}
          onBlur={onFieldBlur}
          validate={(value) => {
            if (!value) return false;
            if (question.data.metadata.type === 'multiple_choice') {
              const num = parseInt(value);
              return !isNaN(num) && num >= 1 && num <= 4;
            } else {
              return !isNaN(parseFloat(value));
            }
          }}
          isEditing={editableFields.finalAnswer}
          onStartEdit={() => {
            setEditableFields(prev => ({ ...prev, finalAnswer: true }));
          }}
          onCancelEdit={() => {
            setEditableFields(prev => ({ ...prev, finalAnswer: false }));
          }}
          renderEditMode={(value, onChange) => (
            question.data.metadata.type === 'multiple_choice' ?
              renderMultipleChoiceInput(value, onChange) :
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="הזן את התשובה המספרית..."
                  type="number"
                />
                {question.data.metadata.type === 'numerical' && (
                  <Input
                    placeholder="סטיית תקן..."
                    type="number"
                    onChange={(e) => {
                      const tolerance = parseFloat(e.target.value);
                      if (!isNaN(tolerance)) {
                        onContentChange({
                          data: {
                            ...question.data,
                            schoolAnswer: {
                              ...question.data.schoolAnswer,
                              finalAnswer: {
                                type: 'numerical',
                                value: question.data.schoolAnswer?.finalAnswer?.type === 'numerical' ? 
                                  question.data.schoolAnswer.finalAnswer.value : 0,
                                tolerance,
                                unit: ''
                              }
                            }
                          }
                        });
                      }
                    }}
                    value={question.data.schoolAnswer?.finalAnswer?.type === 'numerical' ? 
                      question.data.schoolAnswer.finalAnswer.tolerance : 
                      ''}
                  />
                )}
              </Space>
          )}
          renderDisplayMode={(value) => (
            <ContentDisplay 
              data-placeholder={question.data.metadata.type === 'multiple_choice' ? 
                "לא נבחרה תשובה נכונה" : 
                "לא הוזנה תשובה מספרית"}
              hasUnsavedChanges={hasFinalAnswerChanged()}
            >
              {question.data.schoolAnswer?.finalAnswer?.type === 'multiple_choice' && (
                <>
                  תשובה נכונה: {getHebrewLetter(question.data.schoolAnswer.finalAnswer.value)}
                  <div style={{ marginTop: '4px', fontSize: '14px', color: '#4B5563' }}>
                    {getOptionText(question.data.schoolAnswer.finalAnswer.value)}
                  </div>
                </>
              )}
              {question.data.schoolAnswer?.finalAnswer?.type === 'numerical' && 
                `תשובה: ${question.data.schoolAnswer.finalAnswer.value} ± ${question.data.schoolAnswer.finalAnswer.tolerance}`}
            </ContentDisplay>
          )}
        />
      )}
      <EditableWrapper
        label={<SectionLabel>פתרון מלא</SectionLabel>}
        fieldPath="schoolAnswer.solution.text"
        placeholder="הזן את הפתרון המלא..."
        onValueChange={handleSchoolAnswerChange}
        onBlur={onFieldBlur}
        validate={validateSchoolAnswer}
        isEditing={editableFields.schoolAnswer}
        onStartEdit={() => {
          console.log('[SchoolAnswer] Starting school answer edit');
          setEditableFields(prev => ({ ...prev, schoolAnswer: true }));
        }}
        onCancelEdit={() => {
          console.log('[SchoolAnswer] Canceling school answer edit');
          setEditableFields(prev => ({ ...prev, schoolAnswer: false }));
        }}
        renderEditMode={(value, onChange) => (
          <LexicalEditor
            initialValue={value || ''}
            onChange={onChange}
            placeholder="הזן את פתרון בית הספר..."
          />
        )}
        renderDisplayMode={(value) => (
          <div className="markdown-content" style={{ 
            padding: '16px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            cursor: 'pointer'
          }}>
            <MarkdownRenderer content={value || ''} />
          </div>
        )}
      />
    </Space>
  );
}); 