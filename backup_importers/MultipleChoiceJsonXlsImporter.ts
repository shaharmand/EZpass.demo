import { 
  Question, 
  QuestionType, 
  DifficultyLevel,
  SourceType,
  EzpassCreatorType,
  ValidationStatus,
  PublicationStatusEnum,
  ReviewStatusEnum,
  SaveQuestion,
  DatabaseQuestion
} from '../../../types/question';
import { questionStorage, QuestionStorage } from '../questionStorage';
import { logger } from '../../../utils/logger';
import { BaseImporter, ImportResult, BatchImportResult, ImportStats } from './BaseImporter';
import { universalTopics } from '../../universalTopics';
import { Topic, SubTopic } from '../../../types/subject';
import { validateQuestion, ValidationError } from '../../../utils/questionValidator';
import { examService } from '../../../services/examService';
import { generateQuestionId, validateQuestionId } from '../../../utils/idGenerator';
import { CategoryMapper } from './utils/CategoryMapper';
import { CreateQuestion } from '../../../types/storage';
import fs from 'fs';
import chalk from 'chalk';
import xlsx from 'xlsx';

interface MultipleChoiceQuestion {
  _id: number;          // Post ID
  _dbId?: number;       // Database ID (if different)
  _title: string;
  _question: string;
  _correctMsg: string;
  _incorrectMsg: string;
  _answerType: string;
  _answerData: Array<{
    _answer: string;
    _correct: boolean;
    _html: boolean;
  }>;
  _category?: string;
  _createdAt?: string;
  _updatedAt?: string;
}

interface TopicMapping {
  subtopicId: string;
  topicId: string;
}

export class MultipleChoiceJsonXlsImporter extends BaseImporter {
    private questionStorage!: QuestionStorage;
    private isDryRun: boolean = false;

    constructor() {
        super('multiple-choice-json-xls');
    }

    public initialize(questionStorage: QuestionStorage, isDryRun: boolean = false) {
        this.questionStorage = questionStorage;
        this.isDryRun = isDryRun;
    }

    protected getQuestionIdentifier(sourceQuestion: MultipleChoiceQuestion): string {
        // If _id exists, use it
        if (sourceQuestion._id) {
            return sourceQuestion._id.toString();
        }
        // If _dbId exists, use it
        if (sourceQuestion._dbId) {
            return sourceQuestion._dbId.toString();
        }
        // Fallback to using title as identifier
        return sourceQuestion._title || 'unknown';
    }

