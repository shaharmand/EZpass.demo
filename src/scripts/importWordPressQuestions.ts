import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') }); // Load environment variables from .env file

// Set Supabase env vars from React ones before importing any modules that might use them
if (process.env.REACT_APP_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
}
if (process.env.REACT_APP_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
}

import { WordPressEzPassImporter } from '../services/admin/importers/WordPressEzPassImporter';
import { logger } from '../utils/logger';
import { validateQuestion } from '../utils/questionValidator';
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const XLSX = require('xlsx');

// Debug environment variables
console.log('Environment variables:');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '✅ Found' : '❌ Missing');
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing');

interface WordPressQuestion {
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
  _questionPostId?: number;  // Added this but made optional since it might not be in all data
}

interface ImportStats {
  total: number;
  successful: number;
  failed: number;
  noSolution: number;
  withHtml: number;
  byCategory: { [key: string]: number };
}

interface ImportResult {
  success: boolean;
  questionId?: string;
  errors?: string[];
  warnings?: string[];
}

interface CategoryMapping {
  [title: string]: string;  // maps question title to category
}

async function loadCategoriesFromExcel(xlsxPath: string): Promise<CategoryMapping> {
  const mapping: CategoryMapping = {};
  let count = 0;
  
  console.log(chalk.blue('\n=== Reading Categories from Excel ===\n'));
  
  // Read the Excel file
  const workbook = XLSX.readFile(xlsxPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(chalk.yellow('\nDEBUG: Excel Titles:'));
  
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const title = row[7]?.toString().trim();
    const category = row[5]?.toString().trim();
    
    if (title && category && category !== 'no' && category !== 'single') {
      count++;
      console.log(chalk.green(`${count}. Excel Title: [${title}]`));
      mapping[title] = category;
    }
  }
  
  console.log(chalk.blue(`\nTotal valid pairs found: ${count}`));
  return mapping;
}

