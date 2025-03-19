/**
 * Types for database persistence of student preparation state
 */

import type { StudentPrep } from './prepState';
import type { ExamTemplate } from './examTemplate';

/**
 * Database model representation of a user preparation
 * Maps to the user_preparations table in the database
 */
export interface UserPreparationDB {
  id: string;
  user_id: string;
  name: string | null;
  exam_id: string | null;
  custom_name: string | null;
  prep_state: StudentPrep;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Summary information about a user preparation for listing and selection
 */
export interface PreparationSummary {
  id: string;
  name: string;
  customName?: string | null;
  examId?: string | null;
  exam?: ExamTemplate | null;
  lastActiveAt: string;
  completedQuestions: number;
  totalQuestions?: number;
  status: 'active' | 'paused' | 'completed';
  progress: number; // Percentage complete
  prep_state: StudentPrep; // Full preparation state
}

/**
 * Response from preparation creation/update
 */
export interface PreparationResponse {
  id: string;
  success: boolean;
  error?: string;
} 