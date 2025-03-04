import { 
  Question, 
  QuestionType, 
  DifficultyLevel,
  ValidationStatus,
  QuestionFetchParams,
  FilterState,
  EzpassCreatorType,
  isValidQuestionType
} from '../types/question';
import { universalTopicsV2 } from '../services/universalTopics';
import { examService } from '../services/examService';
import { validateContent } from './contentFormatValidator';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  status: ValidationStatus;
}

// Valid values for union types
const VALID_QUESTION_TYPES = [
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.NUMERICAL,
  QuestionType.OPEN
] as const;
const VALID_DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;
const VALID_SOURCE_TYPES = ['exam', 'ezpass'] as const;
const VALID_SEASONS = ['spring', 'summer'] as const;
const VALID_MOEDS = ['a', 'b'] as const;

export function validateQuestion(question: Question): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Helper to add errors
  const addError = (field: string, message: string) => {
    errors.push({ field, message });
  };

  // Helper to add warnings
  const addWarning = (field: string, message: string) => {
    warnings.push({ field, message });
  };

  // Run ALL validations at once
  
  // 1. Basic required fields
  if (!question.id) addError('id', 'מזהה שאלה חסר');
  
  // Name is optional - just warn if missing
  if (!question.name) {
    addWarning('name', 'שם השאלה חסר');
  }

  // 2. Content validation
  if (!question.content) {
    addError('content', 'תוכן שאלה חסר');
  } else {
    if (!question.content.text) {
      addError('content.text', 'טקסט השאלה חסר');
    }
    if (question.content.format !== 'markdown') {
      addError('content.format', 'תוכן השאלה חייב להיות בפורמט markdown');
    }
    
    // Add format warnings
    const formatWarnings = validateContent(question.content.text);
    formatWarnings.forEach(warning => {
      addWarning(`content.${warning.type}`, warning.message);
    });

    // Validate options for multiple choice
    if (question.metadata?.type === QuestionType.MULTIPLE_CHOICE) {
      if (!question.content.options) {
        addError('content.options', 'שאלת רב-ברירה חייבת לכלול אפשרויות');
      } else if (question.content.options.length !== 4) {
        addError('content.options', 'שאלת רב-ברירה חייבת לכלול בדיוק 4 אפשרויות');
      } else {
        // Validate each option has text and format
        question.content.options.forEach((option, index) => {
          if (!option.text) {
            addError(`content.options[${index}].text`, 'טקסט האפשרות חסר');
          }
          if (option.format !== 'markdown') {
            addError(`content.options[${index}].format`, 'פורמט האפשרות חייב להיות markdown');
          }
        });
      }
    }
  }

  // 3. Answer validation
  if (!question.schoolAnswer) {
    addError('schoolAnswer', 'תשובה חסרה');
  } else {
    // Validate solution
    if (!question.schoolAnswer.solution) {
      addError('schoolAnswer.solution', 'פתרון חסר');
    } else {
      if (!question.schoolAnswer.solution.text) {
        addError('schoolAnswer.solution.text', 'טקסט הפתרון חסר');
      }
      if (question.schoolAnswer.solution.format !== 'markdown') {
        addError('schoolAnswer.solution.format', 'פורמט הפתרון חייב להיות markdown');
      }
    }
  }

  // 4. Metadata validation
  if (!question.metadata) {
    addError('metadata', 'מטא-דאטה חסרה');
  } else {
    // Validate required metadata fields
    if (!question.metadata.subjectId) addError('metadata.subjectId', 'נושא רחב חסר');
    if (!question.metadata.domainId) addError('metadata.domainId', 'תחום חסר');
    if (!question.metadata.topicId) addError('metadata.topicId', 'נושא חסר');
    
    // Subtopic is optional
    if (question.metadata.subtopicId) {
      const subtopic = universalTopicsV2.getSubTopicSafe(
        question.metadata.subjectId, 
        question.metadata.domainId, 
        question.metadata.topicId, 
        question.metadata.subtopicId
      );
      if (!subtopic) {
        addError('metadata.subtopicId', `תת-נושא לא קיים בנושא ${question.metadata.topicId}`);
      }
    }

    // Validate question type
    if (!question.metadata.type) {
      addError('metadata.type', 'סוג שאלה חסר');
    } else if (!isValidQuestionType(question.metadata.type)) {
      addError('metadata.type', `סוג שאלה לא חוקי: ${question.metadata.type}`);
    }

    // Validate difficulty level
    if (!question.metadata.difficulty) {
      addError('metadata.difficulty', 'רמת קושי חסרה');
    } else if (!VALID_DIFFICULTY_LEVELS.includes(question.metadata.difficulty)) {
      addError('metadata.difficulty', `רמת קושי לא חוקית: ${question.metadata.difficulty}`);
    }

    // Validate estimated time - optional
    if (question.metadata.estimatedTime !== undefined) {
      if (question.metadata.estimatedTime < 1) {
        addError('metadata.estimatedTime', 'זמן מוערך חייב להיות לפחות דקה אחת');
      }
    }

    // Validate source if present
    if (question.metadata.source) {
      if (!question.metadata.source.type) {
        addError('metadata.source.type', 'סוג מקור חסר');
      } else if (!VALID_SOURCE_TYPES.includes(question.metadata.source.type)) {
        // For legacy data, add warning instead of error
        addWarning('metadata.source.type', `סוג מקור ישן: ${question.metadata.source.type} - יש לעדכן ל-exam או ezpass`);
      } else {
        // Source type specific validations
        switch (question.metadata.source.type) {
          case 'exam':
            if (!question.metadata.source.examTemplateId) {
              addError('metadata.source.examTemplateId', 'תבנית מבחן חסרה');
            } else {
              // Validate that exam template exists
              const examTemplate = examService.getExamById(question.metadata.source.examTemplateId);
              if (!examTemplate) {
                addError('metadata.source.examTemplateId', `תבנית מבחן לא קיימת: ${question.metadata.source.examTemplateId}`);
              }
            }
            if (!question.metadata.source.year) {
              addError('metadata.source.year', 'שנה חסרה');
            } else if (question.metadata.source.year < 1900 || question.metadata.source.year > new Date().getFullYear() + 1) {
              addError('metadata.source.year', 'שנה לא חוקית');
            }
            if (!question.metadata.source.season) {
              addError('metadata.source.season', 'תקופה חסרה');
            } else if (!VALID_SEASONS.includes(question.metadata.source.season)) {
              addError('metadata.source.season', `תקופה לא חוקית: ${question.metadata.source.season}`);
            }
            if (!question.metadata.source.moed) {
              addError('metadata.source.moed', 'מועד חסר');
            } else if (!VALID_MOEDS.includes(question.metadata.source.moed)) {
              addError('metadata.source.moed', `מועד לא חוקי: ${question.metadata.source.moed}`);
            }
            break;
          case 'ezpass':
            if (!question.metadata.source.creatorType) {
              addError('metadata.source.creatorType', 'סוג יוצר חסר');
            } else if (!Object.values(EzpassCreatorType).includes(question.metadata.source.creatorType)) {
              addError('metadata.source.creatorType', `סוג יוצר לא חוקי: ${question.metadata.source.creatorType}`);
            }
            break;
        }
      }
    }
  }

  // 5. Evaluation validation - required for numerical and open questions
  if (question.metadata?.type === QuestionType.MULTIPLE_CHOICE) {
    // Multiple choice should NOT have evaluation
    if (question.evaluationGuidelines) {
      addWarning('evaluationGuidelines', 'שאלת רב-ברירה לא צריכה לכלול הערכה');
    }
  } else {
    // Numerical and Open MUST have evaluation
    if (!question.evaluationGuidelines) {
      addError('evaluationGuidelines', 'הערכה חסרה - נדרשת לשאלות מספריות ופתוחות');
    } else {
      // Validate required criteria
      if (!question.evaluationGuidelines.requiredCriteria?.length) {
        addError('evaluationGuidelines.requiredCriteria', 'קריטריוני הערכה חסרים');
      } else {
        // Validate criteria weights sum to 100
        const totalWeight = question.evaluationGuidelines.requiredCriteria.reduce(
          (sum, criterion) => sum + criterion.weight, 
          0
        );
        if (Math.abs(totalWeight - 100) > 0.01) {
          addError('evaluationGuidelines.requiredCriteria', 'משקלי הקריטריונים חייבים להסתכם ל-100');
        }

        // Validate each criterion has name and description
        question.evaluationGuidelines.requiredCriteria.forEach((criterion, index) => {
          if (!criterion.name?.trim()) {
            addError(`evaluationGuidelines.requiredCriteria[${index}].name`, 'שם הקריטריון חסר');
          }
          if (!criterion.description?.trim()) {
            addError(`evaluationGuidelines.requiredCriteria[${index}].description`, 'תיאור הקריטריון חסר');
          }
          if (criterion.weight <= 0 || criterion.weight > 100) {
            addError(`evaluationGuidelines.requiredCriteria[${index}].weight`, 'משקל הקריטריון חייב להיות בין 1 ל-100');
          }
        });
      }
    }
  }

  // Type-specific validation
  if (question.metadata?.type) {
    switch (question.metadata.type) {
      case QuestionType.MULTIPLE_CHOICE:
        if (!question.content?.options?.length) {
          errors.push({
            field: 'content.options',
            message: 'שאלת רב-ברירה חייבת לכלול אפשרויות'
          });
        }
        if (question.schoolAnswer?.finalAnswer?.type !== 'multiple_choice') {
          errors.push({
            field: 'schoolAnswer.finalAnswer',
            message: 'שאלת רב-ברירה חייבת לכלול תשובה מסוג רב-ברירה'
          });
        }
        break;

      case QuestionType.NUMERICAL:
        if (question.schoolAnswer?.finalAnswer?.type !== 'numerical') {
          errors.push({
            field: 'schoolAnswer.finalAnswer',
            message: 'שאלה מספרית חייבת לכלול תשובה מספרית'
          });
        } else if (!question.schoolAnswer?.finalAnswer?.unit) {
          warnings.push({
            field: 'schoolAnswer.finalAnswer.unit',
            message: 'מומלץ לציין יחידות מידה בשאלות מספריות'
          });
        }
        break;

      case QuestionType.OPEN:
        if (!question.schoolAnswer?.solution?.text) {
          warnings.push({
            field: 'schoolAnswer.solution.text',
            message: 'מומלץ לכלול טקסט פתרון בשאלות פתוחות'
          });
        }
        break;
    }
  }

  // Determine status based on errors and warnings
  let status = ValidationStatus.VALID;
  if (errors.length > 0) {
    status = ValidationStatus.ERROR;
  } else if (warnings.length > 0) {
    status = ValidationStatus.WARNING;
  }

  return {
    errors,
    warnings,
    status
  };
}

