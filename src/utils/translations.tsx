import { QuestionType, DifficultyLevel, SourceType, QuestionStatus } from '../types/question';
import styled from 'styled-components';
import { Card, Typography } from 'antd';
import { InfoCircleOutlined, BookOutlined, HistoryOutlined } from '@ant-design/icons';
import React from 'react';

const { Text } = Typography;

type ValueType = 'subject' | 'domain' | 'topic' | 'subtopic' | 'enum' | 'other';

interface FieldValue {
  text: string;
  isMissing: boolean;
  error?: string;
}

interface FieldValueResult {
  text: string;
  isMissing: boolean;
  error?: string;
}

// Direct type-safe mappings for each enum
export const questionTypeTranslations = {
  [QuestionType.MULTIPLE_CHOICE]: 'סגורה',
  [QuestionType.NUMERICAL]: 'חישובית',
  [QuestionType.OPEN]: 'פתוחה'
};

const difficultyTranslations: Record<DifficultyLevel, string> = {
  1: 'קל מאוד',
  2: 'קל',
  3: 'בינוני',
  4: 'קשה',
  5: 'קשה מאוד'
};

const sourceTypeTranslations: Record<SourceType, string> = {
  [SourceType.EXAM]: 'מבחן',
  [SourceType.EZPASS]: 'איזיפס'
};

const statusTranslations: Record<QuestionStatus, string> = {
  'draft': 'טיוטה',
  'approved': 'מאושר'
};

// Simple translation functions
function translateQuestionType(type: QuestionType): string {
  return questionTypeTranslations[type] || type;
}

function translateDifficulty(level: DifficultyLevel): string {
  return difficultyTranslations[level] || level.toString();
}

function translateSourceType(type: SourceType): string {
  return sourceTypeTranslations[type] || type;
}

function translateStatus(status: QuestionStatus): string {
  return statusTranslations[status] || status;
}

// Get valid values for each enum type
function getValidQuestionTypes(): string[] {
  return Object.values(questionTypeTranslations);
}

function getValidSourceTypes(): string[] {
  return Object.values(sourceTypeTranslations);
}

function getValidDifficultyLevels(): string[] {
  return Object.values(difficultyTranslations);
}

function getValidStatuses(): string[] {
  return Object.values(statusTranslations);
}

// Export everything
export {
  translateQuestionType,
  translateDifficulty,
  translateSourceType,
  translateStatus,
  getValidQuestionTypes,
  getValidSourceTypes,
  getValidDifficultyLevels,
  getValidStatuses
};

// Types
interface EnumMappings {
  questionType: Record<QuestionType, string>;
  difficulty: Record<DifficultyLevel, string>;
  sourceType: Record<SourceType, string>;
  status: Record<string, string>;
}

// Enum translations
export const enumMappings: EnumMappings = {
  questionType: {
    [QuestionType.MULTIPLE_CHOICE]: 'סגורה',
    [QuestionType.NUMERICAL]: 'חישובית',
    [QuestionType.OPEN]: 'פתוחה'
  },
  
  difficulty: {
    1: 'קל מאוד',
    2: 'קל',
    3: 'בינוני',
    4: 'קשה',
    5: 'קשה מאוד'
  },

  sourceType: {
    'exam': 'מבחן',
    'ezpass': 'איזיפס'
  },

  status: {
    'draft': 'טיוטה',
    'approved': 'מאושר'
  }
};

