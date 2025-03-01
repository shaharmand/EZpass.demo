import { BaseQuestionGenerator, DomainConfig, QuestionTypeConfig } from '../../base/BaseQuestionGenerator';
import { Question, QuestionType } from '../../../../types/question';
import { OpenAIService } from '../../../llm/openAIService';
import { QuestionGenerationRequirements, GenerationResult } from '../../../../types/questionGeneration';
import { RubricAssessment, AnswerRequirements } from '../../../../types/questionGeneration';

const CONSTRUCTION_SAFETY_CONFIG: DomainConfig = {
  id: 'safety',
  name: 'Construction Safety',
  supportedTypes: ['multiple_choice', 'open', 'step_by_step'],
  defaultRubricWeights: {
    multiple_choice: {
      'hazard_identification': 40,
      'safety_knowledge': 30,
      'procedure_understanding': 30
    },
    open: {
      'risk_assessment': 30,
      'mitigation_strategy': 30,
      'regulatory_knowledge': 20,
      'communication': 20
    },
    step_by_step: {
      'procedure_accuracy': 40,
      'safety_considerations': 30,
      'documentation': 30
    }
  },
  languageRequirements: [
    'Use professional safety terminology in Hebrew',
    'Reference specific safety standards and regulations',
    'Use clear, unambiguous language for safety instructions',
    'Include proper safety warning symbols and formatting'
  ]
};

export class ConstructionSafetyGenerator extends BaseQuestionGenerator {
  private openAI: OpenAIService;

  constructor(openAI: OpenAIService) {
    super(CONSTRUCTION_SAFETY_CONFIG);
    this.openAI = openAI;
    this.initializeTypeConfigs();
  }

  private initializeTypeConfigs() {
    // Multiple Choice Configuration
    this.typeConfigs.set('multiple_choice', {
      type: 'multiple_choice',
      requiredElements: [
        'Clear hazard scenario description',
        'Four distinct safety-related options',
        'Reference to specific safety regulations',
        'Common misconceptions as distractors'
      ],
      rubricCriteria: [
        {
          name: 'hazard_identification',
          description: 'Ability to identify safety hazards in the scenario',
          defaultWeight: 40
        },
        {
          name: 'safety_knowledge',
          description: 'Understanding of safety regulations and standards',
          defaultWeight: 30
        },
        {
          name: 'procedure_understanding',
          description: 'Knowledge of correct safety procedures',
          defaultWeight: 30
        }
      ],
      formatInstructions: [
        'Present a realistic construction site scenario',
        'Include visual elements if relevant (described in text)',
        'Ensure all options are plausible but only one is best',
        'Reference specific safety standards in the explanation'
      ]
    });

    // Open Question Configuration
    this.typeConfigs.set('open', {
      type: 'open',
      requiredElements: [
        'Comprehensive risk assessment',
        'Multiple safety considerations',
        'Regulatory compliance aspects',
        'Documentation requirements'
      ],
      rubricCriteria: [
        {
          name: 'risk_assessment',
          description: 'Quality and completeness of risk assessment',
          defaultWeight: 30
        },
        {
          name: 'mitigation_strategy',
          description: 'Effectiveness of proposed safety measures',
          defaultWeight: 30
        },
        {
          name: 'regulatory_knowledge',
          description: 'Understanding of relevant regulations',
          defaultWeight: 20
        },
        {
          name: 'communication',
          description: 'Clarity and professionalism of response',
          defaultWeight: 20
        }
      ],
      formatInstructions: [
        'Present a complex safety scenario requiring analysis',
        'Include multiple safety aspects to consider',
        'Require specific reference to regulations',
        'Ask for documentation or reporting elements'
      ]
    });

    // Step by Step Configuration
    this.typeConfigs.set('step_by_step', {
      type: 'step_by_step',
      requiredElements: [
        'Sequential safety procedure steps',
        'Safety checks at each stage',
        'Required documentation points',
        'Emergency response considerations'
      ],
      rubricCriteria: [
        {
          name: 'procedure_accuracy',
          description: 'Correct sequence and completeness of steps',
          defaultWeight: 40
        },
        {
          name: 'safety_considerations',
          description: 'Identification of safety requirements',
          defaultWeight: 30
        },
        {
          name: 'documentation',
          description: 'Proper recording and reporting',
          defaultWeight: 30
        }
      ],
      formatInstructions: [
        'Break down complex safety procedures into clear steps',
        'Include safety checks between steps',
        'Specify required documentation at each stage',
        'Include emergency response considerations'
      ]
    });
  }

  async generateQuestion(requirements: QuestionGenerationRequirements): Promise<GenerationResult> {
    try {
      // 1. Generate base question first
      const prompt = await this.buildPrompt(requirements);
      const response = await this.openAI.complete(prompt);
      const question = JSON.parse(response) as Question;

      // 2. Generate rubric and requirements based on the question
      const { rubric, answerRequirements } = await this.generateRubricAndRequirements(
        question,
        requirements.type
      );

      // 3. Attach rubric and requirements to question
      question.evaluation = {
        rubricAssessment: rubric,
        answerRequirements: answerRequirements
      };

      // 4. Validate the complete question
      const validationResult = await this.validateQuestion(question);
      
      // ... rest of the generation logic ...
    } catch (error) {
      // ... error handling ...
    }
  }

