import { supabase } from '../lib/supabase';

interface QuestionIdComponents {
  subjectCode: string;
  domainCode: string;
  number: number;
}

export class QuestionIdGenerator {
  /**
   * Generates a question ID in the format: XXX-YYY-NNNNN
   * where XXX is the subject code, YYY is the domain code,
   * and NNNNN is a sequential number
   */
  static async generateQuestionId(subjectCode: string, domainCode: string): Promise<string> {
    // Get the latest question number for this subject-domain combination
    const latestNumber = await this.getLatestQuestionNumber(subjectCode, domainCode);
    const nextNumber = latestNumber + 1;
    
    // Format the number with leading zeros to be 5 digits
    const formattedNumber = nextNumber.toString().padStart(5, '0');
    
    return `${subjectCode}-${domainCode}-${formattedNumber}`;
  }

  /**
   * Parse a question ID into its components
   */
  static parseQuestionId(questionId: string): QuestionIdComponents {
    const [subjectCode, domainCode, numberStr] = questionId.split('-');
    return {
      subjectCode,
      domainCode,
      number: parseInt(numberStr, 10)
    };
  }

  /**
   * Get the latest question number for a subject-domain combination
   */
  private static async getLatestQuestionNumber(subjectCode: string, domainCode: string): Promise<number> {
    // Query the database for questions matching the subject and domain codes
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id')
      .like('id', `${subjectCode}-${domainCode}-%`)
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching latest question number:', error);
      throw error;
    }

    if (!questions || questions.length === 0) {
      return 0; // Start from 1 for new subject-domain combinations
    }

    // Parse the latest question ID to get its number
    const latestId = questions[0].id;
    const { number } = this.parseQuestionId(latestId);
    return number;
  }

  /**
   * Validate a question ID format
   */
  static isValidQuestionId(questionId: string): boolean {
    const pattern = /^[A-Z]{3}-[A-Z]{3}-\d{5}$/;
    return pattern.test(questionId);
  }
} 