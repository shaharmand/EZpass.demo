import { DifficultyLevel, QuestionType, Question, SourceType, FullAnswer } from './question';
import { Subject, Domain, Topic, SubTopic } from './subject';

/**
 * Base parameters for generating any type of question
 */
export interface BaseQuestionGenerationParams {
  subject: Subject;
  domain: Domain;
  topic: Topic;
  subtopic: SubTopic;
  type: QuestionType;
  difficulty: DifficultyLevel;
  estimatedTime: number;  // in minutes
}

/**
 * Base response format from OpenAI for question generation
 */
export interface BaseOpenAIQuestionResponse {
  content: {
    text: string;
    format: "markdown";
  };
  options?: Array<{
    text: string;
    format: 'markdown';
  }>;
}

/**
 * Base interface for domain-specific question generators
 */
export interface IQuestionGenerator {
  generate(params: QuestionGenerationRequirements): Promise<Partial<Question>>;
}

/**
 * Base interface for solution generators
 */
export interface ISolutionGenerator {
  generate(question: Partial<Question>): Promise<{ solution: FullAnswer['solution'] }>;
}

export interface TopicHierarchy {
  subject: Subject;
  domain: Domain;
  topic: Topic;
  subtopic: SubTopic;
}

export interface QuestionGenerationRequirements {
  type: QuestionType;
  difficulty: DifficultyLevel;
  hierarchy: {
    subject: {
      id: string;
      name: string;
    };
    domain: {
      id: string;
      name: string;
    };
    topic: {
      id: string;
      name: string;
    };
    subtopic: {
      id: string;
      name: string;
    };
  };
  estimatedTime: number;
  subject: string;
  educationType?: string;
  source?: {
    type: SourceType;
    creatorType?: string;
  };
}

export interface GenerationResult {
  success: boolean;
  question?: Question;
  validationErrors?: string[];
  generationMetadata?: {
    attemptCount: number;
    totalTime: number;
    validationResults: {
      commonValidation: boolean;
      domainValidation: boolean;
      typeValidation: boolean;
      hierarchyValidation: {
        subjectValid: boolean;
        domainValid: boolean;
        topicValid: boolean;
        subtopicValid: boolean;
      };
    };
    timeAnalysis?: {
      estimatedVsActual: {
        minutes: number;
        confidence: number;  // 0-1 scale of confidence in time estimation
      };
      factors: {
        complexity: number;  // 0-1 scale
        prerequisiteKnowledge: number;  // 0-1 scale
        interactivityLevel: number;  // 0-1 scale
      };
    };
  };
}

// Helper function to create TopicHierarchy from IDs using UniversalTopics service
export interface TopicReference {
  subjectId: string;
  domainId: string;
  topicId: string;
  subtopicId: string;
}

export interface QuestionGenerationContext {
  hierarchy: TopicHierarchy;
  requirements: QuestionGenerationRequirements;
  metadata: {
    previousQuestions?: Question[];  // For context about what's been generated before
    relatedConcepts?: string[];     // Related concepts that might be relevant
    prerequisiteTopics?: Topic[];    // Topics that should be understood first
    difficultyContext?: {
      averageDifficulty: number;
      recommendedRange: [number, number];
    };
  };
} 