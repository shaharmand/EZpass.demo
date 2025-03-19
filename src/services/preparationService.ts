/**
 * Preparation Service
 * 
 * Handles database operations related to user preparation persistence
 */

import { supabase } from '../lib/supabase';
import type { StudentPrep } from '../types/prepState';
import type { UserPreparationDB, PreparationSummary, PreparationResponse } from '../types/preparation';
import { getActiveTime } from '../types/prepState';
import { PrepProgressTracker } from './PrepProgressTracker';
import { PrepStateManager } from './PrepStateManager';

/**
 * Save a preparation to the database
 * Will create a new record or update an existing one
 */
export async function savePreparation(preparation: StudentPrep): Promise<PreparationResponse> {
  try {
    console.log('SAVING PREPARATION TO DB:', {
      id: preparation.id,
      examId: preparation.exam?.id
    });
    
    const userData = await supabase.auth.getUser();
    const userId = userData.data.user?.id;
    
    if (!userId) {
      console.error('Cannot save preparation: User not authenticated');
      return { id: '', success: false, error: 'User not authenticated' };
    }
    
    // Always store the original exam ID as text
    const examIdText = preparation.exam?.id || null;
    
    // Verify prep ID is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(preparation.id)) {
      console.error('Invalid preparation ID (not a UUID):', preparation.id);
      return { id: preparation.id, success: false, error: 'Invalid preparation ID format' };
    }
    
    // Look up the exam UUID using the database function
    let examId = null;
    if (examIdText) {
      const { data: examData, error: examError } = await supabase
        .rpc('get_exam_id_by_external_id', { p_external_id: examIdText });
      
      if (examError) {
        console.warn('Error looking up exam UUID:', examError.message);
      } else if (examData) {
        examId = examData;
        console.log(`Found exam UUID ${examId} for text ID ${examIdText}`);
      } else {
        console.log(`No exam found with text ID ${examIdText}`);
      }
    }
    
    // Create or update the preparation
    console.log('Upserting preparation in database:', {
      id: preparation.id,
      userId,
      examId,
      examIdText,
      name: preparation.exam?.names?.full || 'Custom Preparation'
    });
    
    // First, check if there's an existing non-completed preparation for this exam
    if (examId) {
      const { data: existingPrep, error: findError } = await supabase
        .from('user_preparations')
        .select('id, status')
        .eq('user_id', userId)
        .eq('exam_id', examId)
        .in('status', ['active', 'paused'])
        .not('id', 'eq', preparation.id)
        .maybeSingle();
      
      if (findError) {
        console.warn('Error checking for existing preparations:', findError.message);
      } else if (existingPrep) {
        console.log(`Found existing ${existingPrep.status} preparation ${existingPrep.id} for exam ${examId}`);
        // The database trigger will handle setting it to completed
      }
    }
    
    // Determine the status from the prep state
    let status = 'active';  // default to active
    if (preparation.state && 'status' in preparation.state) {
      switch (preparation.state.status) {
        case 'paused':
          status = 'paused';
          break;
        case 'completed':
          status = 'completed';
          break;
        case 'not_started':
        case 'initializing':
        case 'active':
          status = 'active';  // these all map to active in the database
          break;
        case 'error':
          // If there's an error, keep it as active since the user might retry
          status = 'active';
          break;
      }
    }
    
    console.log('Mapping preparation state to database status:', {
      appState: preparation.state?.status,
      dbStatus: status
    });
    
    // Now upsert the preparation
    const { data, error } = await supabase
      .from('user_preparations')
      .upsert({
        id: preparation.id,
        user_id: userId,
        name: preparation.exam?.names?.full || 'Custom Preparation',
        exam_id: examId, // Use the looked up exam ID
        exam_id_text: examIdText, // Store the original exam ID as text
        custom_name: preparation.customName,
        prep_state: preparation,
        status: status, // Use the mapped status
        last_active_at: new Date().toISOString()
      }, { 
        onConflict: 'id'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('ERROR saving preparation:', error);
      return { id: preparation.id, success: false, error: error.message };
    }
    
    console.log('Successfully saved preparation to database:', data.id);
    return { id: data.id, success: true };
  } catch (err) {
    console.error('EXCEPTION in savePreparation:', err);
    return { id: preparation.id, success: false, error: 'Failed to save preparation' };
  }
}

/**
 * Get a preparation by its ID
 */
export async function getPreparationById(id: string): Promise<StudentPrep | null> {
  try {
    // Ensure we have a valid string ID, not a Promise
    if (!id || typeof id !== 'string') {
      console.error('Invalid preparation ID:', id);
      return null;
    }

    const { data, error } = await supabase
      .from('user_preparations')
      .select('prep_state')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error getting preparation by id:', error);
      return null;
    }
    
    return data.prep_state as StudentPrep;
  } catch (err) {
    console.error('Exception in getPreparationById:', err);
    return null;
  }
}

/**
 * Get the user's most recent active preparation
 */
