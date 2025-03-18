import * as dotenv from 'dotenv';
import { resolve, join } from 'path';
import * as fs from 'fs/promises';
import { ValidationResult } from '../../utils/questionValidator';
import { 
    Question,
    QuestionType, 
    ValidationStatus, 
    DatabaseQuestion,
    PublicationStatusEnum,
    ReviewStatusEnum,
    PublicationMetadata,
    ReviewMetadata,
    AIGeneratedFields
} from '../../types/question';
import { ImportInfo } from './types/importTypes';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../../../.env') });

// Map React environment variables to their non-prefixed versions
// This must be done before importing any modules that might use them
if (process.env.REACT_APP_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
}
if (process.env.REACT_APP_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
}
if (process.env.REACT_APP_AUTH_REDIRECT_URL) {
  process.env.AUTH_REDIRECT_URL = process.env.REACT_APP_AUTH_REDIRECT_URL;
}

import { ImportManager } from './ImportManager';
import { QuestionStorage } from '../../services/admin/questionStorage';
import { logger } from '../../utils/logger';
import { checkEnvironmentVariables } from '../../utils/envCheck';
import { getSupabase } from '../../lib/supabase';
import { EZpass1MahatMultipleChoiceImporter } from './importers/EZpass1MahatMultipleChoiceImporter';
import { EZpass1ConstructionCommiteeOpenImporter } from './importers/EZpass1ConstructionCommiteeOpenImporter';
import chalk from 'chalk';

// Check environment variables - this will log the status of all env vars
checkEnvironmentVariables();

interface ImportResult {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    skippedRows: number;
    successfulButSkippedRows: number;
    errors: string[];
}

interface QuestionDetails {
    status: "success" | "failed" | "skipped";
    processingTime?: number;
    errors?: string[];
    warnings?: string[];
    validationStatus?: ValidationStatus;
    originalData: any;
    transformedData: any;
    validationResult?: ValidationResult;
    dbQuestion?: DatabaseQuestion;
    importInfo?: ImportInfo;
}

interface ImportReport {
    timestamp: string;
    configuration: {
        mode: 'dry-run' | 'live';
        jsonPath: string;
        excelPath: string;
        type: string;
        limit?: number;
    };
    environment: {
        supabaseUrl: boolean;
        supabaseAnonKey: boolean;
        authRedirectUrl: boolean;
    };
    results: {
        totalRows: number;
        successfulRows: number;
        failedRows: number;
        skippedRows: number;
        successfulButSkippedRows: number;
        errors: string[];
        validationStats: {
            totalValidated: number;
            valid: number;
            errors: number;
            warnings: number;
        };
    };
    duration: number;
    questionDetails: Record<string, QuestionDetails>;
}

interface DatabaseRecordSection {
    status: 'success' | 'failed' | 'skipped';
    processingTime: number;
    errors?: string[];
    warnings?: string[];
    [key: string]: any;  // Allow other fields
}

// Add default values
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

