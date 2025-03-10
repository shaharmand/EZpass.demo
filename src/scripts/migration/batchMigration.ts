import { questionStorage } from '../../services/admin/questionStorage';
import { DatabaseOperation } from '../../types/storage';
import { logger } from '../../utils/logger';
import { Question, DatabaseQuestion, PublicationStatusEnum, ValidationStatus, ReviewStatusEnum } from '../../types/question';

const BATCH_SIZE = 100;

export async function migrateQuestionsInBatches(questions: Question[]): Promise<void> {
    logger.info(`Starting batch migration of ${questions.length} questions`);
    const batches = Math.ceil(questions.length / BATCH_SIZE);
    
    for (let i = 0; i < batches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, questions.length);
        const batch = questions.slice(start, end);
        
        logger.info(`Processing batch ${i + 1}/${batches} (${batch.length} questions)`);
        
        try {
            // Convert questions to database operations
            const operations: DatabaseOperation[] = await Promise.all(
                batch.map(async (question) => {
                    // Get the next ID for this question
                    const id = await questionStorage.getNextQuestionId(
                        question.metadata.subjectId,
                        question.metadata.domainId
                    );
                    
                    return {
                        id,
                        data: {
                            ...question,
                            id
                        },
                        publication_status: PublicationStatusEnum.DRAFT,
                        validation_status: ValidationStatus.WARNING,
                        review_status: ReviewStatusEnum.PENDING_REVIEW,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                })
            );
            
            // Save the batch
            await questionStorage.saveQuestions(operations);
            logger.info(`Successfully saved batch ${i + 1}`);
            
        } catch (error) {
            logger.error(`Error processing batch ${i + 1}:`, error);
            throw error;
        }
    }
    
    logger.info('Migration completed successfully');
} 