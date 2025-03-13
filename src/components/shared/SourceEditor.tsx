import React, { useEffect, useState } from 'react';
import { Select, Input, Form, Typography, Divider, Space } from 'antd';
import { SourceType, EzpassCreatorType } from '../../types/question';
import { examService } from '../../services/examService';
import { getEnumTranslation } from '../../utils/translations';
import { ExamType, ExamTemplate } from '../../types/examTemplate';

type SourceValue = {
  type: 'exam' | 'ezpass';
  examTemplateId?: string;
  year?: number;
  period?: string;
  moed?: string;
  order?: number;
  creatorType?: 'human' | 'ai';
  number?: number;
};

interface SourceEditorProps {
  value?: SourceValue;
  onChange?: (value: SourceValue) => void;
  initialValue?: SourceValue;
  domainId?: string;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({
  value,
  onChange,
  initialValue,
  domainId
}) => {
  const [examTemplates, setExamTemplates] = useState<ExamTemplate[]>([]);

  useEffect(() => {
    if (!domainId) return;

    // Get all exams for the current domain
    const domainExams = examService.getExamsByDomain(domainId);
    
    // Debug: Log exams for the current domain
    console.log('Exams for current domain:', domainExams.map(exam => ({
      id: exam.id,
      name: exam.names.short,
      type: exam.examType,
      domainId: exam.domainId,
      subjectId: exam.subjectId
    })));
    
    setExamTemplates(domainExams);
  }, [domainId]);

  // Update local value when value prop changes
  useEffect(() => {
    if (value) {
      setLocalValue(value);
    }
  }, [value]);

  const [localValue, setLocalValue] = useState<SourceValue | undefined>(value || initialValue);

  const handleTypeChange = (type: 'exam' | 'ezpass') => {
    const newValue: SourceValue = {
      type,
      ...(type === 'exam' ? {
        examTemplateId: undefined,
        year: undefined,
        period: undefined,
        moed: undefined,
        order: undefined
      } : {
        creatorType: undefined
      })
    };
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const handleExamChange = (field: keyof SourceValue, fieldValue: any) => {
    if (!localValue) return;
    
    const newValue: SourceValue = {
      ...localValue,
      [field]: fieldValue
    };
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const handleCreatorTypeChange = (creatorType: 'human' | 'ai') => {
    const newValue: SourceValue = {
      type: 'ezpass',
      creatorType
    };
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const periodOptions = [
    { label: 'קיץ', value: 'Summer' },
    { label: 'אביב', value: 'Spring' }
  ];

  const moedOptions = [
    { label: 'א׳', value: 'A' },
    { label: 'ב׳', value: 'B' }
  ];

  // Helper to get display label
  const getDisplayLabel = (options: { label: string; value: string }[], value?: string) => {
    const option = options.find(opt => opt.value === value);
    console.log('Getting display label for', value, 'found option:', option);
    return option?.label || '';
  };

  if (!localValue) return null;

  return (
    <Form layout="vertical" style={{ 
      width: '100%', 
      padding: '12px 12px 12px 12px',
      paddingRight: 0,
      margin: 0, 
      maxWidth: '100%', 
      position: 'relative'
    }} className="source-editor">
      <style>
        {`
          /* Make the entire layout wider when editing */
          .source-editor:has([class*="EditableWrapper"]:focus-within) {
            position: relative !important;
            z-index: 1000 !important;
          }

          /* Target parent containers when editing */
          .source-editor:has([class*="EditableWrapper"]:focus-within) ~ div,
          .source-editor:has([class*="EditableWrapper"]:focus-within) ~ *,
          div:has(> .source-editor:has([class*="EditableWrapper"]:focus-within)),
          [class*="PropertiesPanel"]:has(.source-editor:has([class*="EditableWrapper"]:focus-within)),
          [class*="properties-panel"]:has(.source-editor:has([class*="EditableWrapper"]:focus-within)),
          [class*="Panel"]:has(.source-editor:has([class*="EditableWrapper"]:focus-within)),
          [class*="panel"]:has(.source-editor:has([class*="EditableWrapper"]:focus-within)) {
            width: 600px !important;
            max-width: none !important;
            flex-basis: 600px !important;
            flex-grow: 0 !important;
            flex-shrink: 0 !important;
          }

          /* Ensure the content area expands */
          [class*="EditableWrapper"]:focus-within {
            width: 100% !important;
            max-width: none !important;
          }

          /* Remove padding and margins */
          styled\\.div,
          div[class*="styled"] {
            padding-right: 0 !important;
            margin-right: 0 !important;
          }

          /* Target the source editor and its immediate wrapper */
          .source-editor,
          .source-editor > div:first-child {
            padding-right: 0 !important;
            margin-right: 0 !important;
          }

          /* Remove ALL spacing from ant-select components */
          .ant-select {
            margin: 0 !important;
            padding: 0 !important;
          }

          .ant-select-selector {
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }

          /* Target the wrapper around the select */
          .ant-select-selection-search {
            margin: 0 !important;
            padding: 0 !important;
            right: 0 !important;
          }

          /* Add internal padding for select content */
          .ant-select-selection-item,
          .ant-select-selection-placeholder,
          .ant-select-selection-search input {
            padding: 0 8px !important;
            margin: 0 !important;
          }

          /* Remove right padding from form items */
          .ant-form-item,
          .ant-form-item-control-input,
          .ant-form-item-control-input-content {
            padding-right: 0 !important;
            margin-right: 0 !important;
          }
        `}
      </style>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 16,
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: 12,
        marginRight: 0,
        paddingRight: 0
      }}>
        <div style={{ 
          fontSize: 14, 
          color: 'rgba(0, 0, 0, 0.88)', 
          marginRight: 8,
          whiteSpace: 'nowrap'
        }}>
          סוג מקור:
        </div>
        <Select
          value={localValue?.type}
          onChange={handleTypeChange}
          options={[
            { label: 'מבחן', value: 'exam' },
            { label: 'איזיפס', value: 'ezpass' }
          ]}
          style={{ 
            width: 120, 
            marginRight: 'auto'
          }}
        />
      </div>

      {localValue?.type === 'exam' && (
        <>
          <div style={{ 
            marginBottom: 16, 
            padding: 0,
            marginLeft: 0, 
            marginRight: 0
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', padding: 0, margin: 0 }}>
              <div style={{ 
                fontSize: 14, 
                color: 'rgba(0, 0, 0, 0.88)', 
                fontWeight: 500,
                margin: 0,
                padding: 0,
                marginBottom: 4
              }}>
                שם מבחן:
              </div>
              <Select
                value={localValue.examTemplateId}
                onChange={(id) => handleExamChange('examTemplateId', id)}
                placeholder="בחר מבחן"
                options={examTemplates.map((exam) => ({
                  label: exam.names.short,
                  value: exam.id
                }))}
                disabled={!domainId}
                style={{ 
                  width: '100%',
                  margin: 0,
                  padding: 0,
                  marginRight: 0,
                  marginLeft: 0
                }}
              />
            </div>
          </div>

          <div style={{ 
            marginBottom: 16, 
            padding: 0,
            marginLeft: 0, 
            marginRight: 0
          }}>
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              padding: '8px',
              borderRadius: '6px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                <div style={{ fontSize: 14, marginBottom: 4, color: 'rgba(0, 0, 0, 0.88)' }}>
                  שנה:
                </div>
                <Select
                  value={localValue.year}
                  onChange={(year) => handleExamChange('year', year)}
                  style={{ width: 70, minWidth: 70, padding: 0 }}
                  options={Array.from({ length: 11 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return {
                      label: year.toString(),
                      value: year
                    };
                  })}
                  dropdownMatchSelectWidth={false}
                  size="small"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, marginBottom: 4, color: 'rgba(0, 0, 0, 0.88)' }}>
                  תקופה:
                </div>
                <Select
                  labelInValue
                  value={{
                    value: localValue.period,
                    label: getDisplayLabel(periodOptions, localValue.period)
                  }}
                  onChange={(selected) => handleExamChange('period', selected.value)}
                  style={{ width: 80, minWidth: 80, padding: 0 }}
                  options={periodOptions}
                  dropdownMatchSelectWidth={false}
                  size="small"
                  placeholder="תקופה"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, marginBottom: 4, color: 'rgba(0, 0, 0, 0.88)' }}>
                  מועד:
                </div>
                <Select
                  labelInValue
                  value={{
                    value: localValue.moed,
                    label: getDisplayLabel(moedOptions, localValue.moed)
                  }}
                  onChange={(selected) => handleExamChange('moed', selected.value)}
                  style={{ width: 55, minWidth: 55, padding: 0 }}
                  options={moedOptions}
                  dropdownMatchSelectWidth={false}
                  size="small"
                  placeholder="מועד"
                />
              </div>
            </div>
          </div>

          <Form.Item 
            label={<span style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.88)' }}>מספר שאלה:</span>}
            style={{ marginBottom: 0 }}
          >
            <Input
              value={localValue.order}
              onChange={(e) => handleExamChange('order', parseInt(e.target.value))}
              placeholder="מספר שאלה"
              type="number"
              min={1}
              style={{ width: '100px' }}
            />
          </Form.Item>
        </>
      )}

      {localValue?.type === 'ezpass' && (
        <>
          <Form.Item 
            label={<span style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.88)' }}>סוג יוצר:</span>}
            style={{ marginBottom: 0 }}
          >
            <Select
              value={localValue.creatorType}
              onChange={(creatorType) => handleExamChange('creatorType', creatorType)}
              placeholder="בחר סוג יוצר"
              options={[
                { label: 'אדם', value: 'human' },
                { label: 'בינה מלאכותית', value: 'ai' }
              ]}
            />
          </Form.Item>
        </>
      )}
    </Form>
  );
}; 