async function main() {
  try {
    // Get file paths and mode from command line args
    const jsonPath = process.argv[2];
    const xlsxPath = process.argv[3];  // Now expecting xlsx path instead of csv
    const isDryRun = process.argv.includes('--dry-run');
    
    if (!jsonPath || !xlsxPath) {
      console.error(chalk.red('Please provide paths to both the JSON and Excel files'));
      console.error(chalk.yellow('Usage: npm run import-wp-questions <json-file-path> <excel-file-path> [--dry-run]'));
      process.exit(1);
    }

    // Only check Supabase credentials in live mode
    if (!isDryRun) {
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        console.error(chalk.red('Error: Missing required environment variables'));
        console.error(chalk.yellow('Please make sure you have the following variables in your .env file:'));
        console.error(chalk.yellow('- REACT_APP_SUPABASE_URL'));
        console.error(chalk.yellow('- REACT_APP_SUPABASE_ANON_KEY'));
        process.exit(1);
      }
    }

    const fullJsonPath = path.resolve(process.cwd(), jsonPath);
    const fullXlsxPath = path.resolve(process.cwd(), xlsxPath);
    
    console.log(chalk.blue(`\nReading questions from ${fullJsonPath}`));
    console.log(chalk.yellow(isDryRun ? '🔍 DRY RUN MODE - No data will be saved' : '💾 LIVE MODE - Data will be saved'));
    
    const fileContent = await fs.readFile(fullJsonPath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // Extract questions from the nested structure
    const questions: WordPressQuestion[] = [];
    if (jsonData.question) {
      Object.values(jsonData.question).forEach((quiz: any) => {
        Object.values(quiz).forEach((question: any) => {
          questions.push(question as WordPressQuestion);
        });
      });
    }

    if (questions.length === 0) {
      console.error(chalk.red('No questions found in the file'));
      process.exit(1);
    }

    // Initialize stats
    const stats: ImportStats = {
      total: questions.length,
      successful: 0,
      failed: 0,
      noSolution: 0,
      withHtml: 0,
      byCategory: {}
    };

    // Load categories from Excel using the provided path
    const categoryMapping = await loadCategoriesFromExcel(fullXlsxPath);
    
    // Check that all questions have categories before proceeding
    console.log(chalk.blue('\nChecking for category mappings...'));
    console.log(chalk.yellow('\nDEBUG: JSON Question Titles:'));
    const missingCategories: string[] = [];
    
    for (const question of questions) {
      console.log(chalk.green(`Question Title: [${question._title}]`));
      const category = categoryMapping[question._title];
      if (!category) {
        missingCategories.push(question._title);
      }
    }

    if (missingCategories.length > 0) {
      console.error(chalk.red('\n❌ Error: Some questions are missing categories in the Excel:'));
      missingCategories.forEach(title => {
        console.error(chalk.yellow(`  • [${title}]`));
      });
      console.error(chalk.red(`\nTotal questions missing categories: ${missingCategories.length}/${questions.length}`));
      console.error(chalk.yellow('Please ensure all questions have corresponding entries in the Excel file.'));
      process.exit(1);
    }

    console.log(chalk.green(`✅ Found categories for all ${questions.length} questions`));
    
    // Import questions
    console.log(chalk.blue(`\nStarting ${isDryRun ? 'validation' : 'import'} of ${questions.length} questions...`));
    
    // Process each question individually for better error reporting
    const results: { [key: string]: ImportResult } = {};
    
    // Debug: Log first 3 questions in detail
    console.log(chalk.blue('\n=== WordPress Questions Debug Info ==='));
    console.log(chalk.yellow('Command line arguments:', process.argv));
    console.log(chalk.yellow('isDryRun flag value:', isDryRun));
    console.log(chalk.yellow('\nFirst 3 Questions:'));
    for (let i = 0; i < Math.min(3, questions.length); i++) {
      const q = questions[i];
      console.log(chalk.cyan(`\n📝 Question ${i + 1}:`));
      console.log(chalk.yellow('Basic Info:'));
      console.log('ID:', q._id);
      console.log('DB ID:', q._dbId);
      console.log('Title:', q._title);
      console.log('Category:', q._category);
      
      console.log(chalk.yellow('\nTimestamps:'));
      console.log('Created At:', q._createdAt, typeof q._createdAt);
      console.log('Updated At:', q._updatedAt, typeof q._updatedAt);
      
      console.log(chalk.yellow('\nContent Preview:'));
      console.log('Question:', q._question.substring(0, 100) + '...');
      console.log('Correct Message:', q._correctMsg ? (q._correctMsg.substring(0, 100) + '...') : 'None');
      
      console.log(chalk.yellow('\nAnswers:'));
      q._answerData.forEach((answer, index) => {
        console.log(`Answer ${index + 1}:`, {
          text: answer._answer,
          length: answer._answer.length,
          startsWithTab: answer._answer.startsWith('\t'),
          endsWithSpace: answer._answer.endsWith(' '),
          isCorrect: answer._correct,
          hasHtml: answer._html
        });
      });
    }

    console.log(chalk.blue('\n=== Question Stats ==='));
    console.log('Total Questions:', questions.length);
    console.log('Questions with Created Date:', questions.filter(q => q._createdAt).length);
    console.log('Questions with Updated Date:', questions.filter(q => q._updatedAt).length);
    
    // Show date ranges if timestamps exist
    const dates = questions
      .filter(q => q._createdAt)
      .map(q => new Date(q._createdAt!).getTime());
    if (dates.length > 0) {
      console.log('\nDate Range:');
      console.log('Earliest:', new Date(Math.min(...dates)).toISOString());
      console.log('Latest:', new Date(Math.max(...dates)).toISOString());
    }
    
    console.log(chalk.blue('\n=== End Debug Info ===\n'));
    
    // Add debug logging for dry run flag
    console.log(chalk.yellow('\n=== Dry Run Status ==='));
    console.log(`Command line --dry-run flag: ${isDryRun}`);
    console.log('======================\n');

    // If in dry run mode, don't even initialize database connections
    if (isDryRun) {
        console.log(chalk.yellow('🔍 DRY RUN MODE - Skipping all database operations'));
        console.log(chalk.yellow('Only performing validation and transformation\n'));
    }
    
    // Create an instance where it's used
    const importer = new WordPressEzPassImporter();
    
    for (const question of questions) {
      // Just assign the category and let the importer handle validation and mapping
      question._category = categoryMapping[question._title];
      
      try {
        console.log(chalk.yellow(`\nProcessing question ${question._id} with isDryRun=${isDryRun}`));
        // In dry run mode, only validate and transform
        const result = await importer.importQuestion(question, isDryRun);
        results[question._id.toString()] = result;
        
        if (result.success) {
            stats.successful++;
            stats.byCategory[question._category] = (stats.byCategory[question._category] || 0) + 1;
        } else {
            stats.failed++;
            console.log(chalk.red(`\n❌ Question ${question._id} (${question._title}) failed validation:`));
            result.errors?.forEach((error: string) => {
                console.log(chalk.red(`  • ${error}`));
            });
        }

        // Track additional stats
        if (!question._correctMsg) {
          stats.noSolution++;
        }
        if (question._answerData?.some(a => a._html) ||
            /<[^>]*>/g.test(question._question) ||
            /<[^>]*>/g.test(question._correctMsg || '')) {
          stats.withHtml++;
        }
      } catch (error) {
        console.error('Error processing question:', error);
        stats.failed++;
      }
    }

    // Print summary
    console.log(chalk.green('\n=== Import Summary ==='));
    console.log(chalk.green(`✅ Successfully validated: ${stats.successful} questions`));
    console.log(chalk.red(`❌ Failed validation: ${stats.failed} questions`));
    console.log(chalk.yellow(`⚠️ Questions without solutions: ${stats.noSolution}`));
    console.log(chalk.blue(`ℹ️ Questions with HTML content: ${stats.withHtml}`));

    if (isDryRun) {
      console.log(chalk.yellow('\n🔍 This was a dry run - no data was saved'));
      console.log(chalk.yellow('To import the data, run the command without --dry-run'));
    }

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      mode: isDryRun ? 'dry-run' : 'live',
      stats,
      results
    };

    const reportPath = path.join(path.dirname(fullJsonPath), `import-report-${isDryRun ? 'dry-run' : 'live'}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\nDetailed report saved to: ${reportPath}`));

  } catch (error) {
    logger.error('Failed to run import script', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

main(); 