async function writeReport(report: ImportReport, basePath: string) {
    // Create reports directory in the project root
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = join(process.cwd(), 'imports', 'reports', report.configuration.mode === 'dry-run' ? 'dry-run' : 'live');
    const reportPath = join(reportDir, `import-report-${timestamp}.json`);

    try {
        // Ensure reports directory exists
        await fs.mkdir(reportDir, { recursive: true });
        
        // Create summary section with validation details
        const summary = {
            timestamp: report.timestamp,
            configuration: report.configuration,
            results: {
                counts: {
                    total: report.results.totalRows,
                    successful: report.results.successfulRows,
                    failed: report.results.failedRows,
                    skipped: report.results.skippedRows
                },
                validation: {
                    total: report.results.validationStats.totalValidated,
                    valid: report.results.validationStats.valid,
                    errors: report.results.validationStats.errors,
                    warnings: report.results.validationStats.warnings
                },
                duration: report.duration
            },
            errors: report.results.errors
        };

        // Create validation details section grouped by status
        const validationDetails = {
            errored: [] as any[],
            warned: [] as any[]
        };

        // Process each question's validation details
        Object.entries(report.questionDetails).forEach(([id, details]) => {
            const validationInfo = {
                id,
                errors: details.errors?.map(error => error) || [],
                warnings: details.warnings?.map(warning => warning) || [],
                dbQuestion: details.dbQuestion ? {
                    ...details.dbQuestion,
                    data: details.transformedData as Question,
                    publication_status: PublicationStatusEnum.DRAFT,
                    publication_metadata: DEFAULT_PUBLICATION_METADATA,
                    validation_status: details.validationStatus || ValidationStatus.VALID,
                    review_status: ReviewStatusEnum.PENDING_REVIEW,
                    review_metadata: DEFAULT_REVIEW_METADATA,
                    update_metadata: {
                        lastUpdatedAt: new Date().toISOString(),
                        lastUpdatedBy: 'system'
                    },
                    ai_generated_fields: DEFAULT_AI_GENERATED_FIELDS,
                    import_info: details.importInfo,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                } : undefined
            };

            if (details.errors && details.errors.length > 0) {
                validationDetails.errored.push(validationInfo);
            } else if (details.warnings && details.warnings.length > 0) {
                validationDetails.warned.push(validationInfo);
            }
        });

        // Use the accumulated validation stats instead of recounting
        const validationStats = report.results.validationStats;

        // Combine summary and details in a single report
        const fullReport = {
            summary,
            validationDetails,
            details: report.questionDetails
        };
        
        // Write the combined report
        await fs.writeFile(
            reportPath,
            JSON.stringify(fullReport, null, 2)
        );
        
        // Log progress to console with validation stats
        console.log(chalk.blue('\nImport Progress:'));
        console.log('Total Questions:', chalk.yellow(report.results.totalRows));
        console.log('Successful:', chalk.green(report.results.successfulRows));
        console.log('Failed:', chalk.red(report.results.failedRows));
        console.log('Skipped:', chalk.yellow(report.results.skippedRows));
        console.log('Duration:', chalk.blue(`${report.duration}ms`));

        // Add validation stats to console output
        console.log(chalk.blue('\nValidation Results:'));
        console.log('Total Validated:', chalk.yellow(report.results.validationStats.totalValidated));
        console.log('Valid:', chalk.green(report.results.validationStats.valid));
        console.log('Errors:', chalk.red(report.results.validationStats.errors));
        console.log('Warnings:', chalk.yellow(report.results.validationStats.warnings));

        // Show validation details in console
        // First show questions with errors
        if (validationDetails.errored.length > 0) {
            console.error(chalk.red('\nQuestions with Errors:'));
            validationDetails.errored.forEach(({ id, errors, warnings }) => {
                console.error(chalk.cyan(`\nQuestion ${id}:`));
                if (errors && errors.length > 0) {
                    console.error(chalk.red('Errors:'));
                    errors.forEach((error: string) => {
                        console.error(chalk.red('  - ') + error);
                    });
                }
                if (warnings && warnings.length > 0) {
                    console.log(chalk.yellow('Warnings:'));
                    warnings.forEach((warning: string) => {
                        console.log(chalk.yellow('  - ') + warning);
                    });
                }
            });
        }

        // Then show questions with only warnings
        if (validationDetails.warned.length > 0) {
            console.log(chalk.yellow('\nQuestions with Warnings Only:'));
            validationDetails.warned.forEach(({ id, errors, warnings }) => {
                console.log(chalk.cyan(`\nQuestion ${id}:`));
                if (warnings && warnings.length > 0) {
                    console.log(chalk.yellow('Warnings:'));
                    warnings.forEach((warning: string) => {
                        console.log(chalk.yellow('  - ') + warning);
                    });
                }
            });
        }

        // Show where report was saved
        console.log(chalk.green('\nReport saved to:'));
        console.log(chalk.blue(reportPath));

    } catch (error) {
        console.error(chalk.red('Failed to write report:'), error);
    }
}

