import { Question, QuestionMetadata, QuestionType, EzpassCreatorType } from '../../../../types/question';
import { QuestionGenerationParams } from '../../../../types/questionGeneration';
import { AbstractTypeGenerator } from './AbstractTypeGenerator';
import { questionGenerationService } from '../../../llm/QuestionGenerationV2';
import { ExamType } from '../../../../types/examTemplate';

export class MultipleChoiceGenerator extends AbstractTypeGenerator {
  async generateQuestion(metadata: QuestionMetadata): Promise<Question> {
    const prompt = this.getBasePrompt(metadata);
    const params: QuestionGenerationParams = {
      type: QuestionType.MULTIPLE_CHOICE,
      prompt,
      subjectId: metadata.subjectId,
      domainId: metadata.domainId,
      topicId: metadata.topicId,
      subtopicId: metadata.subtopicId,
      difficulty: metadata.difficulty,
      estimatedTime: metadata.estimatedTime,
      answerFormat: {
        hasFinalAnswer: true,
        finalAnswerType: 'multiple_choice',
        requiresSolution: true
      },
      source: {
        type: 'ezpass',
        creatorType: 'ai'
      }
    };
    return questionGenerationService.generateQuestion(params);
  }

  getTypeSpecificPrompt(): string {
    return `
MULTIPLE CHOICE REQUIREMENTS:

1. Question Structure:
   - Clear, focused question text in Hebrew
   - Exactly 4 options
   - One definitively correct answer
   - All options in Hebrew

2. Option Requirements:
   - Similar length options
   - No obviously wrong answers
   - No "all/none of the above"
   - Consistent grammar/structure
   - Each option must be plausible

3. Solution Requirements:
   - Explain why correct answer is right
   - Explain why other options are wrong
   - Include relevant safety regulations/standards
   - Reference specific procedures when applicable`;
  }

  getExampleQuestions(): string {
    return `
EXAMPLE 1:
{
  "content": {
    "text": "מהם אמצעי הבטיחות הנדרשים בעבודה בגובה מעל 2 מטרים?",
    "options": [
      { "text": "קסדה ונעלי בטיחות בלבד", "format": "markdown" },
      { "text": "רתמת בטיחות, קסדה ונעלי בטיחות", "format": "markdown" },
      { "text": "רתמת בטיחות בלבד", "format": "markdown" },
      { "text": "כפפות עבודה וקסדה", "format": "markdown" }
    ]
  },
  "schoolAnswer": {
    "finalAnswer": {
      "type": "multiple_choice",
      "value": 2
    },
    "solution": {
      "text": "התשובה הנכונה היא ב' - נדרשים רתמת בטיחות, קסדה ונעלי בטיחות.\\n\\n**הסבר מפורט:**\\n1. רתמת בטיחות - חובה בכל עבודה בגובה למניעת נפילה\\n2. קסדה - להגנה מפני נפילת חפצים\\n3. נעלי בטיחות - להגנה על כפות הרגליים\\n\\n**למה התשובות האחרות שגויות:**\\n- א' - חסרה רתמת בטיחות שהיא קריטית לעבודה בגובה\\n- ג' - חסר ציוד מגן בסיסי (קסדה ונעליים)\\n- ד' - חסרות נעלי בטיחות וחסרה רתמה",
      "format": "markdown"
    }
  }
}

EXAMPLE 2:
{
  "content": {
    "text": "מהו הצעד הראשון שיש לבצע לפני תחילת עבודה עם פיגום?",
    "options": [
      { "text": "לוודא שיש אישור בטיחות בתוקף לפיגום", "format": "markdown" },
      { "text": "לעלות על הפיגום ולבדוק את יציבותו", "format": "markdown" },
      { "text": "להתחיל בעבודה מיד כדי לחסוך זמן", "format": "markdown" },
      { "text": "לבדוק רק את ציוד המגן האישי", "format": "markdown" }
    ]
  },
  "schoolAnswer": {
    "finalAnswer": {
      "type": "multiple_choice",
      "value": 1
    },
    "solution": {
      "text": "התשובה הנכונה היא א' - יש לוודא שיש אישור בטיחות בתוקף לפיגום.\\n\\n**הסבר מפורט:**\\nלפי תקנות הבטיחות בעבודה, חובה לוודא שהפיגום נבדק ואושר על ידי בודק מוסמך. האישור צריך להיות בתוקף ונגיש באתר.\\n\\n**למה התשובות האחרות שגויות:**\\n- ב' - מסוכן לעלות על פיגום לפני אישור בטיחות\\n- ג' - התעלמות מנהלי בטיחות מסכנת חיים\\n- ד' - בדיקת ציוד אישי חשובה אך לא מספיקה",
      "format": "markdown"
    }
  }
}`;
  }

  getTypeCriteria(): Array<{ name: string; description: string; weight: number }> {
    return [
      {
        name: 'correct_answer',
        description: 'בחירת התשובה הנכונה',
        weight: 40
      },
      {
        name: 'understanding',
        description: 'הבנת עקרונות הבטיחות והנהלים',
        weight: 30
      },
      {
        name: 'explanation',
        description: 'הסבר מפורט למה התשובה נכונה ואחרות שגויות',
        weight: 30
      }
    ];
  }
} 