import { questionGenerationService } from './QuestionGenerationV2';
import { QuestionType, DifficultyLevel, EzpassCreatorType } from '../../types/question';
import { QuestionGenerationParams } from '../../types/questionGeneration';

export async function testOpenQuestionGeneration() {
  const params: QuestionGenerationParams = {
    type: QuestionType.OPEN,
    prompt: "תכנון בטיחות לעבודה בגובה",
    subjectId: "construction_safety",
    domainId: "work_at_height",
    topicId: "safety_planning",
    difficulty: 3,
    estimatedTime: 15,
    answerFormat: {
      hasFinalAnswer: false,
      finalAnswerType: 'none',
      requiresSolution: true
    },
    source: {
      type: 'ezpass',
      creatorType: 'ai'
    }
  };

  try {
    const question = await questionGenerationService.generateQuestion(params);
    console.log('Generated Question:', JSON.stringify(question, null, 2));
    return question;
  } catch (error) {
    console.error('Error generating question:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testOpenQuestionGeneration()
    .then(() => console.log('Test completed successfully'))
    .catch(error => console.error('Test failed:', error));
} 