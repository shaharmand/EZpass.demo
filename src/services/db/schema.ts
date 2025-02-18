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
  created_at: string;
  updated_at: string;
}

export interface DBQuestion {
  id: string;
  topic_id: string;
  content: string;
  type: 'multiple_choice' | 'open' | 'code';
  difficulty: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DBQuestionResponse {
  id: string;
  session_id: string;
  question_id: string;
  user_id: string;
  answer: string;
  is_correct: boolean;
  time_taken: number;
  created_at: string;
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
      exams: 'id, code, exam_type, is_active',
      topics: 'id, exam_id, topic_id',
      subtopics: 'id, topic_id',
      users: 'id, email',
      questions: 'id, topic_id, type, difficulty',
      examSessions: 'id, exam_id, user_id, status',
      topicProgress: 'id, session_id, topic_id',
      questionResponses: 'id, session_id, question_id, user_id'
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