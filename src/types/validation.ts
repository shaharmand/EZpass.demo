export type ValidationSection = 'metadata' | 'content' | 'solution' | 'evaluation';

export interface ValidationIssue {
  field: string;
  message: string;
  section: ValidationSection;
  details?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  details?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  details?: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  formattedErrors?: string;
}

export interface TopicValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    subjectName?: string;
    domainName?: string;
    topicName?: string;
    subtopicName?: string;
  };
} 