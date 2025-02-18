export interface FormalExam {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  completedAt?: string;
  startedAt?: string;
} 