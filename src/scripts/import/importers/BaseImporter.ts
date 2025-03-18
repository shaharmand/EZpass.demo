import { Question, ValidationStatus, PublicationStatusEnum, ReviewStatusEnum, DatabaseQuestion, AIGeneratedFields } from '../../../types/question';
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
     * Generate AI fields for a question (optional - default implementation returns empty fields)
     */
    protected async generateAIFields(question: Omit<Question, 'id'>): Promise<AIGeneratedFields> {
        return {
            fields: [],
            confidence: {},
            generatedAt: new Date().toISOString()
        };
    }

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
            // Set options on the importer if it supports it
            if ('setOptions' in this) {
                (this as any).setOptions(options);
            }

            // Read raw rows from source with limit if specified
            const rows = await this.readSource(sourcePath);
            
            // Update stats with the actual number of rows we'll process
            stats.totalRows = rows.length;
            
            logger.info(`Starting import from ${sourcePath}`, {
                totalAvailableRows: rows.length,
                rowsToProcess: stats.totalRows,
                dryRun: options.dryRun ? true : false,
                limit: options.limit
            });

            // Process each row
            for (const rawRow of rows) {
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

                    // Generate AI fields
                    const aiGeneratedFields = await this.generateAIFields(transformedQuestionWithoutId);

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
                        update_metadata: {
                            lastUpdatedAt: new Date().toISOString(),
                            lastUpdatedBy: 'system'
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

                    // Call the callback with processing details
                    if (options.onQuestionProcessed) {
                        options.onQuestionProcessed(transformedQuestion.id, {
                            rawSourceData: {
                                raw: rawRow,
                                cleaned: cleanedRow,
                                cleaning_changes: (cleanedRow as any).cleaning_changes
                            },
                            databaseRecord: {
                                ...databaseFields,
                                status: 'success',
                                processingTime: Date.now() - startTime,
                                validationResult
                            }
                        });
                    }

                    // Always increment successful rows - the manager will handle dry-run mode
                    stats.successfulRows++;

                } catch (error) {
                    // Log the error with full context
                    logger.error('Failed to process row', {
                        rowId: this.getRowIdentifier(rawRow),
                        error: error instanceof Error ? error.message : 'Unknown error',
                        stack: error instanceof Error ? error.stack : undefined
                    });

                    // Call the callback with error details
                    if (options.onQuestionProcessed) {
                        options.onQuestionProcessed(this.getRowIdentifier(rawRow), {
                            rawSourceData: {
                                raw: rawRow,
                                cleaned: null,
                                cleaning_changes: null
                            },
                            databaseRecord: {
                                status: 'failed',
                                processingTime: Date.now() - startTime,
                                errors: [error instanceof Error ? error.message : 'Unknown error']
                            }
                        });
                    }

                    stats.failedRows++;
                }
            }

            return stats;

        } catch (error) {
            logger.error('Import failed', {
                file: sourcePath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Clean a specific text field
     * Common text cleaning logic that can be used by all importers
     */
    protected cleanText(text: string, options: {
        removeExtraSpaces?: boolean;
        removeTabs?: boolean;
        trim?: boolean;
    } = {}): string {
        let cleaned = text;

        if (options.removeExtraSpaces) {
            // Split by newlines, clean each line, then rejoin
            cleaned = cleaned.split('\n').map(line => {
                return line.replace(/\s{2,}/g, ' ');  // Only replace multiple spaces with single space
            }).join('\n');
        }

        if (options.removeTabs) {
            cleaned = cleaned.replace(/\t+/g, ' ');
        }

        if (options.trim) {
            cleaned = cleaned.trim();
        }

        return cleaned;
    }
} 