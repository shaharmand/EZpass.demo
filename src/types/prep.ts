import type { FormalExam } from './shared/exam';

export interface Prep {
  id: string;
  exam: FormalExam;
  selectedTopics: string[];
  status: 'not_started' | 'in_progress' | 'completed';
  startTime: number;
  completedAt?: string;
}

export type PrepStatus = Prep['status']; 