/**
 * Validates if a set of question parameters satisfies the filter constraints
 */
export function validateQuestionFilter(params: QuestionFetchParams, filter: FilterState): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Helper to add errors
  const addError = (field: string, message: string) => {
    errors.push({ field, message });
  };

  // Check each filter constraint
  if (filter.topics?.length && !filter.topics.includes(params.topic)) {
    addError('topic', `נושא ${params.topic} לא נמצא ברשימת הנושאים המבוקשים`);
  }
  
  if (filter.subTopics?.length && !filter.subTopics.includes(params.subtopic || '')) {
    addError('subtopic', `תת-נושא ${params.subtopic} לא נמצא ברשימת תתי-הנושאים המבוקשים`);
  }

  if (filter.questionTypes?.length && !filter.questionTypes.includes(params.type)) {
    addError('type', `סוג שאלה ${params.type} לא נמצא ברשימת הסוגים המבוקשים`);
  }

  if (filter.difficulty?.length && !filter.difficulty.includes(params.difficulty)) {
    addError('difficulty', `רמת קושי ${params.difficulty} לא נמצאת ברשימת רמות הקושי המבוקשות`);
  }

  // Check source if specified
  if (filter.source && params.source) {
    if (params.source.type !== filter.source.type) {
      addError('source.type', `סוג מקור ${params.source.type} לא תואם לסוג המבוקש ${filter.source.type}`);
    }
    
    // Only validate exam-specific fields if both filter and params are exam sources
    if (filter.source.type === 'exam' && params.source.type === 'exam') {
      if (filter.source.year && params.source.year !== filter.source.year) {
        addError('source.year', `שנת מבחן ${params.source.year} לא תואמת לשנה המבוקשת ${filter.source.year}`);
      }
      if (filter.source.season && params.source.season !== filter.source.season) {
        addError('source.season', `תקופת מבחן ${params.source.season} לא תואמת לתקופה המבוקשת ${filter.source.season}`);
      }
      if (filter.source.moed && params.source.moed !== filter.source.moed) {
        addError('source.moed', `מועד מבחן ${params.source.moed} לא תואם למועד המבוקש ${filter.source.moed}`);
      }
    }
  }

  // Determine status based on errors and warnings
  let status = ValidationStatus.VALID;
  if (errors.length > 0) {
    status = ValidationStatus.ERROR;
  } else if (warnings.length > 0) {
    status = ValidationStatus.WARNING;
  }

  return { errors, warnings, status };
}

