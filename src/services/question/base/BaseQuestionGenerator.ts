import { Question, QuestionType, SourceType, EzpassCreatorType, DifficultyLevel } from '../../../types/question';
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { questionSchema } from "../../../schemas/questionSchema";
import { logger } from '../../../utils/logger';

/**
 * Base generator that ensures LLM understands our complete question format.
 * This serves as foundation for question generation, enrichment, and variants.
 */
export class BaseQuestionGenerator {
  private parser: StructuredOutputParser<typeof questionSchema>;

  constructor() {
    this.parser = StructuredOutputParser.fromZodSchema(questionSchema);
  }

  /**
   * Generate a complete question with all required fields
   */
  protected async generateCompleteQuestion(prompt: string): Promise<Question> {
    try {
      // Get format instructions for the parser
      const formatInstructions = await this.parser.getFormatInstructions();

      // Combine with our base format requirements
      const fullPrompt = `${this.getBaseFormatInstructions()}

${formatInstructions}

${prompt}`;

      // TODO: Call LLM with prompt
      // const response = await this.llm.call(fullPrompt);
      // const question = await this.parser.parse(response);

      // For now, return a mock question
      return this.createMockQuestion();
    } catch (error) {
      logger.error('Failed to generate question', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Base format instructions that every question must follow
   */
  protected getBaseFormatInstructions(): string {
    return `
Generate a complete question following these CRITICAL requirements:

1. Question Structure:
   - Must have clear, focused content
   - Must be in Hebrew (עברית)
   - Must include all metadata fields
   - Must have evaluation guidelines

2. Required Fields:
   - id: Will be set by system
   - name: Short descriptive title
   - type: multiple_choice/numerical/open
   - content: Question text and format
   - metadata: All fields below
   - schoolAnswer: Complete solution
   - evaluationGuidelines: Scoring criteria

3. Metadata Requirements:
   - subjectId: Domain identifier
   - domainId: Specific domain
   - topicId: Specific topic
   - subtopicId: Optional subtopic
   - type: Question type
   - difficulty: 1-5 scale
   - estimatedTime: In minutes
   - answerFormat: Format requirements
   - source: Always ezpass/ai

4. Evaluation Guidelines:
   - Must have requiredCriteria
   - Each criterion needs name, description, weight
   - Weights must sum to 100
   - Must match question type

5. Answer Format:
   - multiple_choice: 4 options, one correct
   - numerical: Value, tolerance, units
   - open: Detailed solution structure

Example of correct structure:
{
  "name": "שאלה על ניהול בטיחות",
  "type": "multiple_choice",
  "content": {
    "text": "תוכן השאלה בעברית",
    "format": "markdown",
    "options": [
      { "text": "תשובה א", "format": "markdown" },
      { "text": "תשובה ב", "format": "markdown" },
      { "text": "תשובה ג", "format": "markdown" },
      { "text": "תשובה ד", "format": "markdown" }
    ]
  },
  "metadata": {
    "subjectId": "civil_engineering",
    "domainId": "construction_safety",
    "topicId": "safety_management",
    "type": "multiple_choice",
    "difficulty": 3,
    "estimatedTime": 10,
    "answerFormat": {
      "hasFinalAnswer": true,
      "finalAnswerType": "multiple_choice",
      "requiresSolution": true
    },
    "source": {
      "type": "ezpass",
      "creatorType": "ai"
    }
  },
  "schoolAnswer": {
    "finalAnswer": {
      "type": "multiple_choice",
      "value": 2
    },
    "solution": {
      "text": "הסבר מפורט בעברית",
      "format": "markdown"
    }
  },
  "evaluationGuidelines": {
    "requiredCriteria": [
      {
        "name": "understanding",
        "description": "הבנת עקרונות הבטיחות",
        "weight": 50
      },
      {
        "name": "application",
        "description": "יישום נכון של הנהלים",
        "weight": 50
      }
    ]
  }
}`;
  }

  /**
   * Create a mock question for testing
   */
  private createMockQuestion(): Question {
    return {
      id: '',
      name: 'שאלת בטיחות לדוגמה',
      content: {
        text: 'מהם אמצעי הבטיחות הנדרשים בעבודה בגובה?',
        format: 'markdown',
        options: [
          { text: 'רתמת בטיחות בלבד', format: 'markdown' },
          { text: 'קסדה ונעלי בטיחות', format: 'markdown' },
          { text: 'רתמה, קסדה ונעלי בטיחות', format: 'markdown' },
          { text: 'אין צורך באמצעי בטיחות', format: 'markdown' }
        ]
      },
      metadata: {
        type: QuestionType.MULTIPLE_CHOICE,
        subjectId: '',
        domainId: '',
        topicId: '',
        difficulty: 3,
        answerFormat: {
          hasFinalAnswer: true,
          finalAnswerType: 'multiple_choice',
          requiresSolution: true
        },
        source: {
          type: 'ezpass',
          creatorType: EzpassCreatorType.AI
        }
      },
      schoolAnswer: {
        finalAnswer: {
          type: 'multiple_choice',
          value: 3
        },
        solution: {
          text: 'בעבודה בגובה נדרש שימוש בכל אמצעי הבטיחות: רתמת בטיחות, קסדה ונעלי בטיחות',
          format: 'markdown'
        }
      },
      evaluationGuidelines: {
        requiredCriteria: [{
          name: 'basic_correctness',
          description: 'תשובה נכונה ומלאה',
          weight: 100
        }]
      }
    };
  }
} 