// Field name translations
const fieldNameMapping: Record<string, string> = {
  // Section headers
  'validation.errors': 'שגיאות תיקוף',
  'metadata.characteristics': 'מאפיינים',
  'metadata.subject_info': 'מידע נושאי',
  'metadata.source_info': 'מידע מקור',
  'admin.interface': 'ממשק מנהל',

  // Field Labels
  'questionName': 'שם השאלה',
  'type': 'סוג שאלה',
  'difficulty': 'רמת קושי',
  'estimatedTime': 'זמן משוער',
  'subjectId': 'נושא רחב',
  'domainId': 'תחום',
  'topicId': 'נושא',
  'subtopicId': 'תת-נושא',
  'sourceType': 'סוג מקור',
  'authorName': 'שם המחבר',
  'validationStatus': 'סטטוס תיקוף',

  // Validation Status
  'validation.status.warning': 'אזהרה',
  'validation.status.error': 'שגיאה',
  'validation.status.success': 'תקין',
  'validation.status.info': 'מידע',
  
  // Field names for validation messages
  'metadata.estimatedTime': 'זמן משוער',
  'metadata.source.sourceType': 'סוג מקור',
  
  // Validation Messages
  'validation.required': 'חסר',
  'validation.invalid_value': 'ערך לא חוקי',
  'validation.select_required': 'יש לבחור',
  'validation.define_required': 'יש להגדיר',
  
  // Error Message Templates
  'error.field_required': 'חסר - יש לבחור {field}',
  'error.field_missing': 'חסר - יש להגדיר {field}',
  'error.invalid_source_type': 'ערך לא חוקי. התקבל \'{value}\'. הערכים החוקיים הם: {validValues}',
  
  // Common Values
  'common.no_value': '-',
  'common.edit': 'עריכה',

  // Source Types
  'source.type.exam': 'מבחן',
  'source.type.ezpass': 'איזיפס',

  // Specific field values
  'subject.civil_engineering': 'הנדסה אזרחית',
  'domain.construction_safety': 'בטיחות בבנייה',

  // Status translation for the question status from DB
  'status': 'סטטוס'
};

const getEnumTranslation = (
  enumType: keyof EnumMappings,
  value: QuestionType | DifficultyLevel | SourceType | QuestionStatus
): string => {
  const mappings = enumMappings[enumType];
  
  // Type-safe check - only look in the specific enum mapping
  switch(enumType) {
    case 'questionType':
      if (!Object.keys(enumMappings.questionType).includes(value as string)) {
        return value.toString();
      }
      break;
    case 'difficulty':
      if (!Object.keys(enumMappings.difficulty).includes(value.toString())) {
        return value.toString();
      }
      break;
    case 'sourceType':
      if (!Object.keys(enumMappings.sourceType).includes(value as string)) {
        return value.toString();
      }
      break;
    case 'status':
      if (!Object.keys(enumMappings.status).includes(value as string)) {
        return value.toString();
      }
      break;
  }

  const translation = (mappings as Record<string, string>)[value];
  if (!translation) {
    console.warn(`Missing enum translation for ${enumType}.${value}`);
    return value.toString();
  }
  return translation;
};

const getFieldTranslation = (field: string): string => {
  const translation = fieldNameMapping[field];
  if (!translation) {
    console.warn(`Missing translation for key: ${field}`);
    return field;
  }
  return translation;
};

const getValidEnumValues = (enumType: keyof EnumMappings): string[] => {
  return Object.keys(enumMappings[enumType]).map(key => 
    getEnumTranslation(enumType, key as any)
  );
};

const formatValidationDetails = (field: string, error: string): string => {
  const hebrewField = getFieldTranslation(field);
  
  // Handle missing field errors
  if (error.includes('Required')) {
    return fieldNameMapping['error.field_required']
      .replace('{field}', hebrewField);
  }

  // Handle invalid enum values
  if (error.includes('Invalid')) {
    let enumType: keyof EnumMappings | undefined;
    
    if (field === 'metadata.source.sourceType') enumType = 'sourceType';
    else if (field === 'type') enumType = 'questionType';
    else if (field === 'metadata.difficulty') enumType = 'difficulty';
    else if (field === 'status') enumType = 'status';

    if (enumType) {
      const value = error.match(/received '(.+)'/)?.[1] || '';
      const validValues = getValidEnumValues(enumType).map(v => `'${v}'`).join(' | ');
      
      return fieldNameMapping['error.invalid_value']
        + ` התקבל '${value}'. הערכים החוקיים הם: ${validValues}`;
    }
  }

  return error;
};

const getDisplayValue = (
  value: string | number | undefined | null, 
  type: 'subject' | 'domain' | 'topic' | 'subtopic' | 'enum' | 'other',
  enumType?: 'questionType' | 'difficulty' | 'sourceType' | 'status'
): string => {
  if (value === undefined || value === null) {
    return fieldNameMapping['common.no_value'];
  }
  
  if (type === 'enum' && enumType) {
    // Cast the value to the appropriate enum type
    switch (enumType) {
      case 'questionType':
        return getEnumTranslation(enumType, value.toString() as QuestionType);
      case 'difficulty':
        return getEnumTranslation(enumType, Number(value) as DifficultyLevel);
      case 'sourceType':
        return getEnumTranslation(enumType, value.toString() as SourceType);
      case 'status':
        return getEnumTranslation(enumType, value as QuestionStatus);
      default:
        return value.toString();
    }
  }
  
  return value.toString();
};

