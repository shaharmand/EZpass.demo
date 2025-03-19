import { getSupabase } from '../../lib/supabase';
import type { QuestionSubmission } from '../../types/submissionTypes';
import { logger } from '../../utils/logger';

/**
 * Service for storing and retrieving question submissions
 */
export class SubmissionStorage {
  private supabase = getSupabase();
  
  /**
   * Save a question submission to the database
   * @param submission QuestionSubmission to save
   * @param userId User ID owning this submission
   * @returns A promise that resolves when the submission is saved
   */
  async saveSubmission(submission: QuestionSubmission, userId: string): Promise<void> {
    try {
      logger.info('Saving question submission', {
        questionId: submission.questionId,
        userId
      });
      
      const { error } = await this.supabase
        .from('question_submissions')
        .upsert({
          user_id: userId,
          question_id: submission.questionId,
          submission_data: submission,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        logger.error('Failed to save question submission', {
          error,
          questionId: submission.questionId,
          userId
        });
        throw error;
      }
      
      logger.info('Question submission saved successfully', {
        questionId: submission.questionId,
        userId
      });
    } catch (error) {
      logger.error('Error in saveSubmission', { error });
      throw error;
    }
  }
  
  /**
   * Get all user's submissions for a question
   * @param questionId Question ID to get submissions for
   * @param userId User ID to get submissions for
   * @returns Array of QuestionSubmission objects
   */
  async getSubmissionsForQuestion(questionId: string, userId: string): Promise<QuestionSubmission[]> {
    try {
      logger.info('Fetching submissions for question', {
        questionId,
        userId
      });
      
      const { data, error } = await this.supabase
        .from('question_submissions')
        .select('submission_data')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });
        
      if (error) {
        logger.error('Failed to get question submissions', {
          error,
          questionId,
          userId
        });
        throw error;
      }
      
      logger.info(`Retrieved ${data.length} submissions for question`, {
        questionId,
        userId
      });
      
      return data.map(record => record.submission_data as QuestionSubmission);
    } catch (error) {
      logger.error('Error in getSubmissionsForQuestion', { error });
      throw error;
    }
  }
  
  /**
   * Get the latest submission for a question
   * @param questionId Question ID to get latest submission for
   * @param userId User ID to get submission for
   * @returns Latest QuestionSubmission or null if none exists
   */
  async getLatestSubmission(questionId: string, userId: string): Promise<QuestionSubmission | null> {
    try {
      logger.info('Fetching latest submission for question', {
        questionId,
        userId
      });
      
      const { data, error } = await this.supabase
        .from('question_submissions')
        .select('submission_data')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        logger.error('Failed to get latest submission', {
          error,
          questionId,
          userId
        });
        throw error;
      }
      
      if (data.length === 0) {
        logger.info('No submissions found for question', {
          questionId,
          userId
        });
        return null;
      }
      
      logger.info('Latest submission retrieved successfully', {
        questionId,
        userId,
        submittedAt: (data[0].submission_data as QuestionSubmission).metadata?.submittedAt
      });
      
      return data[0].submission_data as QuestionSubmission;
    } catch (error) {
      logger.error('Error in getLatestSubmission', { error });
      throw error;
    }
  }
  
  /**
   * Get recent submissions for a user across all questions
   * @param userId User ID to get submissions for
   * @param limit Maximum number of submissions to return
   * @returns Array of recent QuestionSubmission objects
   */
  async getRecentSubmissions(userId: string, limit: number = 10): Promise<QuestionSubmission[]> {
    try {
      logger.info('Fetching recent submissions', {
        userId,
        limit
      });
      
      const { data, error } = await this.supabase
        .from('question_submissions')
        .select('submission_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        logger.error('Failed to get recent submissions', {
          error,
          userId,
          limit
        });
        throw error;
      }
      
      logger.info(`Retrieved ${data.length} recent submissions`, {
        userId
      });
      
      return data.map(record => record.submission_data as QuestionSubmission);
    } catch (error) {
      logger.error('Error in getRecentSubmissions', { error });
      throw error;
    }
  }
  
  /**
   * Get user's submissions stats grouped by question
   * @param userId User ID to get stats for
   * @returns Map of question IDs to submission counts and success rates
   */
  async getUserSubmissionStats(userId: string): Promise<Map<string, {
    totalSubmissions: number;
    correctSubmissions: number;
    lastSubmittedAt: number;
  }>> {
    try {
      logger.info('Fetching user submission stats', {
        userId
      });
      
      const { data, error } = await this.supabase
        .from('question_submissions')
        .select('question_id, submission_data')
        .eq('user_id', userId);
        
      if (error) {
        logger.error('Failed to get user submission stats', {
          error,
          userId
        });
        throw error;
      }
      
      // Group submissions by question ID
      const statsMap = new Map<string, {
        totalSubmissions: number;
        correctSubmissions: number;
        lastSubmittedAt: number;
      }>();
      
      data.forEach(record => {
        const submission = record.submission_data as QuestionSubmission;
        const questionId = record.question_id;
        
        if (!statsMap.has(questionId)) {
          statsMap.set(questionId, {
            totalSubmissions: 0,
            correctSubmissions: 0,
            lastSubmittedAt: 0
          });
        }
        
        const stats = statsMap.get(questionId)!;
        stats.totalSubmissions++;
        
        if (submission.feedback?.data?.isCorrect) {
          stats.correctSubmissions++;
        }
        
        const submittedAt = submission.metadata?.submittedAt || 0;
        if (submittedAt > stats.lastSubmittedAt) {
          stats.lastSubmittedAt = submittedAt;
        }
      });
      
      logger.info(`Generated stats for ${statsMap.size} questions`, {
        userId
      });
      
      return statsMap;
    } catch (error) {
      logger.error('Error in getUserSubmissionStats', { error });
      throw error;
    }
  }
  
  /**
   * Get submission statistics for a user
   * Useful for dashboards and performance tracking
   * @param userId User ID to get statistics for
   * @returns Statistics about the user's submissions
   */
  async getUserStatistics(userId: string): Promise<{
    totalSubmissions: number;
    correctSubmissions: number;
    totalQuestions: number;
    averageScore: number;
    submissionTimes: number[]; // timestamps for time series analysis
  }> {
    try {
      logger.info('Fetching user submission statistics', { userId });
      
      const { data, error } = await this.supabase
        .from('question_submissions')
        .select('submission_data')
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      // Initialize statistics
      const stats = {
        totalSubmissions: data.length,
        correctSubmissions: 0,
        totalQuestions: 0,
        totalScore: 0,
        averageScore: 0,
        submissionTimes: [] as number[]
      };
      
      // Set to track unique question IDs
      const uniqueQuestionIds = new Set<string>();
      
      // Process each submission
      data.forEach(record => {
        const submission = record.submission_data as QuestionSubmission;
        
        // Track unique questions
        uniqueQuestionIds.add(submission.questionId);
        
        // Track correct submissions
        if (submission.feedback?.data?.isCorrect) {
          stats.correctSubmissions++;
        }
        
        // Track scores
        if (submission.feedback?.data?.score !== undefined) {
          stats.totalScore += submission.feedback.data.score;
        }
        
        // Track submission times
        if (submission.metadata?.submittedAt) {
          stats.submissionTimes.push(submission.metadata.submittedAt);
        }
      });
      
      // Calculate total unique questions
      stats.totalQuestions = uniqueQuestionIds.size;
      
      // Calculate average score
      stats.averageScore = stats.totalSubmissions > 0 
        ? stats.totalScore / stats.totalSubmissions 
        : 0;
      
      // Order submission times for time series analysis
      stats.submissionTimes.sort();
      
      logger.info('User statistics generated successfully', {
        userId,
        totalSubmissions: stats.totalSubmissions,
        uniqueQuestions: stats.totalQuestions
      });
      
      return {
        totalSubmissions: stats.totalSubmissions,
        correctSubmissions: stats.correctSubmissions,
        totalQuestions: stats.totalQuestions,
        averageScore: stats.averageScore,
        submissionTimes: stats.submissionTimes
      };
    } catch (error) {
      logger.error('Error generating user statistics', { error, userId });
      throw error;
    }
  }
  
  /**
   * Search for submissions matching certain criteria
   * @param params Search parameters
   * @returns Matching submissions
   */
  async searchSubmissions(params: {
    userId?: string;
    questionId?: string;
    isCorrect?: boolean;
    fromDate?: number;
    toDate?: number;
    limit?: number;
  }): Promise<QuestionSubmission[]> {
    try {
      logger.info('Searching submissions', params);
      
      let query = this.supabase
        .from('question_submissions')
        .select('submission_data');
      
      // Apply filters
      if (params.userId) {
        query = query.eq('user_id', params.userId);
      }
      
      if (params.questionId) {
        query = query.eq('question_id', params.questionId);
      }
      
      // For date filters, we need to create RPC functions in Supabase
      // that can query into the JSONB submission_data
      // This is a simplified version that loads data client-side and filters
      
      const { data, error } = await query.limit(params.limit || 100);
      
      if (error) {
        throw error;
      }
      
      // Convert to QuestionSubmission objects
      let submissions = data.map(record => record.submission_data as QuestionSubmission);
      
      // Apply client-side filters for JSON fields
      if (params.isCorrect !== undefined) {
        submissions = submissions.filter(
          sub => sub.feedback?.data?.isCorrect === params.isCorrect
        );
      }
      
      if (params.fromDate) {
        submissions = submissions.filter(
          sub => (sub.metadata?.submittedAt || 0) >= params.fromDate!
        );
      }
      
      if (params.toDate) {
        submissions = submissions.filter(
          sub => (sub.metadata?.submittedAt || 0) <= params.toDate!
        );
      }
      
      logger.info(`Found ${submissions.length} matching submissions`);
      
      return submissions;
    } catch (error) {
      logger.error('Error searching submissions', { error, params });
      throw error;
    }
  }

  /**
   * Get all submissions for a specific prep/session and user
   * @param prepId Prep/session ID to get submissions for
   * @param userId User ID to get submissions for
   * @returns Array of submissions
   */
  async getSubmissionsForPrep(prepId: string, userId: string): Promise<QuestionSubmission[]> {
    try {
      logger.info('Fetching submissions for prep', { prepId, userId });
      
      const { data, error } = await this.supabase
        .from('question_submissions')
        .select('submission_data')
        .eq('user_id', userId)
        .filter('submission_data->prepId', 'eq', prepId);
        
      if (error) {
        throw error;
      }
      
      return data.map(item => item.submission_data);
    } catch (error) {
      logger.error('Failed to get submissions for prep', { 
        error, 
        prepId,
        userId
      });
      throw error;
    }
  }
}

// Export a singleton instance
export const submissionStorage = new SubmissionStorage(); 