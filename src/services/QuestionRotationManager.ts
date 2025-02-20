import type { TopicSelection } from '../types/prepState';
import type { QuestionType, QuestionFetchParams, FilterState, DifficultyLevel } from '../types/question';
import { satisfiesFilter } from '../types/question';
import type { FormalExam } from '../types/shared/exam';

const QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'open', 'code', 'step_by_step'];
const DIFFICULTY_LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5];

export class QuestionRotationManager {
  private currentSubtopicIndex: number = 0;
  private currentTypeIndex: number = 0;
  private currentDifficultyIndex: number = 0;
  private exam: FormalExam;
  private selection: TopicSelection;
  private currentFilter: FilterState = {};

  constructor(exam: FormalExam, selection: TopicSelection) {
    this.exam = exam;
    this.selection = selection;
  }

  public setFilter(filter: FilterState) {
    this.currentFilter = filter;
  }

  public getNextParameters(): QuestionFetchParams {
    // Try up to 10 times to find parameters that satisfy the filter
    for (let attempt = 0; attempt < 10; attempt++) {
      const params = this.generateParameters();
      if (satisfiesFilter(params, this.currentFilter)) {
        return params;
      }
      // Rotate indices for next attempt
      this.rotateIndices();
    }

    // If we couldn't find matching parameters after 10 attempts,
    // throw an error - the filter might be too restrictive
    throw new Error('Could not find question matching current filters. Please try relaxing some constraints.');
  }

  private generateParameters(): QuestionFetchParams {
    // Get next subtopic
    const subtopicId = this.selection.subTopics[this.currentSubtopicIndex];

    // Find parent topic for this subtopic
    const parentTopic = this.exam.topics.find(topic => 
      topic.subTopics.some(st => st.id === subtopicId)
    );

    if (!parentTopic) {
      throw new Error(`Could not find parent topic for subtopic ${subtopicId}`);
    }

    // Get next question type from allowed types
    const allowedTypes = this.currentFilter.questionTypes || QUESTION_TYPES;
    const questionType = allowedTypes[this.currentTypeIndex % allowedTypes.length] as QuestionType;

    // Get next difficulty from allowed levels
    const allowedDifficulties = this.currentFilter.difficulty || DIFFICULTY_LEVELS;
    const difficulty = allowedDifficulties[this.currentDifficultyIndex % allowedDifficulties.length];

    // For code questions, handle programming language
    const programmingLanguage = questionType === 'code' && this.currentFilter.programmingLanguages?.length
      ? this.currentFilter.programmingLanguages[0]  // Use first allowed language
      : undefined;

    return {
      topic: parentTopic.topicId,
      subtopic: subtopicId,
      type: questionType,
      difficulty,
      subject: this.exam.title,
      educationType: this.exam.examType === 'bagrut' ? 'high_school' : 'technical_college',
      programmingLanguage,
      includeTestCases: this.currentFilter.hasTestCases
    };
  }

  private rotateIndices(): void {
    this.currentSubtopicIndex = (this.currentSubtopicIndex + 1) % this.selection.subTopics.length;
    this.currentTypeIndex = (this.currentTypeIndex + 1) % QUESTION_TYPES.length;
    this.currentDifficultyIndex = (this.currentDifficultyIndex + 1) % DIFFICULTY_LEVELS.length;
  }

  public reset(): void {
    this.currentSubtopicIndex = 0;
    this.currentTypeIndex = 0;
    this.currentDifficultyIndex = 0;
  }
} 