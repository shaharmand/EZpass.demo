import { Question, ValidationStatus, PublicationStatusEnum, ReviewStatusEnum, DatabaseQuestion } from '../../../types/question';
import { logger } from '../../../utils/logger';
import { BaseQuestionImporter, RawImportRow, ImportRowResult, ImportBatchStats, ImportInfo } from '../types/importTypes';
import { QuestionStorage } from '../../../services/admin/questionStorage';
import { CreateQuestion } from '../../../types/storage';
import { validateQuestion, ValidationResult } from '../../../utils/questionValidator';
import { generateFakeQuestionId } from '../../../utils/idGenerator';

export interface ImportStats {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    skippedRows: number;
    successfulButSkippedRows: number;
    errors: string[];
    warnings: string[];
    validationStats: {
        totalValidated: number;
        valid: number;
        errors: number;
        warnings: number;
    };
}

export interface RawSourceSection {
    raw: RawImportRow;
    cleaned: RawImportRow | null;
    cleaning_changes: any;
}

export interface DatabaseRecordSection extends Partial<DatabaseQuestion> {
    status: 'success' | 'failed' | 'skipped';
    errors?: string[];
    warnings?: string[];
    processingTime: number;
    validationResult?: ValidationResult;
}

export interface QuestionProcessingDetails {
    rawSourceData: {
        raw: RawImportRow;
        cleaned: RawImportRow | null;
        cleaning_changes: any;
    };
    databaseRecord: DatabaseRecordSection;
}

export interface ImportOptions {
    dryRun?: boolean;
    limit?: number;
    onQuestionProcessed?: (id: string, details: QuestionProcessingDetails) => void;
}

export abstract class BaseImporter implements BaseQuestionImporter {
    protected readonly importerName: string;
    protected questionStorage: QuestionStorage;
    protected warnings: string[] = []; // Track warnings during import

    constructor(importerName: string, questionStorage: QuestionStorage) {
        this.importerName = importerName;
        this.questionStorage = questionStorage;
    }

    /**
     * Add warnings to be tracked in import stats
     */
    protected addWarnings(newWarnings: string[]) {
        this.warnings.push(...newWarnings);
    }

    /**
     * Get current warnings
     */
    protected getWarnings(): string[] {
        return this.warnings;
    }

    /**
     * Core methods that every importer must implement
     */
    abstract readSource(sourcePath: string): Promise<RawImportRow[]>;
    protected abstract cleanRow(row: RawImportRow): Promise<RawImportRow>;
    abstract validateRow(row: RawImportRow): Promise<string[]>;
    abstract transformRow(row: RawImportRow): Promise<Omit<Question, 'id'>>;
    abstract getRowIdentifier(row: RawImportRow): string;

    /**
     * Get source-specific import info
     */
    protected abstract getImportInfo(row: RawImportRow, question: Question): ImportInfo;

