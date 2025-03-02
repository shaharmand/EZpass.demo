import questions from '../data/questions.json';
import type { Question, QuestionType, QuestionFetchParams, DifficultyLevel } from '../types/question';

export class StaticQuestionService {
  private questions: Question[] = (questions.questions as any[]).map(q => ({
    ...q,
    metadata: {
      ...q.metadata,
      type: q.metadata.type as QuestionType,
      difficulty: q.metadata.difficulty as DifficultyLevel
    }
  }));

  getQuestion(params: QuestionFetchParams): Question {
    // Filter questions based on params
    const matchingQuestions = this.questions.filter(q => 
      q.metadata.topicId === params.topic &&
      q.metadata.difficulty === params.difficulty &&
      q.metadata.type === params.type &&
      (!params.subtopic || q.metadata.subtopicId === params.subtopic)
    );

    if (matchingQuestions.length === 0) {
      throw new Error('No matching questions found');
    }

    // Return a random question from matches
    return matchingQuestions[Math.floor(Math.random() * matchingQuestions.length)];
  }

  getQuestionById(id: string): Question | undefined {
    return this.questions.find(q => q.id === id);
  }
} 