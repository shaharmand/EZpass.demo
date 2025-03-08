import { 
    Question, 
    QuestionType,
    EzpassCreatorType,
    AnswerFormat
} from '../../../types/question';
import { logger } from '../../../utils/logger';
import { BaseImporter, ImportResult } from './BaseImporter';
import { validateQuestion } from '../../../utils/questionValidator';
import { generateQuestionId } from '../../../utils/idGenerator';
import { CategoryMapper } from './utils/CategoryMapper';
import { CreateQuestion } from '../../../types/storage';
import { QuestionStorage } from '../questionStorage';
import { ExamInfoParser } from './utils/ExamInfoParser';
const XLSX = require('xlsx');

interface ExcelQuestion {
    title: string;
    question: string;
    category: string;
    solution: string;
}

export class OpenQuestionXlsImporter extends BaseImporter {
    private questionStorage: QuestionStorage;

    constructor(questionStorage: QuestionStorage) {
        super('open-question-xls');
        this.questionStorage = questionStorage;
    }

    /**
     * Read questions from Excel file
     * @param filePath Path to the Excel file
     * @param limit Optional limit on number of questions to read (default: no limit)
     */
    async readQuestionsFromExcel(filePath: string, limit?: number): Promise<ExcelQuestion[]> {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        // Debug: Log first row to see column names
        console.log('Excel column names:', Object.keys(rows[0] || {}));
        console.log('First row data:', rows[0]);
        console.log('Title value:', rows[0]?.['Title']);
        console.log('Title value with brackets:', rows[0]?.['[Title]']);
        
        // Apply limit if specified
        const questionsToProcess = limit ? rows.slice(0, limit) : rows;
        
        console.log(`Reading ${limit ? `${limit} of ` : ''}${rows.length} questions from Excel`);
        
        return questionsToProcess.map((row: any) => ({
            title: row['[Title]']?.toString().trim() || row['Title']?.toString().trim() || '',
            question: row['Question text']?.toString().trim() || '',
            category: row['Multi question category']?.toString().trim() || '',
            solution: row['Message with correct answer']?.toString().trim() || ''
        }));
    }

    protected getQuestionIdentifier(sourceQuestion: ExcelQuestion): string {
        // Use title as identifier since Excel rows don't have IDs
        return sourceQuestion.title;
    }

