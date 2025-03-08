/**
 * Utility class for parsing exam information from text
 */
export class ExamInfoParser {
    /**
     * Extract exam information from text
     * Example formats:
     * [2023 קיץ מועד א]
     * [2022 חורף מועד ב]
     */
    static parseExamInfo(text: string): { year?: number; season?: 'summer' | 'spring'; moed?: 'a' | 'b'; order?: number } {
        const examInfoMatch = text.match(/\[(.*?)\]/);
        if (!examInfoMatch) return {};

        const info = examInfoMatch[1];
        const result: { year?: number; season?: 'summer' | 'spring'; moed?: 'a' | 'b'; order?: number } = {};

        // Extract year
        const yearMatch = info.match(/\b20\d{2}\b/);
        if (yearMatch) {
            result.year = parseInt(yearMatch[0]);
        }

        // Extract season - map winter to spring
        if (info.includes('קיץ')) {
            result.season = 'summer';
        } else if (info.includes('חורף')) {
            result.season = 'spring'; // Map winter to spring
        }

        // Extract moed
        if (info.includes('מועד א')) {
            result.moed = 'a';
        } else if (info.includes('מועד ב')) {
            result.moed = 'b';
        }

        // Extract order if present (numeric value after #)
        const orderMatch = info.match(/#(\d+)/);
        if (orderMatch) {
            result.order = parseInt(orderMatch[1]);
        }

        return result;
    }
} 