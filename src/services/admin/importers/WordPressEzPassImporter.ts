import { 
  Question, 
  QuestionType, 
  DifficultyLevel,
  SourceType,
  EzpassCreatorType,
  ValidationStatus,
  PublicationStatusEnum
} from '../../../types/question';
import { questionStorage } from '../questionStorage';
import { logger } from '../../../utils/logger';
import { BaseImporter, ImportResult } from './BaseImporter';
import { universalTopics } from '../../universalTopics';
import { Topic, SubTopic } from '../../../types/subject';
import { validateQuestion } from '../../../utils/questionValidator';
import { examService } from '../../../services/examService';
import { generateQuestionId, validateQuestionId } from '../../../utils/idGenerator';
import { getSupabase } from '../../supabaseClient';
const TurndownService = require('turndown');

interface WordPressEzPassQuestion {
  _id: number;          // Post ID
  _dbId?: number;       // Database ID (if different)
  _title: string;
  _question: string;
  _correctMsg: string;
  _incorrectMsg: string;
  _answerType: string;
  _answerData: Array<{
    _answer: string;
    _correct: boolean;
    _html: boolean;
  }>;
  _category?: string;
  _createdAt?: string;
  _updatedAt?: string;
}

interface TopicMapping {
  subtopicId: string;
  topicId: string;
}

const NEWLINE_MARKER = '{{PRESERVED_NEWLINE}}';

// Configure turndown with minimal options
const turndown = new TurndownService({
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
  hr: '---',
  strongDelimiter: '**',
  emDelimiter: '*'
});

// Only handle basic HTML elements
turndown.addRule('basic', {
  filter: ['p', 'div', 'br'],
  replacement: function(content: string) {
    return content;
  }
});

// Simple list handling
turndown.addRule('lists', {
  filter: ['ol', 'ul'],
  replacement: function(content: string, node: any) {
    const isOrdered = node.nodeName === 'OL';
    let items = content.split('\n').filter(item => item.trim().length > 0);
    
    items = items.map((item: string, i: number) => {
      const prefix = isOrdered ? `${i + 1}. ` : '- ';
      return prefix + item;
    });
    
    return items.join('\n');
  }
});

