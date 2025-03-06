import { QuestionType } from '../../../../../types/question';

export interface BaseContent {
  text: string;
  format: 'markdown';
}

export const baseContentPrompt = `
CONTENT STRUCTURE:
{
  "content": {
    "text": "שאלה ברורה בעברית",
    "format": "markdown"
  }
}

Content Requirements:
1. Clear, professional question text
2. All necessary context included
3. RTL formatting for Hebrew
4. No ambiguity in wording
5. Professional terminology
`;

export interface MultipleChoiceContent extends BaseContent {
  options: Array<{
    text: string;
    format: 'markdown';
  }>;
}

export const multipleChoiceContentPrompt = `
${baseContentPrompt}

MULTIPLE CHOICE STRUCTURE:
{
  "content": {
    "text": "שאלה ברורה בעברית",
    "format": "markdown",
    "options": [
      { "text": "תשובה א", "format": "markdown" },
      { "text": "תשובה ב", "format": "markdown" },
      { "text": "תשובה ג", "format": "markdown" },
      { "text": "תשובה ד", "format": "markdown" }
    ]
  }
}

Options Requirements:
1. Exactly 4 options
2. Each option must be:
   - Independent of others
   - Plausible
   - Similar in length/structure
3. Options should:
   - Reference relevant regulations/standards when applicable
   - Use professional terminology
   - Be clearly distinguishable
   - No "all of the above" or "none of the above"
   - No overlapping options
`;

export interface NumericalContent extends BaseContent {
  units?: string;
  variables?: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
}

export const numericalContentPrompt = `
${baseContentPrompt}

NUMERICAL QUESTION STRUCTURE:
{
  "content": {
    "text": "שאלת חישוב הכוללת את כל הנתונים הנדרשים לפתרון",
    "format": "markdown"
  }
}

Requirements:
1. Clear problem statement with:
   - All necessary variables and values
   - Required units clearly specified
   - Any formulas needed
   - Any assumptions that should be made
2. Use LaTeX for mathematical expressions:
   - Inline math: $...$ (e.g., $F = ma$)
   - Display math: $$...$$ (e.g., $$\\frac{F}{A} = P$$)
3. Units and numbers:
   - Write units in Hebrew outside math delimiters
   - Use standard SI units when applicable
   - Specify significant figures needed
`;

export interface OpenContent extends BaseContent {
  guidelines?: {
    minWords?: number;
    maxWords?: number;
    requiredElements?: string[];
  };
}

export const openContentPrompt = `
${baseContentPrompt}

OPEN QUESTION STRUCTURE:
{
  "content": {
    "text": "שאלה פתוחה עם הנחיות ברורות",
    "format": "markdown"
  }
}

Requirements:
1. Clear task definition:
   - Specific points to address
   - Expected scope
   - Required elements (e.g., regulations, examples)
2. Structure guidelines:
   - Logical organization
   - Clear sections if needed
3. Professional context:
   - Industry standards
   - Real-world scenarios
   - Practical applications
`;

export const buildContentPrompt = (type: QuestionType): string => {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return multipleChoiceContentPrompt;
    case QuestionType.NUMERICAL:
      return numericalContentPrompt;
    case QuestionType.OPEN:
      return openContentPrompt;
    default:
      throw new Error(`Unsupported question type: ${type}`);
  }
}; 