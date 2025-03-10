import { Question } from '../../../types/question';

/**
 * Raw import row - completely flat structure
 * This is the dumbest possible representation of imported data
 * Each column is just a string, and transformers will handle interpretation
 */
export type RawImportRow = {
    [column: string]: string;
};

/**
 * Result of importing a single row
 */
export interface ImportRowResult {
    rowIndex: number;           // Original row number in source
    sourceIdentifier: string;   // Some unique identifier from source
    success: boolean;
    errors?: string[];
    warnings?: string[];
}

/**
 * Statistics for an import batch
 */
export interface ImportBatchStats {
    sourceFile: string;
    sourceFormat: string;
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    skippedRows: number;
    successfulButSkippedRows: number;
    errors: string[];
    warnings: string[];
    startTime: string;
    endTime: string;
    validationStats: {
        totalValidated: number;
        valid: number;
        errors: number;
        warnings: number;
        details?: {
            total: number;
            issues: Array<{
                questionId: string;
                errors: Array<{ field: string; message: string }>;
                warnings: Array<{ field: string; message: string }>;
            }>;
        };
    };
}

/**
 * Base interface for all importers
 */
export interface BaseQuestionImporter {
    /**
     * Read source data into raw rows
     */
    readSource(sourcePath: string): Promise<RawImportRow[]>;
    
    /**
     * Transform a raw row into our Question type without ID
     * The ID will be assigned by the import manager
     */
    transformRow(row: RawImportRow): Promise<Omit<Question, 'id'>>;
    
    /**
     * Validate a raw row before transformation
     */
    validateRow(row: RawImportRow): Promise<string[]>;
    
    /**
     * Get a unique identifier for the row
     */
    getRowIdentifier(row: RawImportRow): string;
}

/**
 * Information about where and how a question was imported.
 * This is stored in the DB's import_info field.
 */
export interface ImportInfo {
    /** Import process metadata */
    importMetadata: {
        /** When this import was performed */
        importedAt: string;
        /** Name of the import script used */
        importScript: string;  // e.g. 'ezpass1-mahat-multiple-choice-importer'
        /** Special behavior parameters for the import script (if any) */
        params?: Record<string, any>;
    };

    /** Source system information */
    source: {
        /** Source system/platform/file identifier */
        name: string;  // e.g. 'ezpass1.0', 'mahat-website'
        /** Files used as source for this import */
        files: string[];  // Paths or URLs of source files
        /** Format of the source data */
        format: string;  // e.g. 'json+xls', 'pdf', 'web-scrape'
        /** Original identifier from the source (if exists) */
        originalId?: string;
        /** If imported from another database */
        dbId?: string;
    };

    /** Original data preservation */
    originalData: {
        /** Basic fields that are commonly preserved */
        title?: string;
        createdAt?: string;
        updatedAt?: string;
        /** Any additional source-specific fields to preserve */
        [key: string]: any;
    };
} 