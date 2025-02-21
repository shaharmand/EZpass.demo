import yaml from 'js-yaml';
import type { Question, QuestionType, DifficultyLevel } from '../../../types/question';

interface RawQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correct?: number;
  solution: string;
  difficulty: DifficultyLevel;
}

interface QuestionMetadata {
  topicId: string;
  subtopicId?: string;
  source: {
    examType: string;
  };
}

/**
 * Converts a raw YAML question to our Question type
 */
export function convertRawToQuestion(raw: RawQuestion, metadata: QuestionMetadata): Question {
  const question: Question = {
    id: raw.id,
    type: raw.type,
    content: {
      text: raw.question,
      format: 'markdown' as const
    },
    metadata: {
      ...metadata,
      difficulty: raw.difficulty as DifficultyLevel
    },
    solution: {
      text: raw.solution,
      format: 'markdown' as const
    }
  };

  // Only add options for multiple choice questions
  if (raw.type === 'multiple_choice' && raw.options) {
    question.options = raw.options.map(opt => ({
      text: opt,
      format: 'markdown' as const
    }));
    question.correctOption = raw.correct;
  }

  return question;
}

/**
 * Loads questions from a YAML file and converts them to our Question type
 */
export async function loadYamlQuestions(yamlContent: string, metadata: QuestionMetadata): Promise<Question[]> {
  try {
    const rawQuestions = yaml.load(yamlContent) as RawQuestion[];
    if (!Array.isArray(rawQuestions)) {
      throw new Error('YAML content must be an array of questions');
    }
    return rawQuestions.map(q => convertRawToQuestion(q, metadata));
  } catch (error) {
    console.error('Failed to parse YAML questions:', error);
    throw error;
  }
} 