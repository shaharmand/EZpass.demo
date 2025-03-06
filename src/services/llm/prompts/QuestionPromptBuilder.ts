import { QuestionType } from '../../../types/question';
import { ExamType } from '../../../types/examTemplate';
import { buildMetadataPrompt } from './components/metadata';
import { buildContentPrompt } from './components/content';
import { buildSchoolAnswerPrompt } from './components/schoolAnswer';
import { buildEvaluationPrompt } from './components/evaluationGuidelines';
import { buildExpertisePrompt } from './common/expertise';

export interface QuestionPromptParams {
  // Subject/Topic info
  subject: string;
  topic: string;
  subtopic?: string;

  // Question characteristics
  type: QuestionType;
  difficulty: number;
  examType: ExamType;
  educationType: string;

  // Source information
  source?: {
    type: 'exam' | 'ezpass';
    creatorType?: 'ai' | 'human';
  };

  // Optional params
  isHighLevel?: boolean;
  totalPoints?: number;
  partialCredit?: boolean;
}

export class QuestionPromptBuilder {
  private params: QuestionPromptParams;

  constructor(params: QuestionPromptParams) {
    this.params = params;
  }

  private buildExpertisePrompt(): string {
    return `You are an expert educator in ${this.params.subject}, specializing in ${this.params.topic}${
      this.params.subtopic ? ` and specifically in ${this.params.subtopic}` : ''
    }.`;
  }

  private buildContextPrompt(): string {
    return `You are creating a question for a ${this.params.examType} exam in ${this.params.educationType}.`;
  }

  private buildQuestionTypePrompt(): string {
    return `Generate a ${this.params.type} question with difficulty level ${this.params.difficulty}/5.`;
  }

  private buildScoringPrompt(): string {
    if (this.params.totalPoints) {
      return `The question is worth ${this.params.totalPoints} points${
        this.params.partialCredit ? ' and partial credit is allowed.' : '.'
      }`;
    }
    return '';
  }

  build(): string {
    const prompts = [
      this.buildExpertisePrompt(),
      this.buildContextPrompt(),
      this.buildQuestionTypePrompt(),
      this.buildScoringPrompt()
    ].filter(Boolean);

    return prompts.join('\n');
  }

  private buildMetadataPrompt(): string {
    return buildMetadataPrompt({
      subject: this.params.subject,
      domain: this.params.educationType,
      topic: this.params.topic,
      subtopic: this.params.subtopic,
      type: this.params.type,
      difficulty: this.params.difficulty,
      examType: this.params.examType
    });
  }

  private buildContentPrompt(): string {
    return buildContentPrompt(this.params.type);
  }

  private buildSchoolAnswerPrompt(): string {
    return buildSchoolAnswerPrompt({
      type: this.params.type,
      isHighLevel: this.params.isHighLevel
    });
  }

  private buildEvaluationPrompt(): string {
    return buildEvaluationPrompt({
      type: this.params.type,
      examType: this.params.examType,
      totalPoints: this.params.totalPoints || 100,
      partialCredit: this.params.partialCredit
    });
  }
} 