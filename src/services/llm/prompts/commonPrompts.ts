import { QuestionType } from '../../../types/question';
import { ExamInstitutionType } from '../../../types/examTemplate';

export const buildCommonPrompt = (
  params: {
    subject: string;
    educationType: ExamInstitutionType;
    topic: string;
    domain: string;
    type: QuestionType;
    difficulty: number;
  }
) => {
  return `
Generate a ${params.type} question in ${params.subject} for ${params.educationType} students.

AVAILABLE DOMAINS AND TOPICS:
Subject: ${params.subject}
Domain: ${params.domain}
Topic: ${params.topic}

IMPORTANT: Use these exact IDs in your response:
- subjectId: "${params.subject}"
- domainId: "${params.domain}"
- topicId: "${params.topic}"

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
    - Fractions: \\frac{a}{b}
    - Square root: \\sqrt{x}
    - Powers: x^2 or x_n
    - Greek letters: \\alpha, \\beta, \\theta
    
CRITICAL RULES FOR HEBREW AND MATH:
1. NEVER put Hebrew text inside $...$ or $$...$$
2. NEVER use \\text{} with Hebrew inside math
3. Write all units in Hebrew AFTER the math block
4. Use English subscripts for variables

EXAMPLES:
❌ WRONG: $v_{סופי}$ - Hebrew subscript inside math
✅ RIGHT: $v_{final}$ (מהירות סופית)

❌ WRONG: $$F = ma \\text{ניוטון}$$ - Hebrew unit inside math
✅ RIGHT: $$F = ma$$ ניוטון

❌ WRONG: $\\text{מהירות} = v$ - Hebrew text inside math
✅ RIGHT: מהירות = $v$

❌ WRONG: $$\\frac{\\text{כוח}}{\\text{שטח}}$$ - Hebrew fractions
✅ RIGHT: יחס בין כוח לשטח: $$\\frac{F}{A}$$

DIFFICULTY LEVEL SCALE:
1 (קל מאוד): Basic concept, single step
2 (קל): Simple problem, 2 steps
3 (בינוני): Multiple concepts, 3-4 steps
4 (קשה): Complex analysis, multiple approaches
5 (קשה מאוד): Advanced integration of concepts

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

2. Evaluation Guidelines:
   - All criteria must have clear, specific descriptions in Hebrew
   - Weights must sum to 100
   - Each criterion should be measurable and objective
   - Descriptions should guide both students and evaluators
   - Include specific requirements for each criterion

3. Common Requirements:
   - All text must be in Hebrew
   - Use markdown formatting for descriptions
   - Keep mathematical terms in English/LaTeX
   - Ensure criteria are aligned with question difficulty
   - Make criteria specific to the subject matter

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
`;
}; 