/**
 * Validates if a question matches the given filter criteria
 */
export function satisfiesFilter(params: Question, filter: FilterState): boolean {
  // Check topics if specified
  if (filter.topics?.length && !filter.topics.includes(params.metadata.topicId)) {
    return false;
  }
  
  // Check subtopics if specified
  if (filter.subTopics?.length && !filter.subTopics.includes(params.metadata.subtopicId || '')) {
    return false;
  }

  // Check question types if specified
  if (filter.questionTypes?.length && !filter.questionTypes.includes(params.metadata.type)) {
    return false;
  }

  // Check difficulty levels if specified
  if (filter.difficulty?.length && !filter.difficulty.includes(params.metadata.difficulty)) {
    return false;
  }

  // Check source if specified
  if (filter.source && params.metadata.source) {
    if (filter.source.type !== params.metadata.source.type) {
      return false;
    }
    
    // Only check exam-specific fields if both are exam sources
    if (filter.source.type === 'exam' && params.metadata.source.type === 'exam') {
      if (filter.source.year && params.metadata.source.year !== filter.source.year) {
        return false;
      }
      if (filter.source.season && params.metadata.source.season !== filter.source.season) {
        return false;
      }
      if (filter.source.moed && params.metadata.source.moed !== filter.source.moed) {
        return false;
      }
    }
  }

  return true;
}

