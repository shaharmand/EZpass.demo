import { OpenAIService } from '../llm/openAIService';
import { QuestionWithMetadata } from '../../types/question';
import { DetailedQuestionFeedback, createDetailedFeedback } from '../../types/feedback/types';
import { DetailedEvalLevel, getEvalLevelFromScore } from '../../types/feedback/levels';
import { logger } from '../../utils/logger';
import { buildFeedbackSystemMessage } from '../llm/aiSystemMessages';
import { ExamContext } from './types';
import type { AnswerContentGuidelines } from '../../types/question';

interface QuickFeedbackResponse {
  score: number;
  message: string;
}

/**
 * Service for generating AI-powered detailed feedback
 */
export class AIFeedbackService {
  constructor(private openAIService: OpenAIService) {}

  async generateFeedback(
    question: QuestionWithMetadata,
    userAnswer: string,
    examContext: ExamContext,
    isQuick: boolean = false
  ): Promise<DetailedQuestionFeedback> {
    logger.info('Generating AI feedback', {
      questionId: question.id,
      type: question.metadata.type,
      examType: examContext.examType,
      examName: examContext.examName,
      isQuick
    });

    try {
      const systemMessage = buildFeedbackSystemMessage(
        question.metadata.subjectId,
        examContext.examType,
        examContext.examName
      );
      
      // Build comprehensive question context
      const questionContext = {
        text: question.content.text,
        type: question.metadata.type,
        difficulty: question.metadata.difficulty,
        topic: question.metadata.topicId,
        subtopic: question.metadata.subtopicId,
        estimatedTime: question.metadata.estimatedTime
      };

      // Get answer context including final answer if available
      const answerContext = {
        solution: question.schoolAnswer.solution.text || 'No solution provided',
        finalAnswer: question.metadata.answerFormat.hasFinalAnswer 
          ? (question.schoolAnswer.finalAnswer || null)
          : null
      };

      // Format evaluation guidelines properly
      const evaluationGuidelines = question.evaluationGuidelines?.requiredCriteria?.map(criterion => ({
        name: criterion.name,
        description: criterion.description,
        weight: criterion.weight
      })) || [];

      // Validate criteria weights sum to 100%
      const totalWeight = evaluationGuidelines.reduce((sum: number, criterion: AnswerContentGuidelines['requiredCriteria'][0]) => sum + criterion.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        logger.warn('Evaluation criteria weights do not sum to 100%', {
          questionId: question.id,
          totalWeight
        });
      }

      const prompt = `Please evaluate this ${question.metadata.subjectId} question and provide detailed feedback.

QUESTION CONTEXT:
${JSON.stringify(questionContext, null, 2)}

STUDENT ANSWER:
${userAnswer}

CORRECT ANSWER:
${JSON.stringify(answerContext, null, 2)}

EVALUATION CRITERIA:
The answer will be evaluated based on the following required criteria (total weight: 100%):
${evaluationGuidelines.map(c => `- ${c.name} (${c.weight}%): ${c.description}`).join('\n')}

REQUIRED RESPONSE FORMAT:
{
  "type": "detailed",
  "score": number,                // Overall score (0-100) - MUST be calculated as weighted average of criteria scores
  "evalLevel": string,           // MUST be one of: PERFECT, EXCELLENT, VERY_GOOD, GOOD, FAIR, POOR, IRRELEVANT
  "message": string,             // Short summary in Hebrew
  "coreFeedback": string,        // Main points with ✅❌⚠️ symbols in Hebrew
  "detailedFeedback": string,    // Detailed analysis in Hebrew
  "criteriaFeedback": [          // Must match the order of evaluation criteria above
    {
      "criterionName": string,   // Must match criterion name
      "score": number,           // Score for this criterion (0-100)
      "feedback": string,        // Specific feedback for this criterion in Hebrew
      "weight": number          // Must match criterion weight
    }
  ],
  "scoreCalculation": {          // Explicit calculation details for verification
    "criteriaScores": [          // Individual criterion scores with weights
      {
        "criterionName": string,
        "score": number,
        "weight": number,
        "weightedScore": number  // score * weight / 100
      }
    ],
    "totalWeightedScore": number, // Sum of all weighted scores
    "finalScore": number,        // Rounded totalWeightedScore
    "determinedLevel": string,   // Level determined based on finalScore (MUST use enum values)
    "levelExplanation": string   // Brief explanation of why this level was chosen
  }
}

SCORING GUIDELINES:
- PERFECT: 100% - Perfect solution with no errors
- EXCELLENT: 90-99% - Near perfect solution with minor issues
- VERY_GOOD: 80-89% - Strong solution with minor issues
- GOOD: 70-79% - Good solution with some gaps
- FAIR: 55-69% - Basic understanding, significant gaps
- POOR: 1-54% - Major gaps or incorrect solution
- IRRELEVANT: 0% - Off-topic or unrelated

IMPORTANT:
1. You MUST calculate the final score as the weighted average of criteria scores
2. You MUST explicitly show the calculation in the scoreCalculation field
3. You MUST determine the evaluation level based on the final score using the exact enum values above
4. You MUST explain why you chose that specific level
5. The final score in the root must match the calculated score in scoreCalculation
6. The evalLevel and determinedLevel MUST use the exact enum values (PERFECT, EXCELLENT, etc.)`;

      const response = await this.openAIService.complete(prompt, {
        model: isQuick ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview',
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ]
      });

      try {
        const feedback = JSON.parse(response);
        
        // Validate the feedback structure
        if (feedback.type !== 'detailed') {
          throw new Error('Invalid feedback type received from AI. Expected detailed feedback.');
        }

        // Validate criteria feedback matches evaluation guidelines
        if (!this.validateCriteriaFeedback(feedback.criteriaFeedback, evaluationGuidelines)) {
          throw new Error('Criteria feedback does not match evaluation guidelines');
        }

        // Validate score calculation and evaluation level
        if (!this.validateScoreCalculation(feedback)) {
          throw new Error('Invalid score calculation or level determination');
        }

        // Validate that evalLevel is a valid DetailedEvalLevel
        if (!Object.values(DetailedEvalLevel).includes(feedback.evalLevel)) {
          throw new Error(`Invalid evaluation level: ${feedback.evalLevel}`);
        }

        // Create the detailed feedback with proper evaluation level from AI
        return createDetailedFeedback(
          feedback.score,
          feedback.coreFeedback,
          feedback.detailedFeedback,
          feedback.criteriaFeedback,
          feedback.message
        );

      } catch (error) {
        logger.error('Failed to parse AI response:', error);
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      logger.error('Error generating AI feedback:', error);
      throw error;
    }
  }

