import * as dotenv from 'dotenv';
import { resolve, join } from 'path';
import * as fs from 'fs/promises';
import { ValidationResult } from '../../utils/questionValidator';

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
import { QuestionType, ValidationStatus } from '../../types/question';
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
                warnings: details.warnings?.map(warning => warning) || []
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
        const type = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'multiple-choice';
        const isDryRun = args.includes('--dry-run');
        const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0');

        // Get file paths based on type
        let jsonPath = '';
        let excelPath = '';
        const remainingArgs = args.filter(arg => !arg.startsWith('--'));

        if (type === 'multiple-choice') {
            [jsonPath, excelPath] = remainingArgs;
            if (!jsonPath || !excelPath) {
                console.error(chalk.red('Please provide paths to both the JSON and Excel files for multiple choice questions'));
                console.error(chalk.yellow(
                    'Usage: npm run import-questions <json-file-path> <excel-file-path> --type=multiple-choice [--dry-run] [--limit=N]'
                ));
                process.exit(1);
            }
        } else if (type === 'open') {
            [excelPath] = remainingArgs;
            if (!excelPath) {
                console.error(chalk.red('Please provide path to the Excel file for open questions'));
                console.error(chalk.yellow(
                    'Usage: npm run import-questions <excel-file-path> --type=open [--dry-run] [--limit=N]'
                ));
                process.exit(1);
            }
        } else {
            console.error(chalk.red('Invalid question type. Must be either "multiple-choice" or "open"'));
            process.exit(1);
        }

        // Initialize Supabase and QuestionStorage
        const supabase = getSupabase();
        const storage = new QuestionStorage(supabase);

        // Initialize importer based on type
        let importer;
        if (type === 'multiple-choice') {
            importer = new EZpass1MahatMultipleChoiceImporter(jsonPath, excelPath, storage);
        } else {
            importer = new EZpass1ConstructionCommiteeOpenImporter(excelPath, storage);
        }

        // Log import configuration
        console.log(chalk.blue('\nImport Configuration:'));
        console.log(chalk.blue(`Type: ${type}`));
        if (type === 'multiple-choice') {
            console.log(chalk.blue(`JSON Path: ${jsonPath}`));
        }
        console.log(chalk.blue(`Excel Path: ${excelPath}`));
        console.log(chalk.yellow(`Mode: ${isDryRun ? '🔍 DRY RUN' : '💾 LIVE'}`));
        if (limit > 0) {
            console.log(chalk.blue(`Limit: ${limit} questions`));
        }

        // Import questions
        const sourcePath = type === 'multiple-choice' ? `${jsonPath};${excelPath}` : excelPath;
        let currentQuestionNumber = 0;
        
        console.log(chalk.blue('\nStarting import process...'));
        process.stdout.write(chalk.yellow('Processing question: 0'));

        const result = await importer.importFromSource(sourcePath, { 
            dryRun: isDryRun, 
            limit,
            onQuestionProcessed: (id: string, details: any) => {
                currentQuestionNumber++;
                
                // Update progress counter in the same line
                process.stdout.write(`\r${chalk.yellow(`Processing question: ${currentQuestionNumber}`)}`);
                
                // Store complete details including raw source and database record
                questionDetails[id] = {
                    status: details.databaseRecord.status,
                    processingTime: details.databaseRecord.processingTime,
                    errors: details.databaseRecord.errors,
                    warnings: details.databaseRecord.warnings,
                    validationStatus: details.databaseRecord.validation_status,
                    // Store both original and transformed data
                    originalData: {
                        raw: details.rawSourceData.raw,
                        cleaned: details.rawSourceData.cleaned,
                        cleaning_changes: details.rawSourceData.cleaning_changes
                    },
                    transformedData: {
                        question: details.databaseRecord.data,
                        validation_status: details.databaseRecord.validation_status,
                        review_status: details.databaseRecord.review_status,
                        import_info: details.databaseRecord.import_info
                    },
                    validationResult: details.databaseRecord.validationResult
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
                jsonPath,
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