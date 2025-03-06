import { QuestionType } from '../../../../../types/question';
import { ExamType } from '../../../../../types/examTemplate';

export interface EvaluationParams {
  type: QuestionType;
  examType: ExamType;
  totalPoints: number;
  partialCredit?: boolean;
}

export const buildEvaluationPrompt = (params: EvaluationParams): string => {
  const basePrompt = `
EVALUATION GUIDELINES:
The evaluation object MUST follow this structure:
{
  "evaluation": {
    "totalPoints": ${params.totalPoints},
    "scoringMethod": "${params.partialCredit ? 'partial' : 'all_or_nothing'}",
    "criteria": [
      // Array of scoring criteria
      {
        "criterion": "...",
        "points": number,
        "description": "..."
      }
    ],
    "rubric": {
      // Detailed scoring instructions
    }
  }
}

GENERAL REQUIREMENTS:
- All points must sum to ${params.totalPoints}
- Each criterion must have clear, objective measures
- Include examples of correct and incorrect responses
- Specify deductions for common errors`;

  const examTypePrompt = params.examType === ExamType.BAGRUT ? `
BAGRUT SPECIFIC:
- Follow official Ministry of Education guidelines
- Use standard point distribution
- Include official scoring benchmarks
- Consider previous Bagrut examples`
    : params.examType === ExamType.UNI_COURSE_EXAM ? `
UNIVERSITY COURSE SPECIFIC:
- Focus on learning objectives
- Provide detailed feedback options
- Include improvement suggestions
- Allow for self-assessment`
    : params.examType === ExamType.MAHAT_EXAM ? `
MAHAT SPECIFIC:
- Follow technical education standards
- Include practical application criteria
- Consider industry requirements
- Focus on professional competencies`
    : params.examType === ExamType.GOVERNMENT_EXAM ? `
GOVERNMENT EXAM SPECIFIC:
- Follow official regulatory guidelines
- Use standardized scoring methods
- Include compliance requirements
- Consider certification standards`
    : '';

  const typeSpecificPrompt = params.type === QuestionType.MULTIPLE_CHOICE ? `
MULTIPLE CHOICE SCORING:
- No partial credit for incorrect options
- Clear marking for the correct answer
- Points deducted for guessing (if applicable)
- Consider response time in scoring`
    : params.type === QuestionType.NUMERICAL ? `
NUMERICAL SCORING:
- Define acceptable range for answers
- Partial credit for correct process
- Points for proper units and notation
- Deductions for calculation errors`
    : params.type === QuestionType.OPEN ? `
OPEN RESPONSE SCORING:
- Detailed rubric for content coverage
- Points for structure and clarity
- Credit for unique insights
- Language and presentation criteria`
    : '';

  return `${basePrompt}${examTypePrompt}${typeSpecificPrompt}`;
}; 