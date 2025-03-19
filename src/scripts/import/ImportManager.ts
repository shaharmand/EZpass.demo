import { BaseImporter } from './importers/BaseImporter';
import { ImportBatchStats } from './types/importTypes';
import { logger } from '../../utils/logger';
import { QuestionStorage } from '../../services/admin/questionStorage';
import { 
    Question, 
    DatabaseQuestion, 
    PublicationStatusEnum, 
    ValidationStatus, 
    ReviewStatusEnum,
    PublicationMetadata,
    ReviewMetadata,
    AIGeneratedFields,
    SaveQuestion
} from '../../types/question';
import { ImportInfo } from './types/importTypes';
import { validateQuestion } from '../../utils/questionValidator';

const DEFAULT_PUBLICATION_METADATA: PublicationMetadata = {
    publishedAt: '',
    publishedBy: '',
    archivedAt: '',
    archivedBy: '',
    reason: ''
};

const DEFAULT_REVIEW_METADATA: ReviewMetadata = {
    reviewedAt: '',
    reviewedBy: 'system',
    comments: ''
};

const DEFAULT_AI_GENERATED_FIELDS: AIGeneratedFields = {
    fields: [],
    confidence: {},
    generatedAt: ''
};

export class ImportManager {
    private importers: Map<string, BaseImporter>;
    private questionStorage: QuestionStorage;

    constructor(questionStorage: QuestionStorage) {
        this.importers = new Map();
        this.questionStorage = questionStorage;
    }

    /**
     * Register an importer for a specific format
     */
    registerImporter(format: string, importer: BaseImporter): void {
        this.importers.set(format, importer);
    }

    /**
     * Get registered importer for a format
     */
    getImporter(format: string): BaseImporter | undefined {
        return this.importers.get(format);
    }

    /**
     * Prepare a question with standard database fields
     */
    private async prepareQuestionForStorage(question: Question, importInfo: ImportInfo): Promise<DatabaseQuestion> {
        // Validate the question
        const validationResult = await validateQuestion(question);

        return {
            id: question.id,
            data: question,
            publication_status: PublicationStatusEnum.DRAFT,
            publication_metadata: DEFAULT_PUBLICATION_METADATA,
            validation_status: validationResult.status,
            review_status: ReviewStatusEnum.PENDING_REVIEW,
            review_metadata: {
                ...DEFAULT_REVIEW_METADATA,
                comments: validationResult.errors.length > 0 ? 
                    `Validation issues: ${validationResult.errors.map(e => e.message).join(', ')}` : 
                    validationResult.warnings.length > 0 ? 
                        `Validation warnings: ${validationResult.warnings.map(w => w.message).join(', ')}` : 
                        ''
            },
            update_metadata: {
                lastUpdatedAt: new Date().toISOString(),
                lastUpdatedBy: 'system'
            },
            ai_generated_fields: DEFAULT_AI_GENERATED_FIELDS,
            import_info: importInfo,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    /**
     * Import questions from a source file
     */
    async importQuestions(
        sourcePath: string, 
        format: string,
        options: {
            dryRun?: boolean;
            limit?: number;
        } = {}
    ): Promise<ImportBatchStats> {
        const importer = this.importers.get(format);
        if (!importer) {
            throw new Error(`No importer registered for format: ${format}`);
        }

        logger.info(`Starting import from ${sourcePath} using ${format} importer`, {
            dryRun: options.dryRun,
            limit: options.limit
        });

        const startTime = new Date();
        const validationIssues: Array<{
            questionId: string;
            errors: Array<{ field: string; message: string }>;
            warnings: Array<{ field: string; message: string }>;
        }> = [];

        try {
            const stats = await importer.importFromSource(sourcePath, {
                ...options,
                onQuestionProcessed: async (id, details) => {
                    // Track validation issues
                    if (details.databaseRecord.validationResult) {
                        const { errors, warnings } = details.databaseRecord.validationResult;
                        if (errors.length > 0 || warnings.length > 0) {
                            validationIssues.push({
                                questionId: id,
                                errors: errors.map(e => ({
                                    field: e.field,
                                    message: e.message
                                })),
                                warnings: warnings.map(w => ({
                                    field: w.field,
                                    message: w.message
                                }))
                            });
                        }
                    }

                    // Log processing details with validation info
                    logger.debug('Question processed', {
                        id,
                        status: details.databaseRecord.status,
                        processingTime: details.databaseRecord.processingTime,
                        validationStatus: details.databaseRecord.validationResult?.status,
                        validationErrors: details.databaseRecord.validationResult?.errors.map(e => e.message) || [],
                        validationWarnings: details.databaseRecord.validationResult?.warnings.map(w => w.message) || []
                    });

                    // Handle dry-run mode
                    if (details.databaseRecord.status === 'success' && 
                        details.databaseRecord.id && 
                        details.databaseRecord.data && 
                        details.databaseRecord.import_info) {
                        // Prepare the complete DatabaseQuestion object using the manager's method
                        const completeDbQuestion = await this.prepareQuestionForStorage(
                            details.databaseRecord.data,
                            details.databaseRecord.import_info
                        );

                        // Update the databaseRecord with the complete DatabaseQuestion while preserving required fields
                        details.databaseRecord = {
                            ...completeDbQuestion,
                            status: details.databaseRecord.status,
                            processingTime: details.databaseRecord.processingTime,
                            validationResult: details.databaseRecord.validationResult
                        };

                        if (options.dryRun) {
                            // In dry-run mode, just log what would be saved
                            logger.info('Dry run - would save DatabaseQuestion:', {
                                fullObject: completeDbQuestion
                            });
                        } else {
                            // In live mode, actually save the question
                            await this.questionStorage.updateQuestion(
                                completeDbQuestion.id,
                                {
                                    data: completeDbQuestion.data,
                                    publication_status: completeDbQuestion.publication_status,
                                    validation_status: completeDbQuestion.validation_status,
                                    review_status: completeDbQuestion.review_status,
                                    ai_generated_fields: completeDbQuestion.ai_generated_fields
                                }
                            );
                        }
                    }
                }
            });
            
            const endTime = new Date();
            
            const batchStats: ImportBatchStats = {
                ...stats,
                sourceFile: sourcePath,
                sourceFormat: format,
                warnings: [],
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                validationStats: {
                    totalValidated: stats.validationStats.totalValidated,
                    valid: stats.validationStats.valid,
                    errors: stats.validationStats.errors,
                    warnings: stats.validationStats.warnings,
                    details: {
                        total: validationIssues.length,
                        issues: validationIssues
                    }
                }
            };

            // Log final validation summary with clear terminology
            logger.info('Import validation summary:', {
                total: stats.totalRows,
                valid: stats.validationStats.valid,
                errors: stats.validationStats.errors,
                warnings: stats.validationStats.warnings,
                totalWithIssues: validationIssues.length,
                processingTime: Date.now() - startTime.getTime()
            });

            // Log all validation issues with their full details
            if (validationIssues.length > 0) {
                logger.info('All validation issues:', {
                    totalIssues: validationIssues.length,
                    byQuestion: validationIssues.map(issue => ({
                        questionId: issue.questionId,
                        errors: issue.errors.map(e => e.message),
                        warnings: issue.warnings.map(w => w.message)
                    }))
                });
            }

            return batchStats;

        } catch (error) {
            logger.error('Import failed', {
                file: sourcePath,
                format: format,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Get list of supported import formats
     */
    getSupportedFormats(): string[] {
        return Array.from(this.importers.keys());
    }
} 