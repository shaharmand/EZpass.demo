import { 
  Question, 
  DatabaseQuestion, 
  PublicationStatusEnum,
  PublicationMetadata,
  ValidationStatus,
  ReviewStatusEnum,
  ReviewMetadata,
  AIGeneratedFields,
  ImportInfo,
  QuestionType,
  SourceType,
  EzpassCreatorType,
  SaveQuestion,
  DEFAULT_PUBLICATION_METADATA,
  DEFAULT_REVIEW_METADATA,
  DEFAULT_AI_GENERATED_FIELDS
} from '../../types/question';
import { CreateQuestion, QuestionRepository, DatabaseOperation, IQuestionListItem } from '../../types/storage';
import { logger } from '../../utils/logger';
import { generateQuestionId } from '../../utils/idGenerator';
import { getSupabase } from '../../lib/supabase';
import { universalTopicsV2 } from '../../services/universalTopics';
import { v4 as uuidv4 } from 'uuid';
import { isValidQuestionType, DEFAULT_QUESTION_TYPE, isValidDifficultyLevel, DEFAULT_DIFFICULTY_LEVEL, isValidSourceType, DEFAULT_SOURCE_TYPE, isValidCreatorType, DEFAULT_CREATOR_TYPE } from '../../types/question';
import { validateQuestion } from '../../utils/questionValidator';
import { SupabaseClient } from '@supabase/supabase-js';

interface QuestionFilters {
  subject?: string;
  domain?: string;
  topic?: string;
  type?: string;
  difficulty?: number;
  searchText?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  validationStatus?: ValidationStatus | null;
  subtopic?: string;
  publicationStatus?: PublicationStatusEnum | null;
}

interface QuestionRow {
  id: string;
  data: Question;
  publication_status: PublicationStatusEnum;
  publication_metadata: PublicationMetadata;
  validation_status: ValidationStatus;
  review_status: ReviewStatusEnum;
  review_metadata: ReviewMetadata;
  ai_generated_fields: AIGeneratedFields;
  import_info?: ImportInfo;
  created_at: string;
  updated_at: string;
}

interface QuestionStatistics {
  publication: {
    published: number;
    draft: number;
  };
  review: {
    pending: number;
    total: number;
  };
  validation: {
    error: number;
    warning: number;
    valid: number;
  };
}

