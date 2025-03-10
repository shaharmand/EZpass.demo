import { validateQuestion, ValidationResult } from '../utils/questionValidator';
import { Question } from '../types/question';

export function useQuestionValidation() {
  const validateQuestionData = async (question: Question): Promise<{
    success: boolean;
    errors: ValidationResult['errors'];
    warnings: ValidationResult['warnings'];
  }> => {
    try {
      const validationResult = await validateQuestion(question);
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
        errors: [],
        warnings: []
      };
    }
  };

  return { validateQuestionData };
} 