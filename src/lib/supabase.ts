import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(isDryRun = false) {
  if (isDryRun) {
    logger.info('Dry run mode - using mock Supabase client');
    return null;
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL/SUPABASE_URL/REACT_APP_SUPABASE_URL');
      if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY/SUPABASE_ANON_KEY/REACT_APP_SUPABASE_ANON_KEY');
      
      throw new Error(
        `Missing Supabase environment variables: ${missingVars.join(', ')}\n` +
        'Please ensure these are set in your .env file or environment.'
      );
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    logger.info('Created new Supabase client');
  }

  return supabaseInstance;
}

export function clearSupabaseInstance() {
  supabaseInstance = null;
}

// Create and export the default instance
export const supabase = getSupabase();

// For backwards compatibility with CommonJS scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getSupabase, supabase, clearSupabaseInstance };
} 