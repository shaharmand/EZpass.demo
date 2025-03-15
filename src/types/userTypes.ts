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
  first_name: string;      // Added from migration
  last_name: string;       // Added from migration
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
  // From profiles table
  first_name: string;
  last_name: string;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  
  // From user_metadata
  avatarUrl?: string;
  
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
    
    // Profile data from our table
    first_name: profile.first_name,
    last_name: profile.last_name,
    role: profile.role,
    subscription_tier: profile.subscription_tier,
    
    // Metadata from Supabase
    avatarUrl: user.user_metadata?.avatar_url,
    
    // Additional fields
    lastLoginAt: user.last_sign_in_at
  };
}