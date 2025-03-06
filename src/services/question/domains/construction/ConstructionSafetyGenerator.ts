import { Question, QuestionType } from '../../../../types/question';
import { AbstractQuestionGenerator } from '../../base/AbstractQuestionGenerator';
import { logger } from '../../../../utils/logger';

/**
 * Construction safety specific question generator
 */
export class ConstructionSafetyGenerator extends AbstractQuestionGenerator {
  readonly domain = 'construction_safety';
  readonly supportedTypes = [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.NUMERICAL,
    QuestionType.OPEN
  ];

  /**
   * Validate that content follows construction safety domain rules
   */
  validateDomainContent(content: string): boolean {
    // Add construction safety specific validation
    // e.g. check for required safety terms, protocols, etc.
    return true;
  }

  /**
   * Add construction safety specific context to the question
   */
  async enrichWithDomainContext(question: Question): Promise<Question> {
    // Add domain-specific context like:
    // - Safety regulations references
    // - Industry standards
    // - Common hazard scenarios
    // - PPE requirements
    // - Risk assessment frameworks
    return {
      ...question,
      metadata: {
        ...question.metadata,
        domainContext: {
          safetyStandards: ['ISO 45001', 'OSHA 1926'],
          riskLevel: this.calculateRiskLevel(question),
          requiredPPE: this.getRequiredPPE(question)
        }
      }
    };
  }

  /**
   * Add construction safety specific evaluation criteria
   */
  async addDomainSpecificEvaluation(question: Question): Promise<Question> {
    const baseEvaluation = question.evaluationGuidelines;
    
    // Add construction safety specific criteria based on question type
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return this.addMultipleChoiceEvaluation(question);
      case QuestionType.NUMERICAL:
        return this.addNumericalEvaluation(question);
      case QuestionType.OPEN:
        return this.addOpenEvaluation(question);
      default:
        return question;
    }
  }

  /**
   * Override multiple choice content generation with construction safety specifics
   */
  protected async generateMultipleChoiceContent(question: Question): Promise<Question> {
    // Add construction safety specific multiple choice patterns:
    // - Safety procedure choices
    // - Risk assessment options
    // - PPE selection scenarios
    // - Emergency response protocols
    return {
      ...question,
      content: {
        ...question.content,
        text: await this.generateSafetyScenario(),
        options: await this.generateSafetyOptions()
      }
    };
  }

  /**
   * Override numerical content generation with construction safety specifics
   */
  protected async generateNumericalContent(question: Question): Promise<Question> {
    // Add construction safety specific numerical patterns:
    // - Load calculations
    // - Safety factor computations
    // - Risk probability assessments
    // - Cost-benefit analysis of safety measures
    return {
      ...question,
      content: {
        ...question.content,
        text: await this.generateSafetyCalculation()
      }
    };
  }

  /**
   * Override open content generation with construction safety specifics
   */
  protected async generateOpenContent(question: Question): Promise<Question> {
    // Add construction safety specific open question patterns:
    // - Safety plan development
    // - Risk assessment procedures
    // - Incident investigation reports
    // - Safety audit protocols
    return {
      ...question,
      content: {
        ...question.content,
        text: await this.generateSafetyPlanningScenario()
      }
    };
  }

  // Private helper methods for construction safety domain

  private calculateRiskLevel(question: Question): string {
    // Implement risk level calculation based on question content
    return 'high';
  }

  private getRequiredPPE(question: Question): string[] {
    // Determine required PPE based on question scenario
    return ['hard_hat', 'safety_boots', 'high_vis_vest'];
  }

  private async generateSafetyScenario(): Promise<string> {
    // Generate a realistic construction safety scenario
    return 'בתרחיש הבא, צוות עובד על פיגום בגובה 10 מטר...';
  }

  private async generateSafetyOptions(): Promise<Array<{ text: string, format: string }>> {
    // Generate safety-focused multiple choice options
    return [
      { text: 'לבדוק את תקינות הפיגום ולהשתמש בציוד מגן אישי', format: 'markdown' },
      { text: 'להתחיל לעבוד מיד כדי לחסוך זמן', format: 'markdown' },
      { text: 'לבדוק רק את ציוד המגן האישי', format: 'markdown' },
      { text: 'להסתמך על בדיקת הפיגום מהיום הקודם', format: 'markdown' }
    ];
  }

  private async generateSafetyCalculation(): Promise<string> {
    // Generate a safety-related calculation problem
    return 'חשב את העומס המקסימלי המותר על הפיגום...';
  }

  private async generateSafetyPlanningScenario(): Promise<string> {
    // Generate a safety planning scenario
    return 'פתח תוכנית בטיחות מקיפה לאתר בנייה חדש...';
  }

  private addMultipleChoiceEvaluation(question: Question): Question {
    return {
      ...question,
      evaluationGuidelines: {
        ...question.evaluationGuidelines,
        requiredCriteria: [
          {
            name: 'safety_protocol_understanding',
            description: 'הבנת פרוטוקולי הבטיחות הנדרשים',
            weight: 40
          },
          {
            name: 'risk_assessment',
            description: 'זיהוי והערכת סיכונים נכונה',
            weight: 30
          },
          {
            name: 'ppe_knowledge',
            description: 'ידע בציוד מגן אישי',
            weight: 30
          }
        ]
      }
    };
  }

  private addNumericalEvaluation(question: Question): Question {
    return {
      ...question,
      evaluationGuidelines: {
        ...question.evaluationGuidelines,
        requiredCriteria: [
          {
            name: 'calculation_accuracy',
            description: 'דיוק בחישובי בטיחות',
            weight: 40
          },
          {
            name: 'safety_factor_understanding',
            description: 'הבנת מקדמי בטיחות',
            weight: 30
          },
          {
            name: 'units_and_standards',
            description: 'שימוש נכון ביחידות ותקנים',
            weight: 30
          }
        ]
      }
    };
  }

  private addOpenEvaluation(question: Question): Question {
    return {
      ...question,
      evaluationGuidelines: {
        ...question.evaluationGuidelines,
        requiredCriteria: [
          {
            name: 'safety_plan_completeness',
            description: 'שלמות תוכנית הבטיחות',
            weight: 30
          },
          {
            name: 'risk_assessment_quality',
            description: 'איכות הערכת הסיכונים',
            weight: 30
          },
          {
            name: 'practical_implementation',
            description: 'ישימות התוכנית בשטח',
            weight: 20
          },
          {
            name: 'regulatory_compliance',
            description: 'עמידה בתקנות ותקנים',
            weight: 20
          }
        ]
      }
    };
  }
} 