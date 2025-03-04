import { Question, QuestionType, DifficultyLevel, SourceType, EzpassCreatorType, AnswerFormatRequirements, AnswerContentGuidelines } from '../../../../types/question';
import { BaseQuestionGenerator } from '../../base/BaseQuestionGenerator';
import { DomainConfig } from '../../base/BaseQuestionGenerator';
import { OpenAIService } from '../../../llm/openAIService';
import { QuestionGenerationRequirements, GenerationResult } from '../../../../types/questionGeneration';
import { logger } from '../../../../utils/logger';

const CONSTRUCTION_SAFETY_CONFIG: DomainConfig = {
  id: 'safety',
  name: 'Construction Safety',
  supportedTypes: [QuestionType.MULTIPLE_CHOICE, QuestionType.OPEN, QuestionType.NUMERICAL],
  defaultRubricWeights: {
    [QuestionType.MULTIPLE_CHOICE]: {
      'hazard_identification': 40,
      'safety_knowledge': 30,
      'procedure_understanding': 30
    },
    [QuestionType.OPEN]: {
      'risk_assessment': 30,
      'mitigation_strategy': 30,
      'regulatory_knowledge': 20,
      'communication': 20
    },
    [QuestionType.NUMERICAL]: {
      'calculation_accuracy': 40,
      'unit_conversion': 30,
      'safety_margin': 30
    }
  },
  languageRequirements: [
    'Use clear, professional language',
    'Include relevant safety terminology',
    'Avoid ambiguous wording'
  ]
};

export class ConstructionSafetyGenerator extends BaseQuestionGenerator {
  private openAIService: OpenAIService;

  constructor(openAIService: OpenAIService) {
    super(CONSTRUCTION_SAFETY_CONFIG);
    this.openAIService = openAIService;
    this.initializeTypeConfigs();
  }

  private initializeTypeConfigs() {
    // Initialize type configs with empty maps for now
    this.typeConfigs = new Map();
  }

  protected getDomainInstructions(): string[] {
    return [
      'Focus on practical safety scenarios',
      'Include relevant safety regulations',
      'Consider real-world construction situations',
      'Reference specific safety equipment and procedures',
      'Include hazard identification and risk assessment'
    ];
  }

