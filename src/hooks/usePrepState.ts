import { useState, useCallback } from 'react';
import { PrepStateManager } from '../services/PrepStateManager';
import type { StudentPrep } from '../types/prepState';
import type { Question, QuestionFeedback } from '../types/question';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { questionService } from '../services/llm/service';
import { QuestionRotationManager } from '../services/QuestionRotationManager';

export const usePrepState = () => {
    const { 
        activePrep,
        startPrep,
        pausePrep,
        completePrep,
        getPrep,
        setCurrentQuestion: handleSetCurrentQuestion,
        currentQuestion: studentPrepCurrentQuestion,
        submitAnswer: contextSubmitAnswer
    } = useStudentPrep();

    const getNextQuestion = useCallback(async () => {
        if (!activePrep) {
            throw new Error('No active prep session');
        }

        try {
            // Initialize rotation manager
            const rotationManager = new QuestionRotationManager(
                activePrep.exam,
                activePrep.selection
            );

            // Get next parameters using rotation manager
            const params = rotationManager.getNextParameters();

            // Generate question with rotated parameters
            const question = await questionService.generateQuestion(params);

            return question;
        } catch (error) {
            console.error('Error getting next question:', error);
            throw error;
        }
    }, [activePrep]);

    return {
        prep: activePrep,
        currentQuestion: studentPrepCurrentQuestion,
        startPrep,
        pausePrep,
        completePrep,
        setCurrentQuestion: handleSetCurrentQuestion,
        getPrep,
        getNextQuestion,
        submitAnswer: async (answer: string) => {
            if (!studentPrepCurrentQuestion) {
                throw new Error('No active question');
            }

            // For testing purposes, generate rich feedback based on question type
            const generateFeedback = (answer: string, question: Question): QuestionFeedback => {
                const isMultipleChoice = question.type === 'multiple_choice';
                const score = isMultipleChoice ? 
                    (answer === question.correctOption?.toString() ? 100 : 0) : 
                    Math.min(100, Math.max(0, parseInt(answer.length > 50 ? '85' : '45')));
                const isCorrect = score >= 60;

                const baseAssessment = isCorrect ? 
                    'כל הכבוד! התשובה שלך נכונה ומראה הבנה טובה של החומר.' : 
                    'התשובה שלך לא מדויקת, אבל זו הזדמנות טובה ללמידה.';

                switch (question.type) {
                    case 'multiple_choice':
                        return {
                            isCorrect,
                            score,
                            type: 'multiple_choice',
                            assessment: `${baseAssessment} ${isCorrect ? 
                                'המשך כך!' : 
                                'בוא נבין למה התשובה הנכונה היא אחרת.'}`,
                            correctOption: question.correctOption?.toString(),
                            explanation: question.solution?.text || 'No explanation provided',
                            incorrectExplanations: question.options
                                ?.filter((_, i) => i + 1 !== question.correctOption)
                                .map((opt, i) => `* תשובה ${i + 1} שגויה כי היא לא מדויקת`)
                                .join('\n') || 'No explanations for incorrect options',
                            solution: `# פתרון מלא\n\n${question.solution?.text || 'No solution provided'}`
                        };

                    case 'code':
                        return {
                            isCorrect,
                            score,
                            type: 'code',
                            assessment: `${baseAssessment} ${isCorrect ? 
                                'הקוד שלך עומד בכל הדרישות!' : 
                                'בוא נראה איך אפשר לשפר את הקוד.'}`,
                            explanation: isCorrect ? 
                                `הפתרון שלך מצוין! הקוד עומד בכל הדרישות.` :
                                `יש מספר נקודות לשיפור בקוד.`,
                            solution: question.solution?.text || 'No solution provided',
                            improvementSuggestions: !isCorrect ? 
                                `כדי לשפר את הקוד:\n1. בדוק את הלוגיקה\n2. הוסף טיפול בשגיאות\n3. שפר את הביצועים` : 
                                undefined
                        };

                    case 'step_by_step':
                        return {
                            isCorrect,
                            score,
                            type: 'step_by_step',
                            assessment: `${baseAssessment} ${isCorrect ? 
                                'הצעדים שלך מסודרים ומדויקים!' : 
                                'בוא נעבור על הצעדים ונראה איפה אפשר להשתפר.'}`,
                            explanation: question.solution?.text || 'No step-by-step explanation provided',
                            solution: question.solution?.text || 'No solution provided',
                            improvementSuggestions: !isCorrect ? 
                                `לשיפור הפתרון:\n1. הצג כל שלב בנפרד\n2. הוסף הסברים\n3. בדוק תוצאות` : 
                                undefined
                        };

                    case 'open':
                    default:
                        return {
                            isCorrect,
                            score,
                            type: 'open',
                            assessment: `${baseAssessment} ${isCorrect ? 
                                'התשובה שלך מקיפה ומעמיקה!' : 
                                'בוא נראה איך אפשר להעמיק את התשובה.'}`,
                            explanation: isCorrect ? 
                                `תשובתך מצוינת וכוללת את כל הנקודות החשובות.` :
                                `יש מספר נקודות שכדאי להתייחס אליהן.`,
                            solution: question.solution?.text || 'No solution provided',
                            improvementSuggestions: !isCorrect ? 
                                `להעשרת התשובה:\n1. הוסף הגדרות מדויקות\n2. תן דוגמאות\n3. הרחב הסברים` : 
                                undefined
                        };
                }
            };

            const feedback = generateFeedback(answer, studentPrepCurrentQuestion.question);
            await contextSubmitAnswer(answer, feedback.isCorrect);
        },
        getActiveTime: useCallback(() => 
            activePrep ? PrepStateManager.getActiveTime(activePrep) : 0
        , [activePrep])
    };
};

// Helper function to get feedback message based on score
const getFeedbackMessage = (score: number): string => {
    if (score >= 95) return 'תשובה מצוינת! הראית הבנה מעמיקה של החומר';
    if (score >= 85) return 'תשובה טובה מאוד! כמעט מושלם';
    if (score >= 75) return 'תשובה טובה, אך יש מקום קטן לשיפור';
    if (score >= 60) return 'תשובה סבירה, אך יש מספר נקודות לשיפור';
    return 'תשובה חלקית, כדאי לנסות שוב עם תשומת לב להערות';
} 