// Single export statement for all items
export {
  enumMappings,
  getEnumTranslation,
  getFieldTranslation,
  formatValidationDetails,
  getDisplayValue
};

// Add consistent spacing and visual hierarchy
const styles = {
  // Page layout
  pageContainer: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  
  // Section headers
  sectionHeader: {
    marginBottom: '16px',
    padding: '12px 0',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Question metadata cards
  metadataCard: {
    background: '#f9f9f9',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
  },

  // Field groups
  fieldGroup: {
    marginBottom: '24px',
  },

  // Labels and inputs
  label: {
    fontWeight: 500,
    marginBottom: '8px',
    color: '#262626',
  },
  
  // Tags/chips for metadata
  metadataTag: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#f0f0f0',
    padding: '4px 12px',
    borderRadius: '16px',
    margin: '0 8px 8px 0',
  }
};

// Add these styled components to QuestionMetadataSection.tsx
const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 16px;
`;

const MetadataCard = styled(Card)`
  .ant-card-head {
    min-height: 48px;
    padding: 0 16px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .ant-card-head-title {
    font-size: 14px;
    font-weight: 500;
  }
`;

const FieldLabel = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

const FieldValue = styled.div<{ $isMissing: boolean }>`
  color: ${props => props.$isMissing ? '#ff4d4f' : 'inherit'};
`;

const getFieldValidation = (field: string, type: ValueType, translationKey: string): JSX.Element => {
  const value = getFieldValue(field, type);
  const label = getFieldTranslation(translationKey);
  
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <FieldValue $isMissing={value.isMissing}>
        {value.text || getFieldTranslation('missing')}
      </FieldValue>
      {value.isMissing && (
        <Text type="danger" style={{ fontSize: '12px', marginTop: '4px' }}>
          {formatValidationDetails(field, value.error || '')}
        </Text>
      )}
    </div>
  );
};

const getSourceFields = () => {
  // Implementation of getSourceFields function
};

const getFieldValue = (field: string, type: ValueType): FieldValueResult => {
  // Placeholder implementation - you'll need to implement the actual logic
  return {
    text: '',
    isMissing: true,
    error: 'Not implemented'
  };
};

const getFieldType = (field: string) => {
  // Implementation of getFieldType function
};

const getFieldError = (field: string) => {
  // Implementation of getFieldError function
};

const getFieldWarning = (field: string) => {
  // Implementation of getFieldWarning function
};

const getFieldSuccess = (field: string) => {
  // Implementation of getFieldSuccess function
};

const getFieldInfo = (field: string) => {
  // Implementation of getFieldInfo function
};

const getFieldMissing = (field: string) => {
  // Implementation of getFieldMissing function
};

const getFieldWarningMessage = (field: string) => {
  // Implementation of getFieldWarningMessage function
};

const getFieldErrorMessage = (field: string) => {
  // Implementation of getFieldErrorMessage function
};

const getFieldSuccessMessage = (field: string) => {
  // Implementation of getFieldSuccessMessage function
};

const getFieldInfoMessage = (field: string) => {
  // Implementation of getFieldInfoMessage function
};

const getFieldMissingMessage = (field: string) => {
  // Implementation of getFieldMissingMessage function
};

export const ValidationField: React.FC<{
  field: string;
  type: ValueType;
  translationKey: string;
}> = ({ field, type, translationKey }) => {
  const value = getFieldValue(field, type);
  const label = getFieldTranslation(translationKey);
  
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <FieldValue $isMissing={value.isMissing}>
        {value.text || getFieldTranslation('missing')}
      </FieldValue>
      {value.isMissing && (
        <Text type="danger" style={{ fontSize: '12px', marginTop: '4px' }}>
          {formatValidationDetails(field, value.error || '')}
        </Text>
      )}
    </div>
  );
};

``` 
</rewritten_file>