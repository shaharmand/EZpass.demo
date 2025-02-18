export const FORMATTING_GUIDELINES = {
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

  STEP_BY_STEP_QUESTION: `Step-by-Step Question Guidelines:
1. Purpose: Show problem-solving process
2. Structure:
   - Mathematical formulation
   - Code implementation
   - Step-by-step solution
   Example:
   "נתונה הנוסחה $V = \\frac{4}{3}πr^3$ לחישוב נפח כדור.
   \`\`\`python
   import math
   def sphere_volume(r):
       return (4/3) * math.pi * r**3
   \`\`\`"`,

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
}; 