  protected async buildPrompt(requirements: QuestionGenerationRequirements): Promise<string> {
    const typeConfig = this.typeConfigs.get(requirements.type);
    if (!typeConfig) {
      throw new Error(`Unsupported question type: ${requirements.type}`);
    }

    const instructions = this.getCombinedInstructions(requirements.type);
    
    return `Generate a construction safety question with the following requirements:

DOMAIN REQUIREMENTS:
${this.getDomainInstructions().join('\n')}

TYPE-SPECIFIC REQUIREMENTS:
${this.getTypeInstructions(requirements.type).join('\n')}

REQUIRED ELEMENTS:
${typeConfig.requiredElements.map(elem => `- ${elem}`).join('\n')}

RUBRIC CRITERIA:
${typeConfig.rubricCriteria.map(criterion => 
  `- ${criterion.name} (${criterion.defaultWeight}%): ${criterion.description}`
).join('\n')}

FORMAT INSTRUCTIONS:
${typeConfig.formatInstructions.join('\n')}

DIFFICULTY LEVEL: ${requirements.difficulty}
TOPIC: ${requirements.hierarchy.topic.name}
SUBTOPIC: ${requirements.hierarchy.subtopic.name}
ESTIMATED TIME: ${requirements.estimatedTime} minutes
LANGUAGE: ${requirements.language}

${requirements.minWords ? `MINIMUM WORDS: ${requirements.minWords}` : ''}
${requirements.maxWords ? `MAXIMUM WORDS: ${requirements.maxWords}` : ''}
${requirements.requiredConcepts?.length ? `REQUIRED CONCEPTS:\n${requirements.requiredConcepts.join('\n')}` : ''}
${requirements.excludedConcepts?.length ? `EXCLUDED CONCEPTS:\n${requirements.excludedConcepts.join('\n')}` : ''}

Generate the question in JSON format matching the Question type.`;
  }

  protected getDomainInstructions(): string[] {
    return [
      'Focus on real-world construction safety scenarios',
      'Reference relevant Israeli safety standards and regulations',
      'Include both preventive and reactive safety measures',
      'Consider multiple stakeholder perspectives',
      'Address common construction site hazards',
      'Include emergency response elements where relevant'
    ];
  }

  protected getTypeInstructions(type: QuestionType): string[] {
    const typeConfig = this.typeConfigs.get(type);
    return typeConfig?.formatInstructions || [];
  }

  protected validateDomainRequirements(question: Question): boolean {
    // Validate common requirements first
    if (!this.validateCommonRequirements(question)) {
      return false;
    }

    // Safety-specific validations
    const content = question.content.text.toLowerCase();
    
    // Check for safety-specific elements
    const hasRegulation = content.includes('תקנה') || content.includes('תקן') || content.includes('חוק');
    const hasSafetyTerms = content.includes('בטיחות') || content.includes('סכנה') || content.includes('מיגון');
    const hasContext = content.includes('אתר') || content.includes('עבודה') || content.includes('בנייה');

    if (!hasRegulation || !hasSafetyTerms || !hasContext) {
      return false;
    }

    // Type-specific validation
    const typeConfig = this.typeConfigs.get(question.type);
    if (!typeConfig) {
      return false;
    }

    // Validate required elements are present
    const hasAllElements = typeConfig.requiredElements.every(element => {
      const elementLower = element.toLowerCase();
      return content.includes(elementLower) || 
             question.solution.text.toLowerCase().includes(elementLower);
    });

    return hasAllElements;
  }

  protected async generateRubricAndRequirements(
    question: Question,
    type: QuestionType
  ): Promise<{
    rubric: RubricAssessment;
    answerRequirements: AnswerRequirements;
  }> {
    switch (type) {
      case 'multiple_choice':
        return this.getMultipleChoiceRubric(question);
      case 'open':
        return this.generateOpenQuestionRubric(question);
      case 'step_by_step':
        return this.generateStepByStepRubric(question);
      default:
        throw new Error(`Unsupported question type: ${type}`);
    }
  }

  protected async generateOpenQuestionRubric(question: Question) {
    const prompt = `
    Analyze this construction safety question and create a customized rubric:
    
    QUESTION:
    ${question.content.text}
    
    Create a rubric following these rules:
    1. Select 3-5 most relevant criteria from:
       ${STANDARD_CRITERIA.join('\n       ')}
    
    2. For each criterion provide:
       - Clear description of what to evaluate
       - Weight (%) based on importance
       - Total weights must equal 100%
    
    3. Ensure criteria align with:
       - Core knowledge being tested
       - Skills demonstrated
       - Safety principles involved
    
    Return in JSON format:
    {
      criteria: [{
        name: string,
        description: string,
        weight: number
      }],
      answerRequirements: {
        minLength: number,
        requiredElements: string[],
        mustInclude: string[],
        evaluationGuidelines: string[]
      }
    }`;

    const response = await this.openAI.complete(prompt);
    return JSON.parse(response);
  }

  protected async generateStepByStepRubric(question: Question) {
    const prompt = `
    Create a calculation-focused rubric for this step-by-step safety question:
    
    QUESTION:
    ${question.content.text}
    
    Create a rubric that evaluates:
    1. Process accuracy (steps, formulas, units)
    2. Calculation correctness
    3. Safety interpretation of results
    
    Include specific requirements for:
    - Required calculations
    - Units and conversions
    - Safety thresholds/limits
    - Documentation of process
    
    Return in JSON format matching the same structure as above.`;

    const response = await this.openAI.complete(prompt);
    return JSON.parse(response);
  }

  protected getMultipleChoiceRubric(question: Question) {
    // Fixed rubric for multiple choice
    return {
      rubric: {
        criteria: [{
          name: 'correctness',
          description: 'Selection of the correct answer',
          weight: 100
        }]
      },
      answerRequirements: {
        type: 'single_select',
        options: question.options,
        correctAnswer: question.solution.correctOption
      }
    };
  }
} 