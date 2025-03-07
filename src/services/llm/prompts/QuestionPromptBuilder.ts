import { QuestionType } from "../../../types/question";

export interface QuestionPromptParams {
  type: QuestionType;
  totalPoints?: number;
  topic?: string;
  subtopic?: string;
  difficulty?: number;
  language?: string;
  examType: string;
  subject?: string;
  educationType?: string;
}

export class QuestionPromptBuilder {
  private params: QuestionPromptParams;

  constructor(params: QuestionPromptParams) {
    this.params = params;
  }

  build(): string {
    // Dummy implementation that returns a basic prompt
    return `You are a professional question generator.
Please generate a ${this.params.type} question${this.params.topic ? ` about ${this.params.topic}` : ''}.
The question should be clear, concise, and educational.
Exam type: ${this.params.examType}
${this.params.difficulty ? `Difficulty level: ${this.params.difficulty}/5` : ''}
${this.params.totalPoints ? `Total points: ${this.params.totalPoints}` : ''}
${this.params.subject ? `Subject: ${this.params.subject}` : ''}
${this.params.educationType ? `Education Type: ${this.params.educationType}` : ''}`;
  }
} 