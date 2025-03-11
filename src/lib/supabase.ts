/**
 * Supabase Client Configuration and Environment Variable Handler
 * 
 * This file is responsible for setting up the Supabase client and managing
 * environment variables required for Supabase authentication and configuration.
 * 
 * Key Features:
 * - Implements fallback strategy for environment variables:
 *   1. First tries VITE_ prefix using import.meta.env (for Vercel/production)
 *   2. Falls back to REACT_APP_ prefix using process.env (for development)
 * - Provides real-time logging of environment variable availability
 * - Manages Supabase client instance creation and configuration
 * - Handles auth redirect URL setup
 * 
 * Note: This is where the actual environment variable handling logic resides,
 * making it compatible with both development and production environments.
 */

/// <reference types="vite/client" />
import { createClient, SupabaseClient, AuthFlowType } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

let supabaseInstance: SupabaseClient | null = null;

// Helper function to get environment variable value
function getEnvVar(name: string): string | undefined {
  try {
    // Try REACT_APP_ prefix
    const reactAppValue = process.env[`REACT_APP_${name}`];
    if (reactAppValue) {
      console.log(`✅ Found REACT_APP_${name}`);
      return reactAppValue;
    }

    // Try without prefix (for Node.js scripts)
    const plainValue = process.env[name];
    if (plainValue) {
      console.log(`✅ Found ${name}`);
      return plainValue;
    }

    console.log(`❌ No ${name} found with any prefix`);
    return undefined;
  } catch (error) {
    console.error(`Error accessing environment variable ${name}:`, error);
    return undefined;
  }
}

export function getSupabase(): SupabaseClient {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance;
  }

  console.log('🔍 Checking environment variables...');
  
  const supabaseUrl = getEnvVar('SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');
  const authRedirectUrl = getEnvVar('AUTH_REDIRECT_URL');

  console.log('🔑 Environment variables status:', {
    SUPABASE_URL: supabaseUrl ? '✅' : '❌',
    SUPABASE_ANON_KEY: supabaseAnonKey ? '✅' : '❌',
    AUTH_REDIRECT_URL: authRedirectUrl ? '✅' : '❌'
  });

  // Log auth redirect status
  if (authRedirectUrl) {
    logger.info('✅ Auth redirect URL configured:', authRedirectUrl);
  } else {
    logger.warn('⚠️ No auth redirect URL found. This may affect authentication flows.');
    logger.info('ℹ️ Default redirect behavior will be used (same origin).');
  }

  // Only check required variables
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('SUPABASE_ANON_KEY');
    
    const error = `Missing required Supabase environment variables: ${missingVars.join(', ')}\n` +
      'Please ensure these are set in your .env file with either REACT_APP_ prefix or directly.';
    console.error('❌', error);
    throw new Error(error);
  }

  try {
    const options = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit' as AuthFlowType,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        ...(authRedirectUrl && { redirectTo: authRedirectUrl })
      }
    };
    
    // Create the instance only if it doesn't exist
    if (!supabaseInstance) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, options);
      logger.info('✅ Created new Supabase client with auth configuration:', {
        redirectConfigured: !!authRedirectUrl,
        flowType: 'implicit',
        persistSession: true
      });
    }

    return supabaseInstance;
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    throw error;
  }
}

export function clearSupabaseInstance() {
  if (supabaseInstance) {
    logger.info('🧹 Clearing Supabase client instance');
    supabaseInstance = null;
  }
}

// Create and export the default instance lazily
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const instance = getSupabase();
    if (!instance) {
      throw new Error('Failed to get Supabase client');
    }
    return instance[prop];
  }
});

// For backwards compatibility with CommonJS scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getSupabase, supabase, clearSupabaseInstance };
}

// Helper function for image uploads
export async function uploadImage(file: File, bucket: string = 'images'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${bucket}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
} 