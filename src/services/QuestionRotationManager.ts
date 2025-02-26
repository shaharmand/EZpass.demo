import type { TopicSelection } from '../types/prepState';
import type { QuestionType, QuestionFetchParams, FilterState, DifficultyLevel } from '../types/question';
import { satisfiesFilter } from '../types/question';
import type { ExamTemplate } from '../types/examTemplate';
import { getExamInstitution } from '../types/examTemplate';
import { logger, CRITICAL_SECTIONS } from '../utils/logger';

const QUESTION_TYPES: QuestionType[] = ['multiple_choice', 'open', 'step_by_step'];
const DIFFICULTY_LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5];

interface StudentSubTopicProgress {
  subtopicId: string;
  currentDifficulty: DifficultyLevel;
  // We can add more fields later like:
  // questionsAttempted: number;
  // correctAnswers: number;
  // lastAttemptDate: Date;
}

export class QuestionRotationManager {
  private exam: ExamTemplate;
  private selection: TopicSelection;
  private currentSubtopicIndex: number = -1;
  private studentProgress: Map<string, StudentSubTopicProgress> = new Map();
  private prepId: string;

  constructor(exam: ExamTemplate, selection: TopicSelection, prepId: string) {
    if (!exam.topics?.length) {
      const error = new Error('Cannot initialize QuestionRotationManager: exam has no topics');
      console.error('FORCE ERROR - ROTATION MANAGER INIT FAILED:', {
        error,
        exam,
        selection,
        prepId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
    if (!exam.topics.every(t => t.subTopics?.length)) {
      const error = new Error('Cannot initialize QuestionRotationManager: some topics have no subtopics');
      console.error('FORCE ERROR - ROTATION MANAGER INIT FAILED:', {
        error,
        exam,
        selection,
        prepId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
    if (!exam.allowedQuestionTypes?.length) {
      const error = new Error('Cannot initialize QuestionRotationManager: exam has no question types');
      console.error('FORCE ERROR - ROTATION MANAGER INIT FAILED:', {
        error,
        exam,
        selection,
        prepId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    // Force all logs to show
    logger.configure({
      filters: {
        minLevel: 'debug',
        showOnly: [],
        ignorePatterns: []
      },
      isDevelopment: true
    });

    console.log('FORCE LOG - ROTATION MANAGER CONSTRUCTOR:', {
      examId: exam.id,
      allowedTypes: exam.allowedQuestionTypes,
      selectedSubtopics: selection.subTopics,
      subTopicsCount: selection.subTopics.length,
      prepId,
      timestamp: new Date().toISOString()
    });

    this.exam = {
      ...exam,
      allowedQuestionTypes: exam.allowedQuestionTypes as QuestionType[]
    };
    this.selection = selection;
    this.prepId = prepId;
    
    // Initialize student progress for all selected subtopics
    selection.subTopics.forEach(subtopicId => {
      this.studentProgress.set(subtopicId, {
        subtopicId,
        currentDifficulty: 1 as DifficultyLevel
      });
    });

    // Log initial state with console.log to ensure it shows
    console.log('FORCE LOG - ROTATION MANAGER INITIALIZED:', {
      examId: exam.id,
      allowedTypes: exam.allowedQuestionTypes,
      selectedSubtopics: selection.subTopics,
      subTopicsCount: selection.subTopics.length,
      prepId,
      timestamp: new Date().toISOString()
    });
  }

  public getPrepId(): string {
    return this.prepId;
  }

  public getNextParameters(filter: FilterState = {}): QuestionFetchParams {
    // Force log incoming filter state
    console.log('FORCE LOG - ROTATION MANAGER getNextParameters ENTRY:', {
      incomingFilter: filter,
      currentIndex: this.currentSubtopicIndex,
      timestamp: new Date().toISOString()
    });

    // Step 1: Get active subtopics from filter
    const activeSubtopics = filter.subTopics?.length 
      ? filter.subTopics.filter(st => this.selection.subTopics.includes(st))
      : [...this.selection.subTopics];

    if (!activeSubtopics.length) {
      throw new Error('No active subtopics available');
    }

    // Step 2: Get next subtopic (keeping rotation)
    this.currentSubtopicIndex = (this.currentSubtopicIndex + 1) % activeSubtopics.length;
    const subtopicId = activeSubtopics[this.currentSubtopicIndex];

    console.log('FORCE LOG - ROTATION MANAGER subtopic selection:', {
      previousIndex: this.currentSubtopicIndex,
      selectedSubtopicId: subtopicId,
      timestamp: new Date().toISOString()
    });

    // Log current subtopic progress before getting difficulty
    const currentProgress = this.studentProgress.get(subtopicId);
    console.log('FORCE LOG - ROTATION MANAGER current subtopic progress:', {
      subtopicId,
      currentProgress: currentProgress ? {
        currentDifficulty: currentProgress.currentDifficulty,
        subtopicId: currentProgress.subtopicId
      } : 'not found',
      timestamp: new Date().toISOString()
    });

    // Step 3: Get question type from filter
    let questionType: QuestionType;
    
    console.log('FORCE LOG - ROTATION MANAGER type selection START:', {
      filterState: {
        hasTypes: Boolean(filter.questionTypes?.length),
        types: filter.questionTypes,
        requestedType: filter.questionTypes?.[0]
      },
      examState: {
        allowedTypes: this.exam.allowedQuestionTypes
      }
    });
    
    if (filter.questionTypes?.length === 1) {
      const requestedType = filter.questionTypes[0] as QuestionType;
      console.log('FORCE LOG - ROTATION MANAGER processing requested type:', {
        requestedType,
        isAllowed: this.exam.allowedQuestionTypes.includes(requestedType)
      });

      // Validate requested type is allowed
      if (this.exam.allowedQuestionTypes.includes(requestedType)) {
        questionType = requestedType;
        console.log('FORCE LOG - ROTATION MANAGER using requested type:', {
          requestedType,
          isAllowed: true
        });
      } else {
        console.warn('FORCE LOG - ROTATION MANAGER requested type not allowed:', {
          requestedType,
          allowedTypes: this.exam.allowedQuestionTypes
        });
        // Fall back to random allowed type
        questionType = this.exam.allowedQuestionTypes[
          Math.floor(Math.random() * this.exam.allowedQuestionTypes.length)
        ];
      }
    } else {
      console.log('FORCE LOG - ROTATION MANAGER no specific type requested:', {
        allowedTypes: this.exam.allowedQuestionTypes
      });
      // No specific type requested, pick random allowed type
      questionType = this.exam.allowedQuestionTypes[
        Math.floor(Math.random() * this.exam.allowedQuestionTypes.length)
      ];
    }

    console.log('FORCE LOG - ROTATION MANAGER final type selection:', {
      requestedType: filter.questionTypes?.[0],
      selectedType: questionType,
      wasRequested: filter.questionTypes?.length === 1,
      allowedTypes: this.exam.allowedQuestionTypes
    });

    // Step 4: Get difficulty from filter or progress
    const difficulty = filter.difficulty?.length
      ? filter.difficulty[0]
      : this.studentProgress.get(subtopicId)?.currentDifficulty || 1;

    // Step 5: Find parent topic
    const parentTopic = this.exam.topics.find(topic => 
      topic.subTopics.some(st => st.id === subtopicId)
    );
    if (!parentTopic) {
      throw new Error(`Could not find parent topic for subtopic ${subtopicId}`);
    }

    // Step 6: Create and return parameters
    const params: QuestionFetchParams = {
      topic: parentTopic.id,
      subtopic: subtopicId,
      type: questionType,
      difficulty,
      subject: this.exam.subjectId,
      educationType: getExamInstitution(this.exam.examType),
      includeTestCases: filter.hasTestCases
    };

    console.log('FORCE LOG - ROTATION MANAGER final parameters:', {
      params,
      originalFilter: filter,
      selectedType: questionType,
      allowedTypes: this.exam.allowedQuestionTypes,
      filterTypes: filter.questionTypes,
      timestamp: new Date().toISOString()
    });

    return params;
  }

  public increaseDifficulty(subtopicId: string) {
    const progress = this.studentProgress.get(subtopicId);
    console.log('FORCE LOG - ROTATION MANAGER accessing difficulty map:', {
      action: 'increaseDifficulty',
      subtopicId,
      currentProgress: progress ? {
        currentDifficulty: progress.currentDifficulty,
        subtopicId: progress.subtopicId
      } : 'not found',
      currentIndex: this.currentSubtopicIndex
    });

    if (progress && progress.currentDifficulty < 5) {
      const oldDifficulty = progress.currentDifficulty;
      progress.currentDifficulty = Math.min(5, progress.currentDifficulty + 1) as DifficultyLevel;
      this.studentProgress.set(subtopicId, progress);
      
      // Decrease index by 1 to repeat the current subtopic with new difficulty
      this.currentSubtopicIndex = Math.max(-1, this.currentSubtopicIndex - 1);
      
      console.log('FORCE LOG - ROTATION MANAGER difficulty changed:', {
        action: 'increaseDifficulty',
        subtopicId,
        oldDifficulty,
        newDifficulty: progress.currentDifficulty,
        currentSubtopicIndex: this.currentSubtopicIndex,
        timestamp: new Date().toISOString()
      });
    }
  }

  public decreaseDifficulty(subtopicId: string) {
    const progress = this.studentProgress.get(subtopicId);
    console.log('FORCE LOG - ROTATION MANAGER accessing difficulty map:', {
      action: 'decreaseDifficulty',
      subtopicId,
      currentProgress: progress ? {
        currentDifficulty: progress.currentDifficulty,
        subtopicId: progress.subtopicId
      } : 'not found',
      currentIndex: this.currentSubtopicIndex
    });

    if (progress && progress.currentDifficulty > 1) {
      const oldDifficulty = progress.currentDifficulty;
      progress.currentDifficulty = Math.max(1, progress.currentDifficulty - 1) as DifficultyLevel;
      this.studentProgress.set(subtopicId, progress);
      
      // Decrease index by 1 to repeat the current subtopic with new difficulty
      this.currentSubtopicIndex = Math.max(-1, this.currentSubtopicIndex - 1);
      
      console.log('FORCE LOG - ROTATION MANAGER difficulty changed:', {
        action: 'decreaseDifficulty',
        subtopicId,
        oldDifficulty,
        newDifficulty: progress.currentDifficulty,
        currentSubtopicIndex: this.currentSubtopicIndex,
        timestamp: new Date().toISOString()
      });
    }
  }

  public getSubtopicProgress(subtopicId: string): StudentSubTopicProgress | undefined {
    const progress = this.studentProgress.get(subtopicId);
    console.log('FORCE LOG - ROTATION MANAGER accessing difficulty map:', {
      action: 'getSubtopicProgress',
      subtopicId,
      currentProgress: progress ? {
        currentDifficulty: progress.currentDifficulty,
        subtopicId: progress.subtopicId
      } : 'not found',
      timestamp: new Date().toISOString()
    });
    return progress;
  }

  public getAllProgress(): StudentSubTopicProgress[] {
    return Array.from(this.studentProgress.values());
  }
} 