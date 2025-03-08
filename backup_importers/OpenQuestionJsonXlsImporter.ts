import { 
    Question, 
    QuestionType,
    EzpassCreatorType,
    ValidationStatus,
    PublicationStatusEnum,
    ReviewStatusEnum
} from '../../../types/question';
import { logger } from '../../../utils/logger';
import { BaseImporter, ImportResult } from './BaseImporter';
import { validateQuestion } from '../../../utils/questionValidator';
import { generateQuestionId } from '../../../utils/idGenerator';
import { CategoryMapper } from './utils/CategoryMapper';
import { CreateQuestion } from '../../../types/storage';
import { QuestionStorage } from '../questionStorage';

interface OpenQuestion {
    _id: number;          // Post ID
    _title: string;       // Title/exam info
    _question: string;    // Question text
    _correctMsg: string;  // Solution/correct message
    _category?: string;   // Category from Excel mapping
}

export class OpenQuestionJsonXlsImporter extends BaseImporter {
    private questionStorage: QuestionStorage;

    constructor(questionStorage: QuestionStorage) {
        super('open-question-json-xls');
        this.questionStorage = questionStorage;
    }

    protected getQuestionIdentifier(sourceQuestion: OpenQuestion): string {
        return sourceQuestion._id.toString();
    }

    protected async validateQuestion(question: OpenQuestion, isDryRun: boolean = false): Promise<string[]> {
        const errors: string[] = [];

        if (!question._title) errors.push('Missing title');
        if (!question._question) errors.push('Missing question content');
        if (!question._correctMsg) errors.push('Missing solution');
        if (!question._category) errors.push('Missing category');

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

    protected async transformQuestion(question: OpenQuestion, id?: string): Promise<Question> {
        // Extract exam info from title
        const examInfo = this.parseExamInfo(question._title);

        // Map category to topic structure
        const { topicId, subtopicId } = CategoryMapper.mapCategoryToTopic(question._category || '');

        // Use provided ID or generate a new one
        const questionId = id || await generateQuestionId('civil_engineering', 'construction_safety');
        
        const transformed: Question = {
            id: questionId,
            content: {
                text: question._question,
                format: 'markdown'
            },
            schoolAnswer: {
                solution: {
                    text: question._correctMsg,
                    format: 'markdown'
                }
            },
            metadata: {
                subjectId: 'civil_engineering',
                domainId: 'construction_safety',
                topicId,
                subtopicId,
                type: QuestionType.OPEN,
                difficulty: 3,
                answerFormat: {
                    hasFinalAnswer: false,
                    requiresSolution: true,
                    finalAnswerType: 'none'
                },
                estimatedTime: 10,
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
                    name: 'solution_quality',
                    description: 'איכות הפתרון והשימוש בתקנות',
                    weight: 100
                }]
            }
        };

        return transformed;
    }

    async importQuestion(wpQuestion: OpenQuestion, dryRun: boolean = false): Promise<ImportResult> {
        try {
            // Clean the data at entry point
            const cleanedQuestion = {
                ...wpQuestion,
                _question: this.cleanText(wpQuestion._question, true),
                _correctMsg: this.cleanText(wpQuestion._correctMsg, false)
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
     * Clean up text by removing exam info and whitespace
     */
    private cleanText(text: string, isQuestion: boolean = false): string {
        // Start with basic cleanup
        let cleaned = text.trim();

        // Remove exam info if it's a question
        if (isQuestion) {
            cleaned = cleaned.replace(/^\s*\[.*?\]\s*/m, '');
        }

        // Clean up whitespace and tabs
        cleaned = cleaned
            .replace(/\t+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        return cleaned;
    }
} 