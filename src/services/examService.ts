import { type DifficultyLevel } from '../types/question';
import { ExamType, type ExamTemplate } from '../types/examTemplate';
import { type SubTopic, type Topic } from '../types/subject';
import { logger } from '../utils/logger';
import { validateExamTemplate, examTemplateSchema } from '../schemas/examTemplateSchema';
import { universalTopics } from './universalTopics';
import { Question } from '../types/question';
import { Subject } from '../types/subject';
import { QuestionType } from '../types/question';

// Import exam data directly
const bagrutCS = require('../../data/exams/bagrut_cs.json');
const mahatCS = require('../../data/exams/mahat_cs.json');
const mahatCivil = require('../../data/exams/mahat_civil.json');
const csProgrammingFundamentals = require('../../data/subjects/cs_programming_fundamentals_hsp.json');
const csDataStructures = require('../../data/subjects/cs_data_structures_hsp.json');
//const bagrutMath = require('../../data/exams/bagrut_math.json');

// Raw data interfaces
interface RawSubTopic {
  id: string;
  name?: string;
  description?: string;
  order?: number;
  percentageOfTotal?: number;
}

interface RawTopic {
  id: string;
  name?: string;
  description?: string;
  order?: number;
  subTopics: RawSubTopic[];
}

interface RawExam {
  id: string;
  code: string;
  names: {
    short: string;
    medium: string;
    full: string;
  };
  examType: ExamType;
  difficulty: DifficultyLevel;
  maxDifficulty?: DifficultyLevel;
  subjectId: string;
  domainId: string;
  topics: RawTopic[];
  allowedQuestionTypes: string[];
  duration: number;
  totalQuestions: number;
}

/**
 * Service for loading and managing exam data.
 * Handles loading exam configurations and converting them to runtime formats.
 */
class ExamService {
  private examsByType: Map<ExamType, ExamTemplate[]> = new Map();
  private examsByDomain: Map<string, ExamTemplate[]> = new Map();
  private examsBySubject: Map<string, ExamTemplate[]> = new Map();
  private examCache: Map<string, ExamTemplate> = new Map();

  constructor() {
    this.initializeExams().catch(error => {
      logger.error('Failed to initialize ExamService:', error);
    });
  }

  private async initializeExams() {
    try {
      // Wait for UniversalTopics to be initialized first
      await universalTopics.waitForInitialization();
      
      const rawExams: RawExam[] = [
        ...bagrutCS.exams.map((exam: any) => ({ ...exam, examType: exam.examType as ExamType })),
        ...mahatCS.exams.map((exam: any) => ({ ...exam, examType: exam.examType as ExamType })),
        ...mahatCivil.exams.map((exam: any) => ({ ...exam, examType: exam.examType as ExamType }))
      ];

      this.examCache = new Map<string, ExamTemplate>();
      this.examsByType = new Map<ExamType, ExamTemplate[]>();
      this.examsBySubject = new Map<string, ExamTemplate[]>();
      this.examsByDomain = new Map<string, ExamTemplate[]>();

      rawExams.forEach(rawExam => {
        const transformedExam = {
          ...rawExam,
          topics: rawExam.topics.map((topic: RawTopic) => ({
            id: topic.id,
            name: topic.name || '',
            description: topic.description || '',
            order: topic.order ?? 0,
            subTopics: topic.subTopics.map((st): RawSubTopic => ({
              id: st.id,
              name: st.name || '',
              description: st.description || '',
              order: st.order ?? 0,
              percentageOfTotal: st.percentageOfTotal ?? 0
            }))
          })) as Topic[]
        };

        const exam = validateExamTemplate(transformedExam);
        
        const baseTopics: Topic[] = exam.topics.map(topic => ({
          id: topic.id,
          name: topic.name,  // Already validated as string
          description: topic.description,  // Already validated as string
          order: topic.order,  // Already validated as number
          subTopics: topic.subTopics.map(st => {
            const subtopic = st as unknown as SubTopic;
            return {
              id: subtopic.id,
              name: subtopic.name,
              description: subtopic.description,
              order: subtopic.order,
              questionTemplate: subtopic.questionTemplate,
              typicalQuestions: subtopic.typicalQuestions,
              percentageOfTotal: subtopic.percentageOfTotal
            } as SubTopic;
          })
        }));

        // Enrich with universal topic data
        const enrichedTopics = universalTopics.enrichTopicsArray(baseTopics);
        exam.topics = enrichedTopics;

        // Store by ID
        this.examCache.set(exam.id, exam);

        // Store by exam type
        if (!this.examsByType.has(exam.examType)) {
          this.examsByType.set(exam.examType, []);
        }
        this.examsByType.get(exam.examType)?.push(exam);

        // Store by subject
        const subjectId = exam.subjectId;
        if (!this.examsBySubject.has(subjectId)) {
          this.examsBySubject.set(subjectId, []);
        }
        this.examsBySubject.get(subjectId)?.push(exam);

        // Store by domain
        const domainId = exam.domainId;
        if (!this.examsByDomain.has(domainId)) {
          this.examsByDomain.set(domainId, []);
        }
        this.examsByDomain.get(domainId)?.push(exam);
      });

      // Simple success summary with counts
      logger.info('ExamService initialized:', {
        totalExams: this.examCache.size,
        examsByType: Object.fromEntries(
          Array.from(this.examsByType.entries()).map(([type, exams]) => [type, exams.length])
        ),
        examsBySubject: Object.fromEntries(
          Array.from(this.examsBySubject.entries()).map(([id, exams]) => [id, exams.length])
        ),
        examsByDomain: Object.fromEntries(
          Array.from(this.examsByDomain.entries()).map(([id, exams]) => [id, exams.length])
        )
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to initialize ExamService:', { error: errorMessage });
      throw new Error(`ExamService initialization failed: ${errorMessage}`);
    }
  }
  /**
   * Gets all exams for a given subject ID
   */
  async getExamsBySubject(subjectId: string): Promise<ExamTemplate[]> {
    const exams = this.examsBySubject.get(subjectId);
    if (!exams) {
      throw new Error(`No exams found for subject: ${subjectId}`);
    }
    return exams;
  }

  /**
   * Gets all exams of a specific type.
   * @param examType Type of exams to load (bagrut/mahat)
   */
  getExamsByType(examType: ExamType): ExamTemplate[] {
    const exams = this.examsByType.get(examType) || [];
    return exams;
  }
  
  /**
   * Gets all exams of a specific domain.
   * @param domainId Domain ID to load exams for
   */
  getExamsByDomain(domainId: string): ExamTemplate[] {
    const exams = this.examsByDomain.get(domainId) || [];
    return exams;
  }

  /**
   * Gets a specific exam by ID.
   * @param examId Unique exam identifier
   */
  getExamById(examId: string): ExamTemplate | null {
    const examData = this.examCache.get(examId);
    if (!examData) return null;
    return examData;
  }

 
}

// Export a singleton instance
export const examService = new ExamService(); 