async function main() {
    const startTime = Date.now();
    const questionDetails: ImportReport['questionDetails'] = {};
    let successfulButSkippedCount = 0;
    
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        console.log('\n=== Command Line Arguments ===');
        console.log('Raw args:', args);
        
        const sourcePath = args[0];
        const excelPath = args[1];
        const typeArg = args.find(arg => arg.startsWith('--type='));
        const type = typeArg?.split('=')[1] || 'multiple-choice';
        const isDryRun = args.includes('--dry-run');
        const limitArg = args.find(arg => arg.startsWith('--limit='));
        const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

        console.log('\n=== Extracted Parameters ===');
        console.log('Source Path:', sourcePath);
        console.log('Excel Path:', excelPath);
        console.log('Type Arg:', typeArg);
        console.log('Type:', type);
        console.log('Is Dry Run:', isDryRun);
        console.log('Limit Arg:', limitArg);
        console.log('Limit:', limit);
        console.log('===========================\n');

        if (!sourcePath || !type) {
            console.error('Usage: npm run import-questions <sourcePath> <excelPath> --type=<type> [--dry-run] [--limit=<number>]');
            process.exit(1);
        }

        // Initialize Supabase and QuestionStorage
        const supabase = getSupabase();
        const storage = new QuestionStorage(supabase);

        // Initialize importer based on type
        let importer;
        if (type === 'multiple-choice') {
            importer = new EZpass1MahatMultipleChoiceImporter(sourcePath, excelPath, storage);
        } else {
            importer = new EZpass1ConstructionCommiteeOpenImporter(excelPath, storage);
        }

        // Log import configuration
        console.log(chalk.blue('\nImport Configuration:'));
        console.log(chalk.blue(`Type: ${type}`));
        console.log(chalk.blue(`Source Path: ${sourcePath}`));
        console.log(chalk.blue(`Excel Path: ${excelPath}`));
        console.log(chalk.yellow(`Mode: ${isDryRun ? '🔍 DRY RUN' : '💾 LIVE'}`));
        if (limit !== undefined) {
            console.log(chalk.blue(`Limit: ${limit} questions`));
        }

        // Set options on the importer
        if ('setOptions' in importer) {
            (importer as any).setOptions({ limit, dryRun: isDryRun });
        }

        const result = await importer.importFromSource(sourcePath, { 
            dryRun: isDryRun,
            limit,
            onQuestionProcessed: (id, details) => {
                questionDetails[id] = {
                    status: details.databaseRecord.status,
                    processingTime: details.databaseRecord.processingTime,
                    errors: details.databaseRecord.errors,
                    warnings: details.databaseRecord.warnings,
                    validationStatus: details.databaseRecord.validationResult?.status,
                    originalData: details.rawSourceData.raw,
                    transformedData: details.databaseRecord.data,
                    validationResult: details.databaseRecord.validationResult,
                    dbQuestion: details.databaseRecord.data as DatabaseQuestion
                };
            }
        });

        // Log import results
        console.log(chalk.blue('\nImport Results:'));
        console.log('Total Rows:', chalk.yellow(result.totalRows));
        console.log('Successful Rows:', chalk.green(result.successfulRows));
        console.log('Failed Rows:', chalk.red(result.failedRows));
        console.log('Skipped Rows:', chalk.yellow(result.skippedRows));
        console.log('Successful But Skipped Rows:', chalk.green(result.successfulButSkippedRows));
        console.log('Errors:', chalk.red(result.errors.join(', ')));

        // Log duration
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(chalk.blue(`Duration: ${duration}ms`));

        // Create import report
        const report: ImportReport = {
            timestamp: new Date().toISOString(),
            configuration: {
                mode: isDryRun ? 'dry-run' : 'live',
                jsonPath: sourcePath,
                excelPath,
                type,
                limit
            },
            environment: {
                supabaseUrl: true,
                supabaseAnonKey: true,
                authRedirectUrl: true
            },
            results: {
                totalRows: result.totalRows,
                successfulRows: result.successfulRows,
                failedRows: result.failedRows,
                skippedRows: result.skippedRows,
                successfulButSkippedRows: result.successfulButSkippedRows,
                errors: result.errors,
                validationStats: result.validationStats
            },
            duration,
            questionDetails
        };

        // Write report
        await writeReport(report, sourcePath);

    } catch (error) {
        console.error(chalk.red('Failed to import questions:'), error);
        process.exit(1);
    }
}

main();