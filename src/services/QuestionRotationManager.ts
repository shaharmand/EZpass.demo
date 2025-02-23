import type { TopicSelection } from '../types/prepState';
import type { QuestionType, QuestionFetchParams, FilterState, DifficultyLevel } from '../types/question';
import { satisfiesFilter } from '../types/question';
import type { ExamTemplate } from '../types/examTemplate';
import { getExamInstitution } from '../types/examTemplate';

const QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'open', 'step_by_step'];
const DIFFICULTY_LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5];

export class QuestionRotationManager {
  private currentSubtopicIndex: number = 0;
  private currentTypeIndex: number = 0;
  private currentDifficultyIndex: number = 0;
  private exam: ExamTemplate;
  private selection: TopicSelection;
  private currentFilter: FilterState = {};

  constructor(exam: ExamTemplate, selection: TopicSelection) {
    // Validate exam has topics
    if (!exam.topics || exam.topics.length === 0) {
      throw new Error('Cannot initialize QuestionRotationManager: exam has no topics');
    }
    if (!exam.topics.every(t => t.subTopics && t.subTopics.length > 0)) {
      throw new Error('Cannot initialize QuestionRotationManager: some topics have no subtopics');
    }

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

    console.log('DEBUG: Subtopic selection details:', {
        subtopicId,
        allSubtopics: this.selection.subTopics,
        examTopics: this.exam.topics.map(t => ({
            topicId: t.id,
            subTopics: t.subTopics.map(st => ({
                id: st.id,
                name: st.name
            }))
        }))
    });


    const parentTopic = this.exam.topics.find(topic => 
      topic.subTopics.some(st => {
        const matchesId = st.id === subtopicId;
        console.log('DEBUG: Subtopic matching details:', {
            subtopicToMatch: subtopicId,
            currentSubtopic: {
                id: st.id,
                name: st.name
            },
            matchesId,
            parentTopicId: topic.id
        });
        return matchesId;  // Try matching either ID or code
      })
    );

    if (!parentTopic) {
      console.error('Failed to find parent topic:', {
        subtopicId,
        availableTopics: this.exam.topics.map(t => t.id),
        allSubtopicsInExam: this.exam.topics.flatMap(t => t.subTopics.map(st => st.id))
      });
      throw new Error(`Could not find parent topic for subtopic ${subtopicId}`);
    }

    console.log('Found parent topic:', {
      topicId: parentTopic.id,
      subtopicId,
      allSubtopicsInTopic: parentTopic.subTopics.map(st => st.id)
    });

    // Get allowed types based on exam configuration and filter
    const examTypes = this.exam.allowedQuestionTypes ;
    const filterTypes = this.currentFilter.questionTypes;
    
    console.log('Initial type info:', {
      examId: this.exam.id,
      examTypes: examTypes.join(', '),
      filterTypes: filterTypes ? filterTypes.join(', ') : 'none',
      defaultTypes: QUESTION_TYPES.join(', ')
    });

    const allowedTypes = filterTypes 
      ? filterTypes.filter(type => examTypes.includes(type as QuestionType))
      : examTypes;

    console.log('Question type selection details:', {
      examId: this.exam.id,
      availableTypes: allowedTypes.join(', '),
      currentTypeIndex: this.currentTypeIndex,
      selectionMode: filterTypes ? 'random from filter' : 'random from exam types',
      poolSize: allowedTypes.length
    });
    
    // Determine question type:
    // 1. If exactly one type allowed, use it
    // 2. If filter exists, randomly select from filter types
    // 3. If no filter, randomly select from all exam types
    const questionType = allowedTypes.length === 1 
      ? (allowedTypes[0] as QuestionType)
      : filterTypes 
        ? filterTypes[Math.floor(Math.random() * filterTypes.length)] as QuestionType  // Random from filter
        : examTypes[Math.floor(Math.random() * examTypes.length)] as QuestionType;     // Random from all

    console.log('Selected question type:', {
      questionType,
      wasFiltered: allowedTypes.length === 1,
      selectedFromFilter: !!filterTypes,
      availableTypes: filterTypes || examTypes
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
      topic: parentTopic.id,
      subtopic: subtopicId
    });

    return {
      topic: parentTopic.id,
      subtopic: subtopicId,
      type: questionType,
      difficulty,
      subject: this.exam.subjectId,
      educationType: getExamInstitution(this.exam.examType),
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
      },
      selectedSubtopics: this.selection.subTopics,
      filterSubtopics: this.currentFilter.subTopics
    });

    // Try up to 10 times to find parameters that satisfy the filter
    for (let attempt = 0; attempt < 10; attempt++) {
      console.log(`Attempt ${attempt + 1} of 10`);
      const params = this.generateParameters();
      
      const satisfiesFilters = satisfiesFilter(params, this.currentFilter);
      console.log('Generated parameters check:', {
        params,
        currentFilter: this.currentFilter,
        satisfiesFilters,
        attempt: attempt + 1,
        subtopicMatch: this.currentFilter.subTopics ? 
          this.currentFilter.subTopics.includes(params.subtopic || '') : 
          'no subtopic filter'
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
      },
      availableSubtopics: this.selection.subTopics,
      filterSubtopics: this.currentFilter.subTopics
    });
    throw new Error('Could not find question matching current filters. Please try relaxing some constraints.');
  }
} 