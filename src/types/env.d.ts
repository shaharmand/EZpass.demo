/**
 * Main Environment Variables Type Definitions
 * 
 * This file defines TypeScript types for all environment variables used in the application.
 * It includes type definitions for both Vite (VITE_) and Create React App (REACT_APP_) prefixes
 * to support both development and production environments.
 * 
 * Key Features:
 * - Defines ImportMetaEnv for Vite environment variables
 * - Extends ProcessEnv to include both VITE_ and REACT_APP_ prefixed variables
 * - Provides TypeScript type checking for all environment variables
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_AUTH_REDIRECT_URL: string
  readonly VITE_OPENAI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_AUTH_REDIRECT_URL: string
    readonly VITE_OPENAI_API_KEY: string
    readonly REACT_APP_SUPABASE_URL: string
    readonly REACT_APP_SUPABASE_ANON_KEY: string
    readonly REACT_APP_AUTH_REDIRECT_URL: string
    readonly REACT_APP_OPENAI_API_KEY: string
  }
} 