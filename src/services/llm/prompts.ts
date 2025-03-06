import { QuestionType } from '../../types/question';

type FormattingGuidelineType = {
  COMMON: string;
  OPEN_QUESTION: string;
  MULTIPLE_CHOICE_QUESTION: string;
};

type QuestionPromptType = {
  [K in QuestionType]: string;
};

export const FORMATTING_GUIDELINES: FormattingGuidelineType = {
  COMMON: `Common Formatting Guidelines:

1. Content Integration:
   - Question Name (Mandatory):
     * Must be clear, concise, and specific to the safety aspect being tested
     * Should go beyond the subtopic to describe the specific safety scenario
     * Examples:
       - "Fall Protection - Harness Inspection Procedure"
       - "Chemical Spill Response - First 5 Minutes"
       - "Scaffold Safety - Load Capacity Calculation"
     * Avoid generic names like "Safety Question" or "Construction Safety"
   - Use clear, concise language
   - Include relevant safety standards and regulations
   - Reference specific safety protocols and procedures
   - Use proper construction safety terminology

2. Formatting:
   - Use proper paragraph breaks for readability
   - Include bullet points for lists of safety requirements
   - Use bold for important safety warnings
   - Keep language professional and precise

3. Safety Standards:
   - Reference specific safety codes and regulations
   - Include relevant OSHA standards when applicable
   - Use proper safety terminology
   - Example: "According to OSHA 1926.501(b)(1), fall protection is required..."

4. Combined Examples:
   - Show safety procedure, then implementation:
     "Following proper fall protection procedures:
     • Inspect harness and lanyard
     • Secure anchor point
     • Maintain 100% tie-off"

5. RTL/LTR Handling:
   - Hebrew text in RTL
   - English terms in LTR
   - Proper mixing using Unicode control`,

  OPEN_QUESTION: `Open Question Guidelines:
1. Purpose: Test understanding of safety procedures and protocols
2. Structure:
   - Clear, specific question name describing the safety scenario
   - Safety scenario or situation
   - Include relevant safety standards and regulations
   - Example:
     "תארו את הפעולות הנדרשות במקרה של דליפת חומרים מסוכנים באתר בנייה"
3. Answer Requirements:
   - Safety protocol explanation
   - Regulatory compliance
   - Risk assessment
   - Emergency response procedures`,

  MULTIPLE_CHOICE_QUESTION: `Multiple Choice Question Guidelines:
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
   }`
} as const;

export const QUESTION_PROMPTS: QuestionPromptType = {
  [QuestionType.NUMERICAL]: `Numerical Question Guidelines:
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
5. Include validation criteria for partial credit`,

  [QuestionType.OPEN]: `Open Question Guidelines:
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
   - Emergency response procedures`,

  [QuestionType.MULTIPLE_CHOICE]: `Multiple Choice Question Guidelines:
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
   }`
} as const; 