/** 
 * Filter state interface for the simplified system
 */
export interface QuestionFilter {
  topics?: string[];
  subTopics?: string[];
  questionTypes?: QuestionType[];
  difficulty?: DifficultyLevel[];
  source?: {
    type: 'exam' | 'ezpass';
    year?: number;
    season?: 'spring' | 'summer';
    moed?: 'a' | 'b';
  };
}

/**
 * Validates the teacher's reference answer based on question type
 */
function validateFinalAnswer(finalAnswer: any, questionType?: QuestionType): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!questionType) {
    errors.push({ field: 'metadata.type', message: 'סוג שאלה חסר - נדרש לאימות התשובה' });
    return errors;
  }

  if (!finalAnswer || typeof finalAnswer !== 'object') {
    errors.push({ field: 'schoolAnswer.finalAnswer', message: 'תשובה סופית חסרה או לא תקינה' });
    return errors;
  }

  // Validate type matches question type
  switch (questionType) {
    case QuestionType.MULTIPLE_CHOICE:
      if (finalAnswer.type !== 'multiple_choice') {
        errors.push({ field: 'schoolAnswer.finalAnswer.type', message: 'סוג תשובה חייב להיות multiple_choice עבור שאלת רב-ברירה' });
      } else if (!finalAnswer.value?.multipleChoice || 
                 typeof finalAnswer.value.multipleChoice !== 'number' || 
                 finalAnswer.value.multipleChoice < 1 || 
                 finalAnswer.value.multipleChoice > 4) {
        errors.push({ field: 'schoolAnswer.finalAnswer.value', message: 'תשובה לשאלת רב-ברירה חייבת להיות מספר בין 1 ל-4' });
      }
      break;

    case QuestionType.NUMERICAL:
      if (finalAnswer.type !== 'numerical') {
        errors.push({ field: 'schoolAnswer.finalAnswer.type', message: 'סוג תשובה חייב להיות numerical עבור שאלה מספרית' });
      } else {
        // Validate value
        if (!finalAnswer.value?.numerical || typeof finalAnswer.value.numerical.value !== 'number') {
          errors.push({ field: 'schoolAnswer.finalAnswer.value', message: 'ערך מספרי חסר או לא תקין' });
        } else if (isNaN(finalAnswer.value.numerical.value)) {
          errors.push({ field: 'schoolAnswer.finalAnswer.value', message: 'הערך המספרי אינו תקין' });
        }

        // Validate tolerance
        if (typeof finalAnswer.value?.numerical.tolerance !== 'number' || finalAnswer.value.numerical.tolerance < 0) {
          errors.push({ field: 'schoolAnswer.finalAnswer.tolerance', message: 'טולרנס חייב להיות מספר אי-שלילי' });
        } else if (finalAnswer.value.numerical.tolerance > Math.abs(finalAnswer.value.numerical.value)) {
          errors.push({ field: 'schoolAnswer.finalAnswer.tolerance', message: 'טולרנס לא יכול להיות גדול מהערך עצמו' });
        }

        // Validate unit if provided
        if (finalAnswer.value?.numerical.unit && typeof finalAnswer.value.numerical.unit !== 'string') {
          errors.push({ field: 'schoolAnswer.finalAnswer.unit', message: 'יחידת מידה חייבת להיות מחרוזת' });
        }
      }
      break;

    case QuestionType.OPEN:
      if (finalAnswer.type !== 'none') {
        errors.push({ field: 'schoolAnswer.finalAnswer.type', message: 'שאלה פתוחה צריכה להיות מסוג none' });
      }
      break;

    default:
      errors.push({ field: 'metadata.type', message: `סוג שאלה לא נתמך: ${questionType}` });
  }

  return errors;
} 