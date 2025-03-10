import { ExamPeriod, MoedType } from '../../../types/question';

export interface ExamInfo {
    year?: number;
    period?: ExamPeriod;
    moed?: MoedType;
    order?: number;
    warnings?: string[];
}

/**
 * Parses exam information from question titles and text
 * Supports both Hebrew and English formats
 */
export class ExamInfoParser {
    /**
     * Parse exam info from text without modifying it
     * Supports formats:
     * - Hebrew: [2023 קיץ מועד א]
     * - Hebrew: [2022 חורף מועד ב]
     * - English: [2023 Summer Moed A Q1]
     * - Hebrew: אביב 2024, מועד א'
     * - Hebrew: אביב 2024, מועד ב' - שאלה 54
     */
    static parseExamInfo(text: string): ExamInfo {
        const result: ExamInfo = {};

        // Try to find bracketed info first
        const examInfoMatch = text.match(/\[(.*?)\]/);
        const info = examInfoMatch ? examInfoMatch[1] : text;

        // Common patterns
        const yearPattern = /20\d{2}/;
        const hebrewPeriodPattern = /(קיץ|קייץ|חורף|אביב|סתיו)/;
        const englishPeriodPattern = /(Spring|Summer|Winter|Fall)/i;
        const hebrewMoedPattern = /מועד\s*([אבג])'?/;
        const englishMoedPattern = /Moed\s*[AB]/i;
        const questionPattern = /(?:Q|שאלה\s*)(\d+)/i;

        // Extract year
        const yearMatch = info.match(yearPattern);
        if (yearMatch) {
            result.year = parseInt(yearMatch[0]);
        }

        // Try Hebrew period first, then English
        const hebrewPeriodMatch = info.match(hebrewPeriodPattern);
        if (hebrewPeriodMatch) {
            const hebrewPeriod = hebrewPeriodMatch[1];
            if (hebrewPeriod === 'קיץ' || hebrewPeriod === 'קייץ') {
                result.period = 'Summer';
            } else if (hebrewPeriod === 'חורף') {
                result.period = 'Winter';
            } else if (hebrewPeriod === 'אביב') {
                result.period = 'Spring';
            } else if (hebrewPeriod === 'סתיו') {
                result.period = 'Fall';
            }
        } else {
            // Check for incorrect spelling of קיץ (any other variations)
            const incorrectSummerMatch = info.match(/(קי+ץ|ק+יץ)/);
            if (incorrectSummerMatch && !['קיץ', 'קייץ'].includes(incorrectSummerMatch[1])) {
                result.warnings = result.warnings || [];
                result.warnings.push(`Invalid exam period: "${incorrectSummerMatch[1]}". Should be "קיץ" or "קייץ"`);
            } else {
                const englishPeriodMatch = info.match(englishPeriodPattern);
                if (englishPeriodMatch) {
                    result.period = englishPeriodMatch[1] as ExamPeriod;
                }
            }
        }

        // Try Hebrew moed first, then English
        const hebrewMoedMatch = info.match(hebrewMoedPattern);
        if (hebrewMoedMatch) {
            const moed = hebrewMoedMatch[1];
            if (moed === 'א') {
                result.moed = 'A';
            } else if (moed === 'ב') {
                result.moed = 'B';
            } else if (moed === 'ג') {
                result.moed = 'Special';
            }
        } else {
            const englishMoedMatch = info.match(englishMoedPattern);
            if (englishMoedMatch) {
                result.moed = englishMoedMatch[0].toLowerCase().includes('b') ? 'B' : 'A';
            }
        }

        // Extract question number as order
        const questionMatch = info.match(questionPattern);
        if (questionMatch) {
            result.order = parseInt(questionMatch[1]);
        }

        return result;
    }

    /**
     * Clean exam info from text
     * Removes both bracketed and unbracketed exam info patterns
     * @param text The text to clean
     * @returns The cleaned text with exam info removed
     */
    static cleanExamInfo(text: string): string {
        if (!text) return '';

        // First remove bracketed exam info
        let cleaned = text.replace(/\[.*?\]\s*/g, '');

        // Then remove unbracketed exam info patterns
        cleaned = cleaned.replace(/^[א-ת]+ \d{4},\s*מועד [א-ת]'?\s*-\s*שאלה \d+\s*\n?/g, '');
        cleaned = cleaned.replace(/^[א-ת]+ \d{4},\s*מועד [א-ת]'?\s*\n?/g, '');

        return cleaned.trim();
    }

    /**
     * Extract and remove exam info from text if present at the start
     * Returns the cleaned text and the extracted info
     */
    static extractExamInfo(text: string): {
        cleanedText: string;
        examInfo: ExamInfo;
    } {
        console.log('\n🔍 EXTRACT EXAM INFO CALLED 🔍');
        console.log('Input text:', text ? `"${text.substring(0, 100)}..."` : 'undefined or null');
        
        if (!text) {
            console.log('❌ No text provided to extractExamInfo');
            return { cleanedText: '', examInfo: {} };
        }

        // First extract exam info
        const examInfo = this.parseExamInfo(text);
        console.log('📋 Parsed exam info:', examInfo);

        // Pattern to match exam info at start of text
        const examLinePattern = /^[א-ת]+ \d{4},\s*מועד [א-ת]'?\s*-\s*שאלה \d+\s*\n?/;
        
        // Debug logging for pattern matching
        const lines = text.split('\n');
        const firstLine = lines[0];
        console.log('\n=== EXAM INFO CLEANER DEBUG ===');
        console.log('Full text to clean:', JSON.stringify(text));
        console.log('Lines in text:', lines.length);
        console.log('First line:', JSON.stringify(firstLine));
        console.log('Pattern:', examLinePattern.source);
        console.log('Pattern test result:', examLinePattern.test(firstLine));
        
        // Remove exam info from start of text
        let cleanedText = text.replace(examLinePattern, (match) => {
            console.log('=== FOUND EXAM INFO ===');
            console.log('Matched text:', JSON.stringify(match));
            return '';
        });

        // Log if exam info is still present
        if (cleanedText.includes(firstLine)) {
            console.log('=== EXAM INFO NOT REMOVED ===');
            console.log('Original first line still present:', JSON.stringify(firstLine));
            console.log('Cleaned text starts with:', JSON.stringify(cleanedText.slice(0, 100)));
        } else {
            console.log('=== CLEANING RESULT ===');
            console.log('Cleaned text starts with:', JSON.stringify(cleanedText.slice(0, 100)));
        }

        // Clean up any remaining exam info patterns
        cleanedText = cleanedText
            // Remove bracketed exam info
            .replace(/\[.*?\]\s*/g, '')
            // Remove exam info at start of any remaining lines
            .replace(/^[א-ת]+ \d{4},\s*מועד [א-ת]'?\s*-\s*שאלה \d+\s*\n?/gm, '')
            .replace(/^[א-ת]+ \d{4},\s*מועד [א-ת]'?\s*\n?/gm, '')
            .replace(/^שאלה\s*\d+\s*[:\.]\s*\n?/gm, '')
            // Clean up whitespace but preserve intentional newlines
            .replace(/[ \t]+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .trim();

        console.log('🏁 Final cleaned text:', cleanedText ? `"${cleanedText.substring(0, 100)}..."` : 'empty');
        return {
            cleanedText,
            examInfo
        };
    }
} 