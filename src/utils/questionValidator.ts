import { Question, QuestionType, DifficultyLevel, SourceType, ValidationStatus } from '../types/question';
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
const VALID_QUESTION_TYPES = ['multiple_choice', 'open', 'code', 'step_by_step'] as const;
const VALID_DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;
const VALID_SOURCE_TYPES = ['exam', 'book', 'author', 'ezpass'] as const;
const VALID_SEASONS = ['spring', 'summer'] as const;
const VALID_MOEDS = ['a', 'b'] as const;
const VALID_PROGRAMMING_LANGUAGES = ['java', 'c#', 'python'] as const;

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
  
  // Check for missing name - add warning
  if (!question.name) {
    addWarning('name', 'שם השאלה חסר');
  }
  
  // Validate question type
  if (!question.type) {
    addError('type', 'סוג שאלה חסר');
  } else if (!VALID_QUESTION_TYPES.includes(question.type)) {
    addError('type', `סוג שאלה לא חוקי: ${question.type}`);
  }

  // Validate content format
  if (!question.content?.text) {
    addError('content', 'תוכן שאלה חסר');
  } else {
    if (question.content.format !== 'markdown') {
      addError('content.format', 'תוכן השאלה חייב להיות בפורמט markdown');
    }
    
    // Add format warnings
    const formatWarnings = validateContent(question.content.text);
    formatWarnings.forEach(warning => {
      addWarning(`content.${warning.type}`, warning.message);
    });
  }

  // Also check solution format
  if (!question.solution?.text) {
    addError('solution', 'פתרון חסר');
  } else {
    if (question.solution.format !== 'markdown') {
      addError('solution.format', 'הפתרון חייב להיות בפורמט markdown');
    }
    
    // Add format warnings for solution
    const solutionFormatWarnings = validateContent(question.solution.text);
    solutionFormatWarnings.forEach(warning => {
      addWarning(`solution.${warning.type}`, warning.message);
    });
  }

  // 2. Topic hierarchy and metadata - ALL checks run regardless of previous failures
  const metadata = question.metadata;
  if (!metadata) {
    addError('metadata', 'מטא-דאטה חסרה');
  } else {
    // Validate required metadata fields
    if (!metadata.subjectId) addError('metadata.subjectId', 'נושא רחב חסר');
    if (!metadata.domainId) addError('metadata.domainId', 'תחום חסר');
    if (!metadata.topicId) addError('metadata.topicId', 'נושא חסר');
    if (!metadata.subtopicId) addError('metadata.subtopicId', 'תת-נושא חסר');

    // Validate difficulty level
    if (!metadata.difficulty) {
      addError('metadata.difficulty', 'רמת קושי חסרה');
    } else if (!VALID_DIFFICULTY_LEVELS.includes(metadata.difficulty)) {
      addError('metadata.difficulty', `רמת קושי לא חוקית: ${metadata.difficulty}`);
    }

    // Validate estimated time - now mandatory
    if (!metadata.estimatedTime) {
      addError('metadata.estimatedTime', 'זמן מוערך חסר');
    } else if (metadata.estimatedTime < 1) {
      addError('metadata.estimatedTime', 'זמן מוערך חייב להיות לפחות דקה אחת');
    }

    // Check topic hierarchy existence
    const subject = universalTopicsV2.getSubjectSafe(metadata.subjectId);
    if (!subject) {
      addError('metadata.subjectId', `נושא רחב לא קיים: ${metadata.subjectId}`);
    }

    const domain = universalTopicsV2.getDomainSafe(metadata.subjectId, metadata.domainId);
    if (!domain) {
      addError('metadata.domainId', `תחום לא קיים בנושא ${metadata.subjectId}`);
    }

    const topic = universalTopicsV2.getTopicSafe(metadata.subjectId, metadata.domainId, metadata.topicId);
    if (!topic) {
      addError('metadata.topicId', `נושא לא קיים בתחום ${metadata.domainId}`);
    }

    const subtopic = metadata.subtopicId ? universalTopicsV2.getSubTopicSafe(
      metadata.subjectId, 
      metadata.domainId, 
      metadata.topicId, 
      metadata.subtopicId
    ) : null;
    
    if (metadata.subtopicId && !subtopic) {
      addError('metadata.subtopicId', `תת-נושא לא קיים בנושא ${metadata.topicId}`);
    }

    // Validate source
    if (!metadata.source?.sourceType) {
      addError('metadata.source.sourceType', 'חובה לבחור סוג מקור');
    } else if (!VALID_SOURCE_TYPES.includes(metadata.source.sourceType)) {
      addError('metadata.source.sourceType', `סוג מקור לא חוקי: ${metadata.source.sourceType}`);
    } else {
      // Source type specific validations
      switch (metadata.source.sourceType) {
        case 'exam':
          if (!metadata.source.examTemplateId) {
            addError('metadata.source.examTemplateId', 'תבנית מבחן חסרה');
          } else {
            // Validate that exam template exists
            const examTemplate = examService.getExamById(metadata.source.examTemplateId);
            if (!examTemplate) {
              addError('metadata.source.examTemplateId', `תבנית מבחן לא קיימת: ${metadata.source.examTemplateId}`);
            }
          }
          if (!metadata.source.year) addError('metadata.source.year', 'שנה חסרה');
          if (metadata.source.year && (metadata.source.year < 1900 || metadata.source.year > new Date().getFullYear() + 1)) {
            addError('metadata.source.year', 'שנה לא חוקית');
          }
          if (!metadata.source.season) {
            addError('metadata.source.season', 'תקופה חסרה');
          } else if (!['spring', 'summer'].includes(metadata.source.season)) {
            addError('metadata.source.season', `תקופה לא חוקית: ${metadata.source.season}`);
          }
          if (!metadata.source.moed) {
            addError('metadata.source.moed', 'מועד חסר');
          } else if (!['a', 'b'].includes(metadata.source.moed)) {
            addError('metadata.source.moed', `מועד לא חוקי: ${metadata.source.moed}`);
          }
          break;
        case 'book':
          if (!metadata.source.bookName) addError('metadata.source.bookName', 'שם הספר חסר');
          break;
        case 'author':
          if (!metadata.source.authorName) addError('metadata.source.authorName', 'שם המחבר חסר');
          break;
      }
    }

    // Validate programming language if specified
    if (metadata.programmingLanguage && !['java', 'c#', 'python'].includes(metadata.programmingLanguage)) {
      addError('metadata.programmingLanguage', `שפת תכנות לא חוקית: ${metadata.programmingLanguage}`);
    }
  }

  // 3. Type specific validations - run regardless of previous failures
  switch (question.type) {
    case 'multiple_choice':
      if (!question.options) {
        addError('options', 'שאלת רב-ברירה חייבת לכלול אפשרויות');
      } else if (question.options.length !== 4) {
        addError('options', 'שאלת רב-ברירה חייבת לכלול בדיוק 4 אפשרויות');
      }
      if (!question.correctOption) {
        addError('correctOption', 'שאלת רב-ברירה חייבת לכלול תשובה נכונה');
      } else if (question.correctOption < 1 || question.correctOption > 4) {
        addError('correctOption', 'התשובה הנכונה חייבת להיות מספר בין 1 ל-4');
      }
      break;

    case 'code':
      if (!metadata?.programmingLanguage) {
        addError('metadata.programmingLanguage', 'שאלת קוד חייבת לכלול שפת תכנות');
      } else if (!['java', 'c#', 'python'].includes(metadata.programmingLanguage)) {
        addError('metadata.programmingLanguage', `שפת תכנות לא חוקית: ${metadata.programmingLanguage}`);
      }
      break;
  }

  // 4. Evaluation validation - skip for multiple choice questions
  if (question.type !== 'multiple_choice') {
    if (!question.evaluation) {
      addError('evaluation', 'הערכה חסרה');
    } else {
      if (!question.evaluation.rubricAssessment?.criteria?.length) {
        addError('evaluation.rubricAssessment', 'קריטריוני הערכה חסרים');
      }
      if (!question.evaluation.answerRequirements?.requiredElements?.length) {
        addError('evaluation.answerRequirements', 'דרישות תשובה חסרות');
      }
    }
  }

  // Determine status based on errors and warnings
  let status = ValidationStatus.Valid;
  if (errors.length > 0) {
    status = ValidationStatus.Error;
  } else if (warnings.length > 0) {
    status = ValidationStatus.Warning;
  }

  return {
    errors,
    warnings,
    status
  };
} 