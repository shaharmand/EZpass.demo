import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Button, Row, Col, Tag } from 'antd';
import { 
  EditOutlined, 
  ProfileOutlined,
  TagsOutlined,
  ApartmentOutlined,
  DatabaseOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { 
  Question, 
  QuestionType, 
  DifficultyLevel, 
  PublicationStatusEnum,
  DatabaseQuestion,
  EzpassCreatorType,
  SourceType
} from '../../../types/question';
import { ValidationDisplay } from '../../validation/ValidationDisplay';
import { getEnumTranslation, getFieldTranslation, formatValidationDetails, fieldNameMapping, getQuestionSourceDisplay } from '../../../utils/translations';
import { getExamTemplateName, getExamSourceDisplayText } from '../../../utils/examTranslations';
import { ValidationError, ValidationWarning, ValidationResult } from '../../../types/validation';
import { universalTopicsV2 } from '../../../services/universalTopics';
import { examService } from '../../../services/examService';
import { ExamTemplate } from '../../../types/examTemplate';
import { validateQuestion } from '../../../utils/questionValidator';
import styled from 'styled-components';

const { Text } = Typography;

interface QuestionMetadataSectionProps {
  question: DatabaseQuestion;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<Question>) => Promise<void>;
}

interface MetadataValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

type ValueType = 'subject' | 'domain' | 'topic' | 'subtopic' | 'enum' | 'text' | 'number' | 'date';
type EnumType = 'questionType' | 'difficulty' | 'publication_status' | 'season' | 'moed' | 'examTemplate';

interface DisplayValue {
  text: string;
  isMissing: boolean;
}

type ExamSource = {
  type: 'exam';
  examTemplateId: string;
  year: number;
  season: 'spring' | 'summer';
  moed: 'a' | 'b';
};

type EzpassSource = {
  type: 'ezpass';
  creatorType: EzpassCreatorType;
};

type QuestionSource = ExamSource | EzpassSource;

function isExamSource(source: QuestionSource): source is ExamSource {
  return source.type === 'exam';
}

function isEzpassSource(source: QuestionSource): source is EzpassSource {
  return source.type === 'ezpass';
}

