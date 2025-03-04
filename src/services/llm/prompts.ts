import { QuestionType } from '../../types/question';

type FormattingGuidelineType = {
  COMMON: string;
  OPEN_QUESTION: string;
  CODE_QUESTION: string;
  MULTIPLE_CHOICE_QUESTION: string;
};

type QuestionPromptType = {
  [K in QuestionType]: string;
};

export const FORMATTING_GUIDELINES: FormattingGuidelineType = {
  COMMON: `Common Formatting Guidelines:

1. Content Integration:
   - When relevant, ALWAYS combine code examples with mathematical expressions
   - Use code blocks to demonstrate implementation
   - Use LaTeX for mathematical concepts
   - Show the relationship between math and code

2. Code Formatting:
   - Use \`\`\`language for code blocks
   - Use \`code\` for inline code
   - Include comments in Hebrew
   - Keep variable names in English
   - Example: \`\`\`python
     x = 5  # ערך התחלתי
     y = x * 2  # הכפלה פי 2
     \`\`\`

3. Mathematical Expressions:
   - Display math: Use $$...$$ on its own line
   - Inline math: Use $...$ within text
   - ALL numbers in mathematical context must use LaTeX
   - Use single backslashes for LaTeX commands (e.g. $\frac{1}{2}$, not $$\\frac{1}{2}$$)
   - Example: "כאשר $x = 5$ אז $f(x) = 2x$ יהיה שווה ל-$10$"

4. Combined Examples:
   - Show mathematical formula, then implementation:
     "נחשב את השטח לפי הנוסחה $A = \pi r^2$:
     \`\`\`python
     import math
     radius = 5
     area = math.pi * radius ** 2
     \`\`\`"

5. RTL/LTR Handling:
   - Hebrew text in RTL
   - Code and math in LTR
   - Proper mixing using Unicode control`,

  OPEN_QUESTION: `Open Question Guidelines:
1. Purpose: Test understanding through explanation and analysis
2. Structure:
   - Clear problem statement combining theory and practice
   - Include both mathematical concepts and code implementation
   - Example:
     "הסבירו את הקשר בין הנוסחה $f(x) = ax + b$ לבין הקוד:
     \`\`\`python
     def linear_function(x, a, b):
         return a * x + b
     \`\`\`"
3. Answer Requirements:
   - Mathematical explanation
   - Code analysis
   - Connection between concepts`,

  CODE_QUESTION: `Code Question Guidelines:
1. Purpose: Test programming with mathematical context
2. Structure:
   - Mathematical background
   - Code implementation
   - Test cases with calculations
   Example:
   "חשבו את $\\sum_{i=1}^{n} i^2$ באמצעות לולאה:
   \`\`\`python
   def sum_squares(n):
       return sum(i**2 for i in range(1, n+1))
   \`\`\`"`,

  MULTIPLE_CHOICE_QUESTION: `Multiple Choice Question Guidelines:
1. Purpose: Test understanding of concepts
2. Structure:
   - Question combining theory and implementation
   - Options with both mathematical and code aspects
   Example:
   "מה יהיה הערך של $y$ לאחר ביצוע הקוד:
   \`\`\`python
   x = 5
   y = x ** 2
   \`\`\`
   א) $y = 25$
   ב) $y = 10$
   ג) $y = 5^2$
   ד) $y = 7$"`
} as const;

export const QUESTION_PROMPTS: QuestionPromptType = {
  [QuestionType.NUMERICAL]: `Numerical Question Guidelines:
1. Purpose: Test calculation and problem-solving abilities
2. Structure:
   - Clear problem statement with given values and units
   - Required calculations clearly stated
   - Example:
     "חשבו את העומס המרבי המותר על פיגום בגובה 12 מטר עם מפתח של 3 מטר."
3. Solution Requirements:
   - Step-by-step solution with calculations
   - Include units in each step
   - Final answer with appropriate units
4. Specify acceptable tolerance range
5. Include validation criteria for partial credit`,

  [QuestionType.OPEN]: `Open Question Guidelines:
1. Purpose: Test understanding through explanation and analysis
2. Structure:
   - Clear problem statement combining theory and practice
   - Include both mathematical concepts and code implementation
   - Example:
     "הסבירו את הקשר בין הנוסחה $f(x) = ax + b$ לבין הקוד:
     \`\`\`python
     def linear_function(x, a, b):
         return a * x + b
     \`\`\`"
3. Answer Requirements:
   - Mathematical explanation
   - Code analysis
   - Connection between concepts`,

  [QuestionType.MULTIPLE_CHOICE]: `Multiple Choice Question Guidelines:
1. Purpose: Test understanding of concepts
2. Structure:
   - Question combining theory and implementation
   - Options with both mathematical and code aspects
   Example:
   "מה יהיה הערך של $y$ לאחר ביצוע הקוד:
   \`\`\`python
   x = 5
   y = x ** 2
   \`\`\`
   א) $y = 25$
   ב) $y = 10$
   ג) $y = 5^2$
   ד) $y = 7$"`
} as const; 