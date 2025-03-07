import { questionGenerationService } from './QuestionGenerationV2';
import { QuestionType, DifficultyLevel, EzpassCreatorType } from '../../types/question';
import { QuestionGenerationParams } from '../../types/questionGeneration';

async function testQuestionGeneration() {
  const testParams: QuestionGenerationParams = {
    type: QuestionType.MULTIPLE_CHOICE,
    difficulty: 3 as DifficultyLevel,
    prompt: 'Generate a multiple choice question about safety management fundamentals, focusing on basic safety principles.',
    subjectId: 'civil_engineering',
    domainId: 'safety',
    topicId: 'safety_management_fundamentals',
    subtopicId: 'basics_safety',
    estimatedTime: 5,
    answerFormat: {
      hasFinalAnswer: true,
      finalAnswerType: 'multiple_choice',
      requiresSolution: true
    },
    source: {
      type: 'ezpass',
      creatorType: 'ai'
    }
  };

  try {
    const question = await questionGenerationService.generateQuestion(testParams);
    console.log('Generated Question:', question);
  } catch (error) {
    console.error('Error generating question:', error);
  }
}

testQuestionGeneration(); 