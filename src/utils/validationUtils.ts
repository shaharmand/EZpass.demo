import { SourceType } from '../types/question';
import { getFieldTranslation, enumMappings } from './translations';

export const formatValidationDetails = (field: string, error: string): string => {
  // Most messages will already be properly formatted from Zod
  // This is just for any edge cases or system-level errors
  const hebrewField = getFieldTranslation(field);
  
  // Handle any non-Zod validation messages or system errors
  if (!error.includes('שדה') && !error.includes('חסר') && !error.includes('חייב')) {
    return `שדה ${hebrewField}: ${error}`;
  }

  // Handle required field errors with clearer messages
  if (error === 'Required') {
    return `שדה ${hebrewField}: חסר - שדה זה הוא שדה חובה`;
  }

  // Handle specific field validations
  switch (field) {
    case 'metadata.estimatedTime':
      return `שדה ${hebrewField}: חסר - יש להגדיר זמן משוער לפתרון השאלה`;
      
    case 'metadata.source.sourceType':
      if (error.includes('Invalid enum value')) {
        const match = error.match(/Expected '(.+)', received '(.+)'/);
        if (match) {
          const [, expectedRaw, received] = match;
          const validOptions = expectedRaw.split(' | ')
            .map(type => type.replace(/'/g, ''))
            .map(type => {
              const sourceType = type as keyof typeof enumMappings.sourceType;
              return enumMappings.sourceType[sourceType] || type;
            })
            .join(' | ');
          
          return `שדה ${hebrewField}: ערך לא חוקי: "${received}". יש לבחור מתוך: ${validOptions}`;
        }
      }
      break;

    case 'type':
      if (error.includes('Invalid enum value')) {
        const match = error.match(/Expected '(.+)', received '(.+)'/);
        if (match) {
          const [, expectedRaw, received] = match;
          const validOptions = expectedRaw.split(' | ')
            .map(type => {
              // Cast the string to QuestionType before using it as an index
              return enumMappings.questionType[type as keyof typeof enumMappings.questionType] || type;
            })
            .join(' | ');
          return `שדה ${hebrewField}: ערך לא חוקי: "${received}". יש לבחור מתוך: ${validOptions}`;
        }
      }
      break;

    case 'metadata.difficulty':
      if (error.includes('Invalid enum value')) {
        return `שדה ${hebrewField}: חסר - יש לבחור רמת קושי מתאימה`;
      }
      break;

    case 'metadata.subjectId':
      return `שדה ${hebrewField}: חסר - יש לבחור נושא ראשי`;

    case 'metadata.domainId':
      return `שדה ${hebrewField}: חסר - יש לבחור תחום`;

    case 'metadata.topicId':
      return `שדה ${hebrewField}: חסר - יש לבחור נושא`;

    case 'metadata.subtopicId':
      return `שדה ${hebrewField}: חסר - יש לבחור תת-נושא`;

    case 'content.text':
      if (error.includes('too short')) {
        return `שדה ${hebrewField}: תוכן השאלה קצר מדי`;
      }
      break;

    case 'solution.explanation':
      if (error.includes('too short')) {
        return `שדה ${hebrewField}: הסבר הפתרון קצר מדי`;
      }
      break;

    case 'options':
      if (error.includes('min')) {
        return `שדה ${hebrewField}: יש להגדיר לפחות 2 אפשרויות בחירה`;
      }
      break;
  }

  return error;
}; 
