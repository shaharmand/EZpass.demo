import OpenAI from 'openai';
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { questionSchema } from "../../schemas/questionSchema";
import { QuestionPromptBuilder, QuestionPromptParams } from './prompts/QuestionPromptBuilder';
import { 
  Question, 
  QuestionType, 
  QuestionFetchParams, 
  DifficultyLevel, 
  SourceType, 
  EzpassCreatorType,
  PublicationStatusEnum,
  EMPTY_EVALUATION_GUIDELINES,
  FinalAnswerType,
  AnswerFormatRequirements,
  FullAnswer
} from "../../types/question";
import { BaseOpenAIQuestionResponse } from "../../types/questionGeneration";
import { universalTopics, universalTopicsV2 } from "../universalTopics";
import type { Domain, Topic } from "../../types/subject";
import { logger } from '../../utils/logger';
import { CRITICAL_SECTIONS } from '../../utils/logger';
import { buildQuestionSystemMessage } from './aiSystemMessages';
import { questionStorage } from '../admin/questionStorage';
import { ExamType } from '../../types/examTemplate';
import { generateQuestionId } from '../../utils/idGenerator';
import { ReviewStatusEnum, ValidationStatus } from '../../types/question';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export class QuestionService {
  private llm: OpenAI;
  private parser: StructuredOutputParser<typeof questionSchema>;
  private requestTracker = {
    total: 0,
    success: 0,
    failures: 0,
    lastRequest: 0,
    rateLimitHits: 0
  };

  private readonly RATE_LIMITS = {
    requestsPerMinute: 20,
    cooldownPeriod: 60000, // 1 minute in milliseconds
    maxConsecutiveFailures: 3
  };

  // Cache only for questions generated in current session
  private generationCache: Map<string, Question> = new Map();

  constructor() {
    this.llm = openai;
    this.parser = StructuredOutputParser.fromZodSchema(questionSchema);
  }

  private checkRateLimits(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.requestTracker.lastRequest;

    // If we've hit rate limits recently, enforce a cooldown
    if (this.requestTracker.rateLimitHits > 0) {
      if (timeSinceLastRequest < this.RATE_LIMITS.cooldownPeriod) {
        return false;
      }
      // Reset rate limit counter after cooldown
      this.requestTracker.rateLimitHits = 0;
    }

    // Check if we're within the requests per minute limit
    if (this.requestTracker.total >= this.RATE_LIMITS.requestsPerMinute) {
      if (timeSinceLastRequest < this.RATE_LIMITS.cooldownPeriod) {
        this.requestTracker.rateLimitHits++;
        return false;
      }
      // Reset counter after cooldown
      this.requestTracker.total = 0;
    }

    return true;
  }

  private updateRequestTracker(success: boolean, is429Error: boolean = false) {
    this.requestTracker.total++;
    this.requestTracker.lastRequest = Date.now();

    if (success) {
      this.requestTracker.success++;
      this.requestTracker.failures = 0; // Reset consecutive failures
    } else {
      this.requestTracker.failures++;
      if (is429Error) {
        this.requestTracker.rateLimitHits++;
      }
    }

    // Log if we're approaching limits
    if (this.requestTracker.total > this.RATE_LIMITS.requestsPerMinute * 0.8) {
      console.warn('Approaching rate limit:', {
        total: this.requestTracker.total,
        limit: this.RATE_LIMITS.requestsPerMinute
      });
    }
  }

  private async buildPrompt(params: QuestionFetchParams, metadataRequirements: string): Promise<string> {
    const formatInstructions = await this.parser.getFormatInstructions();
    
    // Get available domains and topics for the subject
    const subject = await universalTopics.getSubjectForTopic(params.topic);
    if (!subject) {
      throw new Error(`Subject not found for topic ${params.topic}`);
    }

    const domain = subject.domains.find((d: Domain) => 
      d.topics.some((t: Topic) => t.id === params.topic)
    );
    if (!domain) {
      throw new Error(`Domain not found for topic ${params.topic}`);
    }

    // Build available options string
    const availableOptions = `
AVAILABLE DOMAINS AND TOPICS:
Subject: ${subject.name} (${subject.id})
Domain: ${domain.name} (${domain.id})
Topic: ${params.topic}
Available Topics in this Domain:
${domain.topics.map((t: Topic) => `- ${t.name} (${t.id})`).join('\n')}

IMPORTANT: Use these exact IDs in your response:
- subjectId: "${subject.id}"
- domainId: "${domain.id}"
- topicId: "${params.topic}"
`;

    return `Generate a ${params.type} question in ${params.subject} for ${params.educationType} students.

${availableOptions}

METADATA REQUIREMENTS:
The metadata object MUST follow this exact structure:
{
  "metadata": {
    "subjectId": "${params.subject}",
    "domainId": "${domain.id}",
    "topicId": "${params.topic}",
    "subtopicId": "${params.subtopic || ''}",
    "type": "${params.type}",
    "difficulty": ${params.difficulty},  // Must be a number: 1, 2, 3, 4, or 5
    "estimatedTime": 10,
    "answerFormat": {
      "format": "markdown",
      "requirements": {
        "maxLength": 1000,
        "minLength": 50
      }
    },
    "source": {
      "type": "ezpass",
      "creatorType": "ai"
    }
  }
}

IMPORTANT: 
- ALL fields shown above are REQUIRED and must be included exactly as shown
- The difficulty field MUST be a number (1, 2, 3, 4, or 5), not a string
- Use the exact domainId from the available options section (e.g., "construction_safety" not "SAF")

LANGUAGE REQUIREMENTS:
- Generate ALL content in Hebrew (עברית)
- Question text must be in Hebrew
- Options must be in Hebrew
- Solution explanation must be in Hebrew
- Keep mathematical terms and symbols in English/LaTeX
- Text direction should be RTL (right-to-left)
- For math formulas:
  - Use $...$ for inline math
  - Use $$...$$ for display math (centered)
  - NEVER include Hebrew text inside math delimiters
  - Use English/Latin characters for variables
  - Write units in Hebrew OUTSIDE the math delimiters
  - Basic LaTeX commands:
    - Fractions: \frac{a}{b}
    - Square root: \sqrt{x}
    - Powers: x^2 or x_n
    - Greek letters: \alpha, \beta, \theta
    
  CRITICAL RULES FOR HEBREW AND MATH:
  1. NEVER put Hebrew text inside $...$ or $$...$$
  2. NEVER use \text{} with Hebrew inside math
  3. Write all units in Hebrew AFTER the math block
  4. Use English subscripts for variables
  
  EXAMPLES:
  ❌ WRONG: $v_{סופי}$ - Hebrew subscript inside math
  ✅ RIGHT: $v_{final}$ (מהירות סופית)
  
  ❌ WRONG: $$F = ma \text{ניוטון}$$ - Hebrew unit inside math
  ✅ RIGHT: $$F = ma$$ ניוטון
  
  ❌ WRONG: $\text{מהירות} = v$ - Hebrew text inside math
  ✅ RIGHT: מהירות = $v$
  
  ❌ WRONG: $$\frac{\text{כוח}}{\text{שטח}}$$ - Hebrew fractions
  ✅ RIGHT: יחס בין כוח לשטח: $$\frac{F}{A}$$

DIFFICULTY LEVEL SCALE:
1 (קל מאוד): Basic concept, single step
2 (קל): Simple problem, 2 steps
3 (בינוני): Multiple concepts, 3-4 steps
4 (קשה): Complex analysis, multiple approaches
5 (קשה מאוד): Advanced integration of concepts

${params.type === QuestionType.MULTIPLE_CHOICE ? `
MULTIPLE CHOICE QUESTION REQUIREMENTS:

1. Question Content:
   - Clear, unambiguous question text in Hebrew
   - All necessary information included
   - No trick questions or misleading wording
   - Use markdown for formatting
   - For math: use LaTeX notation within $$ markers
   - Text should be RTL (right-to-left)

2. Options Structure (CRITICAL):
   - You MUST include exactly 4 options in the content.options array
   - Each option MUST have this exact structure:
     {
       "text": "Option text in Hebrew",
       "format": "markdown"
     }
   - Example of correct options structure:
     "options": [
       { "text": "תשובה א", "format": "markdown" },
       { "text": "תשובה ב", "format": "markdown" },
       { "text": "תשובה ג", "format": "markdown" },
       { "text": "תשובה ד", "format": "markdown" }
     ]

3. Final Answer Structure (CRITICAL):
   - You MUST include a finalAnswer in schoolAnswer with this exact structure:
     {
       "type": "multiple_choice",
       "value": 1  // Must be 1, 2, 3, or 4 indicating the correct option
     }
   - Example of correct finalAnswer:
     "finalAnswer": {
       "type": "multiple_choice",
       "value": 2
     }

4. Solution:
   - Explain why the correct answer is right (in Hebrew)
   - Point out why other options are incorrect
   - Include complete solution process
   - Highlight common misconceptions

5. Complete Example Structure:
{
  "content": {
    "text": "שאלת הבחירה שלך",
    "format": "markdown",
    "options": [
      { "text": "תשובה א", "format": "markdown" },
      { "text": "תשובה ב", "format": "markdown" },
      { "text": "תשובה ג", "format": "markdown" },
      { "text": "תשובה ד", "format": "markdown" }
    ]
  },
  "schoolAnswer": {
    "finalAnswer": {
      "type": "multiple_choice",
      "value": 2
    },
    "solution": {
      "text": "הסבר מפורט למה תשובה ב נכונה",
      "format": "markdown"
    }
  }
}
` : params.type === QuestionType.OPEN ? `
OPEN QUESTION REQUIREMENTS:

1. Question Content:
   - Clear, focused problem statement in Hebrew
   - All necessary context provided
   - Specific deliverables required
   - Use markdown for formatting
   - For math: use LaTeX notation

2. Structure:
   - Break down into sub-questions if needed
   - Clear evaluation criteria
   - Word/length guidelines if applicable

3. Solution:
   - Comprehensive model answer in Hebrew
   - Multiple valid approaches if applicable
   - Evaluation rubric/criteria
   - Common mistakes to avoid
` : params.type === QuestionType.NUMERICAL ? `
NUMERICAL QUESTION REQUIREMENTS:

1. Question Content:
   - Mathematical/physical problem requiring numerical or formula solution in Hebrew
   - Clear progression from given values to final answer
   - All equations, units and constants provided upfront
   - Use LaTeX notation for math formulas:
     - Display equations: $$\begin{align*} F_{max} &= \frac{W}{FS} \end{align*}$$
     - Inline equations: כאשר $F_{max}$ הוא הכוח המקסימלי
   - Include diagrams/figures when relevant

2. Structure:
   - Break down complex calculation into clear steps
   - Each step yields intermediate numerical result
   - Show units and significant figures
   - Guide student through mathematical reasoning
   - Provide validation checks for intermediate results

3. Solution:
   - Complete step-by-step calculation in Hebrew
   - Show all mathematical work and unit conversions
   - Explain each mathematical operation and formula used
   - Include numerical answer with correct units
   - Common calculation mistakes to watch for
` : ''}

EVALUATION FORMAT AND CRITERIA:

1. Common Evaluation Structure:
   {
     "evaluationGuidelines": {
       "requiredCriteria": [
         {
           "name": string,        // Unique identifier for the criterion
           "description": string, // Clear description in Hebrew
           "weight": number       // Must sum to 100
         }
       ]
     }
   }

2. Type-Specific Criteria:

   A. Multiple Choice Questions:
      {
        "requiredCriteria": [
          {
            "name": "correct_answer",
            "description": "בחירת התשובה הנכונה",
            "weight": 50
          },
          {
            "name": "explanation_quality",
            "description": "איכות ההסבר - כולל התייחסות לפרוטוקולי בטיחות, הערכת סיכונים והסבר למה התשובות האחרות שגויות",
            "weight": 50
          }
        ]
      }

   B. Open Questions:
      {
        "requiredCriteria": [
          {
            "name": "completeness",
            "description": "כיסוי מלא של כל שלבי התהליך",
            "weight": 30
          },
          {
            "name": "accuracy",
            "description": "דיוק במידע והתאמה לתקנים",
            "weight": 30
          },
          {
            "name": "organization",
            "description": "מבנה ברור ומסודר",
            "weight": 20
          },
          {
            "name": "practicality",
            "description": "יישומיות והתאמה לשטח",
            "weight": 20
          }
        ]
      }

   C. Numerical Questions:
      {
        "requiredCriteria": [
          {
            "name": "calculation_accuracy",
            "description": "דיוק בחישובים",
            "weight": 40
          },
          {
            "name": "solution_steps",
            "description": "שלבי הפתרון והסבר",
            "weight": 30
          },
          {
            "name": "units_and_format",
            "description": "שימוש נכון ביחידות ופורמט",
            "weight": 30
          }
        ]
      }

3. Evaluation Guidelines:
   - All criteria must have clear, specific descriptions in Hebrew
   - Weights must sum to 100
   - Each criterion should be measurable and objective
   - Descriptions should guide both students and evaluators
   - Include specific requirements for each criterion

4. Common Requirements:
   - All text must be in Hebrew
   - Use markdown formatting for descriptions
   - Keep mathematical terms in English/LaTeX
   - Ensure criteria are aligned with question difficulty
   - Make criteria specific to the subject matter

SCHEMA VALIDATION REQUIREMENTS:
${formatInstructions}

COMPLETE QUESTION STRUCTURE REQUIRED:

CRITICAL: Return ONLY the raw JSON object. Do NOT wrap it in markdown code blocks or any other formatting.

Return EXACTLY this structure:
{
  "id": "CIVIL-construction_safety-000001",
  "name": "שאלה על ניהול בטיחות",
  "type": "${params.type}",
  "content": {
    "text": "Your question text here",
    "format": "markdown",
    "options": ${params.type === QuestionType.MULTIPLE_CHOICE ? `[
      { "text": "תשובה א", "format": "markdown" },
      { "text": "תשובה ב", "format": "markdown" },
      { "text": "תשובה ג", "format": "markdown" },
      { "text": "תשובה ד", "format": "markdown" }
    ]` : '[]'}  // Only for multiple_choice type
  },
  "metadata": {
    "subjectId": "civil_engineering",
    "domainId": "construction_safety",
    "topicId": "safety_management_fundamentals",
    "subtopicId": "work_inspection_service",
    "type": "${params.type}",
    "difficulty": 2,
    "estimatedTime": 10,
    "answerFormat": {
      "hasFinalAnswer": ${params.type !== QuestionType.OPEN},
      "finalAnswerType": "${params.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' : params.type === QuestionType.NUMERICAL ? 'numerical' : 'none'}",
      "requiresSolution": true
    },
    "source": {
      "type": "ezpass",
      "creatorType": "ai"
    }
  },
  "schoolAnswer": {
    "finalAnswer": ${params.type === QuestionType.MULTIPLE_CHOICE ? `{
      "type": "multiple_choice",
      "value": 2
    }` : params.type === QuestionType.NUMERICAL ? `{
      "type": "numerical",
      "value": 0,
      "tolerance": 0,
      "unit": "יחידות"
    }` : 'null'},  // Only for multiple_choice and numerical types
    "solution": {
      "text": "Step by step solution here",
      "format": "markdown"
    }
  },
  "evaluationGuidelines": {
    "requiredCriteria": ${params.type === QuestionType.MULTIPLE_CHOICE ? `[
      {
        "name": "correct_answer",
        "description": "בחירת התשובה הנכונה",
        "weight": 50
      },
      {
        "name": "explanation_quality",
        "description": "איכות ההסבר - כולל התייחסות לפרוטוקולי בטיחות, הערכת סיכונים והסבר למה התשובות האחרות שגויות",
        "weight": 50
      }
    ]` : params.type === QuestionType.NUMERICAL ? `[
      {
        "name": "calculation_accuracy",
        "description": "דיוק בחישובים",
        "weight": 40
      },
      {
        "name": "solution_steps",
        "description": "שלבי הפתרון והסבר",
        "weight": 30
      },
      {
        "name": "units_and_format",
        "description": "שימוש נכון ביחידות ופורמט",
        "weight": 30
      }
    ]` : `[
      {
        "name": "completeness",
        "description": "כיסוי מלא של כל שלבי התהליך",
        "weight": 30
      },
      {
        "name": "accuracy",
        "description": "דיוק במידע והתאמה לתקנים",
        "weight": 30
      },
      {
        "name": "organization",
        "description": "מבנה ברור ומסודר",
        "weight": 20
      },
      {
        "name": "practicality",
        "description": "יישומיות והתאמה לשטח",
        "weight": 20
      }
    ]`}
  }
}

CRITICAL REQUIREMENTS:
1. Return ALL fields shown in the structure above
2. Content requirements:
   - All text content MUST be in Hebrew
   - Use markdown formatting for text
   - Use LaTeX for mathematical expressions
   - Question text must be clear and unambiguous
   - Solution must be detailed and explain the reasoning

3. Format requirements:
   - All text fields must have "format": "markdown"
   - Use $...$ for inline math
   - Use $$...$$ for display math
   - Keep mathematical terms in English/LaTeX
   - Write units in Hebrew outside math delimiters

4. For multiple choice questions:
   - Set type to "multiple_choice"
   - Include exactly 4 options in content.options
   - Set finalAnswer with type "multiple_choice" and value 1-4
   - Set answerFormat.hasFinalAnswer to true
   - Set answerFormat.finalAnswerType to "multiple_choice"

5. For numerical questions:
   - Set type to "numerical"
   - Set finalAnswer with type "numerical", value, and tolerance
   - Set answerFormat.hasFinalAnswer to true
   - Set answerFormat.finalAnswerType to "numerical"
   - Include appropriate units in the finalAnswer
   - Show all calculations in the solution

6. For open questions:
   - Set type to "open"
   - Set finalAnswer to null
   - Set answerFormat.hasFinalAnswer to false
   - Set answerFormat.finalAnswerType to "none"

7. Evaluation Criteria:
   Each question type MUST include the following evaluation criteria with exact weights:

   A. Multiple Choice Questions:
      {
        "requiredCriteria": [
          {
            "name": "correct_answer",
            "description": "בחירת התשובה הנכונה",
            "weight": 50
          },
          {
            "name": "explanation_quality",
            "description": "איכות ההסבר - כולל התייחסות לפרוטוקולי בטיחות, הערכת סיכונים והסבר למה התשובות האחרות שגויות",
            "weight": 50
          }
        ]
      }

   B. Numerical Questions:
      {
        "requiredCriteria": [
          {
            "name": "calculation_accuracy",
            "description": "דיוק בחישובים",
            "weight": 40
          },
          {
            "name": "solution_steps",
            "description": "שלבי הפתרון והסבר",
            "weight": 30
          },
          {
            "name": "units_and_format",
            "description": "שימוש נכון ביחידות ופורמט",
            "weight": 30
          }
        ]
      }

   C. Open Questions:
      {
        "requiredCriteria": [
          {
            "name": "completeness",
            "description": "כיסוי מלא של כל שלבי התהליך",
            "weight": 30
          },
          {
            "name": "accuracy",
            "description": "דיוק במידע והתאמה לתקנים",
            "weight": 30
          },
          {
            "name": "organization",
            "description": "מבנה ברור ומסודר",
            "weight": 20
          },
          {
            "name": "practicality",
            "description": "יישומיות והתאמה לשטח",
            "weight": 20
          }
        ]
      }

CRITICAL: The weights in each question type's evaluation criteria MUST sum to exactly 100%.

${params.type === QuestionType.MULTIPLE_CHOICE ? `
EXAMPLE OF CORRECT MULTIPLE CHOICE QUESTION:
{
  "id": "CIVIL-construction_safety-000001",
  "name": "בחירת ציוד מגן אישי",
  "type": "multiple_choice",
  "content": {
    "text": "איזה ציוד מגן אישי חובה להשתמש בו בעת עבודה בגובה של מעל 2 מטר?",
    "format": "markdown",
    "options": [
      { "text": "קסדה, נעלי בטיחות וחגורת בטיחות", "format": "markdown" },
      { "text": "קסדה ונעלי בטיחות בלבד", "format": "markdown" },
      { "text": "חגורת בטיחות בלבד", "format": "markdown" },
      { "text": "קסדה וחגורת בטיחות בלבד", "format": "markdown" }
    ]
  },
  "metadata": {
    "subjectId": "civil_engineering",
    "domainId": "construction_safety",
    "topicId": "safety_management_fundamentals",
    "subtopicId": "work_inspection_service",
    "type": "multiple_choice",
    "difficulty": 2,
    "estimatedTime": 5,
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
      "value": 1
    },
    "solution": {
      "text": "התשובה הנכונה היא א' - קסדה, נעלי בטיחות וחגורת בטיחות.\n\n**הסבר:**\n1. **קסדה** - חובה להגנה מפני נפילת חפצים\n2. **נעלי בטיחות** - חובה להגנה מפני פציעות רגליים\n3. **חגורת בטיחות** - חובה בעבודה בגובה מעל 2 מטר\n\n**למה התשובות האחרות שגויות:**\n- ב' - חסרה חגורת בטיחות שהיא חובה בגובה\n- ג' - חסרים קסדה ונעלי בטיחות שהינם חובה בכל עבודה\n- ד' - חסרות נעלי בטיחות שהינן חובה בכל עבודה",
      "format": "markdown"
    }
  },
  "evaluationGuidelines": {
    "requiredCriteria": [
      {
        "name": "correct_answer",
        "description": "בחירת התשובה הנכונה",
        "weight": 50
      },
      {
        "name": "explanation_quality",
        "description": "איכות ההסבר - כולל התייחסות לפרוטוקולי בטיחות, הערכת סיכונים והסבר למה התשובות האחרות שגויות",
        "weight": 50
      }
    ]
  }
}` : params.type === QuestionType.NUMERICAL ? `
EXAMPLE OF CORRECT NUMERICAL QUESTION:
{
  "id": "CIVIL-construction_safety-000001",
  "name": "חישוב עומס מקסימלי על פיגום",
  "type": "numerical",
  "content": {
    "text": "חשב את העומס המקסימלי המותר על פיגום בגובה 10 מטר, אם:\n- משקל הפיגום עצמו: 500 ק\"ג\n- פקטור בטיחות נדרש: 4\n- שטח הפיגום: 20 מ\"ר\n\nהשתמש בנוסחה: $$F_{max} = \\frac{W}{FS \\cdot A}$$ כאשר:\n- $F_{max}$ הוא העומס המקסימלי המותר\n- $W$ הוא המשקל הכולל\n- $FS$ הוא פקטור הבטיחות\n- $A$ הוא שטח הפיגום",
    "format": "markdown",
    "options": []
  },
  "metadata": {
    "subjectId": "civil_engineering",
    "domainId": "construction_safety",
    "topicId": "safety_management_fundamentals",
    "subtopicId": "work_inspection_service",
    "type": "numerical",
    "difficulty": 3,
    "estimatedTime": 10,
    "answerFormat": {
      "hasFinalAnswer": true,
      "finalAnswerType": "numerical",
      "requiresSolution": true
    },
    "source": {
      "type": "ezpass",
      "creatorType": "ai"
    }
  },
  "schoolAnswer": {
    "finalAnswer": {
      "type": "numerical",
      "value": 61.25,
      "tolerance": 0.01,
      "unit": "ק\"ג/מ\"ר"
    },
    "solution": {
      "text": "פתרון:\n\n1. **חישוב משקל כולל**\n   $$W = 500$$ ק\"ג\n\n2. **חישוב עומס מקסימלי**\n   $$F_{max} = \\frac{W}{FS \\cdot A} = \\frac{500}{4 \\cdot 20} = 6.25$$ ק\"ג/מ\"ר\n\n3. **הסבר**\n   - משקל הפיגום: 500 ק\"ג\n   - פקטור בטיחות: 4\n   - שטח הפיגום: 20 מ\"ר\n   - העומס המקסימלי המותר: 6.25 ק\"ג/מ\"ר\n\n4. **בדיקות**\n   - העומס נמוך מהמשקל הכולל (בטיחותי)\n   - התוצאה הגיונית ביחס למשקל ושטח\n   - היחידות נכונות (ק\"ג/מ\"ר)",
      "format": "markdown"
    }
  },
  "evaluationGuidelines": {
    "requiredCriteria": [
      {
        "name": "calculation_accuracy",
        "description": "דיוק בחישובים",
        "weight": 40
      },
      {
        "name": "solution_steps",
        "description": "שלבי הפתרון והסבר",
        "weight": 30
      },
      {
        "name": "units_and_format",
        "description": "שימוש נכון ביחידות ופורמט",
        "weight": 30
      }
    ]
  }
}` : `
EXAMPLE OF CORRECT OPEN QUESTION:
{
  "id": "CIVIL-construction_safety-000001",
  "name": "תכנון מערכת בטיחות באתר בנייה",
  "type": "open",
  "content": {
    "text": "תכנן מערכת בטיחות מקיפה לאתר בנייה חדש, כולל:\n\n1. זיהוי והערכת סיכונים\n2. תכנון מערכת בטיחות\n3. תכנון מערכת חירום\n4. תכנון מערכת הדרכה\n\nיש לכלול:\n- תיאור מפורט של כל שלב\n- רשימת ציוד נדרש\n- רשימת מסמכים נדרשים\n- לוח זמנים לביצוע\n- תקציב משוער",
    "format": "markdown",
    "options": []
  },
  "metadata": {
    "subjectId": "civil_engineering",
    "domainId": "construction_safety",
    "topicId": "safety_management_fundamentals",
    "subtopicId": "work_inspection_service",
    "type": "open",
    "difficulty": 4,
    "estimatedTime": 30,
    "answerFormat": {
      "hasFinalAnswer": false,
      "finalAnswerType": "none",
      "requiresSolution": true
    },
    "source": {
      "type": "ezpass",
      "creatorType": "ai"
    }
  },
  "schoolAnswer": {
    "finalAnswer": null,
    "solution": {
      "text": "תכנון מערכת בטיחות מקיפה לאתר בנייה:\n\n## 1. זיהוי והערכת סיכונים\n\n### שלבי התהליך\n1. **סקירה מקדימה**\n   - איסוף מידע על האתר והעבודות המתוכננות\n   - בחינת תיעוד קודם של תאונות ותקריות\n   - זיהוי גורמי סיכון פוטנציאליים\n\n2. **זיהוי סיכונים**\n   - סיור מקיף באתר\n   - זיהוי סכנות פיזיות, כימיות, ביולוגיות ופסיכולוגיות\n   - תיעוד מפורט של כל הסיכונים שזוהו\n\n### ציוד נדרש\n- מצלמה דיגיטלית\n- טאבלט/מחשב נייד\n- טפסי הערכת סיכונים\n- מכשירי מדידה\n\n### מסמכים נדרשים\n- תוכנית האתר\n- רישיון בנייה\n- תיעוד תאונות קודמות\n- תקנים רלוונטיים\n\n## 2. תכנון מערכת בטיחות\n\n### שלבי התהליך\n1. **תכנון פיזי**\n   - סימון אזורים מסוכנים\n   - תכנון דרכי גישה\n   - תכנון מערכת תאורה\n\n2. **תכנון ציוד**\n   - רשימת ציוד מגן אישי\n   - רשימת ציוד בטיחות\n   - רשימת ציוד חירום\n\n### ציוד נדרש\n- ציוד מגן אישי\n- ציוד בטיחות\n- ציוד חירום\n\n### מסמכים נדרשים\n- תוכנית בטיחות\n- רשימת ציוד\n- תוכנית תחזוקה\n\n## 3. תכנון מערכת חירום\n\n### שלבי התהליך\n1. **תכנון תגובה**\n   - זיהוי תרחישי חירום\n   - תכנון תגובה לכל תרחיש\n   - הכנת תוכנית פינוי\n\n2. **תכנון תקשורת**\n   - מערכת התראה\n   - מערכת תקשורת\n   - רשימת אנשי קשר\n\n### ציוד נדרש\n- מערכת התראה\n- מערכת תקשורת\n- ציוד חירום\n\n### מסמכים נדרשים\n- תוכנית חירום\n- רשימת אנשי קשר\n- תוכנית פינוי\n\n## 4. תכנון מערכת הדרכה\n\n### שלבי התהליך\n1. **תכנון תוכן**\n   - זיהוי נושאי הדרכה\n   - הכנת חומרי הדרכה\n   - תכנון תרגולים\n\n2. **תכנון לוח זמנים**\n   - תאריכי הדרכות\n   - משך כל הדרכה\n   - תדירות הדרכות\n\n### ציוד נדרש\n- ציוד הדרכה\n- ציוד תרגול\n- ציוד תצוגה\n\n### מסמכים נדרשים\n- תוכנית הדרכה\n- חומרי הדרכה\n- טפסי הערכה\n\n## לוח זמנים\n\n1. **חודש ראשון**\n   - זיהוי והערכת סיכונים\n   - תכנון מערכת בטיחות\n\n2. **חודש שני**\n   - תכנון מערכת חירום\n   - תכנון מערכת הדרכה\n\n3. **חודש שלישי**\n   - ביצוע הדרכות\n   - הפעלת המערכת\n\n## תקציב משוער\n\n1. **ציוד**\n   - ציוד מגן אישי: 50,000 ₪\n   - ציוד בטיחות: 100,000 ₪\n   - ציוד חירום: 30,000 ₪\n\n2. **הדרכות**\n   - חומרי הדרכה: 20,000 ₪\n   - מדריכים: 40,000 ₪\n   - תרגולים: 30,000 ₪\n\n3. **תחזוקה**\n   - תחזוקה חודשית: 10,000 ₪\n   - החלפת ציוד: 20,000 ₪\n\n**סה\"כ תקציב משוער: 300,000 ₪**",
      "format": "markdown"
    }
  },
  "evaluationGuidelines": {
    "requiredCriteria": [
      {
        "name": "completeness",
        "description": "כיסוי מלא של כל שלבי התהליך",
        "weight": 30
      },
      {
        "name": "accuracy",
        "description": "דיוק במידע והתאמה לתקנים",
        "weight": 30
      },
      {
        "name": "organization",
        "description": "מבנה ברור ומסודר",
        "weight": 20
      },
      {
        "name": "practicality",
        "description": "יישומיות והתאמה לשטח",
        "weight": 20
      }
    ]
  }
}`}
`;
  }

  private async generateQuestionId(subjectId: string, domainId: string): Promise<string> {
    // Get next available number from storage
    const nextNumber = await questionStorage.getNextQuestionId(subjectId, domainId);
    
    // Format the ID: XXX-YYY-NNNNNN
    return `${subjectId}-${domainId}-${String(nextNumber).padStart(6, '0')}`;
  }

  async generateQuestion(params: QuestionPromptParams): Promise<Question> {
    try {
      // Build the complete prompt using our component system
      const promptBuilder = new QuestionPromptBuilder(params);
      const prompt = promptBuilder.build();
      
      // Get format instructions for the parser
      const formatInstructions = await this.parser.getFormatInstructions();

      // Log the full prompt for debugging
      logger.debug('Full generation prompt:', prompt);

      // Generate the question
      const response = await this.llm.chat.completions.create({
        model: 'gpt-4-0125-preview',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: formatInstructions
          }
        ],
        temperature: 0.7
      });

      // Parse and validate the response
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse the response into our Question type
      const parsedQuestion = await this.parser.parse(content);

      // Ensure the metadata has the required answerFormat and source
      const questionWithFormat = {
        ...parsedQuestion,
        metadata: {
          ...parsedQuestion.metadata,
          answerFormat: {
            hasFinalAnswer: params.type !== QuestionType.OPEN,
            finalAnswerType: params.type === QuestionType.MULTIPLE_CHOICE ? ('multiple_choice' as const) : 
                           params.type === QuestionType.NUMERICAL ? ('numerical' as const) : ('none' as const),
            requiresSolution: true
          },
          source: {
            type: 'ezpass' as const,
            creatorType: 'ai' as EzpassCreatorType
          }
        },
        evaluationGuidelines: {
          requiredCriteria: [],
          optionalCriteria: [],
          scoringMethod: 'sum',
          maxScore: params.totalPoints || 100
        }
      };

      // Create the question in storage
      const createdQuestion = await questionStorage.createQuestion({
        question: questionWithFormat,
        import_info: {
          system: 'ezpass',
          originalId: questionWithFormat.id,
          importedAt: new Date().toISOString()
        }
      });

      return createdQuestion;
    } catch (error) {
      logger.error('Error generating question:', error);
      throw error;
    }
  }
}

export const questionService = new QuestionService(); 