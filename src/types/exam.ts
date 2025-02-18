import { Topic, ExamNames, Exam as ExamSchema } from '../schemas/exam';

export type { Topic, ExamNames };

/**
 * Core exam data types representing the static configuration of exams in the system.
 * These types are used to load and parse exam data from JSON configuration files.
 * They represent the immutable structure of exams, topics, and subtopics.
 * 
 * @example
 * // Example of an exam configuration in JSON:
 * {
 *   "id": "bagrut_cs_basic_java",
 *   "code": "899",
 *   "names": {
 *     "short": "יסודות מדמ\"ח Java",
 *     "medium": "יסודות מדעי המחשב Java - בגרות",
 *     "full": "בחינת בגרות - יסודות מדעי המחשב ותכנות בסיסי בשפת Java"
 *   },
 *   "exam_type": "bagrut",
 *   "difficulty": 3,
 *   "programming_language": "java",
 *   "topics": [...]
 * }
 */

/**
 * Supported exam types in the system.
 * Each type represents a different educational or certification context.
 */
export enum ExamType {
  // High School & Technical Education
  BAGRUT = 'bagrut',                    // Ministry of Education - High School
  MAHAT = 'mahat',                      // Technical Education
  
  // University Exams
  UNI_COURSE = 'uni_course',            // University course exams (מבחני קורס)
  UNI_PSYCHOMETRIC = 'uni_psychometric', // General university entrance
  UNI_AMIR = 'uni_amir',                // English proficiency
  UNI_YAEL = 'uni_yael',                // Hebrew proficiency
  
  // Government Ministry Certifications
  MINISTRY_LABOR = 'ministry_labor',     // Ministry of Labor certifications
  MINISTRY_TRANSPORT = 'ministry_transport', // Ministry of Transport certifications
  MINISTRY_HEALTH = 'ministry_health',   // Ministry of Health certifications
  
  // Other
  PRIVATE_CERTIFICATION = 'private_certification' // Non-government certification bodies
}

/**
 * Core exam configuration type representing a single exam.
 * This is the base structure loaded from JSON files.
 */
export interface ExamData {
  /** Unique identifier for the exam (e.g., "bagrut_cs_basic_java") */
  id: string;
  /** Official institution code (e.g., "899" for Bagrut CS, "61102" for Mahat) */
  code: string;
  /** Display names for different contexts */
  names: ExamNames;
  /** Type of exam (e.g., bagrut, mahat) */
  exam_type: ExamType;
  /** Difficulty level (1-5) */
  difficulty: number;
  /** Programming language for CS exams */
  programming_language?: 'java' | 'c#' | 'python';
  /** List of topics covered in the exam */
  topics: Topic[];
}

/**
 * Collection of Mahat exams grouped by faculty.
 */
export interface MahatExams {
  /** Faculty identifier (e.g., "software_engineering") */
  faculty: string;
  /** List of Mahat exams */
  exams: ExamData[];
}

/**
 * Collection of Bagrut exams.
 */
export interface BagrutExams {
  /** List of Bagrut exams */
  exams: ExamData[];
} 