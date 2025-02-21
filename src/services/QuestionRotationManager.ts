import type { TopicSelection } from '../types/prepState';
import type { QuestionType, QuestionFetchParams, FilterState, DifficultyLevel } from '../types/question';
import { satisfiesFilter } from '../types/question';
import type { FormalExam } from '../types/shared/exam';

const QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'open', 'step_by_step'];
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
    console.log('QuestionRotationManager initialized:', {
      examId: exam.id,
      selectedTopics: selection.topics,
      selectedSubtopics: selection.subTopics
    });
  }

  public setFilter(filter: FilterState) {
    console.log('Setting new filter:', {
      oldFilter: this.currentFilter,
      newFilter: filter,
      oldTypeIndex: this.currentTypeIndex,
      oldDifficultyIndex: this.currentDifficultyIndex
    });

    // Reset indices when filter changes
    if (JSON.stringify(filter) !== JSON.stringify(this.currentFilter)) {
      this.currentTypeIndex = 0;
      this.currentDifficultyIndex = 0;
      console.log('Filter changed, reset indices');
    }
    this.currentFilter = filter;
  }

  private generateParameters(): QuestionFetchParams {
    // Get next subtopic
    const subtopicId = this.selection.subTopics[this.currentSubtopicIndex];

    console.log('Subtopic selection:', {
      currentIndex: this.currentSubtopicIndex,
      allSubtopics: this.selection.subTopics,
      selectedSubtopicId: subtopicId
    });

    // Find parent topic for this subtopic
    console.log('Exam topics:', this.exam.topics.map(topic => ({
      topicId: topic.topicId,
      subTopics: topic.subTopics.map(st => ({
        id: st.id,
        code: st.code,
        name: st.name
      }))
    })));

    const parentTopic = this.exam.topics.find(topic => 
      topic.subTopics.some(st => {
        console.log('Comparing subtopics:', {
          examSubtopicId: st.id,
          examSubtopicCode: st.code,
          selectedSubtopicId: subtopicId,
          matches: st.id === subtopicId || st.code === subtopicId
        });
        return st.id === subtopicId || st.code === subtopicId;  // Try matching either ID or code
      })
    );

    if (!parentTopic) {
      console.error('Failed to find parent topic:', {
        subtopicId,
        availableTopics: this.exam.topics.map(t => t.topicId),
        allSubtopicsInExam: this.exam.topics.flatMap(t => t.subTopics.map(st => st.id))
      });
      throw new Error(`Could not find parent topic for subtopic ${subtopicId}`);
    }

    console.log('Found parent topic:', {
      topicId: parentTopic.topicId,
      subtopicId,
      allSubtopicsInTopic: parentTopic.subTopics.map(st => st.id)
    });

    // Get allowed types based on exam configuration and filter
    const examTypes = this.exam.questionTypes || QUESTION_TYPES;
    const filterTypes = this.currentFilter.questionTypes;
    
    console.log('Question type selection:', {
      examId: this.exam.id,
      examTypes,
      filterTypes,
      currentTypeIndex: this.currentTypeIndex,
      requestedType: filterTypes?.[0]
    });

    const allowedTypes = filterTypes 
      ? filterTypes.filter(type => examTypes.includes(type as QuestionType))
      : examTypes;

    console.log('Allowed question types:', {
      allowedTypes,
      filterApplied: !!filterTypes,
      examTypesLength: examTypes.length,
      allowedTypesLength: allowedTypes.length
    });
    
    // If we have exactly one type in the filter, always use that
    const questionType = allowedTypes.length === 1 
      ? (allowedTypes[0] as QuestionType)
      : allowedTypes[this.currentTypeIndex % allowedTypes.length] as QuestionType;

    console.log('Selected question type:', {
      questionType,
      wasFiltered: allowedTypes.length === 1,
      currentTypeIndex: this.currentTypeIndex,
      rotationIndex: this.currentTypeIndex % allowedTypes.length
    });

    // Get next difficulty from allowed levels
    const allowedDifficulties = this.currentFilter.difficulty || DIFFICULTY_LEVELS;
    const difficulty = allowedDifficulties[this.currentDifficultyIndex % allowedDifficulties.length];

    // For code questions, handle programming language
    const programmingLanguage = questionType === 'code' && this.currentFilter.programmingLanguages?.length
      ? this.currentFilter.programmingLanguages[0]  // Use first allowed language
      : undefined;

    // Log the parameters for debugging
    console.log('Generating question parameters:', {
      currentIndices: {
        subtopic: this.currentSubtopicIndex,
        type: this.currentTypeIndex,
        difficulty: this.currentDifficultyIndex
      },
      filter: this.currentFilter,
      selectedType: questionType,
      allowedTypes,
      typeIndex: this.currentTypeIndex,
      topic: parentTopic.topicId,
      subtopic: subtopicId
    });

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
    const allowedTypes = this.currentFilter.questionTypes || QUESTION_TYPES;
    const allowedDifficulties = this.currentFilter.difficulty || DIFFICULTY_LEVELS;

    const oldIndices = {
      subtopic: this.currentSubtopicIndex,
      type: this.currentTypeIndex,
      difficulty: this.currentDifficultyIndex
    };

    this.currentSubtopicIndex = (this.currentSubtopicIndex + 1) % this.selection.subTopics.length;
    this.currentTypeIndex = (this.currentTypeIndex + 1) % allowedTypes.length;
    this.currentDifficultyIndex = (this.currentDifficultyIndex + 1) % allowedDifficulties.length;

    console.log('Rotating indices:', {
      old: oldIndices,
      new: {
        subtopic: this.currentSubtopicIndex,
        type: this.currentTypeIndex,
        difficulty: this.currentDifficultyIndex
      },
      allowedTypesLength: allowedTypes.length,
      allowedDifficultiesLength: allowedDifficulties.length
    });
  }

  public reset(): void {
    const oldIndices = {
      subtopic: this.currentSubtopicIndex,
      type: this.currentTypeIndex,
      difficulty: this.currentDifficultyIndex
    };

    this.currentSubtopicIndex = 0;
    this.currentTypeIndex = 0;
    this.currentDifficultyIndex = 0;

    console.log('Reset indices:', {
      old: oldIndices,
      new: {
        subtopic: 0,
        type: 0,
        difficulty: 0
      }
    });
  }

  public getNextParameters(): QuestionFetchParams {
    console.log('Getting next parameters, current state:', {
      currentFilter: this.currentFilter,
      currentIndices: {
        subtopic: this.currentSubtopicIndex,
        type: this.currentTypeIndex,
        difficulty: this.currentDifficultyIndex
      }
    });

    // Try up to 10 times to find parameters that satisfy the filter
    for (let attempt = 0; attempt < 10; attempt++) {
      console.log(`Attempt ${attempt + 1} of 10`);
      const params = this.generateParameters();
      
      const satisfiesFilters = satisfiesFilter(params, this.currentFilter);
      console.log('Generated parameters:', {
        params,
        satisfiesFilters,
        attempt: attempt + 1
      });

      if (satisfiesFilters) {
        return params;
      }
      
      // Rotate indices for next attempt
      this.rotateIndices();
    }

    // If we couldn't find matching parameters after 10 attempts,
    // throw an error - the filter might be too restrictive
    console.error('Failed to find matching parameters after 10 attempts', {
      currentFilter: this.currentFilter,
      finalIndices: {
        subtopic: this.currentSubtopicIndex,
        type: this.currentTypeIndex,
        difficulty: this.currentDifficultyIndex
      }
    });
    throw new Error('Could not find question matching current filters. Please try relaxing some constraints.');
  }
} 