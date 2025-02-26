import { useState, useCallback } from 'react';
import { PrepStateManager } from '../services/PrepStateManager';
import type { StudentPrep } from '../types/prepState';
import type { Question, QuestionFeedback } from '../types/question';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { questionService } from '../services/llm/questionGenerationService';
import { QuestionRotationManager } from '../services/QuestionRotationManager';
import { MultipleChoiceFeedbackService } from '../services/feedback/multipleChoiceFeedback';
import { FeedbackService } from '../services/llm/feedbackGenerationService';
import { logger } from '../utils/logger';
import { ExamType } from '../types/examTemplate';   
import { examService } from '../services/examService';
import { universalTopics } from '../services/universalTopics';

// Initialize services
const multipleChoiceFeedbackService = new MultipleChoiceFeedbackService();
const feedbackService = new FeedbackService();

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
                type: question.type,
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
            const question = studentPrepCurrentQuestion.question;
            let feedback: QuestionFeedback;

            try {
                logger.info('Processing answer submission', {
                    questionId: question.id,
                    type: question.type,
                    answerLength: answer.length,
                    rawAnswer: answer,
                    answerType: typeof answer
                });

                if (question.type === 'multiple_choice') {
                    const selectedOption = parseInt(answer);
                    if (isNaN(selectedOption) || selectedOption < 1 || selectedOption > 4) {
                        logger.error('Invalid multiple choice answer', { answer });
                        throw new Error('Invalid multiple choice answer');
                    }

                    logger.info('Generating multiple choice feedback', {
                        questionId: question.id,
                        selectedOption,
                        rawAnswer: answer
                    });

                    const mcFeedback = multipleChoiceFeedbackService.generateFeedback(question, selectedOption);
                    feedback = {
                        ...mcFeedback,
                        detailedFeedback: mcFeedback.detailedFeedback || 'No detailed feedback available'
                    };

                    logger.info('Generated multiple choice feedback', {
                        questionId: question.id,
                        isCorrect: feedback.isCorrect,
                        score: feedback.score,
                        submittedAnswer: answer
                    });
                } else {
                    logger.info('Generating feedback for non-multiple choice question', {
                        questionId: question.id,
                        type: question.type,
                        topicId: question.metadata.topicId
                    });

                    // Debug topic data retrieval
                    let subject: string;
                    try {
                        subject = universalTopics.getSubjectName(question.metadata.topicId);
                        logger.info('Retrieved subject for topic:', {
                            topicId: question.metadata.topicId,
                            subject
                        });
                    } catch (error) {
                        logger.error('Failed to get subject for topic:', {
                            error,
                            topicId: question.metadata.topicId,
                            errorMessage: error instanceof Error ? error.message : 'Unknown error',
                            errorStack: error instanceof Error ? error.stack : undefined
                        });
                        throw error; // Re-throw to prevent feedback generation with unknown subject
                    }

                    feedback = await feedbackService.generateFeedback({
                        question,
                        studentAnswer: answer,
                        formalExamName: prep.exam.names.full,
                        examType: prep.exam.examType as ExamType,
                        subject
                    });

                    logger.info('Generated question feedback', {
                        questionId: question.id,
                        isCorrect: feedback.isCorrect,
                        score: feedback.score,
                        subject: subject
                    });
                }

                await contextSubmitAnswer(answer, prep);
                logger.info('Answer submitted successfully', {
                    questionId: question.id,
                    score: feedback.score
                });

                return feedback;
            } catch (error) {
                logger.error('Failed to generate feedback', {
                    error,
                    questionId: question.id,
                    type: question.type
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