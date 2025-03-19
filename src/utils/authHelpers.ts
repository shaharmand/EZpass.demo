import { getSupabase } from '../lib/supabase';

/**
 * Get the current user ID from Supabase auth
 * @returns Promise that resolves to the user ID string or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

/**
 * Get the current user ID synchronously (uses localStorage directly if available)
 * Note: This may not be accurate if the session has changed since last login
 * @returns User ID string or null if not authenticated
 */
export function getCurrentUserIdSync(): string | null {
  try {
    // Try to extract from localStorage directly, which is synchronous
    const supabaseKey = Object.keys(localStorage).find(key => 
      key.startsWith('sb-') && key.endsWith('-auth-token')
    );
    
    if (supabaseKey) {
      const authData = JSON.parse(localStorage.getItem(supabaseKey) || '{}');
      return authData?.user?.id || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user ID synchronously:', error);
    return null;
  }
} 