import type { TopicSelection } from '../types/prepState';
import type { QuestionType } from '../types/question';
import type { FormalExam } from '../types/shared/exam';

const QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'open', 'code', 'step_by_step'];
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5];

export interface QuestionParameters {
  topic: string;
  subtopic: string;
  type: QuestionType;
  difficulty: number;
  subject: string;
  educationType: string;
}

export class QuestionRotationManager {
  private currentSubtopicIndex: number = 0;
  private currentTypeIndex: number = 0;
  private currentDifficultyIndex: number = 0;
  private exam: FormalExam;
  private selection: TopicSelection;

  constructor(exam: FormalExam, selection: TopicSelection) {
    this.exam = exam;
    this.selection = selection;
  }

  public getNextParameters(): QuestionParameters {
    // Get next subtopic
    const subtopicId = this.selection.subTopics[this.currentSubtopicIndex];
    this.currentSubtopicIndex = (this.currentSubtopicIndex + 1) % this.selection.subTopics.length;

    // Find parent topic for this subtopic
    const parentTopic = this.exam.topics.find(topic => 
      topic.subTopics.some(st => st.id === subtopicId)
    );

    if (!parentTopic) {
      throw new Error(`Could not find parent topic for subtopic ${subtopicId}`);
    }

    // Get next question type
    const questionType = QUESTION_TYPES[this.currentTypeIndex];
    this.currentTypeIndex = (this.currentTypeIndex + 1) % QUESTION_TYPES.length;

    // Get next difficulty level
    const difficulty = DIFFICULTY_LEVELS[this.currentDifficultyIndex];
    this.currentDifficultyIndex = (this.currentDifficultyIndex + 1) % DIFFICULTY_LEVELS.length;

    return {
      topic: parentTopic.topicId,
      subtopic: subtopicId,
      type: questionType,
      difficulty,
      subject: this.exam.title,
      educationType: this.exam.examType === 'bagrut' ? 'high_school' : 'technical_college'
    };
  }

  public reset(): void {
    this.currentSubtopicIndex = 0;
    this.currentTypeIndex = 0;
    this.currentDifficultyIndex = 0;
  }
} 