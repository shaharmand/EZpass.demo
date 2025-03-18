import { Question } from 'question';
import OpenAI from 'openai';
import { initializeOpenAI, getOpenAI } from '../../../utils/openai';

export interface TitleGenerationOptions {
    includeCategory?: boolean;
    maxLength?: number;
    includeQuestionType?: boolean;
    useChoices?: boolean;  // Whether to use multiple choice options in title generation
    useSolution?: boolean; // Whether to use solution text in title generation
    useAI?: boolean;  // Whether to use AI for title generation
}

export interface RawQuestionData {
    questionText?: string;
    title?: string;
    category?: string;
    type?: string;
    subtopicId?: string;  // Added subtopicId
    options?: Array<{ text: string }>;  // Added multiple choice options
    solution?: string;    // Added solution text
}

export class TitleGenerator {
    private static openai: OpenAI;

    private static initializeOpenAI() {
        if (!this.openai) {
            initializeOpenAI();
            this.openai = getOpenAI();
        }
    }

    private static async generateAITitle(data: RawQuestionData): Promise<string> {
        this.initializeOpenAI();

        const prompt = `You are an expert educational content organizer specializing in creating concise, descriptive titles for questions in an educational system. 

Your task is to analyze the following question and create a standardized title that effectively summarizes its core content while following specific formatting rules.

## Question Information:
SubTopic: ${data.subtopicId || data.category || 'Not specified'}
Question Text: ${data.questionText || ''}
Options: ${data.options ? data.options.map(opt => opt.text).join('\n') : 'No options'}
Solution: ${data.solution || 'No solution provided'}

## Title Creation Rules:
1. Create a title between 15-35 characters (3-7 words) that captures the essence of what knowledge is being tested
2. Start with an appropriate type indicator word based on question intent:
   - "הגדרת" (Definition of) for questions about what something is
   - "דרישות" (Requirements) for questions about what is needed/required
   - "תנאים" (Conditions) for questions about when something applies
   - "אחריות" (Responsibility) for questions about who is responsible
   - "סמכות" (Authority) for questions about who has authority
   - "נהלי" (Procedures) for questions about how something is done
   - "תדירות" (Frequency) for questions about how often something occurs
   - "מפרט" (Specifications) for questions about detailed requirements
   - "חובת" (Obligation) for questions about mandatory actions/requirements
   - "אמצעי" (Means) for questions about tools or methods
3. Follow with the specific subject matter that is more specific than the SubTopic
4. Add distinguishing context when necessary, especially:
   - Location context (e.g., "באתר", "במפעל", "במעבדה")
   - Material context (e.g., "מעץ", "ממתכת")
   - Specific regulation or standard reference (e.g., "לפי תקן")
   - Temporal context (e.g., "זמני", "קבוע")
   - Conditional context (e.g., "בחירום", "בשגרה")
5. Focus on what knowledge is being tested rather than the question's phrasing

## Response Format:
First, analyze the question by addressing these points:
1. Question Type: [Identify if this is a definition, requirement, procedure, etc. question]
2. Central Concept: [Extract the main subject being tested]
3. Specific Context: [Note any distinguishing context that should be included]
4. Potential Similar Questions: [Identify potential similar questions that might exist in this subtopic]
5. Distinguishing Features: [Identify what specific elements would distinguish this question from similar ones]
6. Appropriate Type Indicator: [Select the most appropriate prefix word from the list]
7. Knowledge Being Tested: [Describe what specific knowledge or regulation this question is testing]

Then, based on your analysis, provide:
Generated Title: [Your title here]

Please provide both the analysis and the title.`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a title generation expert. Provide both the analysis and the generated title."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 500  // Increased to accommodate the analysis
            });

            const response = completion.choices[0]?.message?.content?.trim();
            
            // Log the full response for debugging
            console.log('\n=== Title Generation Analysis ===');
            console.log(response);
            console.log('===============================\n');

            // Extract just the title from the response and remove any extra quotes
            const titleMatch = response?.match(/Generated Title:\s*(.+)$/m);
            const generatedTitle = titleMatch 
                ? titleMatch[1].trim().replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
                : this.generateFallbackTitle(data);
            
            return generatedTitle;
        } catch (error) {
            console.error('Error generating AI title:', error);
            return this.generateFallbackTitle(data);
        }
    }

    private static generateFallbackTitle(data: RawQuestionData): string {
        // Fallback to the original title generation logic if AI fails
        let title = '';

        if (data.subtopicId || data.category) {
            title += `${data.subtopicId || data.category} - `;
        }

        if (data.type) {
            title += `[${data.type}] - `;
        }

        const contentText = data.title || data.questionText || '';
        const firstSentence = contentText.split(/[.!?]/)[0];
        
        const cleanText = firstSentence
            .replace(/[#*_`~]/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        title += cleanText.length > 100 
            ? cleanText.substring(0, 100) + '...'
            : cleanText;

        return title;
    }

    /**
     * Generates a title for a question based on its content
     * @param question The question object containing various fields (can be without ID)
     * @param options Configuration options for title generation
     * @returns Generated title
     */
    static async generateTitle(question: Omit<Question, 'id'>, options: TitleGenerationOptions = {}): Promise<string> {
        const {
            includeCategory = true,
            maxLength = 100,
            includeQuestionType = false,
            useChoices = false,
            useSolution = false,
            useAI = true  // Default to using AI
        } = options;

        // Create raw data with null checks
        const rawData: RawQuestionData = {
            questionText: question?.content?.text || question?.name || '',
            title: question?.name || '',
            category: question?.metadata?.subtopicId || question?.metadata?.topicId || '',
            type: question?.metadata?.type || '',
            subtopicId: question?.metadata?.subtopicId || '',
            options: question?.content?.options || [],
            solution: question?.schoolAnswer?.solution?.text || ''
        };

        if (useAI) {
            return this.generateAITitle(rawData);
        }

        return this.generateFallbackTitle(rawData);
    }

    /**
     * Generates a title from raw question data (useful during import)
     * @param data Raw question data from import source
     * @param options Configuration options for title generation
     * @returns Generated title
     */
    static async generateTitleFromRaw(data: RawQuestionData, options: TitleGenerationOptions = {}): Promise<string> {
        const {
            includeCategory = true,
            maxLength = 100,
            includeQuestionType = false,
            useChoices = false,
            useSolution = false,
            useAI = true  // Default to using AI
        } = options;

        if (useAI) {
            return this.generateAITitle(data);
        }

        return this.generateFallbackTitle(data);
    }
} 