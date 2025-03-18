import OpenAI from 'openai';
import { logger } from './logger';

let openaiInstance: OpenAI | null = null;

/**
 * Initialize OpenAI client with proper environment variables
 * Handles both Node.js and browser environments
 */
export function initializeOpenAI(): OpenAI {
    if (openaiInstance) {
        return openaiInstance;
    }

    // Check for environment variables - prioritize REACT_APP_OPENAI_API_KEY since it's used in production
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || 
                   process.env.OPENAI_API_KEY || 
                   process.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
        logger.error('OpenAI API key not found in environment variables');
        throw new Error('OpenAI API key not found. Please set REACT_APP_OPENAI_API_KEY');
    }

    // Initialize OpenAI client
    openaiInstance = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Allow browser usage if needed
    });

    logger.info('OpenAI client initialized successfully');
    return openaiInstance;
}

/**
 * Get the OpenAI instance
 * Initializes if not already initialized
 */
export function getOpenAI(): OpenAI {
    return initializeOpenAI();
}

/**
 * Check if OpenAI is properly configured
 */
export function checkOpenAIConfig(): boolean {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || 
                   process.env.OPENAI_API_KEY || 
                   process.env.VITE_OPENAI_API_KEY;

    return !!apiKey;
} 