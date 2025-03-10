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
     * Read questions from JSON file and convert to raw rows
     */
    async readSource(sourcePath: string): Promise<RawSourceRow[]> {
        const [jsonPath, excelPath] = sourcePath.split(';');
        
        // Read JSON questions
        const fileContent = await fs.promises.readFile(jsonPath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        const questionMap = jsonData.question || {};
        const rows: RawSourceRow[] = [];
        const errors: string[] = [];

        // Read Excel mappings
        const workbook = xlsx.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const mappings = xlsx.utils.sheet_to_json(worksheet, {
            raw: true,
            defval: '',
            blankrows: false
        });

        // Create normalized title to row map for Excel data
        const normalizedTitleMap = new Map<string, any>();
        
        // First log all Excel titles
        console.log('\nAvailable Excel mappings:');
        mappings.forEach((row: any) => {
            const title = row['Title'] || '';
            if (title.includes('2015')) {
                console.log(`Excel: "${title}" -> "${row['Multi question category']}"`);
            }
        });

        // Then create the map - only use rows with non-empty categories
        mappings.forEach((row: any) => {
            const title = row['Title'] || '';
            const category = row['Multi question category'] || '';
            // Add to map regardless of category being empty or not
            normalizedTitleMap.set(title, row);
        });

        // Extract questions from nested structure
        Object.entries(questionMap).forEach(([key, value]: [string, any]) => {
            Object.entries(value).forEach(([questionId, questionData]: [string, any]) => {
                if (questionData) {
                    const title = questionData._title || '';
                    
                    // Find matching Excel row using exact title
                    const excelRow = normalizedTitleMap.get(title);
                    const category = excelRow ? excelRow['Multi question category'] || '' : '';
                    const titleNew = excelRow ? excelRow['TitleNew'] || '' : '';
                    
                    if (!category) {
                        // Log error but continue with the import
                        console.error(`\nERROR: No category found for JSON title: "${title}"`);
                        console.error(`Question text: "${questionData._question}"`);
                        // Try to find similar titles
                        Array.from(normalizedTitleMap.keys())
                            .forEach(t => {
                                const similarity = t.replace(/\s+/g, '') === title.replace(/\s+/g, '');
                                if (similarity) {
                                    console.error(`Found similar Excel title: "${t}" -> "${normalizedTitleMap.get(t)['Multi question category']}"`);
                                }
                            });
                        errors.push(`Missing category mapping for title: "${title}"`);
                    }

                    // Parse answer data into separate fields
                    const answers = questionData._answerData || [];
                    const correctIndex = answers.findIndex((a: any) => a._correct) + 1;

                    const row: RawSourceRow = {
                        title: title,
                        titleNew: titleNew,
                        question: questionData._question || '',
                        correct_message: questionData._correctMsg || '',
                        answer1: answers[0]?._answer || '',
                        answer2: answers[1]?._answer || '',
                        answer3: answers[2]?._answer || '',
                        answer4: answers[3]?._answer || '',
                        correct_answer: correctIndex.toString(),
                        category: category, // This might be empty string now
                        post_id: questionId,
                        db_id: questionData._dbId?.toString() || '',
                        created_at: questionData._createdAt || '',
                        updated_at: questionData._updatedAt || '',
                        source: 'json',
                        source_file: jsonPath
                    };

                    rows.push(row);
                }
            });
        });

        if (errors.length > 0) {
            console.error('\nCategory mapping errors found:');
            errors.forEach(error => console.error(`- ${error}`));
        }

        return rows;
    }

    /**
     * Clean raw row and add any new fields from cleaning process
     */
    protected async cleanRow(row: RawImportRow): Promise<RawImportRow> {
        const sourceRow = row as RawSourceRow;
        
        // Extract exam info first (we need this for metadata)
        const examInfo = ExamInfoParser.parseExamInfo(sourceRow.title);

        // Also check question text for order if not found in title
        if (!examInfo.order) {
            const questionMatch = sourceRow.question.match(/שאלה\s*(\d+)/);
            if (questionMatch) {
                examInfo.order = parseInt(questionMatch[1]);
            }
        }

        // Clean question text with dedicated method
        const cleanedQuestionText = this.cleanQuestionText(sourceRow.question);

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
            title: sourceRow.titleNew || sourceRow.title, // Use titleNew if available, fallback to original title
            titleNew: sourceRow.titleNew,
            question: cleanedQuestionText,
            correct_message: this.cleanText(sourceRow.correct_message, {
                removeExtraSpaces: true,
                removeTabs: true,
                trim: true
            }),
            
            // Clean each answer
            answer1: this.cleanOptionText(sourceRow.answer1),
            answer2: this.cleanOptionText(sourceRow.answer2),
            answer3: this.cleanOptionText(sourceRow.answer3),
            answer4: this.cleanOptionText(sourceRow.answer4),
            correct_answer: sourceRow.correct_answer,
            
            category: sourceRow.category?.trim() || '',

            // New fields from cleaning
            exam_info: examInfo ? JSON.stringify(examInfo) : '',

            // Track cleaning changes for debugging/validation
            cleaning_changes: JSON.stringify({
                title_changed: (sourceRow.titleNew || sourceRow.title) !== sourceRow.title,
                question_changed: cleanedQuestionText !== sourceRow.question,
                correct_message_changed: this.cleanText(sourceRow.correct_message) !== sourceRow.correct_message,
                answers_changed: [
                    this.cleanOptionText(sourceRow.answer1) !== sourceRow.answer1,
                    this.cleanOptionText(sourceRow.answer2) !== sourceRow.answer2,
                    this.cleanOptionText(sourceRow.answer3) !== sourceRow.answer3,
                    this.cleanOptionText(sourceRow.answer4) !== sourceRow.answer4
                ],
                category_changed: (sourceRow.category?.trim() || '') !== sourceRow.category,
                exam_info_extracted: !!examInfo
            })
        };

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

        // 2. Normalize whitespace
        return cleanedExamInfo
            .replace(/\s+/g, ' ')  // Replace multiple whitespace chars with single space
            .trim();               // Remove leading/trailing whitespace
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
            cleaned = cleaned.replace(/\s+/g, ' ');
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
        
        // Map category to topic structure only if category exists
        let topicId: string | undefined;
        let subtopicId: string | undefined;
        
        if (cleanedRow.category) {
            try {
                const mapping = CategoryMapper.mapCategoryToTopic(cleanedRow.category);
                topicId = mapping.topicId;
                subtopicId = mapping.subtopicId;
            } catch (error) {
                console.error(`Failed to map category "${cleanedRow.category}" to topic structure:`, error);
                // Leave topic/subtopic undefined
            }
        }

        // Parse exam info (added during cleaning)
        const examInfo = cleanedRow.exam_info ? JSON.parse(cleanedRow.exam_info) : null;
        
        // Debug logging for title selection
        console.log('\nTransforming row title:', {
            titleNew: cleanedRow.titleNew,
            originalTitle: cleanedRow.title,
            selectedTitle: cleanedRow.titleNew || cleanedRow.title,
            hasExamInfo: !!examInfo,
            examInfoYear: examInfo?.year,
            examInfoPeriod: examInfo?.period,
            category: cleanedRow.category,
            hasTopicMapping: !!topicId
        });

        const transformed: Omit<Question, 'id'> = {
            name: cleanedRow.titleNew || cleanedRow.title || 'Missing Title',
            content: {
                text: cleanedRow.question,
                format: 'markdown',
                options: [
                    { text: cleanedRow.answer1, format: 'markdown' },
                    { text: cleanedRow.answer2, format: 'markdown' },
                    { text: cleanedRow.answer3, format: 'markdown' },
                    { text: cleanedRow.answer4, format: 'markdown' }
                ]
            },
            schoolAnswer: {
                finalAnswer: {
                    type: 'multiple_choice',
                    value: parseInt(cleanedRow.correct_answer) as 1 | 2 | 3 | 4
                },
                solution: {
                    text: cleanedRow.correct_message,
                    format: 'markdown'
                }
            },
            metadata: {
                subjectId: 'civil_engineering',
                domainId: 'construction_safety',
                topicId: topicId || '',
                subtopicId: subtopicId || '',
                type: QuestionType.MULTIPLE_CHOICE,
                difficulty: 3,
                answerFormat: {
                    hasFinalAnswer: true,
                    finalAnswerType: 'multiple_choice',
                    requiresSolution: false
                },
                estimatedTime: 3,
                source: examInfo ? {
                    type: 'exam',
                    examTemplateId: 'mahat_civil_safety',
                    year: examInfo.year,
                    period: examInfo.period,
                    moed: examInfo.moed,
                    order: examInfo.order
                } : {
                    type: 'ezpass',
                    creatorType: EzpassCreatorType.HUMAN
                }
            },
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

        return transformed;
    }

    /**
     * Get source-specific import info
     */
    protected getImportInfo(row: RawImportRow): ImportInfo {
        const sourceRow = row as RawSourceRow;
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
                title: sourceRow.title,
                question: sourceRow.question,
                correctMessage: sourceRow.correct_message,
                answers: [
                    sourceRow.answer1,
                    sourceRow.answer2,
                    sourceRow.answer3,
                    sourceRow.answer4
                ],
                correctAnswer: sourceRow.correct_answer,
                category: sourceRow.category,
                createdAt: sourceRow.created_at,
                updatedAt: sourceRow.updated_at
            }
        };
    }

    /**
     * Clean option text by removing prefixes like א., ב., etc.
     */
    private cleanOptionText(text: string): string {
        // Remove option prefixes (א., ב., ג., ד.) and any following spaces/tabs
        return text.replace(/^[א-ד]\.\s*|\t+/g, '').trim();
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