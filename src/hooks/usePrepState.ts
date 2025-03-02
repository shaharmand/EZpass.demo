import { useState, useCallback } from 'react';
import { PrepStateManager } from '../services/PrepStateManager';
import type { StudentPrep } from '../types/prepState';
import type { Question, QuestionFeedback } from '../types/question';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { questionService } from '../services/llm/questionGenerationService';
import { QuestionRotationManager } from '../services/QuestionRotationManager';
import { logger } from '../utils/logger';
import { ExamType } from '../types/examTemplate';   
import { examService } from '../services/examService';
import { universalTopics } from '../services/universalTopics';
import { isSuccessfulAnswer } from '../types/question';

export const usePrepState = () => {
    const { 
        startPrep,
        pausePrep,
        completePrep,
        getPrep,
        setCurrentQuestion: handleSetCurrentQuestion,
        currentQuestion: studentPrepCurrentQuestion,
        submitAnswer: contextSubmitAnswer
    } = useStudentPrep();

    const [currentPrepId, setCurrentPrepId] = useState<string | null>(null);

    const getCurrentPrep = useCallback(async () => {
        if (!currentPrepId) {
            throw new Error('No active prep session');
        }
        const prep = await getPrep(currentPrepId);
        if (!prep) {
            throw new Error('Practice session not found');
        }
        return prep;
    }, [currentPrepId, getPrep]);

    const getNextQuestion = useCallback(async () => {
        try {
            const prep = await getCurrentPrep();

            logger.info('Getting next question', {
                prepId: prep.id,
                examId: prep.exam.id,
                selectedTopics: prep.selection.subTopics
            });

            // Initialize rotation manager with required prepId
            const rotationManager = new QuestionRotationManager(
                prep.exam,
                prep.selection,
                prep.id
            );

            // Get next parameters using rotation manager
            const params = rotationManager.getNextParameters();
            logger.info('Generated question parameters', { params });

            // Generate question with rotated parameters
            const question = await questionService.generateQuestion(params);
            logger.info('Generated new question', {
                questionId: question.id,
                type: question.metadata.type,
                topic: question.metadata.topicId
            });

            return question;
        } catch (error) {
            logger.error('Failed to get next question', { error });
            throw error;
        }
    }, [getCurrentPrep]);

    const handleStartPrep = useCallback(async (...args: Parameters<typeof startPrep>) => {
        const prepId = await startPrep(...args);
        setCurrentPrepId(prepId);
        return prepId;
    }, [startPrep]);

    return {
        currentQuestion: studentPrepCurrentQuestion,
        startPrep: handleStartPrep,
        pausePrep,
        completePrep,
        setCurrentQuestion: handleSetCurrentQuestion,
        getPrep,
        getNextQuestion,
        submitAnswer: async (answer: string) => {
            if (!studentPrepCurrentQuestion) {
                logger.error('Attempted to submit answer without active question');
                throw new Error('No active question');
            }

            const prep = await getCurrentPrep();
            
            try {
                // Delegate to context's submitAnswer
                await contextSubmitAnswer(answer, prep);
                logger.info('Answer submitted successfully');
            } catch (error) {
                logger.error('Failed to submit answer', {
                    error,
                    questionId: studentPrepCurrentQuestion.question.id,
                });
                throw error;
            }
        },
        getActiveTime: useCallback(async () => {
            try {
                const prep = await getCurrentPrep();
                return PrepStateManager.getActiveTime(prep);
            } catch {
                return 0;
            }
        }, [getCurrentPrep])
    };
}; 