export class WordPressEzPassImporter extends BaseImporter {
  private htmlEntities: { [key: string]: string } = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&ndash;': '\u2013',
    '&mdash;': '\u2014',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D'
  };

  private categoryMappings: { [key: string]: string } = {
    'משטחי עבודה, מדרכת מעבר ופתחים': 'משטחי עבודה, מדרכות מעבר ופתחים',
    'מכונות הרמה אחרות ואביזרי הרמה': 'מכונות ואביזרי הרמה',
    'תוכניות בטיחות': 'תכניות בטיחות',
    'גגות שבירים תלולים': 'גגות שבירים או תלולים',
    'הקמת מבנה מתכת': 'הקמת מבני מתכת',
    'שירות פיקוח על העבודה והמוס"ל': 'שרות פיקוח על העבודה והמוס"ל'
  };

  constructor() {
    super('wordpress-ezpass');
  }

  /**
   * Get unique identifier for the question in source format
   */
  protected getQuestionIdentifier(sourceQuestion: WordPressEzPassQuestion): string {
    return sourceQuestion._id.toString();
  }

  /**
   * Parse exam info from text
   */
  private parseExamInfo(text: string): {
    year?: number;
    season?: 'spring' | 'summer';
    moed?: 'a' | 'b';
    order?: number;
  } {
    const info: {
      year?: number;
      season?: 'spring' | 'summer';
      moed?: 'a' | 'b';
      order?: number;
    } = {};

    // Common patterns in exam info
    const yearPattern = /20\d{2}/;
    const seasonPattern = /(קיץ|חורף|אביב|סתיו)/;
    const moedPattern = /(מועד א|מועד ב|מועד ג)/;
    const questionPattern = /שאלה (\d+)/;

    // Extract year
    const yearMatch = text.match(yearPattern);
    if (yearMatch) {
      info.year = parseInt(yearMatch[0]);
    }

    // Extract season and convert to English
    const seasonMatch = text.match(seasonPattern);
    if (seasonMatch) {
      const hebrewSeason = seasonMatch[1];
      switch (hebrewSeason) {
        case 'קיץ':
        case 'אביב':
          info.season = 'summer';
          break;
        case 'חורף':
        case 'סתיו':
          info.season = 'spring';
          break;
      }
    }

    // Extract moed and convert to English
    const moedMatch = text.match(moedPattern);
    if (moedMatch) {
      const hebrewMoed = moedMatch[1];
      switch (hebrewMoed) {
        case 'מועד א':
          info.moed = 'a';
          break;
        case 'מועד ב':
          info.moed = 'b';
          break;
        // Ignore מועד ג as it's not a valid option
      }
    }

    // Extract question number as order
    const questionMatch = text.match(questionPattern);
    if (questionMatch) {
      info.order = parseInt(questionMatch[1]);
    }

    return info;
  }

  /**
   * Convert HTML content to markdown if needed
   */
  private convertToMarkdown(content: string, isHtml: boolean): string {
    if (!content) return '';
    
    // First normalize newlines to \n
    content = content.replace(/\r\n|\r/g, '\n');
    
    // Replace HTML entities
    Object.entries(this.htmlEntities).forEach(([entity, char]) => {
      content = content.replace(new RegExp(entity, 'g'), char);
    });
    
    // Check if content looks like HTML
    const hasHtmlTags = /<[^>]*>/g.test(content);
    
    if (isHtml || hasHtmlTags) {
      try {
        // Replace block elements with newlines
        content = content
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
          .replace(/<li[^>]*>/gi, '- ');
        
        // Remove all remaining HTML tags
        content = content.replace(/<[^>]+>/g, '');
        
        // Clean up the content
        content = this.cleanupMarkdown(content);
        
        logger.debug('Converted HTML to markdown', {
          original: content,
          converted: content
        });

        return content;
      } catch (error) {
        logger.warn('Failed to convert HTML to markdown', {
          error: error instanceof Error ? error.message : 'Unknown error',
          contentPreview: content.substring(0, 100)
        });
        // Return cleaned content even if conversion fails
        return this.cleanupMarkdown(content);
      }
    }
    
    // For non-HTML content, just normalize newlines and clean up
    return this.cleanupMarkdown(content);
  }

  /**
   * Clean up markdown content
   */
  private cleanupMarkdown(content: string): string {
    return content
      .replace(/\r\n|\r/g, '\n')  // Normalize newlines
      .replace(/\n{3,}/g, '\n\n') // Cap consecutive newlines at 2
      .trim();
  }

  /**
   * Validate WordPress question format
   */
  protected async validateQuestion(wpQuestion: WordPressEzPassQuestion, isDryRun: boolean = false): Promise<string[]> {
    const errors: string[] = [];

    // Skip ID validation for dry runs
    if (!isDryRun) {
        // ID validation is now mandatory for every question
        const subjectId = 'civil_engineering';
        const domainId = 'construction_safety';
        
        try {
            // Instead of generating ID, just validate the format
            const mockId = `CIV-SAF-${String(wpQuestion._id).padStart(6, '0')}`;
            
            // Validate the ID format and content
            if (!validateQuestionId(mockId, subjectId, domainId)) {
                errors.push(`Invalid question ID format. Expected format: CIV-SAF-NNNNNN, got: ${mockId}`);
                return errors;
            }

            // Validate that ID has exactly 6 digits
            const match = mockId.match(/^[A-Z]{3}-[A-Z]{3}-(\d+)$/);
            if (!match || match[1].length !== 6) {
                errors.push(`Question ID must have exactly 6 digits after the domain code. Got: ${mockId}`);
                return errors;
            }
        } catch (error) {
            errors.push(`Failed to validate question ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return errors;
        }
    }

    // Required fields validation (always run these)
    if (!wpQuestion._question) {
        errors.push('Question text is required');
    }

    if (!wpQuestion._answerData || !Array.isArray(wpQuestion._answerData)) {
        errors.push('Answer data is required and must be an array');
    } else {
        // Validate answers
        if (wpQuestion._answerData.length !== 4) {
            errors.push('Multiple choice questions must have exactly 4 answers');
        }

        const correctAnswers = wpQuestion._answerData.filter(a => a._correct);
        if (correctAnswers.length !== 1) {
            errors.push('Multiple choice questions must have exactly 1 correct answer');
        }

        wpQuestion._answerData.forEach((answer, index) => {
            if (!answer._answer) {
                errors.push(`Answer ${index + 1} text is missing`);
            }
        });
    }

    // Make category required
    if (!wpQuestion._category) {
        errors.push('Category is required');
    }

    return errors;
  }

  /**
   * Import a single question from WordPress format
   */
  async importQuestion(wpQuestion: WordPressEzPassQuestion, dryRun: boolean = false): Promise<ImportResult> {
    try {
        // STEP 1: Always log the mode
        console.log('========== IMPORT QUESTION START ==========');
        console.log(`DRY RUN MODE: ${dryRun}`);
        console.log(`Question ID: ${wpQuestion._id}`);
        console.log('=========================================');

        // STEP 2: Always validate and transform (this doesn't touch DB)
        const question = this.transformQuestion(wpQuestion);
        const validationResult = validateQuestion(question);

        // STEP 3: If validation fails, return errors
        if (validationResult.errors.length > 0) {
            return {
                success: false,
                errors: validationResult.errors.map(err => `${err.field}: ${err.message}`)
            };
        }

        // STEP 4: DRY RUN CHECK - Return early if dry run
        if (dryRun === true) {
            console.log('DRY RUN: Skipping database operations');
            return {
                success: true,
                questionId: question.id,
                warnings: ['Dry run mode - validation successful']
            };
        }

        // STEP 5: ONLY FOR NON-DRY RUN - Save to database
        console.log('LIVE RUN: Proceeding with database save');
        const supabaseClient = getSupabase();
        if (!supabaseClient) throw new Error('Supabase client not initialized');

        const { error } = await supabaseClient
            .from('questions')
            .upsert({
                id: question.id,
                data: question,
                publication_status: PublicationStatusEnum.DRAFT,
                validation_status: validationResult.errors.length > 0 
                    ? 'error' 
                    : validationResult.warnings.length > 0 
                        ? 'warning' 
                        : 'valid',
                import_info: {
                    system: 'wordpress',
                    originalId: wpQuestion._id,
                    originalDbId: wpQuestion._dbId,
                    originalTitle: wpQuestion._title,
                    originalCategory: wpQuestion._category,
                    importedAt: new Date().toISOString(),
                    importedBy: 'wordpress-importer',
                    originalFormat: 'wordpress-ezpass',
                    transformations: [
                        'html-to-markdown',
                        'exam-info-extraction',
                        'category-mapping'
                    ]
                },
                updated_at: new Date().toISOString()
            });

        if (error) {
            logger.error('Failed to save question to database', {
                questionId: question.id,
                error: error.message
            });
            throw error;
        }

        return {
            success: true,
            questionId: question.id
        };

    } catch (error) {
        logger.error('Failed to import WordPress EZPass question', {
            wpQuestionId: wpQuestion._id,
            error: error instanceof Error ? error.message : 'Unknown error',
            isDryRun: dryRun
        });

        return {
            success: false,
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
  }

  /**
   * Map WordPress category to our topic structure
   * Returns the matching subtopic and its parent topic
   */
  private mapCategory(category: string): TopicMapping {
    // Check for exact category mapping
    const mappedCategory = this.categoryMappings[category] || category;
    
    // Get all topics and subtopics from UniversalTopics
    const allTopics = universalTopics.getTopicsForSubject('civil_engineering');
    
    // Try to find exact matching subtopic by Hebrew name
    for (const topic of allTopics) {
        for (const subtopic of topic.subTopics) {
            if (subtopic.name === mappedCategory) {
                return {
                    subtopicId: subtopic.id,
                    topicId: topic.id
                };
            }
        }
    }

    // If no match found, throw error with category name
    throw new Error(`No matching subtopic found for category: ${category}`);
  }

  /**
   * Clean up option text by removing Hebrew letter prefixes and whitespace
   * Handles:
   * - "א. " (letter, dot, space)
   * - "א " (letter, space)
   * - "א." (letter, dot)
   * - Removes tabs and extra whitespace
   */
  private cleanOptionText(text: string): string {
    if (!text) return '';
    
    return text
      // First trim any whitespace/tabs from both ends
      .trim()
      // Remove any tabs anywhere in the text (including middle of text)
      .replace(/\t+/g, ' ')
      // Remove Hebrew letter prefix patterns
      .replace(/^[אבגד](?:\. |\.|\ )/, '')
      // Fix escaped quotes in Hebrew units
      .replace(/ק\\"ג/g, 'ק"ג')
      .replace(/מ\\"ר/g, 'מ"ר')
      // Clean up any resulting double spaces (including those left by tab removal)
      .replace(/\s{2,}/g, ' ')
      // Final trim to ensure clean result
      .trim();
  }

  /**
   * Extract and remove exam info from question text if present
   * Returns the cleaned text and the extracted info
   */
  private extractExamInfoFromQuestion(questionText: string): {
    cleanedText: string;
    examInfo?: {
      year?: number;
      season?: 'spring' | 'summer';
      moed?: 'a' | 'b';
      order?: number;
    }
  } {
    // Check if the first line contains exam info
    const lines = questionText.split('\n');
    if (lines.length < 2) return { cleanedText: questionText };

    const firstLine = lines[0].trim();
    const examInfo = this.parseExamInfo(firstLine);

    // If we found exam info in the first line, remove it
    if (examInfo.year || examInfo.season || examInfo.moed) {
      return {
        cleanedText: lines.slice(1).join('\n').trim(),
        examInfo
      };
    }

    return { cleanedText: questionText };
  }

  /**
   * Validate that exam info from title matches question text
   */
  private validateExamInfo(
    titleInfo: {
      year?: number;
      season?: 'spring' | 'summer';
      moed?: 'a' | 'b';
      order?: number;
    },
    questionInfo: {
      year?: number;
      season?: 'spring' | 'summer';
      moed?: 'a' | 'b';
      order?: number;
    }
  ): string[] {
    const errors: string[] = [];

    // Compare year if both exist
    if (titleInfo.year && questionInfo.year && titleInfo.year !== questionInfo.year) {
      errors.push(`Year mismatch: ${titleInfo.year} in title vs ${questionInfo.year} in question`);
    }

    // Compare season if both exist
    if (titleInfo.season && questionInfo.season && titleInfo.season !== questionInfo.season) {
      errors.push(`Season mismatch: ${titleInfo.season} in title vs ${questionInfo.season} in question`);
    }

    // Compare moed if both exist
    if (titleInfo.moed && questionInfo.moed && titleInfo.moed !== questionInfo.moed) {
      errors.push(`Moed mismatch: ${titleInfo.moed} in title vs ${questionInfo.moed} in question`);
    }

    return errors;
  }

  /**
   * Transform WordPress question to our format
   */
  protected transformQuestion(wpQuestion: WordPressEzPassQuestion): Question {
    // Extract exam info from title and question text
    const titleExamInfo = this.parseExamInfo(wpQuestion._title);
    const { cleanedText: questionText, examInfo: questionExamInfo } = this.extractExamInfoFromQuestion(wpQuestion._question);

    // Generate ID for non-dry run
    const id = `CIV-SAF-${String(wpQuestion._id).padStart(6, '0')}`;

    // Validate exam info consistency if both exist
    if (questionExamInfo && (questionExamInfo.year || questionExamInfo.season || questionExamInfo.moed)) {
      const validationErrors = this.validateExamInfo(titleExamInfo, questionExamInfo);
      if (validationErrors.length > 0) {
        throw new Error(`Exam info validation failed: ${validationErrors.join(', ')}`);
      }
    }
    
    // Map category to topic structure
    const { topicId, subtopicId } = this.mapCategory(wpQuestion._category || '');

    // Find correct answer index
    const correctIndex = wpQuestion._answerData.findIndex(answer => answer._correct);

    return {
      id,
      content: {
        text: questionText,
        format: 'markdown',
        options: wpQuestion._answerData.map(answer => ({
          text: answer._answer,
          format: 'markdown'
        }))
      },
      answer: {
        finalAnswer: {
          type: 'multiple_choice',
          value: (correctIndex + 1) as 1 | 2 | 3 | 4
        },
        solution: {
          text: wpQuestion._correctMsg || 'No explanation provided',
          format: 'markdown',
          requiredSolution: true
        }
      },
      metadata: {
        subjectId: 'civil_engineering',
        domainId: 'construction_safety',
        topicId,
        subtopicId,
        type: QuestionType.MULTIPLE_CHOICE,
        difficulty: 3,
        estimatedTime: 5,
        source: titleExamInfo?.year ? {
          type: 'exam',
          examTemplateId: 'civil_safety',
          year: titleExamInfo.year,
          season: titleExamInfo.season || 'summer',
          moed: titleExamInfo.moed || 'a'
        } : {
          type: 'ezpass',
          creatorType: EzpassCreatorType.HUMAN
        }
      },
      evaluation: {
        rubricAssessment: {
          criteria: [{
            name: 'basic_correctness',
            description: 'תשובה נכונה ומלאה',
            weight: 100
          }]
        },
        answerRequirements: {
          requiredElements: []
        }
      }
    };
  }
}