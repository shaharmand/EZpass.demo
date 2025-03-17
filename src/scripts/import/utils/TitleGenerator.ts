import { logger } from '../../../utils/logger';
import { ExamInfoParser } from './ExamInfoParser';

export class TitleGenerator {
    /**
     * Maximum length for using question text as title
     * Questions longer than this will use the provided title instead
     */
    private static readonly MAX_QUESTION_LENGTH = 100;

    /**
     * Generates an appropriate title for a question
     * If the question text is short and clear enough, uses it as the title
     * Otherwise returns empty string to use the provided title
     * 
     * @param questionText The full text of the question
     * @param currentTitle The current/default title if any
     * @returns The generated title or empty string to use current title
     */
    static generateTitle(questionText: string, currentTitle: string): string {
        // Clean up the question text
        const cleanText = this.cleanQuestionText(questionText);

        // If question is short enough and doesn't end with question mark, use it as title
        if (cleanText.length <= this.MAX_QUESTION_LENGTH && !cleanText.includes('?')) {
            logger.debug('Using question text as title', {
                originalText: questionText,
                cleanText: cleanText
            });
            return cleanText;
        }

        // Otherwise return empty to use the provided title
        logger.debug('Using provided title', {
            questionLength: cleanText.length,
            currentTitle: currentTitle
        });
        return '';
    }
