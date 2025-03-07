import { Question, QuestionType, DifficultyLevel, SourceType, EzpassCreatorType, AnswerFormatRequirements, AnswerContentGuidelines } from '../../../../types/question';
import { BaseQuestionGenerator } from '../../base/BaseQuestionGenerator';
import { OpenAIService } from '../../../../services/llm/openAIService';
import { QuestionGenerationRequirements, GenerationResult } from '../../../../types/questionGeneration';
import { logger } from '../../../../utils/logger';

interface TypeConfig {
  instructions: string[];
  examples: string[];
  criteria: Array<{ name: string; description: string; weight: number; }>;
}

export class ConstructionSafetyGenerator extends BaseQuestionGenerator {
  private openAIService: OpenAIService;
  private typeConfigs: Map<QuestionType, TypeConfig> = new Map();

  constructor(openAIService: OpenAIService) {
    super();
    this.openAIService = openAIService;
    this.initializeTypeConfigs();
  }

  protected getTypeInstructions(type: QuestionType): string[] {
    return this.typeConfigs.get(type)?.instructions || [];
  }

  private initializeTypeConfigs() {
    // Multiple Choice config
    this.typeConfigs.set(QuestionType.MULTIPLE_CHOICE, {
      instructions: [
        'Create clear, focused questions about construction safety procedures',
        'Include exactly 4 options with one correct answer',
        'Ensure all options are plausible but only one is best practice',
        'Focus on practical safety scenarios workers might encounter'
      ],
      examples: this.getMultipleChoiceExamples(),
      criteria: this.getMultipleChoiceCriteria()
    });

    // Open Question config
    this.typeConfigs.set(QuestionType.OPEN, {
      instructions: [
        'Create comprehensive safety planning scenarios',
        'Include specific requirements for the response',
        'Focus on real-world construction safety challenges',
        'Require detailed safety protocol explanations'
      ],
      examples: this.getOpenQuestionExamples(),
      criteria: this.getOpenQuestionCriteria()
    });

    // Numerical Question config
    this.typeConfigs.set(QuestionType.NUMERICAL, {
      instructions: [
        'Create practical calculation problems related to safety',
        'Include all necessary information for the calculation',
        'Focus on real safety-related measurements and limits',
        'Specify units and acceptable tolerance ranges'
      ],
      examples: this.getNumericalExamples(),
      criteria: this.getNumericalCriteria()
    });
  }

  protected getDomainInstructions(): string[] {
    return [
      'Focus on construction site safety protocols and regulations',
      'Include relevant safety standards (ISO 45001, OSHA 1926)',
      'Consider common construction hazards and prevention measures',
      'Emphasize proper PPE usage and safety equipment',
      'Include emergency response procedures when relevant'
    ];
  }

  protected async validateHierarchy(requirements: QuestionGenerationRequirements): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const { subject, domain, topic } = requirements.hierarchy;
    
    // Validate subject
    if (subject.id !== 'construction') {
      errors.push('Subject must be construction');
    }

    // Validate domain
    if (domain.id !== 'safety') {
      errors.push('Domain must be safety');
    }

    // Validate topic exists
    if (!topic.id) {
      errors.push('Topic ID is required');
    }

    // Optional subtopic validation - only check if subtopic exists and has an id
    const hasSubtopic = (obj: any): obj is { id: string; name: string } => {
      return obj && typeof obj === 'object' && 'id' in obj;
    };

    if (hasSubtopic(requirements.hierarchy.subtopic) && !requirements.hierarchy.subtopic.id) {
      errors.push('Subtopic ID is required if subtopic is provided');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async validateDomainRequirements(requirements: QuestionGenerationRequirements): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate difficulty level
    if (requirements.difficulty < 1 || requirements.difficulty > 5) {
      errors.push('Difficulty must be between 1 and 5');
    }

    // Validate question type
    if (!this.typeConfigs.has(requirements.type)) {
      errors.push(`Unsupported question type: ${requirements.type}`);
    }

    // Validate estimated time if provided
    if (requirements.estimatedTime !== undefined && requirements.estimatedTime <= 0) {
      errors.push('Estimated time must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private getMultipleChoiceExamples(): string[] {
    return [
      'What is the first step before starting work on a scaffold?\nA) Check scaffold safety certification\nB) Start working immediately\nC) Check only personal PPE\nD) Ask coworkers if it\'s safe',
      'Which PPE is required for working at heights?\nA) Hard hat only\nB) Safety harness, hard hat, and safety boots\nC) Safety harness only\nD) Work gloves and hard hat'
    ];
  }

  private getOpenQuestionExamples(): string[] {
    return [
      'Develop a comprehensive safety plan for a new construction site, including risk assessment, PPE requirements, and emergency procedures.',
      'Analyze the safety risks in a concrete pouring operation and propose detailed prevention measures.'
    ];
  }

  private getNumericalExamples(): string[] {
    return [
      'Calculate the maximum load capacity for a scaffold platform that is 2.4m long and 0.6m wide, given a load rating of 2.5 kN/m².',
      'Determine the minimum safe distance for a crane operation if the boom length is 30m and the load weight is 2000kg.'
    ];
  }

  private getMultipleChoiceCriteria(): Array<{ name: string; description: string; weight: number }> {
    return [
      {
        name: 'safety_protocol_understanding',
        description: 'Understanding of safety protocols',
        weight: 40
      },
      {
        name: 'risk_assessment',
        description: 'Correct risk assessment',
        weight: 30
      },
      {
        name: 'ppe_knowledge',
        description: 'Knowledge of PPE requirements',
        weight: 30
      }
    ];
  }

  private getOpenQuestionCriteria(): Array<{ name: string; description: string; weight: number }> {
    return [
      {
        name: 'comprehensiveness',
        description: 'Comprehensive safety planning',
        weight: 30
      },
      {
        name: 'risk_assessment',
        description: 'Thorough risk assessment',
        weight: 30
      },
      {
        name: 'practical_measures',
        description: 'Practical safety measures',
        weight: 40
      }
    ];
  }

  private getNumericalCriteria(): Array<{ name: string; description: string; weight: number }> {
    return [
      {
        name: 'calculation_accuracy',
        description: 'Accurate safety calculations',
        weight: 40
      },
      {
        name: 'safety_factors',
        description: 'Appropriate safety factors',
        weight: 30
      },
      {
        name: 'units_standards',
        description: 'Correct use of units and standards',
        weight: 30
      }
    ];
  }

  async generateQuestion(requirements: QuestionGenerationRequirements): Promise<GenerationResult> {
    try {
      // Validate topic hierarchy first
      const hierarchyValidation = await this.validateHierarchy(requirements);

      if (!hierarchyValidation.isValid) {
        return {
          success: false,
          validationErrors: hierarchyValidation.errors
        };
      }

      logger.info('Generating construction safety question', {
        type: requirements.type,
        topic: requirements.hierarchy.topic.name,
        subtopic: requirements.hierarchy.subtopic?.name,
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
          subtopicId: requirements.hierarchy.subtopic?.id,
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