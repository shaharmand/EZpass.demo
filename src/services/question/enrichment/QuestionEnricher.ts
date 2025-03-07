import { Question, QuestionType, DifficultyLevel } from '../../../types/question';
import { logger } from '../../../utils/logger';

interface EnrichmentRequest {
  question: Question;
  fieldsToEnrich: Array<'evaluationGuidelines' | 'difficulty' | 'subtopic' | 'title'>;
  shouldGenerateVariant?: boolean;
}

/**
 * Service for enriching existing questions with missing metadata
 * and generating variants
 */
export class QuestionEnricher {
  /**
   * Enrich a question with missing metadata
   */
  async enrichQuestion(request: EnrichmentRequest): Promise<Question> {
    const { question, fieldsToEnrich } = request;
    let enrichedQuestion = { ...question };

    try {
      // Add missing fields one by one
      for (const field of fieldsToEnrich) {
        enrichedQuestion = await this.enrichField(enrichedQuestion, field);
      }

      // Generate variant if requested
      if (request.shouldGenerateVariant) {
        return this.generateVariant(enrichedQuestion);
      }

      return enrichedQuestion;

    } catch (error) {
      logger.error('Failed to enrich question', {
        questionId: question.id,
        fields: fieldsToEnrich,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Enrich a specific field using appropriate prompt
   */
  private async enrichField(question: Question, field: string): Promise<Question> {
    switch (field) {
      case 'evaluationGuidelines':
        return this.addEvaluationGuidelines(question);
      case 'difficulty':
        return this.assessDifficulty(question);
      case 'subtopic':
        return this.categorizeSubtopic(question);
      case 'title':
        return this.generateTitle(question);
      default:
        return question;
    }
  }

  /**
   * Add evaluation guidelines based on question type
   */
  private async addEvaluationGuidelines(question: Question): Promise<Question> {
    const prompt = `
Given this ${question.metadata.type} question in construction safety:

${question.content.text}

Example criteria for ${question.metadata.type}:
${this.getExampleCriteria(question.metadata.type)}
`;

    // TODO: Call LLM with prompt and parse response

    return {
      ...question,
      metadata: {
        ...question.metadata,
        difficulty: 3  // Medium difficulty
      }
    };
  }

  /**
   * Assess question difficulty based on content
   */
  private async assessDifficulty(question: Question): Promise<Question> {
    const prompt = `
Analyze this construction safety question and assign a difficulty level (1-5):

${question.content.text}

Consider:
1. Number of concepts involved
2. Complexity of safety considerations
3. Required background knowledge
4. Number of steps in solution
5. Real-world application complexity

Current domain: ${question.metadata.domainId}
Topic: ${question.metadata.topicId}
`;

    // TODO: Call LLM with prompt and parse response
    return {
      ...question,
      metadata: {
        ...question.metadata,
        difficulty: 3  // Medium difficulty
      }
    };
  }

  /**
   * Categorize question into appropriate subtopic
   */
  private async categorizeSubtopic(question: Question): Promise<Question> {
    const prompt = `
Categorize this construction safety question into the most appropriate subtopic:

${question.content.text}

Current topic: ${question.metadata.topicId}

Available subtopics:
- work_inspection_service
- safety_management_basics
- risk_assessment
- emergency_procedures
`;

    // TODO: Call LLM with prompt and parse response
    return question;
  }

  /**
   * Generate a descriptive title for the question
   */
  private async generateTitle(question: Question): Promise<Question> {
    const prompt = `
Generate a short, descriptive title for this construction safety question:

${question.content.text}

Requirements:
1. Max 5-7 words
2. Capture main concept
3. Be specific enough to distinguish
4. Use professional terminology
`;

    // TODO: Call LLM with prompt and parse response
    return question;
  }

  /**
   * Generate a variant of the question
   */
  private async generateVariant(question: Question): Promise<Question> {
    const prompt = `
Create a variant of this construction safety question:

${question.content.text}

Requirements:
1. Change scenario but keep core concept
2. Maintain similar difficulty level
3. Use different specific values/context
4. Keep same evaluation criteria
5. Must be different enough to be useful as additional practice

Original metadata:
${JSON.stringify(question.metadata, null, 2)}
`;

    // TODO: Call LLM with prompt and parse response
    return question;
  }

  /**
   * Get example evaluation criteria based on question type
   */
  private getExampleCriteria(type: QuestionType): string {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return `
- Understanding of safety protocols (40%)
- Risk assessment accuracy (30%)
- Proper procedure identification (30%)`;
      
      case QuestionType.NUMERICAL:
        return `
- Calculation accuracy (40%)
- Safety factor understanding (30%)
- Units and standards compliance (30%)`;
      
      case QuestionType.OPEN:
        return `
- Completeness of safety plan (30%)
- Risk assessment quality (30%)
- Practical implementation (20%)
- Regulatory compliance (20%)`;
      
      default:
        return '';
    }
  }
} 