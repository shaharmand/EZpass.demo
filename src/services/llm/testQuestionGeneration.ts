import { QuestionService } from './questionGenerationService';
import { QuestionType, DifficultyLevel, EzpassCreatorType } from '../../types/question';

async function testQuestionGeneration() {
  const questionService = new QuestionService();
  
  const testParams = {
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: 3 as DifficultyLevel,
    topic: 'safety_management_fundamentals',
    subtopic: 'basics_safety',
    subject: 'civil_engineering',
    educationType: 'professional',
    source: {
      type: 'ezpass' as const,
      creatorType: EzpassCreatorType.AI
    }
  };

  try {
    const question = await questionService.generateQuestion(testParams);
    console.log('Generated Question:', question);
  } catch (error) {
    console.error('Error generating question:', error);
  }
}

testQuestionGeneration(); 