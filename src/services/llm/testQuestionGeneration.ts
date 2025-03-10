import { QuestionType, DifficultyLevel, EzpassCreatorType } from '../../types/question';
import { questionGenerationService } from './QuestionGenerationV2';
import { ExamInstitutionType, ExamType } from '../../types/examTemplate';

export async function testOpenQuestionGeneration() {
  const params = {
    type: QuestionType.OPEN,
    topic: 'safety_management_fundamentals',
    subtopic: 'work_inspection_service',
    difficulty: 3 as DifficultyLevel,
    subject: 'civil_engineering',
    domainId: 'construction_safety',
    educationType: ExamInstitutionType.PRACTICAL_ENGINEERING,
    examType: ExamType.MAHAT_EXAM
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