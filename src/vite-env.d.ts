/**
 * Vite Client Type Reference File
 * 
 * This file is essential for Vite's environment variable handling, particularly in production (Vercel).
 * Its primary purpose is to provide the Vite client type reference which enables import.meta.env functionality.
 * 
 * Key Features:
 * - Provides the crucial /// <reference types="vite/client" /> declaration
 * - Required for proper TypeScript support of import.meta.env
 * - Essential for Vite's environment variable handling in production
 * 
 * Note: While some type definitions may overlap with env.d.ts, 
 * this file is necessary for Vite's client-side environment variable handling.
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