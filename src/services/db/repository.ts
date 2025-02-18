import { ExamDatabase } from './schema';
import type { 
  DBExam, 
  DBTopic, 
  DBSubTopic, 
  DBExamSession,
  ExamWithRelations,
  FormalExam,
  DBExamTopicProgress
} from '../../types/shared/exam';
import { convertDBExamToFormalExam } from '../../types/shared/exam';
import type { DBUser, DBQuestion, DBQuestionResponse } from './schema';

// Initialize database
const db = new ExamDatabase();

// Helper function for generating UUIDs
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Repository class to handle all database operations
export class ExamRepository {
  // Exam operations
  async findExamsByType(examType: 'bagrut' | 'mahat'): Promise<FormalExam[]> {
    const exams = await db.exams
      .where('examType')
      .equals(examType)
      .and((exam: { isActive: boolean }) => exam.isActive)
      .toArray();

    const examsWithRelations = await Promise.all(
      exams.map(async (exam: DBExam) => {
        const topics = await db.topics
          .where('examId')
          .equals(exam.id)
          .toArray();

        const topicsWithSubtopics = await Promise.all(
          topics.map(async (topic: DBTopic) => ({
            ...topic,
            subTopics: await db.subtopics
              .where('topicId')
              .equals(topic.id)
              .toArray()
          }))
        );

        return {
          exam,
          topics: topicsWithSubtopics
        } as ExamWithRelations;
      })
    );

    return examsWithRelations.map(convertDBExamToFormalExam);
  }

  // Question operations
  async findQuestionsByTopic(topicId: string): Promise<DBQuestion[]> {
    return db.questions
      .where('topicId')
      .equals(topicId)
      .toArray();
  }

  async saveQuestion(question: DBQuestion): Promise<string> {
    return db.questions.add({
      ...question,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // User operations
  async findUserById(userId: string): Promise<DBUser | undefined> {
    return db.users.get(userId);
  }

  async saveUser(user: Omit<DBUser, 'createdAt' | 'updatedAt'>): Promise<string> {
    return db.users.add({
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Session operations
  async createSession(examId: string, userId: string): Promise<string> {
    return db.examSessions.add({
      id: generateUUID(),
      examId: examId,
      userId: userId,
      status: 'not_started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async saveQuestionResponse(response: Omit<DBQuestionResponse, 'createdAt'>): Promise<string> {
    return db.questionResponses.add({
      ...response,
      createdAt: new Date().toISOString()
    });
  }

  // Progress tracking
  async getTopicProgress(sessionId: string, topicId: string): Promise<DBExamTopicProgress | undefined> {
    return db.topicProgress
      .where(['sessionId', 'topicId'])
      .equals([sessionId, topicId])
      .first();
  }

  async updateTopicProgress(progress: DBExamTopicProgress): Promise<void> {
    await db.topicProgress.put({
      ...progress,
      updatedAt: new Date().toISOString()
    });
  }
} 