import { QuestionType } from '../../../../../types/question';

export interface SchoolAnswerParams {
  type: QuestionType;
  isHighLevel?: boolean;
}

export const buildSchoolAnswerPrompt = (params: SchoolAnswerParams): string => {
  const basePrompt = `
SCHOOL ANSWER REQUIREMENTS:
The school answer MUST include:
1. A clear, step-by-step solution process in Hebrew
2. Explanations for each step
3. Key concepts and formulas used
4. Common mistakes to avoid
5. Final answer clearly marked

FORMAT:
{
  "schoolAnswer": {
    "solution": [
      // Array of solution steps
      {
        "step": 1,
        "description": "...",
        "explanation": "...",
        "formula": "..." // if applicable
      },
      // More steps...
    ],
    "commonMistakes": [
      // Array of common mistakes and how to avoid them
    ]${params.type !== QuestionType.OPEN ? ',\n    "finalAnswer": "..."' : ''}
  }
}`;

  const typeSpecificPrompt = params.type === QuestionType.MULTIPLE_CHOICE ? `
MULTIPLE CHOICE SPECIFIC:
- Explain why each incorrect option is wrong
- Highlight key differences between options
- Point out misleading aspects in distractors` 
    : params.type === QuestionType.NUMERICAL ? `
NUMERICAL SPECIFIC:
- Show all calculations clearly
- Include units in each step
- Explain any assumptions made
- Round final answer appropriately`
    : params.type === QuestionType.OPEN ? `
OPEN QUESTION SPECIFIC:
- Provide a model answer structure
- List key points that should be included
- Suggest alternative approaches
- Include evaluation criteria`
    : '';

  const levelSpecificPrompt = params.isHighLevel ? `
HIGH LEVEL ADDITIONS:
- Include alternative solution methods
- Discuss theoretical foundations
- Connect to advanced concepts
- Provide real-world applications`
    : '';

  return `${basePrompt}${typeSpecificPrompt}${levelSpecificPrompt}`;
}; 