export class QuestionStorage implements QuestionRepository {
  private questionsCache: Map<string, DatabaseQuestion> = new Map();
  private initialized: boolean = false;
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient | null) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    this.supabase = supabaseClient;
  }

  private isExamSource(source: any): source is { type: 'exam'; examTemplateId: string; year: number; season: 'spring' | 'summer'; moed: 'a' | 'b'; order?: number } {
    return source?.type === 'exam';
  }

  private isEzpassSource(source: any): source is { type: 'ezpass'; creatorType: EzpassCreatorType } {
    return source?.type === 'ezpass';
  }

  /**
   * Validates and normalizes question data
   * Ensures all required fields are present and valid
   * Sets default values for invalid fields
   * @throws {Error} if question data is invalid
   */
  private validateQuestionData(questionData: any): asserts questionData is Question {
    const validationChanges: Array<{field: string, originalValue: any, newValue: any}> = [];

    if (!questionData?.metadata) {
      throw new Error('Question metadata is required');
    }

    // Validate question type
    if (!questionData.metadata.type) {
      throw new Error('Question type is required');
    }
    
    if (!isValidQuestionType(questionData.metadata.type)) {
      validationChanges.push({
        field: 'type',
        originalValue: questionData.metadata.type,
        newValue: DEFAULT_QUESTION_TYPE
      });
      logger.warn('Invalid question type detected', {
        questionId: questionData.id,
        originalType: questionData.metadata.type,
        defaultedTo: DEFAULT_QUESTION_TYPE,
        validTypes: Object.values(QuestionType)
      });
      questionData.metadata.type = DEFAULT_QUESTION_TYPE;
    }

    // Validate difficulty level
    if (!isValidDifficultyLevel(questionData.metadata.difficulty)) {
      validationChanges.push({
        field: 'difficulty',
        originalValue: questionData.metadata.difficulty,
        newValue: DEFAULT_DIFFICULTY_LEVEL
      });
      logger.warn('Invalid difficulty level detected', {
        questionId: questionData.id,
        originalDifficulty: questionData.metadata.difficulty,
        defaultedTo: DEFAULT_DIFFICULTY_LEVEL,
        validRange: '1-5'
      });
      questionData.metadata.difficulty = DEFAULT_DIFFICULTY_LEVEL;
    }

    // Validate source information
    if (!questionData.metadata.source) {
      validationChanges.push({
        field: 'source',
        originalValue: null,
        newValue: { type: DEFAULT_SOURCE_TYPE, creatorType: DEFAULT_CREATOR_TYPE }
      });
      logger.warn('Missing source information', {
        questionId: questionData.id,
        defaultedTo: { type: DEFAULT_SOURCE_TYPE, creatorType: DEFAULT_CREATOR_TYPE }
      });
      questionData.metadata.source = {
        type: DEFAULT_SOURCE_TYPE,
        creatorType: DEFAULT_CREATOR_TYPE
      };
    } else {
      // Validate source type
      if (!isValidSourceType(questionData.metadata.source.type)) {
        validationChanges.push({
          field: 'source.type',
          originalValue: questionData.metadata.source.type,
          newValue: DEFAULT_SOURCE_TYPE
        });
        logger.warn('Invalid source type detected', {
          questionId: questionData.id,
          originalSourceType: questionData.metadata.source.type,
          defaultedTo: DEFAULT_SOURCE_TYPE,
          validTypes: ['exam', 'ezpass']
        });
        questionData.metadata.source.type = DEFAULT_SOURCE_TYPE;
      }

      // Validate creator type for ezpass questions
      if (questionData.metadata.source.type === 'ezpass') {
        if (!isValidCreatorType(questionData.metadata.source.creatorType)) {
          validationChanges.push({
            field: 'source.creatorType',
            originalValue: questionData.metadata.source.creatorType,
            newValue: DEFAULT_CREATOR_TYPE
          });
          logger.warn('Invalid creator type detected for ezpass question', {
            questionId: questionData.id,
            originalCreatorType: questionData.metadata.source.creatorType,
            defaultedTo: DEFAULT_CREATOR_TYPE,
            validTypes: ['ai', 'human']
          });
          questionData.metadata.source.creatorType = DEFAULT_CREATOR_TYPE;
        }
      }
    }

    // Log all changes made during validation if any occurred
    if (validationChanges.length > 0) {
      logger.warn('Question data was modified during validation', {
        questionId: questionData.id,
        changes: validationChanges,
        timestamp: new Date().toISOString()
      });
    }

    // Validate required fields
    if (!questionData.metadata.topicId) {
      throw new Error('Topic ID is required');
    }

    if (!questionData.metadata.subtopicId) {
      throw new Error('Subtopic ID is required');
    }

    // Validate topic hierarchy
    const hierarchyValidation = universalTopicsV2.validateTopicHierarchy({
      subjectId: questionData.metadata.subjectId,
      domainId: questionData.metadata.domainId,
      topicId: questionData.metadata.topicId,
      subtopicId: questionData.metadata.subtopicId
    });

    if (!hierarchyValidation.isValid) {
      throw new Error(`Invalid topic hierarchy: ${hierarchyValidation.error}`);
    }

    if (!questionData.content?.text) {
      throw new Error('Question content is required');
    }

    // Validate answer structure based on question type
    if (!questionData.schoolAnswer) {
      throw new Error('Question schoolAnswer is required');
    }

    switch (questionData.metadata.type) {
      case QuestionType.MULTIPLE_CHOICE:
        if (!questionData.content.options?.length || questionData.content.options.length !== 4) {
          throw new Error('Multiple choice questions must have exactly 4 options');
        }
        if (!questionData.schoolAnswer.finalAnswer || questionData.schoolAnswer.finalAnswer.type !== 'multiple_choice') {
          throw new Error('Multiple choice questions must have a multiple choice answer');
        }
        break;

      case QuestionType.NUMERICAL:
        if (!questionData.schoolAnswer.finalAnswer || questionData.schoolAnswer.finalAnswer.type !== 'numerical') {
          throw new Error('Numerical questions must have a numerical answer');
        }
        break;

      case QuestionType.OPEN:
        if (!questionData.schoolAnswer.solution?.text) {
          logger.warn('Open question missing solution text', {
            questionId: questionData.id,
            impact: 'This may affect evaluation quality'
          });
        }
        break;
    }
  }

  private async initializeStorage(): Promise<void> {
    if (this.initialized) return;

    try {
      const { data: questions, error } = await this.supabase
        .from('questions')
        .select('*') as { data: QuestionRow[] | null, error: any };

      if (error) {
        console.error('Failed to load questions from database:', error);
        throw error;
      }

      if (!questions) {
        console.warn('No questions found in database');
        this.questionsCache.clear();
        this.initialized = true;
        return;
      }

      // Clear existing cache and update with questions from database
      this.questionsCache.clear();
      questions.forEach(row => {
        // Validate and normalize the data
        this.validateQuestionData(row.data);

        const question: DatabaseQuestion = {
          ...row.data,
          id: row.id,
          publication_status: row.publication_status,
          publication_metadata: row.publication_metadata,
          validation_status: row.validation_status,
          review_status: row.review_status,
          review_metadata: row.review_metadata,
          ai_generated_fields: row.ai_generated_fields,
          import_info: row.import_info || undefined,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
        this.questionsCache.set(question.id, question);
      });

      console.log(`Loaded ${questions.length} questions from database`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeStorage();
    }
  }

  async getAllQuestions(): Promise<DatabaseQuestion[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values()).map(question => {
      // Ensure question type is properly cast to QuestionType enum
      const questionData = { ...question };
      questionData.metadata.type = questionData.metadata.type as QuestionType;
      return questionData;
    });
  }

  async getQuestionsList(): Promise<IQuestionListItem[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values())
      .filter(q => q.metadata.source && 
                   q.metadata.subjectId && 
                   q.metadata.domainId && 
                   q.metadata.topicId && 
                   q.metadata.subtopicId && 
                   q.created_at && 
                   q.updated_at &&
                   q.review_status)
      .map(q => {
        // Log errors for missing required data - these are fundamental data integrity requirements
        if (!q.metadata.source || 
            !q.metadata.subjectId || 
            !q.metadata.domainId || 
            !q.metadata.topicId || 
            !q.metadata.subtopicId || 
            !q.created_at || 
            !q.updated_at ||
            !q.review_status) {
          console.error('❌ Question missing required data - data integrity issue:', {
            questionId: q.id,
            missingFields: {
              source: !q.metadata.source,
              subjectId: !q.metadata.subjectId,
              domainId: !q.metadata.domainId,
              topicId: !q.metadata.topicId,
              subtopicId: !q.metadata.subtopicId,
              created_at: !q.created_at,
              updated_at: !q.updated_at,
              review_status: !q.review_status
            }
          });
        }

        // Ensure question type is properly cast to QuestionType enum
        const type = q.metadata.type as QuestionType;
        
        // Handle source field according to interface requirements
        const source = this.isExamSource(q.metadata.source)
          ? {
              type: SourceType.EXAM as const,
              examTemplateId: q.metadata.source!.examTemplateId,
              year: q.metadata.source!.year,
              season: q.metadata.source!.season,
              moed: q.metadata.source!.moed,
              ...(q.metadata.source!.order ? { order: q.metadata.source!.order } : {})
            }
          : {
              type: SourceType.EZPASS as const,
              creatorType: q.metadata.source!.creatorType
            };

        return {
          id: q.id,
          title: q.name || q.content.text.substring(0, 50) + '...',
          content: q.content.text,
          metadata: {
            subjectId: q.metadata.subjectId!,
            domainId: q.metadata.domainId!,
            topicId: q.metadata.topicId!,
            subtopicId: q.metadata.subtopicId!,
            type,
            difficulty: q.metadata.difficulty,
            estimatedTime: q.metadata.estimatedTime,
            source
          },
          publication_status: q.publication_status,
          validation_status: q.validation_status,
          review_status: q.review_status,
          created_at: q.created_at!,
          updated_at: q.updated_at!
        };
      });
  }

  private mapDatabaseRowToQuestion(row: QuestionRow): DatabaseQuestion {
    return {
      ...row.data,
      id: row.id,
      publication_status: row.publication_status,
      publication_metadata: row.publication_metadata || DEFAULT_PUBLICATION_METADATA,
      validation_status: row.validation_status,
      review_status: row.review_status,
      review_metadata: row.review_metadata || DEFAULT_REVIEW_METADATA,
      ai_generated_fields: row.ai_generated_fields || DEFAULT_AI_GENERATED_FIELDS,
      import_info: row.import_info,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async getQuestion(id: string): Promise<DatabaseQuestion | null> {
    try {
      // Log the query being made
      console.log(`Getting question ${id} with all fields including import_info`);
      
      const { data: row, error } = await this.supabase
        .from('questions')
        .select('*, import_info')  // Explicitly include import_info in the selection
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching question:', error);
        throw error;
      }
      if (!row) return null;

      // Log what we got from the database
      console.log('Question data from DB:', {
        id: row.id,
        hasImportInfo: !!row.import_info,
        importInfo: row.import_info
      });

      return this.mapDatabaseRowToQuestion(row as QuestionRow);
    } catch (error) {
      console.error('Error getting question:', error);
      throw error;
    }
  }

  /**
   * Validates a question ID format
   * Expected format: {subjectId}-{domainId}-{number}
   */
  private validateQuestionId(id: string): boolean {
    // Basic format check: subject-domain-number
    const pattern = /^[a-z_]+-[a-z_]+-\d{6}$/;
    if (!pattern.test(id)) {
      return false;
    }

    // Extract parts
    const [subjectId, domainId] = id.split('-');

    // Check if subject and domain are valid
    const validPartPattern = /^[a-z_]+$/;
    if (!validPartPattern.test(subjectId) || !validPartPattern.test(domainId)) {
      return false;
    }

    return true;
  }

  /**
   * Validates subject and domain ID format
   * Expected format: lowercase letters and underscores only
   */
  private validateSubjectDomainId(id: string): boolean {
    const validPartPattern = /^[a-z_]+$/;
    return validPartPattern.test(id);
  }

  /**
   * Validates question content and structure
   * @throws {Error} if question data is invalid
   * @returns {ValidationStatus} The validation status from the external validator
   */
  private async validateQuestionContent(data: Question): Promise<ValidationStatus> {
    if (!data) {
      throw new Error('Question data is required');
    }

    if (!data.id) {
      throw new Error('Question ID is required for validation');
    }

    // Run external validation which handles all content validation
    const validationResult = await validateQuestion(data);
    return validationResult.status;
  }

  /**
   * Checks if a question exists in the database
   * @returns {Promise<boolean>} true if question exists, false otherwise
   * @throws {Error} if there's a database error
   */
  private async checkQuestionExists(questionId: string): Promise<boolean> {
      const { data: existingQuestion, error: fetchError } = await this.supabase
        .from('questions')
        .select('id')
        .eq('id', questionId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw fetchError;
    }

    return !!existingQuestion;
  }

  /**
   * Validates a question for creation
   * @throws {Error} if validation fails
   * @returns {ValidationStatus} The validation status
   */
  private async validateQuestionForCreation(questionId: string, data: Question): Promise<ValidationStatus> {
    // Validate ID format
    if (!this.validateQuestionId(questionId)) {
      throw new Error(`Invalid question ID format: ${questionId}. Expected format: {subjectId}-{domainId}-{number}`);
    }

    // Check if question already exists - should not exist for creation
    const exists = await this.checkQuestionExists(questionId);
    if (exists) {
      throw new Error(`Question ${questionId} already exists`);
    }

    // Validate question content
    return await this.validateQuestionContent(data);
  }

  /**
   * Validates a question that must exist in the database
   * @throws {Error} if validation fails
   * @returns {ValidationStatus} The validation status
   */
  private async validateQuestionForExistingQuestion(questionId: string, data?: Question): Promise<ValidationStatus | undefined> {
    // Validate ID format
    if (!this.validateQuestionId(questionId)) {
      throw new Error(`Invalid question ID format: ${questionId}. Expected format: {subjectId}-{domainId}-{number}`);
    }

    // Check if question exists - must exist
    const exists = await this.checkQuestionExists(questionId);
    if (!exists) {
      throw new Error(`Question ${questionId} does not exist`);
    }

    // Validate question content if provided
    if (data) {
      return await this.validateQuestionContent(data);
    }

    return undefined;
  }

  /**
   * Common handling of JSON fields for question operations
   */
  private prepareQuestionFields(question: Partial<DatabaseOperation>): Record<string, any> {
    const operation: Record<string, any> = {
      id: question.id,
      data: question.data,
      publication_status: question.publication_status,
      validation_status: question.validation_status,
      review_status: question.review_status
    };

    // Handle publication_metadata with proper structure
    if (question.publication_metadata) {
      operation.publication_metadata = {
        publishedAt: question.publication_metadata.publishedAt,
        publishedBy: question.publication_metadata.publishedBy,
        archivedAt: question.publication_metadata.archivedAt,
        archivedBy: question.publication_metadata.archivedBy,
        reason: question.publication_metadata.reason
      };
    }

    // Handle review_metadata with proper structure
    if (question.review_metadata?.reviewedAt && question.review_metadata?.reviewedBy) {
      operation.review_metadata = {
        reviewedAt: question.review_metadata.reviewedAt,
        reviewedBy: question.review_metadata.reviewedBy,
        comments: question.review_metadata.comments
      };
    }

    // Handle other JSON fields
    if (question.ai_generated_fields) {
      operation.ai_generated_fields = question.ai_generated_fields;
    }

    if (question.import_info) {
      operation.import_info = question.import_info;
    }

    return operation;
  }

  /**
   * Common error handling and logging for question operations
   */
  private async executeQuestionOperation(
    operation: 'create' | 'save',
    questionId: string,
    operationFn: () => Promise<any>,
    additionalContext: Record<string, any> = {}
  ): Promise<void> {
    try {
      await operationFn();
      logger.debug(`Successfully ${operation}d question`, {
        questionId,
        ...additionalContext
      });
    } catch (error) {
      logger.error(`Failed to ${operation} question:`, {
        questionId,
        error,
        ...additionalContext
      });
      throw error;
    }
  }

  /**
   * Generates a unique question ID based on subject and domain
   */
  private async generateUniqueQuestionId(subjectId: string, domainId: string): Promise<string> {
    // Get the 3-letter codes for subject and domain
    const subjectCode = universalTopicsV2.getSubjectCode(subjectId);
    const domainCode = universalTopicsV2.getDomainCode(domainId);

    let questionId = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const nextNumber = await this.getNextQuestionId(subjectId, domainId);
      questionId = `${subjectCode}-${domainCode}-${String(nextNumber).padStart(6, '0')}`;

      const { data: existingQuestion, error: fetchError } = await this.supabase
        .from('questions')
        .select('id')
        .eq('id', questionId)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        isUnique = true;
      } else if (fetchError) {
        throw fetchError;
      }

      attempts++;
    }

    if (!isUnique) {
      throw new Error(`Failed to generate unique question ID after ${maxAttempts} attempts`);
    }

    return questionId;
  }

  /**
   * Prepares a question for creation with default values
   */
  private async prepareQuestionForCreation(question: CreateQuestion): Promise<{
    questionId: string;
    newQuestion: Record<string, any>;
    validationStatus: ValidationStatus;
  }> {
    if (!question.question) {
      throw new Error('Question data is required for creation');
    }

    // Get subject and domain IDs from question data
    const subjectId = question.question.metadata.subjectId;
    const domainId = question.question.metadata.domainId;

    // Generate the question ID - the ID generator will handle validation
    const questionId = await this.generateUniqueQuestionId(subjectId, domainId);

    // Create a new question data object with the generated ID
    const questionData = {
      ...question.question,
      id: questionId
    };

    // Validate the question for creation
    const validationStatus = await this.validateQuestionForCreation(questionId, questionData);
    
    // Prepare the question with all fields
    const newQuestion = this.prepareQuestionFields({
      ...question,
      id: questionId,
      data: questionData,
      validation_status: validationStatus,
      review_status: ReviewStatusEnum.PENDING_REVIEW,
      publication_status: PublicationStatusEnum.DRAFT
    });

    return { questionId, newQuestion, validationStatus };
  }

  /**
   * Prepares a question for update with only provided fields
   */
  private async prepareQuestionForUpdate(
    questionId: string,
    updates: {
      data?: Question;
      publication_status?: PublicationStatusEnum;
      validation_status?: ValidationStatus;
      review_status?: ReviewStatusEnum;
      ai_generated_fields?: AIGeneratedFields;
    }
  ): Promise<Record<string, any>> {
    // Get the current question to validate if needed
    const currentQuestion = await this.getQuestion(questionId);
    if (!currentQuestion) {
      throw new Error(`Question ${questionId} not found`);
    }

    // Only validate and update validation status if new content is provided
    let validationStatus = updates.validation_status;
    if (updates.data) {
      validationStatus = await this.validateQuestionContent(updates.data);
    }

    // Prepare the update data
    return this.prepareQuestionFields({
      id: questionId,
      ...updates,
      validation_status: validationStatus
    });
  }

  /**
   * Prepares a question for saving with all fields
   */
  private async prepareQuestionForSave(question: DatabaseOperation): Promise<Record<string, any>> {
    // Validate that the question exists and get its current state
    const currentQuestion = await this.getQuestion(question.id);
    if (!currentQuestion) {
      throw new Error(`Question ${question.id} does not exist. Use createQuestion for new questions.`);
    }

    // Only validate content if new data is provided
    let validationStatus = question.validation_status;
    if (question.data) {
      // Ensure data has the correct ID
      const completeQuestion = {
        ...question.data,
        id: question.id
      };
      validationStatus = await this.validateQuestionContent(completeQuestion);
    }

    // Remove import_info from save operation to prevent modification
    const { import_info, ...saveData } = question;

    // Prepare the save data
    return {
      ...this.prepareQuestionFields({
        ...saveData,
        validation_status: validationStatus
      }),
      updated_at: new Date().toISOString()
    };
  }

  async createQuestion(question: CreateQuestion): Promise<DatabaseQuestion> {
    // Validate required fields
    if (!question.question) {
      throw new Error('Question data is required for creation');
    }

    // Generate the question ID first
    const questionId = await this.generateUniqueQuestionId(question.question.metadata.subjectId, question.question.metadata.domainId);

    // Create a complete question with the generated ID
    const questionWithId = {
      ...question.question,
      id: questionId
    };

    // Run validation with the complete question
    const validationStatus = await this.validateQuestionContent(questionWithId);

    // Log the incoming question data
    console.log('📝 Creating new question with data:', JSON.stringify(question, null, 2));

    // Prepare the question data for database insertion
    const questionData: DatabaseOperation = {
      id: questionId,
      data: questionWithId,
      publication_status: PublicationStatusEnum.DRAFT,
      validation_status: validationStatus,
      review_status: ReviewStatusEnum.PENDING_REVIEW,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Required ImportInfo fields for a generated question
      import_info: question.import_info || {
        system: 'ezpass',
        originalId: questionId,
        importedAt: new Date().toISOString()
      }
    };

    // Execute the operation
    await this.executeQuestionOperation('create', questionData.id, async () => {
      const { error } = await this.supabase
        .from('questions')
        .insert(questionData);
      if (error) throw error;
    }, {
      validationStatus: questionData.validation_status,
      hasImportInfo: !!question.import_info
    });

    // Return the full question data
    const createdQuestion = await this.getQuestion(questionData.id);
    if (!createdQuestion) {
      throw new Error(`Failed to retrieve created question ${questionData.id}`);
    }

    return createdQuestion;
  }

  async updateQuestion(
    questionId: string, 
    updates: {
      data?: Question;
      publication_status?: PublicationStatusEnum;
      validation_status?: ValidationStatus;
      review_status?: ReviewStatusEnum;
      ai_generated_fields?: AIGeneratedFields;
    }
  ): Promise<void> {
    // Prepare the update data
    const updateData = await this.prepareQuestionForUpdate(questionId, updates);

    // Execute the operation
    await this.executeQuestionOperation('save', questionId, async () => {
      const { error } = await this.supabase.rpc('update_question_partial', {
        p_id: questionId,
        p_data: updateData
      });
      if (error) throw error;
    }, {
      updatedFields: Object.keys(updateData)
    });
  }

  async saveQuestion(question: SaveQuestion): Promise<void> {
    // Prevent saving test questions
    if (question.id.startsWith('test_')) {
      logger.warn('Attempted to save test question - skipping', {
        questionId: question.id
      });
      return;
    }

    // Validate that all required fields are present
    if (!question.data) {
      throw new Error('Question data is required for saving');
    }
    if (!question.publication_status) {
      throw new Error('Publication status is required for saving');
    }
    if (!question.validation_status) {
      throw new Error('Validation status is required for saving');
    }
    if (!question.review_status) {
      throw new Error('Review status is required for saving');
    }

    // Get the current question to preserve import_info
    const currentQuestion = await this.getQuestion(question.id);
    if (!currentQuestion) {
      throw new Error(`Question ${question.id} does not exist. Use createQuestion for new questions.`);
    }

    // Prepare the operation data with ONLY the fields that should trigger DB updates
    const operationData: DatabaseOperation = {
      id: question.id,
      data: question.data,
      publication_status: question.publication_status,
      validation_status: question.validation_status,
      review_status: question.review_status,
      // Always include import_info from the current question
      import_info: currentQuestion.import_info,
      // Explicitly exclude metadata fields to ensure DB triggers handle them:
      // - publication_metadata (handled by DB trigger)
      // - review_metadata (handled by DB trigger)
      // - ai_generated_fields (handled by DB trigger)
      updated_at: new Date().toISOString()
    };

    // Execute the operation
    await this.executeQuestionOperation('save', question.id, async () => {
      const { error } = await this.supabase
        .from('questions')
        .upsert(operationData);
      if (error) throw error;
    });
  }

  // Update the bulk update method to use the same explicit type
  async updateQuestions(updates: Array<{ 
    id: string; 
    updates: {
      data?: Question;
      publication_status?: PublicationStatusEnum;
      validation_status?: ValidationStatus;
      review_status?: ReviewStatusEnum;
      ai_generated_fields?: AIGeneratedFields;
    }
  }>): Promise<void> {
    await Promise.all(updates.map(({ id, updates }) => this.updateQuestion(id, updates)));
  }

  async updateQuestionStatus(questionId: string, newStatus: PublicationStatusEnum, metadata?: PublicationMetadata): Promise<void> {
    await this.ensureInitialized();

    try {
      const updateData: {
        publication_status: PublicationStatusEnum;
        publication_metadata: PublicationMetadata;
      } = {
        publication_status: newStatus,
        publication_metadata: DEFAULT_PUBLICATION_METADATA
      };

      // Add metadata for published/archived status
      if (newStatus === PublicationStatusEnum.PUBLISHED) {
        updateData.publication_metadata = {
          publishedAt: new Date().toISOString(),
          publishedBy: metadata?.publishedBy || 'admin', // TODO: Get actual user
          archivedAt: undefined,
          archivedBy: undefined,
          reason: undefined
        };
      } else if (newStatus === PublicationStatusEnum.ARCHIVED) {
        updateData.publication_metadata = {
          publishedAt: undefined,
          publishedBy: undefined,
          archivedAt: new Date().toISOString(),
          archivedBy: metadata?.archivedBy || 'admin', // TODO: Get actual user
          reason: metadata?.reason
        };
      }

      const { error } = await this.supabase
        .from('questions')
        .update(updateData)
        .eq('id', questionId);

      if (error) throw error;

      // Update cache
      const question = this.questionsCache.get(questionId);
      if (question) {
        question.publication_status = newStatus;
        question.publication_metadata = updateData.publication_metadata;
        this.questionsCache.set(questionId, question);
      }

      console.log(`Updated status of question ${questionId} to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update question status:', error);
      throw new Error('Failed to update question status');
    }
  }

  async deleteQuestion(questionId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const { error } = await this.supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      // Remove from cache
      this.questionsCache.delete(questionId);
      console.log(`Deleted question ${questionId} from database`);
    } catch (error) {
      console.error('Failed to delete question:', error);
      throw new Error('Failed to delete question from database');
    }
  }

  async getFilteredQuestions(filters: QuestionFilters): Promise<DatabaseQuestion[]> {
    try {
      let query = this.supabase
        .from('questions')
        .select('*');

      // Apply filters
      if (filters.publicationStatus) {
        query = query.eq('publication_status', filters.publicationStatus);
      }

      if (filters.validationStatus) {
        query = query.eq('validation_status', filters.validationStatus);
      }

      // Handle topic hierarchy filtering
      if (filters.subject || filters.domain || filters.topic) {
        console.log('🔍 FILTER PARAMS:', {
          filters,
          timestamp: new Date().toISOString()
        });
        
        if (filters.subject) {
          query = query.eq('data->metadata->>subjectId', filters.subject);
        }
        
        if (filters.domain) {
          query = query.eq('data->metadata->>domainId', filters.domain);
        }
        
        if (filters.topic) {
          console.log('🔍 APPLYING TOPIC FILTER:', {
            topic: filters.topic,
            path: 'data->metadata->>topicId',
            timestamp: new Date().toISOString()
          });
          query = query.eq('data->metadata->>topicId', filters.topic);
        }

        if (filters.subtopic) {
          query = query.eq('data->metadata->>subtopicId', filters.subtopic);
        }
      }

      if (filters.type) {
        console.log('🔍 APPLYING TYPE FILTER:', {
          type: filters.type,
          path: 'data->metadata->>type',
          timestamp: new Date().toISOString()
        });
        query = query.eq('data->metadata->>type', filters.type);
      }

      if (filters.difficulty) {
        query = query.eq('data->metadata->>difficulty', filters.difficulty);
      }

      if (filters.searchText) {
        query = query.or(`data->content->>text.ilike.%${filters.searchText}%,id.ilike.%${filters.searchText}%`);
      }

      // Add date range filtering if provided
      if (filters.dateRange?.start) {
        query = query.gte('created_at', filters.dateRange.start.toISOString());
      }
      if (filters.dateRange?.end) {
        query = query.lte('created_at', filters.dateRange.end.toISOString());
      }

      // Add sorting
      if (filters.sortBy) {
        query = query.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc'
        });
      } else {
        // Default sort by created_at desc
        query = query.order('created_at', { ascending: false });
      }

      const { data: questions, error } = await query;

      if (error) throw error;

      if (!questions) return [];

      // Transform to DatabaseQuestion format
      return questions.map(row => ({
        ...row.data,
        id: row.id,
        publication_status: row.publication_status,
        publication_metadata: row.publication_metadata || undefined,
        validation_status: row.validation_status,
        review_status: row.review_status,
        created_at: row.created_at!,
        updated_at: row.updated_at!
      }));

    } catch (error) {
      console.error('Error in getFilteredQuestions:', error);
      throw new Error('Failed to fetch filtered questions');
    }
  }

  async getQuestionsNeedingAttention(): Promise<DatabaseQuestion[]> {
    const filters: QuestionFilters = {
      validationStatus: ValidationStatus.WARNING
    };
    return this.getFilteredQuestions(filters);
  }

  async getQuestions(): Promise<DatabaseQuestion[]> {
    try {
      const { data: rows, error } = await this.supabase
        .from('questions')
        .select('*');

      if (error) throw error;
      if (!rows) return [];

      return (rows as QuestionRow[]).map(row => this.mapDatabaseRowToQuestion(row));
    } catch (error) {
      console.error('Error getting questions:', error);
      throw error;
    }
  }

  async getNextQuestionId(subjectId: string, domainId: string): Promise<number> {
    const { data: questions, error } = await this.supabase
      .from('questions')
      .select('id')
      .like('id', `${universalTopicsV2.getSubjectCode(subjectId)}-${universalTopicsV2.getDomainCode(domainId)}-%`);

    if (error) {
      logger.error('Error getting next question ID:', error);
      throw error;
    }

    // If no questions exist, start from 1
    if (!questions || questions.length === 0) {
      return 1;
    }

    // Extract numbers from IDs and find max
    const numbers = questions.map(q => {
      const match = q.id.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    return Math.max(...numbers) + 1;
  }

  async getQuestionStatistics(): Promise<QuestionStatistics> {
    const { data: questions, error } = await this.supabase
      .from('questions')
      .select('publication_status, review_status, validation_status');

    if (error) {
      console.error('Failed to load question statistics:', error);
      throw error;
    }

    const stats: QuestionStatistics = {
      publication: {
        published: 0,
        draft: 0
      },
      review: {
        pending: 0,
        total: 0
      },
      validation: {
        error: 0,
        warning: 0,
        valid: 0
      }
    };

    questions?.forEach(q => {
      // Publication stats
      if (q.publication_status === PublicationStatusEnum.PUBLISHED) {
        stats.publication.published++;
      } else {
        stats.publication.draft++;
      }

      // Review stats
      if (q.review_status === 'PENDING_REVIEW') {
        stats.review.pending++;
      }
      stats.review.total++;

      // Validation stats
      switch (q.validation_status) {
        case ValidationStatus.ERROR:
          stats.validation.error++;
          break;
        case ValidationStatus.WARNING:
          stats.validation.warning++;
          break;
        case ValidationStatus.VALID:
          stats.validation.valid++;
          break;
      }
    });

    return stats;
  }

  async saveQuestions(questions: DatabaseOperation[]): Promise<void> {
    try {
      // Filter out test questions
      const filteredQuestions = questions.filter(q => !q.id.startsWith('test_'));

      // Validate and prepare questions
      const operations = await Promise.all(filteredQuestions.map(async (question) => {
        // Validate the data field if it exists
        if (question.data) {
          // Ensure data has the correct ID
          const completeQuestion = {
            ...question.data,
            id: question.id
          };
          const validationResult = await validateQuestion(completeQuestion);
          
          // Use the status directly from validation result
          question.validation_status = validationResult.status;
        }

        // Prepare base operation with required fields
        const operation: Record<string, any> = {
          id: question.id,
          data: question.data,
          publication_status: question.publication_status,
          validation_status: question.validation_status,
          review_status: question.review_status
        };

        // Only include JSON fields if they exist
        if (question.publication_metadata) {
          operation.publication_metadata = question.publication_metadata;
        }
        if (question.review_metadata) {
          operation.review_metadata = question.review_metadata;
        }
        if (question.ai_generated_fields) {
          operation.ai_generated_fields = question.ai_generated_fields;
        }

        return operation;
      }));

      // Save all questions in a single transaction
      const { error } = await this.supabase
        .from('questions')
        .upsert(operations);

      if (error) {
        logger.error('Failed to save questions:', {
          error: error.message,
          count: operations.length
        });
        throw error;
      }

      logger.debug('Successfully saved questions', {
        count: operations.length
      });
    } catch (error) {
      logger.error('Failed to save questions:', error);
      throw error;
    }
  }
}

export const questionStorage = new QuestionStorage(getSupabase()); 