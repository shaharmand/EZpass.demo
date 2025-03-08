import { QuestionType, DifficultyLevel, SourceType, QuestionStatus, ValidationStatus, PublicationStatusEnum } from '../types/question';
import { examService } from '../services/examService';
import styled from 'styled-components';
import { Card, Typography } from 'antd';

const { Text } = Typography;

// Direct type-safe mappings for each enum
const questionTypeTranslations: Record<QuestionType, string> = {
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

const validationStatusTranslations: Record<ValidationStatus, string> = {
  [ValidationStatus.VALID]: 'תקין',
  [ValidationStatus.WARNING]: 'אזהרה',
  [ValidationStatus.ERROR]: 'לא תקין'
};

const publicationStatusTranslations: Record<PublicationStatusEnum, string> = {
  [PublicationStatusEnum.DRAFT]: 'טיוטה',
  [PublicationStatusEnum.PUBLISHED]: 'מפורסם',
  [PublicationStatusEnum.ARCHIVED]: 'בארכיון'
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

function translateValidationStatus(status: ValidationStatus): string {
  return validationStatusTranslations[status] || status;
}

function translatePublicationStatus(status: PublicationStatusEnum): string {
  return publicationStatusTranslations[status] || status;
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

function getValidValidationStatuses(): string[] {
  return Object.values(validationStatusTranslations);
}

function getValidPublicationStatuses(): string[] {
  return Object.values(publicationStatusTranslations);
}

// Export everything
export {
  translateQuestionType,
  translateDifficulty,
  translateSourceType,
  translateValidationStatus,
  translatePublicationStatus,
  getValidQuestionTypes,
  getValidSourceTypes,
  getValidDifficultyLevels,
  getValidValidationStatuses,
  getValidPublicationStatuses
};

// Types
type ValueType = 'subject' | 'domain' | 'topic' | 'subtopic' | 'enum' | 'other' | 'metadata';
type EnumType = 'questionType' | 'difficulty' | 'sourceType' | 'publication_status' | 'season' | 'moed' | 'examTemplate';

interface EnumMappings {
  questionType: Record<QuestionType, string>;
  difficulty: Record<DifficultyLevel, string>;
  sourceType: Record<SourceType, string>;
  publication_status: Record<PublicationStatusEnum, string>;
  validationStatus: Record<string, string>;
  season: Record<'spring' | 'summer', string>;
  moed: Record<'a' | 'b', string>;
  examTemplate: Record<string, string>;
}

// Enum translations
const enumMappings: EnumMappings = {
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
    [SourceType.EXAM]: 'מבחן',
    [SourceType.EZPASS]: 'איזיפס'
  },

  publication_status: {
    'draft': 'טיוטה',
    'published': 'מפורסם',
    'archived': 'בארכיון'
  },

  validationStatus: {
    'valid': 'תקין',
    'error': 'לא תקין',
    'warning': 'אזהרה'
  },

  season: {
    'spring': 'אביב',
    'summer': 'קיץ'
  },

  moed: {
    'a': 'א׳',
    'b': 'ב׳'
  },

  examTemplate: {
    'mahat_civil_safety': 'בטיחות בבנייה - מה״ט',
    'mahat_civil_construction': 'ביצוע בנייה - מה״ט',
    'mahat_civil_management': 'ניהול הבנייה - מה״ט',
    'mahat_civil_planning': 'תכנון מבנים - מה״ט'
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
  'authorName': 'שם המחבר',
  'validationStatus': 'סטטוס אימות',
  'pendingReview': 'ממתין לאישור',

  // Source Metadata Section
  'metadata.source.title': 'מידע מקור',
  'metadata.source.type': 'סוג מקור',
  'metadata.source.exam.template': 'שם מבחן',
  'metadata.source.exam.year': 'שנה',
  'metadata.source.exam.season': 'עונה',
  'metadata.source.exam.moed': 'מועד',
  'metadata.source.exam.order': 'מספר שאלה',
  'sourceType': 'סוג מקור',
  'examTemplateId': 'שם מבחן',
  'year': 'שנה',
  'season': 'עונה',
  'moed': 'מועד',
  'order': 'מספר שאלה',

  // Season translations
  'metadata.source.exam.season.spring': 'אביב',
  'metadata.source.exam.season.summer': 'קיץ',
  'metadata.source.exam.season.winter': 'חורף',

  // Moed translations
  'metadata.source.exam.moed.a': 'א׳',
  'metadata.source.exam.moed.b': 'ב׳',
  'metadata.source.exam.moed.c': 'ג׳',

  // Status translation for the question status from DB
  'status': 'סטטוס',

  // Common messages
  'common.no_value': 'לא הוזן',
  'common.missing': 'חסר',
  'common.edit': 'עריכה',
  'metadata.basic_info': 'מידע בסיסי',
  'name': 'שם השאלה',
};

const getEnumTranslation = (
  enumType: keyof EnumMappings,
  value: QuestionType | DifficultyLevel | SourceType | QuestionStatus | ValidationStatus | string | undefined
): string => {
  if (value === undefined || value === null) {
    return fieldNameMapping['common.no_value'];
  }

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
    case 'publication_status':
      if (!Object.keys(enumMappings.publication_status).includes(value as string)) {
        return value.toString();
      }
      break;
    case 'validationStatus':
      if (!Object.keys(enumMappings.validationStatus).includes(value as string)) {
        return value.toString();
      }
      break;
  }

  const translation = (mappings as Record<string, string>)[value.toString()];
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
    else if (field === 'publication_status') enumType = 'publication_status';

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
  type: ValueType,
  enumType?: EnumType
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
      case 'publication_status':
        return getEnumTranslation(enumType, value as PublicationStatusEnum);
      case 'season':
        return enumMappings.season[value.toString() as 'spring' | 'summer'] || value.toString();
      case 'moed':
        return enumMappings.moed[value.toString() as 'a' | 'b'] || value.toString();
      case 'examTemplate':
        return enumMappings.examTemplate[value.toString()] || value.toString();
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
  getValidEnumValues,
  formatValidationDetails,
  getDisplayValue,
  examTemplateTranslations,
  fieldNameMapping,
  // Add new exports
  JsonDataContainer,
  JsonDataHeader,
  JsonDataTitle,
  JsonDataContent,
  MetadataGrid,
  MetadataCard,
  FieldLabel,
  FieldValue
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

const FieldLabel = styled(Text)`
  color: #8c8c8c;
  font-size: 13px;
  display: block;
  margin-bottom: 4px;
`;

const FieldValue = styled(Text)<{ $isMissing?: boolean }>`
  font-size: 14px;
  color: ${props => props.$isMissing ? '#ff4d4f' : '#262626'};
  display: block;
`;

// Add exam template translations
const examTemplateTranslations: Record<string, string> = {
  'mahat_civil_safety': 'בטיחות בבנייה - מה״ט',
  'mahat_civil_construction': 'ביצוע בנייה - מה״ט',
  'mahat_civil_management': 'ניהול הבנייה - מה״ט',
  'mahat_civil_planning': 'תכנון מבנים - מה״ט'
};

// Add unified source display function
export const getQuestionSourceDisplay = (source: {
  sourceType: SourceType;
  examTemplateId?: string;
  year?: string | number;
  season?: string;
  moed?: string;
  order?: string | number;
}): string => {
  const sourceTypeText = getEnumTranslation('sourceType', source.sourceType);

  switch (source.sourceType) {
    case SourceType.EXAM:
      if (!source.examTemplateId) return sourceTypeText;
      
      // Use static exam template translations
      const examName = examTemplateTranslations[source.examTemplateId] || source.examTemplateId;
      
      const season = source.season ? getEnumTranslation('season', source.season) : '';
      const year = source.year?.toString() || '';
      const moed = source.moed ? getEnumTranslation('moed', source.moed) : '';
      const order = source.order ? `שאלה ${source.order}` : '';
      
      return [examName, [season, year, moed].filter(Boolean).join(' '), order]
        .filter(Boolean)
        .join(' • ');

    case SourceType.EZPASS:
      return 'שאלת תרגול מקורית - איזיפס';

    default:
      return sourceTypeText;
  }
};

// Add these styled components for JSON data display
const JsonDataContainer = styled.div`
  margin-top: 24px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const JsonDataHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #dee2e6;
`;

const JsonDataTitle = styled(Text)`
  font-size: 16px;
  font-weight: 500;
  color: #495057;
`;

const JsonDataContent = styled.pre`
  margin: 0;
  padding: 16px;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  overflow-x: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #212529;

  .json-key {
    color: #d63384;
  }
  .json-string {
    color: #198754;
  }
  .json-number {
    color: #0d6efd;
  }
  .json-boolean {
    color: #dc3545;
  }
  .json-null {
    color: #6c757d;
  }
`; 