  protected getTypeInstructions(type: QuestionType): string[] {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return [
          'Provide 4 distinct options',
          'Include common misconceptions as distractors',
          'Make all options plausible but only one correct',
          'Base distractors on common safety mistakes',
          'Ensure options are mutually exclusive'
        ];
      case QuestionType.OPEN:
        return [
          'Require detailed safety analysis',
          'Ask for specific safety measures',
          'Include evaluation criteria',
          'Request justification based on regulations',
          'Ask for risk mitigation strategies'
        ];
      case QuestionType.NUMERICAL:
        return [
          'Include relevant safety calculations',
          'Specify required units',
          'Consider safety margins',
          'Include practical measurements',
          'Reference specific safety standards'
        ];
      default:
        return [];
    }
  }

  protected validateDomainRequirements(question: Question): boolean {
    // Validate that the question contains safety-related content
    const content = question.content.text.toLowerCase();
    const safetyTerms = ['safety', 'hazard', 'risk', 'protection', 'regulation', 'תקנה', 'בטיחות', 'סכנה'];
    const hasSafetyTerms = safetyTerms.some(term => content.includes(term));

    if (!hasSafetyTerms) {
      return false;
    }

    // Validate based on question type
    switch (question.metadata.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return this.validateMultipleChoice(question);
      case QuestionType.OPEN:
        return this.validateOpen(question);
      case QuestionType.NUMERICAL:
        return this.validateNumerical(question);
      default:
        return false;
    }
  }

  private validateMultipleChoice(question: Question): boolean {
    if (!question.content.options || question.content.options.length !== 4) {
      return false;
    }
    return question.content.options.every(option => option.text.trim().length > 0);
  }

  private validateOpen(question: Question): boolean {
    return question.content.text.length >= 50; // Minimum length for open questions
  }

  private validateNumerical(question: Question): boolean {
    const content = question.content.text.toLowerCase();
    return /\d+/.test(content) && // Contains numbers
           /units?|יחידות|מטר|מ"ר|ק"ג/.test(content); // Contains units
  }

  async generateQuestion(requirements: QuestionGenerationRequirements): Promise<GenerationResult> {
    try {
      logger.info('Generating construction safety question', {
        type: requirements.type,
        topic: requirements.hierarchy.topic.name,
        subtopic: requirements.hierarchy.subtopic.name,
        difficulty: requirements.difficulty
      });

      const prompt = await this.buildPrompt(requirements);
      const response = await this.openAIService.complete(prompt, {
        temperature: 0.7
      });

      if (!response) {
        throw new Error('No content received from OpenAI');
      }

      const parsed = JSON.parse(response);
      const question: Question = {
        id: `safety-${Date.now()}`,
        metadata: {
          subjectId: requirements.hierarchy.subject.id,
          domainId: 'safety',
          topicId: requirements.hierarchy.topic.id,
          subtopicId: requirements.hierarchy.subtopic.id,
          difficulty: requirements.difficulty,
          type: requirements.type,
          answerFormat: {
            hasFinalAnswer: requirements.type !== QuestionType.OPEN,
            finalAnswerType: requirements.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' :
                           requirements.type === QuestionType.NUMERICAL ? 'numerical' : 'multiple_choice',
            requiresSolution: true
          },
          source: {
            type: SourceType.EZPASS,
            creatorType: EzpassCreatorType.AI
          }
        },
        content: {
          text: parsed.content.text,
          format: 'markdown'
        },
        schoolAnswer: {
          finalAnswer: requirements.type === QuestionType.MULTIPLE_CHOICE ? 
            { type: 'multiple_choice', value: 1 } :
            requirements.type === QuestionType.NUMERICAL ?
            { type: 'numerical', value: 0, tolerance: 0 } :
            undefined,
          solution: {
            text: '',
            format: 'markdown'
          }
        },
        evaluationGuidelines: this.generateAnswerRequirements(requirements.type)
      };

      return {
        success: true,
        question,
        generationMetadata: {
          attemptCount: 1,
          totalTime: 0,
          validationResults: {
            commonValidation: true,
            domainValidation: true,
            typeValidation: true,
            hierarchyValidation: {
              subjectValid: true,
              domainValid: true,
              topicValid: true,
              subtopicValid: true
            }
          }
        }
      };

    } catch (error) {
      logger.error('Failed to generate construction safety question', { error });
      return {
        success: false,
        validationErrors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  protected async buildPrompt(requirements: QuestionGenerationRequirements): Promise<string> {
    const domainInstructions = this.getDomainInstructions();
    const typeInstructions = this.getTypeInstructions(requirements.type);
    
    return `Generate a ${requirements.type} question about construction safety.
Topic: ${requirements.hierarchy.topic.name}
Difficulty: ${requirements.difficulty}

Domain Requirements:
${domainInstructions.map(i => `- ${i}`).join('\n')}

Type-Specific Requirements:
${typeInstructions.map(i => `- ${i}`).join('\n')}

Return the question in the following JSON format:
{
  "content": {
    "text": "Your question text here",
    "format": "markdown"
  }${requirements.type === QuestionType.MULTIPLE_CHOICE ? `,
  "options": [
    {
      "text": "Option 1",
      "format": "markdown"
    },
    // ... 3 more options
  ]` : ''}
}`;
  }

  private generateAnswerRequirements(type: QuestionType): AnswerContentGuidelines {
    const baseRequirements = [
      {
        name: 'safety_compliance',
        description: 'Safety regulations compliance',
        weight: 40
      },
      {
        name: 'risk_assessment',
        description: 'Risk assessment',
        weight: 30
      },
      {
        name: 'hazard_identification',
        description: 'Hazard identification',
        weight: 30
      }
    ];

    return {
      requiredCriteria: baseRequirements
    };
  }
} 