  private validateCriteriaFeedback(
    criteriaFeedback: any[], 
    guidelines: { name: string; weight: number }[]
  ): boolean {
    if (!Array.isArray(criteriaFeedback) || criteriaFeedback.length !== guidelines.length) {
      return false;
    }

    return criteriaFeedback.every((feedback, index) => {
      const guideline = guidelines[index];
      return (
        feedback.criterionName === guideline.name &&
        feedback.weight === guideline.weight &&
        typeof feedback.score === 'number' &&
        feedback.score >= 0 &&
        feedback.score <= 100 &&
        typeof feedback.feedback === 'string' &&
        feedback.feedback.length > 0
      );
    });
  }

  private validateScoreCalculation(feedback: any): boolean {
    const { score, evalLevel, criteriaFeedback, scoreCalculation } = feedback;
    
    // Check if scoreCalculation exists and has required fields
    if (!scoreCalculation || 
        !Array.isArray(scoreCalculation.criteriaScores) ||
        typeof scoreCalculation.totalWeightedScore !== 'number' ||
        typeof scoreCalculation.finalScore !== 'number' ||
        typeof scoreCalculation.determinedLevel !== 'string' ||
        typeof scoreCalculation.levelExplanation !== 'string') {
      return false;
    }

    // 1. Validate each criterion's weighted score calculation
    const calculatedTotal = scoreCalculation.criteriaScores.reduce((sum: number, criterion: { score: number; weight: number }) => {
      const weightedScore = criterion.score * criterion.weight / 100;
      return sum + weightedScore;
    }, 0);

    // Allow small rounding differences
    if (Math.abs(calculatedTotal - scoreCalculation.totalWeightedScore) > 0.01) {
      return false;
    }

    // 2. Check if final score matches root score
    if (score !== scoreCalculation.finalScore) {
      return false;
    }

    // 3. Check if determined level matches our scoring guidelines using enum values
    const level = scoreCalculation.determinedLevel;
    if (score === 100 && level !== 'PERFECT') return false;
    if (score >= 90 && score < 100 && level !== 'EXCELLENT') return false;
    if (score >= 80 && score < 90 && level !== 'VERY_GOOD') return false;
    if (score >= 70 && score < 80 && level !== 'GOOD') return false;
    if (score >= 55 && score < 70 && level !== 'FAIR') return false;
    if (score > 0 && score < 55 && level !== 'POOR') return false;
    if (score === 0 && level !== 'IRRELEVANT') return false;

    // 4. Check if determined level matches the root evalLevel
    if (level !== evalLevel) {
      return false;
    }

    // 5. Validate consistency between criteriaFeedback and scoreCalculation
    if (criteriaFeedback.length !== scoreCalculation.criteriaScores.length) {
      return false;
    }

    // Check each criterion's consistency
    for (let i = 0; i < criteriaFeedback.length; i++) {
      const feedbackCriterion = criteriaFeedback[i];
      const calculationCriterion = scoreCalculation.criteriaScores[i];

      // Check names match
      if (feedbackCriterion.criterionName !== calculationCriterion.criterionName) {
        return false;
      }

      // Check weights match
      if (feedbackCriterion.weight !== calculationCriterion.weight) {
        return false;
      }

      // Check scores match
      if (feedbackCriterion.score !== calculationCriterion.score) {
        return false;
      }

      // Check weighted score calculation
      const expectedWeightedScore = feedbackCriterion.score * feedbackCriterion.weight / 100;
      if (Math.abs(expectedWeightedScore - calculationCriterion.weightedScore) > 0.01) {
        return false;
      }
    }

    return true;
  }

  private isValidQuickFeedbackResponse(response: any): response is QuickFeedbackResponse {
    return (
      typeof response === 'object' &&
      typeof response.score === 'number' &&
      response.score >= 0 &&
      response.score <= 100 &&
      typeof response.message === 'string' &&
      response.message.length > 0
    );
  }
} 