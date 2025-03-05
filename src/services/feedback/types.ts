import { ExamType } from '../../types/examTemplate';

export interface ExamContext {
  examType: ExamType;
  examName: string;
  subject: string;
  prepId: string;
} 