    /**
     * Import questions from a source
     */
    async importFromSource(sourcePath: string, options: ImportOptions = {}): Promise<ImportStats> {
        // Reset warnings at start of import
        this.warnings = [];
        const importStartTime = Date.now();
        
        const stats: ImportStats = {
            totalRows: 0,
            successfulRows: 0,
            failedRows: 0,
            skippedRows: 0,
            successfulButSkippedRows: 0,
            errors: [],
            warnings: [],
            validationStats: {
                totalValidated: 0,
                valid: 0,
                errors: 0,
                warnings: 0
            }
        };

        try {
            // Read raw rows from source
            const rows = await this.readSource(sourcePath);
            stats.totalRows = rows.length;
            
            logger.info(`Starting import from ${sourcePath}`, {
                totalRows: rows.length,
                dryRun: options.dryRun ? true : false,
                limit: options.limit
            });

            // Apply limit if specified
            const limitedRows = options.limit ? rows.slice(0, options.limit) : rows;

            // Process each row
            for (const rawRow of limitedRows) {
                const startTime = Date.now();
                try {
                    // Clean and validate the row
                    const cleanedRow = await this.cleanRow(rawRow);
                    
                    // Validate the row
                    const validationErrors = await this.validateRow(cleanedRow);
                    if (validationErrors.length > 0) {
                        throw new Error(validationErrors.join(', '));
                    }

                    // Transform to question format - without ID
                    const transformedQuestionWithoutId = await this.transformRow(cleanedRow);

                    // Generate ID based on whether this is a dry run
                    let nextId;
                    if (options.dryRun) {
                        // For dry runs, use generateFakeQuestionId
                        nextId = generateFakeQuestionId(
                            transformedQuestionWithoutId.metadata.subjectId,
                            transformedQuestionWithoutId.metadata.domainId
                        );
                    } else {
                        // For real imports, get the next ID from storage
                        nextId = await this.questionStorage.getNextQuestionId(
                            transformedQuestionWithoutId.metadata.subjectId,
                            transformedQuestionWithoutId.metadata.domainId
                        );
                    }

                    // Add the ID to the transformed question
                    const transformedQuestion: Question = {
                        ...transformedQuestionWithoutId,
                        id: nextId
                    };

                    // Always validate and prepare database fields, even in dry run
                    const validationResult = await validateQuestion(transformedQuestion);
                    const importInfo = this.getImportInfo(cleanedRow, transformedQuestion);
                    
                    // Log validation result details
                    logger.debug('Validation result:', {
                        questionId: this.getRowIdentifier(rawRow),
                        validationStatus: validationResult.status,
                        hasErrors: validationResult.errors.length > 0,
                        hasWarnings: validationResult.warnings.length > 0,
                        currentStats: {
                            totalValidated: stats.validationStats.totalValidated,
                            valid: stats.validationStats.valid,
                            errors: stats.validationStats.errors,
                            warnings: stats.validationStats.warnings
                        }
                    });

                    // Update validation stats with new terminology
                    stats.validationStats.totalValidated++;
                    if (validationResult.status === ValidationStatus.VALID) {
                        stats.validationStats.valid++;
                        logger.info(`Question marked as VALID: ${this.getRowIdentifier(rawRow)}`, {
                            status: 'valid',
                            newValidCount: stats.validationStats.valid
                        });
                    } else if (validationResult.status === ValidationStatus.ERROR) {
                        stats.validationStats.errors++;
                        logger.error(`Question marked as ERROR: ${this.getRowIdentifier(rawRow)}`, {
                            status: 'error',
                            errors: validationResult.errors.map(e => e.message),
                            newErrorCount: stats.validationStats.errors
                        });
                    } else if (validationResult.status === ValidationStatus.WARNING) {
                        stats.validationStats.warnings++;
                        logger.info(`Question marked as WARNING: ${this.getRowIdentifier(rawRow)}`, {
                            status: 'warning',
                            warnings: validationResult.warnings.map(w => w.message),
                            newWarningCount: stats.validationStats.warnings
                        });
                    }

                    // Log updated validation stats after counting
                    logger.debug('Updated validation stats:', {
                        questionId: this.getRowIdentifier(rawRow),
                        stats: stats.validationStats
                    });

                    // Prepare database fields without timestamps
                    const databaseFields: DatabaseQuestion = {
                        id: transformedQuestion.id,
                        data: transformedQuestion,
                        publication_status: PublicationStatusEnum.DRAFT,
                        publication_metadata: {
                            publishedAt: '',
                            publishedBy: '',
                            archivedAt: '',
                            archivedBy: '',
                            reason: ''
                        },
                        validation_status: validationResult.status,
                        review_status: ReviewStatusEnum.PENDING_REVIEW,
                        review_metadata: {
                            reviewedAt: '',
                            reviewedBy: '',
                            comments: validationResult.errors.length > 0 ? 
                                `Validation issues: ${validationResult.errors.map(e => e.message).join(', ')}` : 
                                validationResult.warnings.length > 0 ? 
                                    `Validation warnings: ${validationResult.warnings.map(w => w.message).join(', ')}` : 
                                    ''
                        },
                        ai_generated_fields: {
                            fields: [],
                            confidence: {},
                            generatedAt: ''
                        },
                        import_info: importInfo,
                        // Set timestamps to empty strings by default
                        created_at: '',
                        updated_at: ''
                    };

                    // Only set timestamps if they exist in source
                    const sourceRow = cleanedRow as { created_at?: string; updated_at?: string };
                    if (sourceRow.created_at) {
                        databaseFields.created_at = sourceRow.created_at;
                    }
                    if (sourceRow.updated_at) {
                        databaseFields.updated_at = sourceRow.updated_at;
                    }
                    
                    // Only store in database if not dry run
                    if (!options.dryRun) {
                        await this.questionStorage.createQuestion({
                            question: transformedQuestion,
                            import_info: importInfo
                        });
                    }

                    // Track processing details with proper section nesting
                    const details: QuestionProcessingDetails = {
                        rawSourceData: {
                            raw: rawRow,
                            cleaned: cleanedRow,
                            cleaning_changes: 'cleaning_changes' in cleanedRow ? 
                                JSON.parse(cleanedRow.cleaning_changes as string) : null
                        },
                        databaseRecord: {
                            ...databaseFields,
                            status: 'success',
                            processingTime: Date.now() - startTime,
                            validationResult,
                            errors: validationResult.errors.map(e => e.message),
                            warnings: validationResult.warnings.map(w => w.message)
                        }
                    };

                    // Skip actual import in dry run mode
                    if (options.dryRun) {
                        stats.skippedRows++;
                        // Don't add dry run skipping as a warning - it's expected behavior
                    } else {
                        stats.successfulRows++;
                    }

                    // Notify about processed question with clear section separation
                    if (options.onQuestionProcessed) {
                        const questionId = transformedQuestion.id || this.getRowIdentifier(rawRow);
                        options.onQuestionProcessed(questionId, {
                            rawSourceData: details.rawSourceData,
                            databaseRecord: details.databaseRecord
                        });
                    }

                } catch (error) {
                    stats.failedRows++;
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    stats.errors.push(errorMessage);
                    stats.validationStats.errors++; // Count failed imports as validation errors
                    
                    logger.error(`Failed to process question: ${this.getRowIdentifier(rawRow)}`, {
                        error: errorMessage,
                        status: 'error'
                    });
                    
                    const errorId = this.getRowIdentifier(rawRow);
                    // Notify about failed question with proper section nesting
                    if (options.onQuestionProcessed) {
                        options.onQuestionProcessed(errorId, {
                            rawSourceData: {
                                raw: rawRow,
                                cleaned: null,
                                cleaning_changes: null
                            },
                            databaseRecord: {
                                status: 'failed',
                                processingTime: Date.now() - startTime,
                                errors: [errorMessage]
                            }
                        });
                    }
                }
            }

            // Add accumulated warnings to stats
            stats.warnings.push(...this.warnings);

            // Log final validation summary
            logger.info('Import validation summary:', {
                total: stats.totalRows,
                valid: stats.validationStats.valid,
                errors: stats.validationStats.errors,
                warnings: stats.validationStats.warnings,
                processingTime: Date.now() - importStartTime
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            stats.errors.push(errorMessage);
            logger.error('Import failed:', {
                error: errorMessage,
                file: sourcePath,
                processingTime: Date.now() - importStartTime
            });
        }

        return stats;
    }

    /**
     * Clean a specific text field
     * Common text cleaning logic that can be used by all importers
     */
    protected cleanText(text: string, options: {
        removeExamInfo?: boolean;
        removeExtraSpaces?: boolean;
        removeTabs?: boolean;
        trim?: boolean;
    } = {}): string {
        const {
            removeExamInfo = false,
            removeExtraSpaces = true,
            removeTabs = true,
            trim = true
        } = options;

        let cleaned = text;

        if (trim) {
            cleaned = cleaned.trim();
        }

        if (removeExamInfo) {
            cleaned = cleaned.replace(/^\s*\[.*?\]\s*/m, '');
        }

        if (removeTabs) {
            cleaned = cleaned.replace(/\t+/g, ' ');
        }

        if (removeExtraSpaces) {
            cleaned = cleaned.replace(/\s{2,}/g, ' ');
        }

        return cleaned;
    }
} 