export async function getUserActivePreparation(): Promise<StudentPrep | null> {
  try {
    const userData = await supabase.auth.getUser();
    const userId = userData.data.user?.id;
    
    if (!userId) {
      console.log('No user ID found when getting active preparation');
      return null;
    }
    
    console.log('Getting active preparation for user:', userId);
    
    try {
      // Use maybeSingle() which returns null if no rows found instead of an error
      // This avoids the PGRST116 error
      const { data, error } = await supabase
        .from('user_preparations')
        .select('prep_state')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting active preparation:', error);
        return null;
      }
      
      if (!data) {
        console.log('No active preparation found for user:', userId);
        return null;
      }
      
      return data.prep_state as StudentPrep;
    } catch (dbError) {
      // If maybeSingle() is not available in this version
      console.error('Database error in getUserActivePreparation, trying alternate method:', dbError);
      
      // Fall back to array-based method
      try {
        const { data, error } = await supabase
          .from('user_preparations')
          .select('prep_state')
          .eq('user_id', userId)
          .order('last_active_at', { ascending: false })
          .limit(1);
          
        if (error || !data || data.length === 0) {
          console.log('No active preparations found using alternate method');
          return null;
        }
        
        return data[0].prep_state as StudentPrep;
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        return null;
      }
    }
  } catch (err) {
    console.error('Exception in getUserActivePreparation:', err);
    return null;
  }
}

/**
 * Get a list of the user's preparations
 */
export async function getUserPreparations(): Promise<PreparationSummary[]> {
  try {
    const userData = await supabase.auth.getUser();
    const userId = userData.data.user?.id;
    
    if (!userId) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('user_preparations')
      .select('id, name, custom_name, exam_id, prep_state, last_active_at')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });
    
    if (error || !data) {
      console.error('Error getting user preparations:', error);
      return [];
    }
    
    // Convert to summary format
    return data.map((prep): PreparationSummary => {
      const prepState = prep.prep_state;
      const status = prepState.state.status === 'active' || prepState.state.status === 'paused' || prepState.state.status === 'completed' 
        ? prepState.state.status 
        : 'paused';
      
      // Get the actual number of questions completed by the user
      let completedQuestions = 0;
      
      // Use the dedicated completedQuestions field which counts unique completions
      if ('completedQuestions' in prepState.state) {
        completedQuestions = prepState.state.completedQuestions || 0;
      }
      
      // Get total questions count from exam if available
      const totalQuestions = prepState.exam?.totalQuestions || 0;
      
      // Calculate progress using PrepProgressTracker's getOverallProgress method if possible
      let progress = 0;
      
      // If we have the prep state, get metrics from PrepStateManager
      try {
        // Get metrics from the PrepStateManager which maintains trackers
        const metrics = PrepStateManager.getHeaderMetrics(prepState);
        progress = Math.round(metrics.overallProgress);
      } catch (err) {
        console.warn('Error getting metrics from PrepStateManager:', err);
        // Fallback to simple percentage calculation
        progress = totalQuestions > 0 
          ? Math.min(100, Math.round((completedQuestions / totalQuestions) * 100)) 
          : 0;
      }
      
      // Count correct answers from history if available
      let correctAnswers = 0;
      if (prepState.state.status !== 'initializing' && prepState.state.status !== 'not_started') {
        if ('correctAnswers' in prepState.state) {
          correctAnswers = prepState.state.correctAnswers || 0;
        } else if (prepState.state.questionHistory && Array.isArray(prepState.state.questionHistory)) {
          // Count correct answers if not directly available
          correctAnswers = prepState.state.questionHistory.filter((entry: any) => 
            entry.submission?.feedback?.data?.isCorrect === true
          ).length;
        }
      }
      
      return {
        id: prep.id,
        name: prep.name || 'Custom Preparation',
        customName: prep.custom_name,
        examId: prep.exam_id,
        exam: prepState.exam,
        lastActiveAt: prep.last_active_at,
        completedQuestions: completedQuestions,
        totalQuestions: completedQuestions, // Use completedQuestions as totalQuestions for display
        status,
        progress,
        prep_state: {
          ...prepState,
          state: {
            ...prepState.state,
            correctAnswers // Make sure correct answers count is available
          }
        }
      };
    });
  } catch (err) {
    console.error('Exception in getUserPreparations:', err);
    return [];
  }
}

// Helper function to type check the state
function isActiveOrCompletedState(state: any): state is (
  | { 
      status: 'active' | 'paused' | 'completed';
      completedQuestions: number;
      questionHistory: any[];
    }
) {
  return (
    (state.status === 'active' || state.status === 'paused' || state.status === 'completed') && 
    'questionHistory' in state
  );
}

/**
 * Delete a preparation by ID
 */
export async function deletePreparation(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_preparations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting preparation:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception in deletePreparation:', err);
    return false;
  }
}

/**
 * Update the submission with preparation ID
 */
export async function updateSubmissionWithPrepId(submissionId: string, prepId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('question_submissions')
      .update({ prep_id: prepId })
      .eq('id', submissionId);
    
    if (error) {
      console.error('Error updating submission with prep ID:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception in updateSubmissionWithPrepId:', err);
    return false;
  }
}

/**
 * Find an existing preparation for an exam
 * Returns the most recently active preparation if one exists
 */
export async function findPreparationByExamId(examId: string): Promise<StudentPrep | null> {
  try {
    const userData = await supabase.auth.getUser();
    const userId = userData.data.user?.id;
    
    if (!userId) {
      console.log('No user ID found when checking for existing preparation');
      return null;
    }
    
    console.log('Checking for existing preparation:', { examId, userId });
    
    const { data, error } = await supabase
      .rpc('find_preparation_by_exam_id', { 
        p_exam_text_id: examId,
        p_user_id: userId 
      });
    
    if (error) {
      console.error('Error checking for existing preparations:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log('No existing preparation found for exam:', examId);
      return null;
    }
    
    console.log('Found existing preparation:', {
      id: data[0].id,
      status: data[0].status
    });
    
    return data[0].prep_state as StudentPrep;
  } catch (err) {
    console.error('Exception in findPreparationByExamId:', err);
    return null;
  }
} 