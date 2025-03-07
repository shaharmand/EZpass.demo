import { QuestionType } from '../../../../types/question';

export const OPEN_QUESTION_GUIDELINES = `Open Question Guidelines:
1. Purpose: Test understanding of safety procedures and protocols
2. Structure:
   - Clear, specific question name describing the safety scenario
   - Clear safety scenario or situation
   - Include relevant safety standards and regulations
   - Example:
     "תארו את הפעולות הנדרשות במקרה של דליפת חומרים מסוכנים באתר בנייה"
3. Answer Requirements:
   - Safety protocol explanation
   - Regulatory compliance
   - Risk assessment
   - Emergency response procedures` as const;

export const MULTIPLE_CHOICE_GUIDELINES = `Multiple Choice Question Guidelines:
1. Purpose: Test understanding of safety concepts and procedures
2. Structure:
   - Clear, specific question name describing the safety scenario
   - Safety scenario or situation
   - Options with different safety approaches
   - Required explanation of the chosen answer
3. Example:
   "מה הפעולה הראשונה שיש לבצע במקרה של פציעה באתר:
   א) להזעיק עזרה ראשונה
   ב) להמשיך בעבודה
   ג) להזעיק את הממונה על הבטיחות
   ד) לתעד את האירוע"
4. Evaluation Requirements:
   - Basic correctness (50%): Correct answer selection
   - Explanation quality (50%): Clear explanation of why the chosen answer is correct
   - Explanation should include:
     * Reference to safety protocols
     * Risk assessment reasoning
     * Why other options are incorrect
5. Evaluation Criteria:
   {
     "requiredCriteria": [
       {
         "name": "correct_answer",
         "weight": 50,
         "description": "בחירת התשובה הנכונה"
       },
       {
         "name": "explanation_quality",
         "weight": 50,
         "description": "איכות ההסבר - כולל התייחסות לפרוטוקולי בטיחות, הערכת סיכונים והסבר למה התשובות האחרות שגויות"
       }
     ]
   }` as const;

export const NUMERICAL_QUESTION_GUIDELINES = `Numerical Question Guidelines:
1. Purpose: Test calculation of safety-related measurements and specifications
2. Structure:
   - Clear, specific question name describing the safety calculation
   - Clear problem statement with given values and units
   - Required safety calculations clearly stated
   - Example:
     "חשבו את המרחק המינימלי הנדרש בין פיגום לקו חשמל לפי תקן הבטיחות"
3. Solution Requirements:
   - Step-by-step solution with calculations
   - Include units in each step
   - Final answer with appropriate units
4. Specify acceptable tolerance range
5. Include validation criteria for partial credit` as const;

export const QUESTION_TYPE_PROMPTS: Record<QuestionType, string> = {
  [QuestionType.OPEN]: OPEN_QUESTION_GUIDELINES,
  [QuestionType.MULTIPLE_CHOICE]: MULTIPLE_CHOICE_GUIDELINES,
  [QuestionType.NUMERICAL]: NUMERICAL_QUESTION_GUIDELINES,
} as const; 