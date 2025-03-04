import type { User } from '@supabase/supabase-js';

/**
 * User's role in the system
 */
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

/**
 * User's subscription tier
 */
export enum SubscriptionTier {
  FREE = 'free',           // Basic access with limited features
  PLUS = 'plus',          // Standard paid subscription
  PRO = 'pro'             // Premium subscription with all features
}

/**
 * Profile data stored in our profiles table
 * Only contains additional data not already in auth.users
 */
export interface Profile {
  id: string;              // References auth.users(id)
  role: UserRole;
  subscription_tier: SubscriptionTier;
  updated_at?: string;
}

/**
 * Complete user profile that combines:
 * - Auth data (from Supabase auth.users)
 * - Additional profile data (from our profiles table)
 */
export interface UserProfile extends Pick<User, 'id' | 'email' | 'phone'> {
  // From user_metadata
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  
  // From our profiles table
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  
  // Additional fields
  lastLoginAt?: string;
}

/**
 * Helper to convert Supabase User and Profile to UserProfile
 */
export function createUserProfile(user: User, profile: Profile): UserProfile {
  return {
    // Auth data from Supabase
    id: user.id,
    email: user.email ?? '',
    phone: user.phone ?? undefined,
    
    // Metadata from Supabase
    firstName: user.user_metadata?.first_name ?? '',
    lastName: user.user_metadata?.last_name ?? '',
    avatarUrl: user.user_metadata?.avatar_url,
    
    // Profile data from our table
    role: profile.role,
    subscriptionTier: profile.subscription_tier
  };
}