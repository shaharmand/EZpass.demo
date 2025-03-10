import { migrateQuestionsInBatches } from './batchMigration';
import { logger } from '../../utils/logger';
import { Question, QuestionType } from '../../types/question';
import { questionStorage } from '../../services/admin/questionStorage';
import fs from 'fs';
import path from 'path';

async function loadQuestionsFromFiles(directoryPath: string): Promise<Question[]> {
    const questions: Question[] = [];
    const files = fs.readdirSync(directoryPath);

    for (const file of files) {
        if (file.endsWith('.json')) {
            const filePath = path.join(directoryPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const questionData = JSON.parse(content);
            
            // Assuming each file contains one question
            // Adjust this based on your file structure
            questions.push(questionData);
        }
    }

    return questions;
}

async function main() {
    try {
        // Replace this with your questions directory path
        const questionsDir = process.argv[2];
        if (!questionsDir) {
            throw new Error('Please provide the questions directory path as an argument');
        }

        logger.info('Loading questions from files...');
        const questions = await loadQuestionsFromFiles(questionsDir);
        
        logger.info(`Found ${questions.length} questions to import`);
        
        // Confirm with user
        console.log(`\nAbout to import ${questions.length} questions.`);
        console.log('Questions will be saved in batches of 100.');
        console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
        
        // Wait 5 seconds before proceeding
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await migrateQuestionsInBatches(questions);
        logger.info('Import completed successfully');
        
    } catch (error) {
        logger.error('Import failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
} 