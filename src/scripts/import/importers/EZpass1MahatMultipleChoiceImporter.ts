import { Question, QuestionType, EzpassCreatorType } from '../../../types/question';
import { BaseImporter } from './BaseImporter';
import { RawImportRow, ImportInfo } from '../types/importTypes';
import { validateQuestion } from '../../../utils/questionValidator';
import { generateQuestionId } from '../../../utils/idGenerator';
import { CategoryMapper } from '../utils/CategoryMapper';
import { ExamInfoParser } from '../utils/ExamInfoParser';
import { QuestionStorage } from '../../../services/admin/questionStorage';
import { TitleGenerator } from '../utils/TitleGenerator';
import xlsx from 'xlsx';
import fs from 'fs';

// Raw source row - all fields needed throughout the pipeline
interface RawSourceRow {
    // Fields needed for transformation
    title: string;          
    titleNew: string;      // New field for transformed title
    question: string;       
    correct_message: string;
    
    // Answer fields - explicit columns instead of JSON
    answer1: string;
    answer2: string;
    answer3: string;
    answer4: string;
    correct_answer: string;  // 1-4 as string
    
    category: string;       

    // Fields needed for import info
    post_id: string;        
    db_id: string;         
    created_at: string;    
    updated_at: string;    
    source: string;        
    source_file: string;   

    // Make compatible with RawImportRow
    [column: string]: string;
}

// Cleaned row - same fields as raw source plus new fields from cleaning
interface CleanedRow extends RawSourceRow {
    exam_info: string;      // JSON string of exam info, added during cleaning
    cleaning_changes: string; // JSON string tracking what was changed during cleaning
}

export class EZpass1MahatMultipleChoiceImporter extends BaseImporter {
    private titleToCategoryMap: Map<string, string> = new Map();
    private jsonPath: string;
    private excelPath: string;
    private options?: { limit?: number; dryRun?: boolean };

    constructor(
        jsonPath: string,
        excelPath: string,
        questionStorage: QuestionStorage
    ) {
        super('ezpass1-mahat-multiple-choice', questionStorage);
        this.jsonPath = jsonPath;
        this.excelPath = excelPath;
        this.loadTitleToCategoryMap();
    }

    /**
     * Set import options
     */
    setOptions(options: { limit?: number; dryRun?: boolean }) {
        console.log('\n=== EZpass1MahatMultipleChoiceImporter setOptions ===');
        console.log('Previous options:', this.options);
        console.log('New options:', options);
        this.options = options;
        console.log('Updated options:', this.options);
        console.log('================================================\n');
    }