    protected async validateQuestion(question: MultipleChoiceQuestion, isDryRun: boolean = false): Promise<string[]> {
        const errors: string[] = [];

        if (!question._title) errors.push('Missing title');
        if (!question._question) errors.push('Missing question content');
        if (!question._answerData || question._answerData.length === 0) errors.push('Missing answers');
        if (!question._category) errors.push('Missing category');

        // Validate that at least one answer is marked as correct
        const hasCorrectAnswer = question._answerData?.some(answer => answer._correct);
        if (!hasCorrectAnswer) errors.push('No correct answer marked');

        // Try to map category to validate it exists
        if (question._category) {
            try {
                CategoryMapper.mapCategoryToTopic(question._category);
            } catch (error) {
                errors.push(`Invalid category: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return errors;
    }

    protected async transformQuestion(question: MultipleChoiceQuestion, id?: string): Promise<Question> {
        // Extract exam info from title and question text
        const titleExamInfo = this.parseExamInfo(question._title);
        const questionExamInfo = this.parseExamInfo(question._question);

        // Combine exam info, preferring title info over question info
        const examInfo = {
            ...questionExamInfo,
            ...titleExamInfo
        };

        // Map category to topic structure
        const { topicId, subtopicId } = CategoryMapper.mapCategoryToTopic(question._category || '');

        // Use provided ID or generate a new one if not provided
        const questionId = id || await generateQuestionId('civil_engineering', 'construction_safety');
        
        const transformed: Question = {
            id: questionId,
            content: {
                text: question._question,
                format: 'markdown',
                options: question._answerData.map(answer => ({
                    text: answer._answer,
                    format: 'markdown'
                }))
            },
            schoolAnswer: {
                finalAnswer: {
                    type: 'multiple_choice',
                    value: (question._answerData.findIndex(a => a._correct) + 1) as 1 | 2 | 3 | 4
                },
                solution: {
                    text: question._correctMsg || 'No explanation provided',
                    format: 'markdown'
                }
            },
            metadata: {
                subjectId: 'civil_engineering',
                domainId: 'construction_safety',
                topicId,
                subtopicId,
                type: QuestionType.MULTIPLE_CHOICE,
                difficulty: 3,
                answerFormat: {
                    hasFinalAnswer: true,
                    finalAnswerType: 'multiple_choice',
                    requiresSolution: false
                },
                estimatedTime: 5,
                source: examInfo?.year ? {
                    type: 'exam',
                    examTemplateId: 'mahat_civil_safety',
                    year: examInfo.year,
                    season: examInfo.season || 'summer',
                    moed: examInfo.moed || 'a',
                    order: examInfo.order
                } : {
                    type: 'ezpass',
                    creatorType: EzpassCreatorType.HUMAN
                }
            },
            evaluationGuidelines: {
                requiredCriteria: [{
                    name: 'basic_correctness',
                    description: 'תשובה נכונה ומלאה',
                    weight: 100
                }]
            }
        };

        return transformed;
    }

    async importQuestions(questions: MultipleChoiceQuestion[], limit?: number): Promise<BatchImportResult> {
        const questionsToProcess = limit ? questions.slice(0, limit) : questions;
        console.log(`\nStarting import of ${questionsToProcess.length} questions...\n`);
        
        const results: BatchImportResult = {
            total: questionsToProcess.length,
            successful: 0,
            failed: 0,
            results: {},
            importerName: this.importerName
        };

        for (const question of questionsToProcess) {
            console.log(`\nProcessing question ${question._id}...`);
            const result = await this.importQuestion(question, this.isDryRun);
            const questionId = this.getQuestionIdentifier(question);
            results.results[questionId] = result;
            
            if (result.success) {
                results.successful++;
                console.log(`✅ Question ${question._id} imported successfully as ${result.questionId}`);
            } else {
                results.failed++;
                console.log(`❌ Question ${question._id} failed:`, result.errors);
            }
        }

        console.log('\n=== Import Summary ===');
        console.log(`✅ Successfully imported: ${results.successful} questions`);
        console.log(`❌ Failed imports: ${results.failed} questions`);

        return results;
    }

    async importQuestion(wpQuestion: MultipleChoiceQuestion, dryRun: boolean = false): Promise<ImportResult> {
        try {
            // Clean the data at entry point
            const cleanedQuestion = {
                ...wpQuestion,
                _question: this.cleanText(wpQuestion._question, true),
                _answerData: wpQuestion._answerData.map(answer => ({
                    ...answer,
                    _answer: this.cleanText(answer._answer, false)
                }))
            };

            // Transform the cleaned data
            const question = await this.transformQuestion(cleanedQuestion);

            // Validate the transformed question
            const validationResult = validateQuestion(question);
            if (validationResult.errors.length > 0) {
                return {
                    success: false,
                    errors: validationResult.errors.map(err => `${err.field}: ${err.message}`)
                };
            }

            // DRY RUN CHECK - Return early if dry run
            if (dryRun === true) {
                return {
                    success: true,
                    questionId: question.id,
                    warnings: ['Dry run mode - validation successful']
                };
            }

            // Create in database
            const createQuestion: CreateQuestion = {
                question: question,
                import_info: {
                    system: 'ezpass',
                    originalId: this.getQuestionIdentifier(wpQuestion),
                    importedAt: new Date().toISOString(),
                    additionalData: {
                        importSource: 'wordpress',
                        importType: 'wordpress-to-ezpass',
                        importerName: this.importerName,
                        originalTitle: wpQuestion._title,
                        originalCategory: wpQuestion._category
                    }
                }
            };

            await this.questionStorage.createQuestion(createQuestion);

            return {
                success: true,
                questionId: question.id
            };

        } catch (error) {
            logger.error(`Failed to import ${this.importerName} question`, {
                sourceId: this.getQuestionIdentifier(wpQuestion),
                error: error instanceof Error ? error.message : 'Unknown error',
                isDryRun: dryRun,
                stack: error instanceof Error ? error.stack : undefined
            });

            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Clean up text by removing Hebrew prefixes and whitespace
     */
    private cleanText(text: string, isQuestion: boolean = false): string {
        // Start with basic cleanup
        let cleaned = text.trim();

        // Remove exam info if it's a question
        if (isQuestion) {
            cleaned = cleaned.replace(/^\s*\[.*?\]\s*/m, '');
        }

        // Remove Hebrew prefixes if it's an option
        if (!isQuestion) {
            cleaned = cleaned.replace(/^[אבגד]\.?\t*\s*/gm, '');
        }

        // Clean up whitespace and tabs
        cleaned = cleaned
            .replace(/\t+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        return cleaned;
    }

    async importFromJson(jsonPath: string, mappingPath: string, limit?: number, isDryRun: boolean = false): Promise<ImportStats> {
        let categoryMap = new Map<string, string>();

        try {
            // Read category mappings from Excel file
            const workbook = xlsx.readFile(mappingPath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const mappings = xlsx.utils.sheet_to_json(worksheet) as Record<string, any>[];
            
            // Create mapping of question IDs to categories
            mappings.forEach((row: any) => {
                if (row.id && row.Category) {
                    categoryMap.set(row.id.toString(), row.Category);
                }
            });

            console.log(`Loaded ${categoryMap.size} category mappings from Excel`);
            if (categoryMap.size > 0) {
                console.log('First few mappings:', Array.from(categoryMap.entries()).slice(0, 2));
            }

            // Read and parse the JSON file
            const fileContent = await fs.promises.readFile(jsonPath, 'utf-8');
            
            interface JsonData {
                question?: { [key: string]: any };
                post?: { [key: string]: any };
                post_meta?: { [key: string]: any };
            }
            
            let jsonData: JsonData;
            let questions;
            
            try {
                jsonData = JSON.parse(fileContent);
                const questionMap = jsonData.question || {};
                const questionEntries = Object.entries(questionMap);
                
                if (!questionEntries.length) {
                    throw new Error('No questions found in the export file');
                }

                console.log('Found question entries:', questionEntries.length);

                // Extract the actual question data from the nested structure
                questions = questionEntries
                    .map(([key, value]: [string, any]) => {
                        const questionId = Object.keys(value)[0];
                        const questionData = value[questionId];
                        const postData = jsonData.post?.[questionId];

                        if (!questionData) {
                            console.log(`Missing data for question ${key}`);
                            return null;
                        }

                        // Get category by matching title
                        const title = questionData._title || questionData._question;
                        const category = categoryMap.get(questionId);
                        if (!category) {
                            console.log(`No category found for question ID: ${questionId}`);
                            return null;
                        }

                        return {
                            _id: questionData._id || parseInt(questionId),
                            _title: questionData._title || '',
                            _question: questionData._question || '',
                            _correctMsg: questionData._correctMsg || '',
                            _incorrectMsg: questionData._incorrectMsg || '',
                            _answerType: questionData._answerType || 'multiple-choice',
                            _answerData: Array.isArray(questionData._answerData) 
                                ? questionData._answerData 
                                : [],
                            _category: category,
                            _createdAt: postData?.post_date || questionData._createdAt,
                            _updatedAt: postData?.post_modified || questionData._updatedAt
                        } as MultipleChoiceQuestion;
                    })
                    .filter((q: unknown): q is MultipleChoiceQuestion => q !== null);

                console.log('\nQuestions data structure:', {
                    questionsFound: !!questions,
                    isArray: Array.isArray(questions),
                    length: questions?.length,
                    firstQuestionKeys: questions?.[0] ? Object.keys(questions[0]) : 'No questions found',
                    firstQuestionSample: questions?.[0] ? JSON.stringify(questions[0]).slice(0, 200) + '...' : 'No questions found'
                });

                if (!questions || !Array.isArray(questions) || questions.length === 0) {
                    throw new Error('No valid questions found in the JSON file');
                }
            } catch (error) {
                throw new Error(`Failed to extract questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Apply limit if specified
            const questionsToProcess = limit ? questions.slice(0, limit) : questions;
            console.log(chalk.blue(`\nProcessing ${questionsToProcess.length} questions${limit ? ` (from total of ${questions.length})` : ''}`));

            const stats = {
                total: questionsToProcess.length,
                successful: 0,
                failed: 0,
                byCategory: {} as { [key: string]: number }
            };

            for (const question of questionsToProcess) {
                const result = await this.importQuestion(question, isDryRun);
                if (result.success) {
                    stats.successful++;
                    if (question._category) {
                        stats.byCategory[question._category] = (stats.byCategory[question._category] || 0) + 1;
                    }
                } else {
                    stats.failed++;
                }
            }

            return stats;
        } catch (error) {
            throw new Error(`Failed to import from JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 