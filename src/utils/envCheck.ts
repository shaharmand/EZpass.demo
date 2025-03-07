/**
 * Environment Variables Debug Utility
 * 
 * This is an optional debugging tool that provides detailed information about
 * the status of environment variables in the application.
 * 
 * Key Features:
 * - Checks for both VITE_ and REACT_APP_ prefixed variables
 * - Provides detailed console logging of environment variable availability
 * - Helps debug environment configuration issues
 * - Shows which prefix (VITE_ or REACT_APP_) is active for each variable
 * 
 * Note: This file is optional as similar checks are performed in supabase.ts,
 * but it provides additional debugging information that can be helpful during development.
 */

/**
 * Utility to check environment variables
 */
export function checkEnvironmentVariables() {
  console.log('🌍 Environment Variables Status:', {
    // Supabase Variables
    supabase: {
      VITE_PREFIX: {
        SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL),
        SUPABASE_ANON_KEY: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
        AUTH_REDIRECT_URL: Boolean(process.env.VITE_AUTH_REDIRECT_URL)
      },
      REACT_APP_PREFIX: {
        SUPABASE_URL: Boolean(process.env.REACT_APP_SUPABASE_URL),
        SUPABASE_ANON_KEY: Boolean(process.env.REACT_APP_SUPABASE_ANON_KEY),
        AUTH_REDIRECT_URL: Boolean(process.env.REACT_APP_AUTH_REDIRECT_URL)
      },
      ACTIVE_PREFIX: {
        SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'VITE_' : (process.env.REACT_APP_SUPABASE_URL ? 'REACT_APP_' : 'NOT_FOUND'),
        SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'VITE_' : (process.env.REACT_APP_SUPABASE_ANON_KEY ? 'REACT_APP_' : 'NOT_FOUND'),
        AUTH_REDIRECT_URL: process.env.VITE_AUTH_REDIRECT_URL ? 'VITE_' : (process.env.REACT_APP_AUTH_REDIRECT_URL ? 'REACT_APP_' : 'NOT_FOUND')
      }
    },
    // OpenAI Variables
    openai: {
      REACT_APP_PREFIX: {
        OPENAI_API_KEY: Boolean(process.env.REACT_APP_OPENAI_API_KEY)
      },
      VITE_PREFIX: {
        OPENAI_API_KEY: Boolean(process.env.VITE_OPENAI_API_KEY)
      },
      ACTIVE_PREFIX: {
        OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY ? 'VITE_' : (process.env.REACT_APP_OPENAI_API_KEY ? 'REACT_APP_' : 'NOT_FOUND')
      }
    }
  });
} 