const ValidationSection = styled.div`
  margin: 16px 0;
  
  .section-header {
    font-size: 16px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
  }

  .validation-errors {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 4px;
    padding: 12px 16px;
    margin-bottom: 8px;
  }

  .validation-warnings {
    background: #fffbe6;
    border: 1px solid #ffe58f;
    border-radius: 4px;
    padding: 12px 16px;
  }

  .validation-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .validation-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

export const QuestionMetadataSection: React.FC<QuestionMetadataSectionProps> = ({
  question,
  isEditing,
  onEdit,
  onSave
}) => {
  const [examTemplate, setExamTemplate] = useState<ExamTemplate | null>(null);
  const [validationState, setValidationState] = useState<MetadataValidationResult | null>(null);
  const [sourceDisplay, setSourceDisplay] = useState<string>('');

  if (!question?.metadata) {
    return (
      <Card style={{ direction: 'rtl' }}>
        <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
          <ProfileOutlined style={{ fontSize: '24px', color: '#faad14' }} />
          <Text type="warning">{getFieldTranslation('metadata.missing')}</Text>
          <Button 
            type="primary"
            icon={<EditOutlined />}
            onClick={onEdit}
          >
            {getFieldTranslation('metadata.add')}
          </Button>
        </Space>
      </Card>
    );
  }

  const validateMetadata = (question: Question): MetadataValidationResult => {
    const result = validateQuestion(question);
    return {
      success: result.errors.length === 0,
      errors: result.errors || [],
      warnings: result.warnings || []
    };
  };

  useEffect(() => {
    if (question) {
      const result = validateMetadata(question);
      setValidationState(result);
    }
  }, [question]);

  useEffect(() => {
    const loadExamTemplate = async () => {
      if (question?.metadata?.source?.type === 'exam' && question?.metadata?.source?.examTemplateId) {
        const template = await examService.getExamById(question.metadata.source.examTemplateId);
        setExamTemplate(template);
      }
    };
    loadExamTemplate();
  }, [question?.metadata?.source]);

  useEffect(() => {
    const loadSourceDisplay = async () => {
      if (question?.metadata?.source) {
        const display = await getQuestionSourceDisplay({
          sourceType: question.metadata.source.type as SourceType,
          ...(question.metadata.source.type === SourceType.EXAM ? {
            examTemplateId: question.metadata.source.examTemplateId,
            year: question.metadata.source.year,
            season: question.metadata.source.season,
            moed: question.metadata.source.moed,
            order: question.metadata.source.order
          } : {})
        });
        setSourceDisplay(display);
      }
    };
    loadSourceDisplay();
  }, [question?.metadata?.source]);

  const getDisplayValue = (
    value: string | number | null | undefined,
    type: ValueType,
    enumType?: EnumType
  ): DisplayValue => {
    if (value === undefined || value === null || value === '') {
      return { 
        text: getFieldTranslation('common.no_value'), 
        isMissing: true 
      };
    }
    
    if (type === 'enum' && enumType) {
      let translatedValue: string;
      switch (enumType) {
        case 'questionType':
          translatedValue = getEnumTranslation(enumType, String(value) as QuestionType);
          break;
        case 'difficulty':
          translatedValue = getEnumTranslation(enumType, Number(value) as DifficultyLevel);
          break;
        case 'publication_status':
          translatedValue = getEnumTranslation(enumType, String(value) as PublicationStatusEnum);
          break;
        case 'season':
          translatedValue = fieldNameMapping[`metadata.source.exam.season.${value}`] || String(value);
          break;
        case 'moed':
          translatedValue = fieldNameMapping[`metadata.source.exam.moed.${value}`] || String(value);
          break;
        case 'examTemplate':
          translatedValue = examTemplate?.names?.medium || String(value);
          break;
        default:
          translatedValue = String(value);
      }
      return { text: translatedValue, isMissing: false };
    }
    
    if (['subject', 'domain', 'topic', 'subtopic'].includes(type)) {
      const hierarchyValue = getHierarchyValue(type as 'subject' | 'domain' | 'topic' | 'subtopic', String(value));
      return {
        text: hierarchyValue,
        isMissing: hierarchyValue === getFieldTranslation('common.no_value')
      };
    }

    if (type === 'number') {
      return {
        text: Number(value).toString(),
        isMissing: false
      };
    }

    if (type === 'date' && value) {
      try {
        const date = new Date(value);
        return {
          text: date.toLocaleDateString('he-IL'),
          isMissing: false
        };
      } catch {
        return { text: String(value), isMissing: false };
      }
    }

    return { 
      text: String(value), 
      isMissing: false 
    };
  };

  const getHierarchyValue = (type: 'subject' | 'domain' | 'topic' | 'subtopic', id: string | undefined | null): string => {
    if (!id) return getFieldTranslation('common.no_value');

    let name: string | undefined;
    switch (type) {
      case 'subject':
        name = universalTopicsV2.getSubjectSafe(id)?.name;
        break;
      case 'domain':
        name = universalTopicsV2.getDomainSafe(question.metadata.subjectId || '', id)?.name;
        break;
      case 'topic':
        name = universalTopicsV2.getTopicSafe(
          question.metadata.subjectId || '',
          question.metadata.domainId || '',
          id
        )?.name;
        break;
      case 'subtopic':
        name = universalTopicsV2.getSubTopicSafe(
          question.metadata.subjectId || '',
          question.metadata.domainId || '',
          question.metadata.topicId || '',
          id
        )?.name;
        break;
    }

    return name || id;
  };

  const getFieldValidation = (
    fieldName: string,
    valueType: ValueType,
    enumType?: EnumType
  ) => {
    const fieldError = validationState?.errors.find((error: ValidationError) => error.field === fieldName);
    
    let fieldValue: string | number | null | undefined;
    if (fieldName === 'name') {
      fieldValue = question.name;
    } else if (fieldName === 'type') {
      fieldValue = question.metadata.type;
    } else if (fieldName === 'publication_status') {
      fieldValue = question.publication_status;
    } else if (question.metadata.source) {
      // Handle source fields based on type
      const source = question.metadata.source;
      if (source.type === 'exam') {
        switch (fieldName) {
          case 'examTemplateId':
            fieldValue = source.examTemplateId;
            break;
          case 'year':
            fieldValue = source.year;
            break;
          case 'season':
            fieldValue = source.season;
            break;
          case 'moed':
            fieldValue = source.moed;
            break;
        }
      } else if (source.type === 'ezpass') {
        if (fieldName === 'creatorType') {
          fieldValue = source.creatorType;
        }
      }
    } else {
      fieldValue = question.metadata[fieldName as keyof typeof question.metadata] as string | number | undefined;
    }

    const displayValue = getDisplayValue(fieldValue, valueType, enumType);
    const translationKey = fieldName.split('.').pop() || fieldName;
    const label = getFieldTranslation(translationKey);
    
    return (
      <div className={`metadata-field ${fieldError ? 'has-error' : ''}`}>
        <div className="metadata-header">
          <div className="field-label">
            <Text>{label}</Text>
            <Text type="secondary" className="field-separator">:</Text>
          </div>
          <div className="field-value-wrapper">
            <div className={`field-value ${displayValue.isMissing ? 'is-missing' : ''}`}>
              <Text type={displayValue.isMissing ? "secondary" : undefined} italic={displayValue.isMissing}>
                {displayValue.text}
              </Text>
            </div>
          </div>
        </div>
        {fieldError && (
          <div className="validation-message error">
            <Text type="danger">{fieldError.message}</Text>
          </div>
        )}
      </div>
    );
  };

  const renderSectionHeader = (icon: React.ReactNode, titleKey: string) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      direction: 'rtl',
      marginBottom: '16px'
    }}>
      <Space>
        {icon}
        <Text strong>{getFieldTranslation(titleKey)}</Text>
      </Space>
      <Button 
        type="text" 
        icon={<EditOutlined />}
        onClick={onEdit}
      >
        {getFieldTranslation('common.edit')}
      </Button>
    </div>
  );

  const renderSourceInfo = () => {
    const source = question?.metadata?.source;
    if (!source) return null;

    return (
      <div>
        <Text>
          {getQuestionSourceDisplay({
            sourceType: source.type as SourceType,
            ...(source.type === SourceType.EXAM ? {
              examTemplateId: source.examTemplateId,
              year: source.year,
              season: source.season,
              moed: source.moed,
              order: source.order
            } : {})
          })}
        </Text>
      </div>
    );
  };

  return (
    <div style={{ direction: 'rtl' }} className="metadata-section-container">
      <style>
        {`
          .metadata-section-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .metadata-field {
            padding: 8px;
            margin-bottom: 2px;
            border-radius: 4px;
          }

          .metadata-header {
            display: grid;
            grid-template-columns: 90px 1fr;
            align-items: baseline;
            gap: 8px;
          }

          .field-label {
            display: flex;
            align-items: baseline;
            justify-content: flex-end;
            gap: 4px;
            text-align: right;
            color: rgba(0, 0, 0, 0.85);
            font-size: 13px;
          }

          .field-separator {
            margin: 0 4px;
          }

          .field-value-wrapper {
            display: flex;
            align-items: center;
          }

          .field-value {
            display: inline-flex;
            align-items: center;
            background: #f5f5f5;
            border-radius: 4px;
            padding: 4px 8px;
            min-height: 28px;
            border: 1px solid #f0f0f0;
            font-size: 13px;
            width: 100%;
          }

          .field-value.is-missing {
            background: #fff;
            border-style: dashed;
          }

          .section-header {
            font-size: 16px;
            font-weight: 500;
            color: rgba(0, 0, 0, 0.85);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .section-header .anticon {
            color: #1677ff;
            font-size: 16px;
          }

          .metadata-section {
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #f0f0f0;
          }

          .topic-hierarchy {
            display: flex;
            flex-direction: column;
            gap: 16px;
            position: relative;
            padding: 8px;
          }

          .topic-level {
            position: relative;
            display: flex;
            align-items: center;
            min-height: 40px;
          }

          .topic-level::before {
            content: '';
            position: absolute;
            right: -16px;
            top: -16px;
            bottom: 50%;
            width: 2px;
            background: #e8e8e8;
          }

          .topic-level::after {
            content: '';
            position: absolute;
            right: -16px;
            top: 50%;
            width: 16px;
            height: 2px;
            background: #e8e8e8;
          }

          .topic-level:first-child::before {
            display: none;
          }

          .topic-level .metadata-header {
            flex: 1;
            display: grid;
            grid-template-columns: 80px 1fr;
            gap: 12px;
            background: white;
            border-radius: 4px;
          }

          .topic-level .field-label {
            font-size: 13px;
            color: rgba(0, 0, 0, 0.85);
            padding: 8px 0;
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }

          .topic-level .field-value {
            font-size: 13px;
            padding: 8px 12px;
            background: #f5f5f5;
            border: 1px solid #f0f0f0;
            border-radius: 4px;
            margin-left: 12px;
            flex: 1;
          }

          .topic-level-2 {
            margin-right: 24px;
          }

          .topic-level-3 {
            margin-right: 48px;
          }

          .topic-level-4 {
            margin-right: 72px;
          }

          .topic-level:not(:last-child)::before {
            bottom: -16px;
            height: calc(100% + 32px);
          }

          .topic-level:first-child .field-value {
            background: #f5f5f5;
            border-color: #f0f0f0;
            color: inherit;
          }

          .topic-level:first-child .field-label {
            color: rgba(0, 0, 0, 0.85);
            font-weight: normal;
          }

          .topic-level:hover .field-value {
            border-color: #f0f0f0;
            background: white;
          }

          .exam-source-info {
            background: #fafafa;
            border-radius: 4px;
            padding: 8px 12px;
            border: 1px solid #f0f0f0;
            margin-bottom: 12px;
          }

          .source-separator {
            margin: 0 8px;
            opacity: 0.5;
          }
        `}
      </style>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="metadata-section">
          <div className="section-header">
            <ProfileOutlined />
            {getFieldTranslation('metadata.basic_info')}
          </div>
          <Space direction="vertical" style={{ width: '100%' }}>
            {getFieldValidation('name', 'text')}
          </Space>
        </div>

        <div className="metadata-section">
          <div className="section-header">
            <TagsOutlined />
            {getFieldTranslation('metadata.characteristics')}
          </div>
          <Row gutter={[16, 16]}>
            <Col span={8}>{getFieldValidation('type', 'enum', 'questionType')}</Col>
            <Col span={8}>{getFieldValidation('difficulty', 'enum', 'difficulty')}</Col>
            <Col span={8}>{getFieldValidation('estimatedTime', 'number')}</Col>
          </Row>
        </div>

        <div className="metadata-section">
          <div className="section-header">
            <ApartmentOutlined />
            {getFieldTranslation('metadata.subject_info')}
          </div>
          <div className="topic-hierarchy">
            <div className="topic-level topic-level-1">
              {getFieldValidation('subjectId', 'subject')}
            </div>
            <div className="topic-level topic-level-2">
              {getFieldValidation('domainId', 'domain')}
            </div>
            <div className="topic-level topic-level-3">
              {getFieldValidation('topicId', 'topic')}
            </div>
            <div className="topic-level topic-level-4">
              {getFieldValidation('subtopicId', 'subtopic')}
            </div>
          </div>
        </div>

        <div className="metadata-section">
          <div className="section-header">
            <DatabaseOutlined />
            {getFieldTranslation('metadata.source_info')}
          </div>
          {renderSourceInfo()}
        </div>
      </Space>
    </div>
  );
}; 