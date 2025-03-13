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
import { logger } from '../../../utils/logger';
import { TopicMapping } from '../utils/CategoryMapper';

// Raw source row - all fields needed throughout the pipeline
interface RawSourceRow {
    // Fields needed for transformation
    title: string;
    question_text: string;
    solution_text: string;
    category: string;

    // Fields needed for import info
    row_id: string;
    source_format: string;
    source_file: string;

    // Make compatible with RawImportRow
    [column: string]: string;
}

// Cleaned row - same fields as raw source plus new fields from cleaning
interface CleanedRow extends RawSourceRow {
    exam_info: string;      // JSON string of exam info, added during cleaning
    cleaning_changes: string; // JSON string tracking what was changed during cleaning
}

export class EZpass1ConstructionCommiteeOpenImporter extends BaseImporter {
    private excelPath: string;

    constructor(
        excelPath: string,
        questionStorage: QuestionStorage
    ) {
        super('ezpass1-construction-commitee-open', questionStorage);
        this.excelPath = excelPath;
    }

    /**
     * Read questions from Excel file and convert to raw rows
     */
    async readSource(sourcePath: string): Promise<RawSourceRow[]> {
        const workbook = xlsx.readFile(sourcePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json<{[key: string]: any}>(worksheet);
        
        return rows.map((row, index) => ({
            title: row['[Title]']?.toString() || row['Title']?.toString() || '',
            question_text: row['Question text']?.toString() || '',
            solution_text: row['Message with correct answer']?.toString() || '',
            category: row['Multi question category']?.toString() || '',
            row_id: row['ID']?.toString() || `row-${index + 1}`,
            source_format: 'excel',
            source_file: sourcePath
        }));
    }

    /**
     * Validate a raw row before transformation
     */
    async validateRow(row: RawImportRow): Promise<string[]> {
        const errors: string[] = [];
        const sourceRow = row as RawSourceRow;

        if (!sourceRow.title) errors.push('Missing title');
        if (!sourceRow.question_text) errors.push('Missing question content');
        if (!sourceRow.solution_text) errors.push('Missing solution');
        if (!sourceRow.category) errors.push('Missing category');

        // Try to map category to validate it exists
        if (sourceRow.category) {
            try {
                CategoryMapper.mapCategoryToTopic(sourceRow.category);
            } catch (error) {
                errors.push(`Invalid category: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return errors;
    }

    /**
     * Clean raw row and add any new fields from cleaning process
     */
    protected async cleanRow(row: RawImportRow): Promise<RawImportRow> {
        const sourceRow = row as RawSourceRow;
        
        // Clean text fields
        const cleanedTitle = this.cleanText(sourceRow.title, {
            removeExtraSpaces: true,
            trim: true
        });

        const cleanedQuestionText = this.cleanText(sourceRow.question_text, {
            removeExtraSpaces: true,
            removeTabs: true,
            trim: true
        });

        const cleanedSolutionText = this.cleanText(sourceRow.solution_text, {
            removeExtraSpaces: true,
            removeTabs: true,
            trim: true
        });

        // Create cleaned row with tracking changes
        const cleanedRow: CleanedRow = {
            ...sourceRow,
            title: cleanedTitle,
            question_text: cleanedQuestionText,
            solution_text: cleanedSolutionText,
            exam_info: '', // No exam info for open questions
            cleaning_changes: JSON.stringify({
                title_changed: cleanedTitle !== sourceRow.title,
                question_changed: cleanedQuestionText !== sourceRow.question_text,
                solution_changed: cleanedSolutionText !== sourceRow.solution_text,
                exam_info_extracted: false // Never extract exam info for open questions
            })
        };

        return cleanedRow;
    }

    /**
     * Transform cleaned row into a question
     */
    async transformRow(row: RawImportRow): Promise<Omit<Question, 'id'>> {
        const cleanedRow = row as CleanedRow;
        
        // Map category to topic structure
        const topicMapping = CategoryMapper.mapCategoryToTopic(cleanedRow.category);

        const transformed: Omit<Question, 'id'> = {
            name: cleanedRow.title,
            content: {
                text: cleanedRow.question_text,
                format: 'markdown'
            },
            schoolAnswer: {
                solution: {
                    text: cleanedRow.solution_text,
                    format: 'markdown'
                }
            },
            metadata: {
                subjectId: 'civil_engineering',
                domainId: 'construction_safety',
                topicId: topicMapping.topicId,
                subtopicId: topicMapping.subtopicId,
                type: QuestionType.OPEN,
                difficulty: 3,
                answerFormat: {
                    hasFinalAnswer: false,
                    finalAnswerType: 'none',
                    requiresSolution: true
                },
                estimatedTime: 10,
                source: {
                    type: 'exam',
                    examTemplateId: 'construction_manager_committee',
                    year: 2022 + Math.floor(Math.random() * 4), // Random year between 2022-2025
                }
            },
            evaluationGuidelines: {
                requiredCriteria: [
                    {
                        name: 'Correctness',
                        description: 'מידת הדיוק והנכונות של התשובה בהשוואה לפתרון המורה',
                        weight: 40
                    },
                    {
                        name: 'Completeness', 
                        description: 'מידת השלמות של התשובה - האם כל הנקודות החשובות מהפתרון הוזכרו',
                        weight: 40
                    },
                    {
                        name: 'Clarity and Organization',
                        description: 'בהירות ההסבר, ארגון התשובה וסדר הגיוני',
                        weight: 20
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
                importScript: 'ezpass1-construction-commitee-open-importer',
                params: {}
            },
            source: {
                name: 'ezpass1.0',
                files: [this.excelPath],
                format: 'excel',
                originalId: sourceRow.row_id
            },
            originalData: {
                category: sourceRow.category
            }
        };
    }

    /**
     * Get a unique identifier for the row
     */
    getRowIdentifier(row: RawImportRow): string {
        return (row as RawSourceRow).row_id;
    }

    /**
     * Clean text with various options
     */
    protected cleanText(text: string, options: {
        removeExamInfo?: boolean;
        removeExtraSpaces?: boolean;
        removeTabs?: boolean;
        trim?: boolean;
    } = {}): string {
        let cleaned = text;

        if (options.removeExamInfo) {
            cleaned = cleaned.replace(/שאלה\s*\d+\s*[:\.]/g, '');
        }

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
} 