    /**
     * Read questions from JSON file and convert to raw rows
     */
    async readSource(sourcePath: string): Promise<RawSourceRow[]> {
        console.log('\n=== EZpass1MahatMultipleChoiceImporter readSource ===');
        console.log('Source Path:', sourcePath);
        console.log('Options state:', this.options);
        console.log('Limit value:', this.options?.limit);
        console.log('Dry run value:', this.options?.dryRun);
        console.log('===================================================\n');

        try {
            // Read JSON file
            const jsonData = await fs.promises.readFile(sourcePath, 'utf-8');
            const data = JSON.parse(jsonData);

            // Read category mappings from Excel
            const workbook = xlsx.readFile(this.excelPath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const categoryData = xlsx.utils.sheet_to_json(worksheet);
            
            // Debug: Log the first row to see column names
            if (categoryData.length > 0) {
                console.log('Excel file first row:', categoryData[0]);
            }

            // Create mapping of titles to categories
            const categoryMap = new Map<string, string>();
            categoryData.forEach((row: any) => {
                if (row['Title'] && row['Category']) {
                    categoryMap.set(row['Title'], row['Category']);
                }
            });

            console.log(`Loaded ${categoryMap.size} category mappings from Excel`);
            if (categoryMap.size > 0) {
                console.log('First few mappings:', Array.from(categoryMap.entries()).slice(0, 2));
            } else {
                console.log('No category mappings found. Available columns:', Object.keys(categoryData[0] || {}));
            }

            // Extract questions from JSON data
            const questions = Object.entries(data.question || {})
                .map(([key, value]: [string, any]) => {
                    const questionId = Object.keys(value)[0];
                    const questionData = value[questionId];
                    const postData = data.post?.[questionId];

                    if (!questionData) {
                        console.log(`Missing data for question ${key}`);
                        return null;
                    }

                    // Get category by matching title
                    const category = categoryMap.get(questionData._title);
                    if (!category) {
                        console.log(`No category found for title: ${questionData._title}`);
                        return null;
                    }

                    // Convert to RawSourceRow format
                    const rawRow: RawSourceRow = {
                        title: questionData._title || '',
                        titleNew: questionData._title || '',  // Initially same as title
                        question: questionData._question || '',
                        correct_message: questionData._correctMsg || '',
                        answer1: questionData._answerData?.[0]?._answer || '',
                        answer2: questionData._answerData?.[1]?._answer || '',
                        answer3: questionData._answerData?.[2]?._answer || '',
                        answer4: questionData._answerData?.[3]?._answer || '',
                        correct_answer: (questionData._answerData?.findIndex((a: any) => a._correct) + 1).toString() || '',
                        category: category,
                        post_id: questionId,
                        db_id: questionId,
                        created_at: postData?.post_date || '',
                        updated_at: postData?.post_modified || '',
                        source: 'ezpass1.0',
                        source_file: this.jsonPath
                    };

                    return rawRow;
                })
                .filter((row): row is RawSourceRow => row !== null);

            console.log(`Found ${questions.length} valid questions`);

            // Apply limit if specified
            const limitedQuestions = this.options?.limit ? questions.slice(0, this.options.limit) : questions;
            console.log(`Processing ${limitedQuestions.length} questions (${this.options?.limit ? `limited from ${questions.length}` : 'all'})`);

            return limitedQuestions;

        } catch (error) {
            console.error('Error reading source:', error);
            throw error;
        }
    }

    /**
     * Clean raw row and add any new fields from cleaning process
     */
    protected async cleanRow(row: RawImportRow): Promise<RawImportRow> {
        const sourceRow = row as RawSourceRow;
        
        console.log('\n=== Cleaning Row ===');
        console.log('Original Row:', {
            title: sourceRow.title,
            question: sourceRow.question,
            answers: {
                answer1: sourceRow.answer1,
                answer2: sourceRow.answer2,
                answer3: sourceRow.answer3,
                answer4: sourceRow.answer4
            },
            category: sourceRow.category
        });
        
        // Extract exam info first (we need this for metadata)
        const examInfo = ExamInfoParser.parseExamInfo(sourceRow.title);
        console.log('Extracted Exam Info:', examInfo);

        // Also check question text for order if not found in title
        if (!examInfo.order) {
            const questionMatch = sourceRow.question.match(/שאלה\s*(\d+)/);
            if (questionMatch) {
                examInfo.order = parseInt(questionMatch[1]);
                console.log('Found order in question text:', examInfo.order);
            }
        }

        // Clean question text with special handling
        const cleanedQuestion = this.cleanQuestionText(sourceRow.question);
        console.log('Cleaned Question Text:', {
            original: sourceRow.question,
            cleaned: cleanedQuestion,
            changes: cleanedQuestion !== sourceRow.question
        });

        // Clean correct message with special handling for solutions
        const cleanedMessage = this.cleanSolutionText(sourceRow.correct_message);
        console.log('Cleaned Solution Text:', {
            original: sourceRow.correct_message,
            cleaned: cleanedMessage,
            changes: cleanedMessage !== sourceRow.correct_message
        });

        // Clean answers with special handling
        const cleanedAnswers = {
            answer1: this.cleanOptionText(sourceRow.answer1),
            answer2: this.cleanOptionText(sourceRow.answer2),
            answer3: this.cleanOptionText(sourceRow.answer3),
            answer4: this.cleanOptionText(sourceRow.answer4)
        };

        // Create new cleaned row with explicit fields
        const cleanedRow: CleanedRow = {
            // Import info fields - kept as is from source
            post_id: sourceRow.post_id,
            db_id: sourceRow.db_id,
            created_at: sourceRow.created_at,
            updated_at: sourceRow.updated_at,
            source: sourceRow.source,
            source_file: sourceRow.source_file,

            // Cleaned transform fields
            title: sourceRow.titleNew || sourceRow.title,
            titleNew: sourceRow.titleNew,
            question: cleanedQuestion,
            correct_message: cleanedMessage,
            
            // Cleaned answers
            answer1: cleanedAnswers.answer1,
            answer2: cleanedAnswers.answer2,
            answer3: cleanedAnswers.answer3,
            answer4: cleanedAnswers.answer4,
            correct_answer: sourceRow.correct_answer,
            
            category: sourceRow.category?.trim() || '',

            // New fields from cleaning
            exam_info: examInfo ? JSON.stringify(examInfo) : '',

            // Track cleaning changes for debugging/validation
            cleaning_changes: JSON.stringify({
                title_changed: (sourceRow.titleNew || sourceRow.title) !== sourceRow.title,
                question_changed: cleanedQuestion !== sourceRow.question,
                correct_message_changed: cleanedMessage !== sourceRow.correct_message,
                answers_changed: [
                    cleanedAnswers.answer1 !== sourceRow.answer1,
                    cleanedAnswers.answer2 !== sourceRow.answer2,
                    cleanedAnswers.answer3 !== sourceRow.answer3,
                    cleanedAnswers.answer4 !== sourceRow.answer4
                ],
                category_changed: (sourceRow.category?.trim() || '') !== sourceRow.category,
                exam_info_extracted: !!examInfo
            })
        };

        console.log('Cleaned Row Result:', {
            title: cleanedRow.title,
            titleNew: cleanedRow.titleNew,
            question: cleanedRow.question,
            answers: {
                answer1: cleanedRow.answer1,
                answer2: cleanedRow.answer2,
                answer3: cleanedRow.answer3,
                answer4: cleanedRow.answer4
            },
            category: cleanedRow.category
        });
        console.log('===================================\n');

        return cleanedRow;
    }

    /**
     * Clean question text by:
     * 1. Removing exam info (both bracketed and unbracketed)
     * 2. Normalizing whitespace (spaces, tabs, newlines)
     * 
     * @param text The question text to clean
     * @returns The cleaned question text
     */
    private cleanQuestionText(text: string): string {
        if (!text) return '';

        // 1. Remove exam info
        const cleanedExamInfo = ExamInfoParser.cleanExamInfo(text);

        // 2. Use base class's cleanText to preserve newlines
        return this.cleanText(cleanedExamInfo, {
            removeExtraSpaces: true,
            removeTabs: true,
            trim: true
        });
    }

    /**
     * Clean option text by removing leading/trailing whitespace and normalizing spaces
     * while preserving newlines
     */
    private cleanOptionText(text: string): string {
        if (!text) return '';
        // Remove option prefixes (א., ב., ג., ד.) and any following spaces/tabs
        return text.replace(/^[א-ד]\.\s*|\t+/g, '').trim();
    }

    /**
     * Clean text with various options
     * Note: This method handles basic text cleaning for non-question text
     */
    protected cleanText(text: string, options: {
        removeExtraSpaces?: boolean;
        removeTabs?: boolean;
        trim?: boolean;
    } = {}): string {
        let cleaned = text;

        if (options.removeExtraSpaces) {
            // Split by newlines, clean each line, then rejoin
            cleaned = cleaned.split('\n').map(line => {
                return line.replace(/\s{2,}/g, ' ');  // Only replace multiple spaces with single space
            }).join('\n');
        }

        if (options.removeTabs) {
            cleaned = cleaned.replace(/\t+/g, ' ');
        }

        if (options.trim) {
            cleaned = cleaned.trim();
        }

        return cleaned;
    }

    /**
     * Clean solution text by:
     * 1. Removing הסבר: or הסבר from the first line
     * 2. Normalizing whitespace while preserving newlines
     */
    private cleanSolutionText(text: string): string {
        if (!text) return '';
        
        // Split into lines
        const lines = text.split('\n');
        
        // Clean first line by removing הסבר: or הסבר
        if (lines.length > 0) {
            lines[0] = lines[0].replace(/^הסבר:?\s*/, '');
        }
        
        // Rejoin lines and clean whitespace while preserving newlines
        return this.cleanText(lines.join('\n'), {
            removeExtraSpaces: true,
            removeTabs: true,
            trim: true
        });
    }

    /**
     * Validate a raw row before transformation
     */
    async validateRow(row: RawImportRow): Promise<string[]> {
        const errors: string[] = [];
        const warnings: string[] = [];
        const sourceRow = row as RawSourceRow;

        // Debug logging for title fields
        console.log('\nValidating row title fields:', {
            originalTitle: sourceRow.title,
            titleNew: sourceRow.titleNew,
            hasTitle: !!sourceRow.title,
            hasTitleNew: !!sourceRow.titleNew,
            questionStart: sourceRow.question?.substring(0, 50),
            postId: sourceRow.post_id
        });

        // Check for missing titleNew - this should be present for all rows
        if (!sourceRow.titleNew) {
            const warning = `Warning: Missing titleNew for question ${sourceRow.post_id} (using original title: "${sourceRow.title}")`;
            console.log('⚠️', warning);
            warnings.push(warning);
        }

        // Still fail if both titles are missing
        if (!sourceRow.title && !sourceRow.titleNew) {
            console.log('❌ Both title and titleNew are missing');
            errors.push('Missing title (both title and titleNew are empty)');
        }
        
        if (!sourceRow.question) {
            errors.push('Missing question text');
        }
        
        // Validate answers
        if (!sourceRow.answer1 || !sourceRow.answer2 || !sourceRow.answer3 || !sourceRow.answer4) {
            errors.push('Missing one or more answer options');
        }
        if (!sourceRow.correct_answer) {
            errors.push('Missing correct answer');
        } else {
            const correctNum = parseInt(sourceRow.correct_answer);
            if (isNaN(correctNum) || correctNum < 1 || correctNum > 4) {
                errors.push('Correct answer must be a number between 1 and 4');
            }
        }
        
        if (!sourceRow.category) {
            // Change from error to warning for missing category
            const warning = `Warning: Missing category for question "${sourceRow.title}" (ID: ${sourceRow.post_id}). Question will be imported but needs category assignment.`;
            console.log('\n⚠️', warning);
            console.log(`Title: "${sourceRow.title}"`);
            console.log(`TitleNew: "${sourceRow.titleNew}"`);
            console.log(`Question: "${sourceRow.question}"`);
            console.log('---');
            warnings.push(warning);
        }

        // Track warnings in the import stats
        if (warnings.length > 0) {
            // Add warnings to the import stats through the base importer
            this.addWarnings(warnings);
        }

        return errors;
    }

    /**
     * Transform cleaned row into a question
     */
    async transformRow(row: RawImportRow): Promise<Omit<Question, 'id'>> {
        const cleanedRow = row as CleanedRow;

        // Create the question object with only core content fields
        const question: Omit<Question, 'id'> = {
            name: cleanedRow.titleNew || cleanedRow.title,  // Use original title initially
            content: {
                text: cleanedRow.question,
                format: 'markdown' as const,
                options: [
                    { text: cleanedRow.answer1, format: 'markdown' as const },
                    { text: cleanedRow.answer2, format: 'markdown' as const },
                    { text: cleanedRow.answer3, format: 'markdown' as const },
                    { text: cleanedRow.answer4, format: 'markdown' as const }
                ]
            },
            schoolAnswer: {
                finalAnswer: {
                    type: 'multiple_choice',
                    value: parseInt(cleanedRow.correct_answer) as 1 | 2 | 3 | 4
                },
                solution: {
                    text: cleanedRow.correct_message,
                    format: 'markdown' as const
                }
            },
            // Required metadata with minimal values
            metadata: {
                subjectId: 'civil_engineering',
                domainId: 'construction_safety',
                topicId: CategoryMapper.mapCategoryToTopic(cleanedRow.category).topicId,
                subtopicId: CategoryMapper.mapCategoryToTopic(cleanedRow.category).subtopicId,
                type: QuestionType.MULTIPLE_CHOICE,
                difficulty: 3,
                answerFormat: {
                    hasFinalAnswer: true,
                    finalAnswerType: 'multiple_choice',
                    requiresSolution: false
                }
            },
            // Required evaluation guidelines with minimal values
            evaluationGuidelines: {
                requiredCriteria: [
                    {
                        name: 'Correctness',
                        description: 'Selection of the correct answer',
                        weight: 100
                    }
                ]
            }
        };

        // Generate title using OpenAI as the final step
        try {
            console.log('\n=== Generating Title ===');
            const generatedTitle = await TitleGenerator.generateTitle(question);
            console.log('Generated Title:', generatedTitle);
            question.name = generatedTitle;
            console.log('Title Generation Complete');
            console.log('========================\n');
        } catch (error) {
            console.error('Error generating title:', error);
            console.log('Keeping original title:', question.name);
            // Keep the original title if generation fails
        }

        // Log the transformed question content
        console.log('\n=== Transformed Question Content ===');
        console.log(JSON.stringify(question, null, 2));
        console.log('===================================\n');

        return question;
    }

    /**
     * Get source-specific import info
     */
    protected getImportInfo(row: RawImportRow, question: Question): ImportInfo {
        const sourceRow = row as RawSourceRow;
        const cleanedRow = row as CleanedRow;
        const examInfo = JSON.parse(cleanedRow.exam_info || '{}');
        const { topicId, subtopicId } = CategoryMapper.mapCategoryToTopic(cleanedRow.category);

        // Only use the generated title, no fallback
        const title = question.name;

        // Log title generation details
        console.log('\n=== Title Generation ===');
        console.log('Original Title:', sourceRow.title);
        console.log('New Title:', sourceRow.titleNew);
        console.log('Generated Title:', title);
        console.log('Title Generation Reasoning:', {
            questionLength: cleanedRow.question.length,
            hasExamInfo: !!examInfo,
            examInfo,
            titleLength: title?.length || 0,
            isQuestionBased: title === cleanedRow.question,
            isOriginalBased: title === cleanedRow.title
        });
        console.log('========================\n');

        return {
            importMetadata: {
                importedAt: new Date().toISOString(),
                importScript: 'ezpass1-mahat-multiple-choice-importer',
                params: {}
            },
            source: {
                name: 'ezpass1.0',
                files: [this.jsonPath, this.excelPath],
                format: 'json+xls',
                originalId: sourceRow.post_id,
                dbId: sourceRow.db_id
            },
            originalData: {
                raw: {
                    title: sourceRow.title,
                    question: sourceRow.question,
                    answers: {
                        answer1: sourceRow.answer1,
                        answer2: sourceRow.answer2,
                        answer3: sourceRow.answer3,
                        answer4: sourceRow.answer4
                    },
                    correctAnswer: sourceRow.correct_answer,
                    correctMessage: sourceRow.correct_message,
                    category: sourceRow.category
                },
                final: {
                    title,
                    question: cleanedRow.question,
                    answers: {
                        answer1: cleanedRow.answer1,
                        answer2: cleanedRow.answer2,
                        answer3: cleanedRow.answer3,
                        answer4: cleanedRow.answer4
                    },
                    correctAnswer: cleanedRow.correct_answer,
                    correctMessage: cleanedRow.correct_message,
                    category: cleanedRow.category,
                    topicId,
                    subtopicId
                },
                aiReasoning: {
                    titleGeneration: {
                        originalTitle: sourceRow.title,
                        newTitle: sourceRow.titleNew,
                        generatedTitle: title,
                        reasoning: {
                            questionLength: cleanedRow.question.length,
                            hasExamInfo: !!examInfo,
                            examInfo,
                            titleLength: title?.length || 0,
                            isQuestionBased: title === cleanedRow.question,
                            isOriginalBased: title === cleanedRow.title
                        }
                    }
                }
            }
        };
    }

    /**
     * Get a unique identifier for the row
     */
    getRowIdentifier(row: RawImportRow): string {
        return (row as RawSourceRow).post_id || 'unknown';
    }

    private loadTitleToCategoryMap() {
        // Implementation of loadTitleToCategoryMap method
    }

 
} 