    protected async validateQuestion(question: ExcelQuestion): Promise<string[]> {
        const errors: string[] = [];

        if (!question.title) errors.push('Missing title');
        if (!question.question) errors.push('Missing question content');
        if (!question.solution) errors.push('Missing solution');
        if (!question.category) errors.push('Missing category');

        // Try to map category to validate it exists
        if (question.category) {
            try {
                CategoryMapper.mapCategoryToTopic(question.category);
            } catch (error) {
                errors.push(`Invalid category: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return errors;
    }

    protected async transformQuestion(question: ExcelQuestion, id?: string): Promise<Question> {
        // Extract exam info from title
        const examInfo = ExamInfoParser.parseExamInfo(question.title);

        // Map category to topic structure
        const { topicId, subtopicId } = CategoryMapper.mapCategoryToTopic(question.category);

        // Use provided ID or generate a new one
        const questionId = id || await generateQuestionId('civil_engineering', 'construction_safety');
        
        const transformed: Question = {
            id: questionId,
            name: question.title,  // Use the title from Excel directly
            content: {
                text: question.question,
                format: 'markdown'
            },
            schoolAnswer: {
                solution: {
                    text: question.solution,
                    format: 'markdown'
                }
            },
            metadata: {
                subjectId: 'civil_engineering',
                domainId: 'construction_safety',
                topicId,
                subtopicId,
                type: QuestionType.OPEN,
                difficulty: 3,
                answerFormat: {
                    hasFinalAnswer: false,
                    requiresSolution: true,
                    finalAnswerType: 'none'
                },
                estimatedTime: 10,
                source: examInfo?.year ? {
                    type: 'exam',
                    examTemplateId: 'mahat_civil_safety',
                    year: examInfo.year,
                    season: examInfo.season || 'summer',
                    moed: examInfo.moed || 'a',
                    order: examInfo.order
                } : {
                    type: 'ezpass',
                    creatorType: EzpassCreatorType.HUMAN
                }
            },
            evaluationGuidelines: {
                requiredCriteria: [
                    {
                        name: 'Understanding',
                        description: 'הבנת הבעיה והצגת פתרון מתאים',
                        weight: 40
                    },
                    {
                        name: 'Methodology',
                        description: 'שימוש נכון בשיטות ובתקנות',
                        weight: 35
                    },
                    {
                        name: 'Clarity',
                        description: 'בהירות ההסבר וארגון התשובה',
                        weight: 25
                    }
                ]
            }
        };

        return transformed;
    }

    async importQuestion(excelQuestion: ExcelQuestion, dryRun: boolean = false): Promise<ImportResult> {
        try {
            // Clean the data at entry point
            const cleanedQuestion = {
                ...excelQuestion,
                question: this.cleanText(excelQuestion.question, true),
                solution: this.cleanText(excelQuestion.solution, false)
            };

            // Transform the cleaned data
            const question = await this.transformQuestion(cleanedQuestion);

            // Validate the transformed question
            const validationResult = validateQuestion(question);
            if (validationResult.errors.length > 0) {
                return {
                    success: false,
                    errors: validationResult.errors.map(err => `${err.field}: ${err.message}`)
                };
            }

            // DRY RUN CHECK - Return early if dry run
            if (dryRun === true) {
                return {
                    success: true,
                    questionId: question.id,
                    warnings: ['Dry run mode - validation successful']
                };
            }

            // Create in database
            const createQuestion: CreateQuestion = {
                question: question,
                import_info: {
                    system: 'ezpass',
                    originalId: this.getQuestionIdentifier(excelQuestion),
                    importedAt: new Date().toISOString(),
                    additionalData: {
                        importSource: 'excel',
                        importType: 'excel-to-ezpass',
                        importerName: this.importerName,
                        originalTitle: excelQuestion.title,
                        originalCategory: excelQuestion.category
                    }
                }
            };

            await this.questionStorage.createQuestion(createQuestion);

            return {
                success: true,
                questionId: question.id
            };

        } catch (error) {
            logger.error(`Failed to import ${this.importerName} question`, {
                sourceId: this.getQuestionIdentifier(excelQuestion),
                error: error instanceof Error ? error.message : 'Unknown error',
                isDryRun: dryRun,
                stack: error instanceof Error ? error.stack : undefined
            });

            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Clean up text by removing exam info and whitespace
     */
    private cleanText(text: string, isQuestion: boolean = false): string {
        // Start with basic cleanup
        let cleaned = text.trim();

        // Remove exam info if it's a question
        if (isQuestion) {
            cleaned = cleaned.replace(/^\s*\[.*?\]\s*/m, '');
        }

        // Clean up whitespace and tabs
        cleaned = cleaned
            .replace(/\t+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        return cleaned;
    }

    /**
     * Import questions from an Excel file
     * @param filePath Path to the Excel file
     * @param limit Optional limit on number of questions to import
     * @param dryRun Whether to run in dry-run mode
     */
    async importFromExcel(filePath: string, limit?: number, dryRun: boolean = false): Promise<{
        total: number;
        successful: number;
        failed: number;
    }> {
        const questions = await this.readQuestionsFromExcel(filePath, limit);
        
        const stats = {
            total: questions.length,
            successful: 0,
            failed: 0
        };

        for (const question of questions) {
            const result = await this.importQuestion(question, dryRun);
            if (result.success) {
                stats.successful++;
                console.log(`✅ Imported question "${question.title}"`);
            } else {
                stats.failed++;
                logger.error(`Failed to import question "${question.title}"`, {
                    errors: result.errors
                });
            }
        }

        return stats;
    }
} 