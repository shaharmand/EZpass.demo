/**
 * Submission Service
 * 
 * Manages submissions of question answers and their association with preparations
 */

import { supabase } from '../../lib/supabase';
import type { QuestionSubmission } from '../../types/submissionTypes';
import { updateSubmissionWithPrepId } from '../preparationService';
import { savePreparation } from '../preparationService';
import { PrepStateManager } from '../PrepStateManager';

/**
 * Save a new question submission to the database
 */
export async function saveSubmission(submission: QuestionSubmission, prepId?: string): Promise<string | null> {
  try {
    const userData = await supabase.auth.getUser();
    const userId = userData.data.user?.id;
    
    if (!userId) {
      console.error('Cannot save submission: user not authenticated');
      return null;
    }
    
    // Create a separate variable for the database prep ID that can be null
    let dbPrepId: string | null = prepId || null;
    
    // Check if the prep exists in the database if prepId is provided
    if (prepId) {
      try {
        // First check if the prep exists in the database
        const { data: prepExists, error: checkError } = await supabase
          .from('user_preparations')
          .select('id')
          .eq('id', prepId)
          .maybeSingle();
        
        // If the prep doesn't exist, try to save it first
        if (checkError || !prepExists) {
          console.log('Preparation not found in database, saving it first:', prepId);
          // Get the prep from local storage/state
          const prep = await PrepStateManager.getPrep(prepId);
          
          if (prep) {
            // Save the prep to ensure it exists before referencing it
            const saveResult = await savePreparation(prep);
            if (!saveResult.success) {
              console.error('Failed to save preparation before submission:', saveResult.error);
              // Continue without the prep_id reference
              dbPrepId = null;
            }
          } else {
            console.error('Cannot find preparation to save:', prepId);
            // Continue without the prep_id reference
            dbPrepId = null;
          }
        }
      } catch (prepError) {
        console.error('Error checking/saving preparation:', prepError);
        // Continue without the prep_id reference to avoid foreign key errors
        dbPrepId = null;
      }
    }
    
    // Save the submission
    const { data, error } = await supabase
      .from('question_submissions')
      .insert({
        user_id: userId,
        question_id: submission.questionId,
        submission_data: submission,
        prep_id: dbPrepId
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error saving submission:', error);
      return null;
    }
    
    return data.id;
  } catch (err) {
    console.error('Exception in saveSubmission:', err);
    return null;
  }
}

/**
 * Get submissions for a question by a user
 */
export async function getQuestionSubmissions(questionId: string): Promise<QuestionSubmission[]> {
  try {
    const userData = await supabase.auth.getUser();
    const userId = userData.data.user?.id;
    
    if (!userId) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('question_submissions')
      .select('submission_data')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting question submissions:', error);
      return [];
    }
    
    return data.map(row => row.submission_data as QuestionSubmission);
  } catch (err) {
    console.error('Exception in getQuestionSubmissions:', err);
    return [];
  }
}

/**
 * Get all submissions for a preparation
 */
export async function getPreparationSubmissions(prepId: string): Promise<QuestionSubmission[]> {
  try {
    const userData = await supabase.auth.getUser();
    const userId = userData.data.user?.id;
    
    if (!userId) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('question_submissions')
      .select('submission_data')
      .eq('user_id', userId)
      .eq('prep_id', prepId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error getting preparation submissions:', error);
      return [];
    }
    
    return data.map(row => row.submission_data as QuestionSubmission);
  } catch (err) {
    console.error('Exception in getPreparationSubmissions:', err);
    return [];
  }
}

/**
 * Get the latest submission for each question in a preparation
 */
export async function getLatestPreparationSubmissions(prepId: string): Promise<Record<string, QuestionSubmission>> {
  try {
    const submissions = await getPreparationSubmissions(prepId);
    
    // Group by question ID and keep only the latest
    const submissionsByQuestion: Record<string, QuestionSubmission> = {};
    
    submissions.forEach(submission => {
      const questionId = submission.questionId;
      const existingSubmission = submissionsByQuestion[questionId];
      
      // If no existing submission or current is newer
      if (!existingSubmission || 
          (existingSubmission.metadata.submittedAt < submission.metadata.submittedAt)) {
        submissionsByQuestion[questionId] = submission;
      }
    });
    
    return submissionsByQuestion;
  } catch (err) {
    console.error('Exception in getLatestPreparationSubmissions:', err);
    return {};
  }
} 