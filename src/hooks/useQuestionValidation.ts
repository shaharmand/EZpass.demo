import { validateQuestion, ValidationResult } from '../utils/questionValidator';
import { Question } from '../types/question';

export function useQuestionValidation() {
  const validateQuestionData = (question: Question): { 
    success: boolean; 
    errors: ValidationResult['errors'];
    warnings: ValidationResult['warnings'];
  } => {
    try {
      const validationResult = validateQuestion(question);
      const success = validationResult.errors.length === 0;
      
      if (!success) {
        console.error('❌ Validation failed', { 
          errors: validationResult.errors,
          warnings: validationResult.warnings 
        });
      }

      return {
        success,
        errors: validationResult.errors,
        warnings: validationResult.warnings
      };
    } catch (error) {
      console.error('❌ Validation error:', error);
      return {
        success: false,
        errors: [{ field: 'general', message: 'Validation failed unexpectedly' }],
        warnings: []
      };
    }
  };

  return { validateQuestionData };
} 