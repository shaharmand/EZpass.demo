import { logger } from '../../../utils/logger';
import { ExamInfoParser } from './ExamInfoParser';

export class TitleGenerator {
    /**
     * Maximum length for using question text as title
     * Questions longer than this will use the provided title instead
     */
    private static readonly MAX_QUESTION_LENGTH = 100;
    private static readonly MAX_TITLE_LENGTH = 60;
    private static readonly MIN_TITLE_LENGTH = 20;

    private static cleanQuestionText(text: string): string {
        // Remove markdown formatting
        let clean = text.replace(/[*_`~]/g, '');
        
        // Remove HTML tags
        clean = clean.replace(/<[^>]*>/g, '');
        
        // Remove extra whitespace
        clean = clean.replace(/\s+/g, ' ').trim();
        
        // Remove question marks and other punctuation at the end
        clean = clean.replace(/[?.,!]$/, '');
        
        return clean;
    }

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

        // If current title is good, keep it
        if (currentTitle && 
            currentTitle.length >= this.MIN_TITLE_LENGTH && 
            currentTitle.length <= this.MAX_TITLE_LENGTH) {
            logger.debug('Using current title', {
                currentTitle: currentTitle
            });
            return currentTitle;
        }

        // Generate a new title from the first sentence
        const firstSentence = cleanText.split(/[.!?]/)[0].trim();
        if (firstSentence.length >= this.MIN_TITLE_LENGTH && 
            firstSentence.length <= this.MAX_TITLE_LENGTH) {
            logger.debug('Using first sentence as title', {
                firstSentence: firstSentence
            });
            return firstSentence;
        }

        // If first sentence is too long, truncate it
        if (firstSentence.length > this.MAX_TITLE_LENGTH) {
            logger.debug('Truncating first sentence', {
                originalSentence: firstSentence,
                truncatedSentence: firstSentence.substring(0, this.MAX_TITLE_LENGTH - 3) + '...'
            });
            return firstSentence.substring(0, this.MAX_TITLE_LENGTH - 3) + '...';
        }

        // If first sentence is too short, use a default title
        logger.debug('Using default title', {
            defaultTitle: 'שאלה חדשה'
        });
        return 'שאלה חדשה';
    }
}
