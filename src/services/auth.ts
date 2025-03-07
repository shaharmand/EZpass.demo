import { supabase } from '../lib/supabase';
import { UserProfile, createUserProfile } from '../types/userTypes';

/**
 * Get complete user profile data by combining auth and profile data
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    // Get current user's auth data
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    // Get user's profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) return null;

    // Combine auth and profile data into UserProfile
    return createUserProfile(user, profile);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user's profile data
 * Note: Can only update fields that user is allowed to change
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        last_login_at: updates.lastLoginAt
      })
      .eq('id', updates.id)
      .select()
      .single();

    if (error || !profile) {
      console.error('Error updating profile:', error);
      return null;
    }

    // Get fresh auth data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return createUserProfile(user, profile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

/**
 * Sign up a new user with email/password
 */
export async function signUp(email: string, password: string, firstName: string, lastName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });

  if (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }

  return data;
}

/**
 * Sign in with Google
 * Note: Google OAuth will automatically populate user_metadata with:
 * - avatar_url
 * - full_name
 * - name
 * We'll parse these in our profile creation
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });

  if (error) {
    console.error('Error signing in with Google:', error.message);
    throw error;
  }

  return data;
}

export async function getCurrentUser() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  // ... existing code ...
}

export async function checkUserSession() {
  const { data: { user } } = await supabase.auth.getUser();
  // ... existing code ...
} 