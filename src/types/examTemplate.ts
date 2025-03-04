import { Topic, SubTopic } from './subject'; // Importing Topic and SubTopic from Subject.ts    
import { DifficultyLevel, QuestionType } from './question';


/**
 * Supported exam types in the system.
 * Each type represents a different educational or certification context.
 */
export enum ExamType {
  BAGRUT_EXAM = 'bagrut_exam',
  MAHAT_EXAM = 'mahat_exam', 
  UNI_COURSE_EXAM = 'uni_course_exam',
  ENTRY_EXAM = 'entry_exam',
  GOVERNMENT_EXAM = 'government_exam',
}

/**
 * Defines the type of institution that administers and issues the exam.
 * This helps determine the academic context and requirements.
 */
export enum ExamInstitutionType {
  HIGH_SCHOOL = 'high_school',                // Secondary education institutions (e.g. for Bagrut)
  PRACTICAL_ENGINEERING = 'practical_engineering',     // Technical and vocational colleges (e.g. for MAHAT)
  UNIVERSITY = 'university',                   // Higher education institutions
  GOVERNMENT_MINISTRY = 'government_ministry', // Government certification bodies
  PRIVATE_INSTITUTION = 'private_institution'  // Private educational/certification organizations
}
/**
 * Maps exam types to their corresponding institution types.
 * This is a core business logic mapping used across the application.
 */
export function getExamInstitution(examType: ExamType): ExamInstitutionType {
  switch (examType) {
    case ExamType.MAHAT_EXAM:
      return ExamInstitutionType.PRACTICAL_ENGINEERING;
    case ExamType.UNI_COURSE_EXAM:
      return ExamInstitutionType.UNIVERSITY;
    case ExamType.BAGRUT_EXAM:
      return ExamInstitutionType.HIGH_SCHOOL;
    case ExamType.ENTRY_EXAM:
      return ExamInstitutionType.UNIVERSITY;
    case ExamType.GOVERNMENT_EXAM:
      return ExamInstitutionType.GOVERNMENT_MINISTRY;
    default:
      return ExamInstitutionType.HIGH_SCHOOL;
  }
}

/**
 * Gets a display name for an institution type in Hebrew
 */
export function getInstitutionDisplayName(institution: ExamInstitutionType): string {
  switch (institution) {
    case ExamInstitutionType.HIGH_SCHOOL:
      return 'תיכון';
    case ExamInstitutionType.PRACTICAL_ENGINEERING:
      return 'הנדסאים';
    case ExamInstitutionType.UNIVERSITY:
      return 'אוניברסיטה';
    case ExamInstitutionType.GOVERNMENT_MINISTRY:
      return 'משרד ממשלתי';
    default:
      return 'לא ידוע';
  }
}



  /** Supported programming languages in the system */

/**
 * Exam configuration type representing the structure of an exam
 * as defined in the JSON files, along with runtime properties.
 */
export interface ExamTemplate {
  /** Unique identifier for the exam (e.g., "bagrut_cs_basic_java") */
  id: string;
  /** Official institution code (e.g., "899" for Bagrut CS) */
  code: string;
  /** Display names for different contexts */
  names: {
    short: string;
    medium: string;
    full: string;
  };
  /** Type of exam */
  examType: ExamType;
  /** Difficulty level (1-5) */
  difficulty: DifficultyLevel;
  /** Maximum difficulty level (optional) */
  maxDifficulty?: DifficultyLevel;
  
  /** Subject ID this exam belongs to */
  subjectId: string;
  /** Domain ID this exam belongs to */
  domainId: string;
  
  // Content and Structure
  /** List of topics covered in the exam */
  topics: Topic[]; // Using the Topic type from Subject.ts
  /** Types of questions that can appear in this exam */
  allowedQuestionTypes: QuestionType[]; // Using QuestionType from question.ts
  /** Structured sections of the exam */
  calculatorAllowed?: boolean;
  /** List of allowed materials/tools during exam */
  allowedMaterials?: string[];
  /** Fixed duration in minutes */
  duration: number;
  /** Total number of questions across all sections */
  totalQuestions: number;
}




