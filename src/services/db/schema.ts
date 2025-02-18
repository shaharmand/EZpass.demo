import Dexie, { Table } from 'dexie';
import type { 
  DBExam, 
  DBTopic, 
  DBSubTopic, 
  DBExamSession,
  DBExamTopicProgress 
} from '../../types/shared/exam';

// Define user types
export interface DBUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBQuestion {
  id: string;
  topicId: string;
  content: string;
  type: 'multiple_choice' | 'open' | 'code';
  difficulty: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DBQuestionResponse {
  id: string;
  sessionId: string;
  questionId: string;
  userId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken: number;
  createdAt: string;
}

// Define the database
export class ExamDatabase extends Dexie {
  // Define tables
  exams!: Table<DBExam, string>;
  topics!: Table<DBTopic, string>;
  subtopics!: Table<DBSubTopic, string>;
  users!: Table<DBUser, string>;
  questions!: Table<DBQuestion, string>;
  examSessions!: Table<DBExamSession, string>;
  topicProgress!: Table<DBExamTopicProgress, string>;
  questionResponses!: Table<DBQuestionResponse, string>;

  constructor() {
    super('EZpassDB');

    // Define schema with indexes
    this.version(1).stores({
      exams: 'id, code, examType, isActive',
      topics: 'id, examId, topicId',
      subtopics: 'id, topicId',
      users: 'id, email',
      questions: 'id, topicId, type, difficulty',
      examSessions: 'id, examId, userId, status',
      topicProgress: 'id, sessionId, topicId',
      questionResponses: 'id, sessionId, questionId, userId'
    });
  }

  // Helper method to initialize with sample data
  async initializeWithSampleData(data: { 
    exams: DBExam[],
    topics: DBTopic[],
    subtopics: DBSubTopic[] 
  }) {
    await this.transaction('rw', 
      [this.exams, this.topics, this.subtopics], 
      async () => {
        // Clear existing data
        await Promise.all([
          this.exams.clear(),
          this.topics.clear(),
          this.subtopics.clear()
        ]);

        // Add new data
        await Promise.all([
          this.exams.bulkAdd(data.exams),
          this.topics.bulkAdd(data.topics),
          this.subtopics.bulkAdd(data.subtopics)
        ]);
    });
  }
} 