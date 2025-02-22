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
    },
    // Add default rubric assessment based on question type
    rubricAssessment: {
      criteria: raw.type === 'multiple_choice' ? [
        {
          name: "Correctness",
          description: "Selecting the right answer and demonstrating understanding",
          weight: 60
        },
        {
          name: "Understanding",
          description: "Showing comprehension of core concepts and why other options are wrong",
          weight: 40
        }
      ] : raw.type === 'open' ? [
        {
          name: "Accuracy",
          description: "Correctness of the solution and understanding of concepts",
          weight: 40
        },
        {
          name: "Methodology",
          description: "Proper approach to problem-solving",
          weight: 30
        },
        {
          name: "Clarity",
          description: "Clear and organized presentation of ideas",
          weight: 30
        }
      ] : raw.type === 'code' ? [
        {
          name: "Functionality",
          description: "Code works as required",
          weight: 40
        },
        {
          name: "Efficiency",
          description: "Optimal solution and performance",
          weight: 20
        },
        {
          name: "Style",
          description: "Code organization and readability",
          weight: 20
        },
        {
          name: "Testing",
          description: "Handling edge cases",
          weight: 20
        }
      ] : [ // step_by_step
        {
          name: "Process",
          description: "Following correct solution steps",
          weight: 40
        },
        {
          name: "Calculations",
          description: "Accurate computations",
          weight: 30
        },
        {
          name: "Validation",
          description: "Checking results at each step",
          weight: 30
        }
      ]
    },
    // Add default answer requirements based on question type
    answerRequirements: {
      requiredElements: raw.type === 'multiple_choice' ? [
        "Correct option selection",
        "Understanding of core concepts",
        "Recognition of why other options are incorrect"
      ] : raw.type === 'open' ? [
        "Key concepts covered",
        "Proper explanation",
        "Clear presentation"
      ] : raw.type === 'code' ? [
        "Working code solution",
        "Proper error handling",
        "Code organization",
        "Test cases handled"
      ] : [ // step_by_step
        "Complete step sequence",
        "Accurate calculations",
        "Result validation"
      ]
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