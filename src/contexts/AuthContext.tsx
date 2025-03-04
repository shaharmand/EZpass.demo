import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types/userTypes';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile data whenever user changes
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      // Create UserProfile combining auth and profile data
      setProfile({
        id: user.id,
        email: user.email ?? '',
        phone: user.phone ?? undefined,
        firstName: user.user_metadata?.first_name ?? '',
        lastName: user.user_metadata?.last_name ?? '',
        avatarUrl: user.user_metadata?.avatar_url,
        role: profile.role,
        subscriptionTier: profile.subscription_tier
      });
    }

    loadProfile();
  }, [user]);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      setUser(user ?? null);

      // Handle Google Sign In data
      if (event === 'SIGNED_IN' && user?.app_metadata?.provider === 'google') {
        const identity = user.identities?.[0]?.identity_data;
        if (identity) {
          const firstName = identity.given_name || '';
          const lastName = identity.family_name || '';
          const avatarUrl = identity.avatar_url || identity.picture;
          
          // Update user metadata
          await supabase.auth.updateUser({
            data: {
              first_name: firstName,
              last_name: lastName,
              avatar_url: avatarUrl
            }
          });

          // Ensure profile exists
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              first_name: firstName,
              last_name: lastName,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
              // Include default values for required fields if not set
              role: 'student',  // Will use default if exists
              subscription_tier: 'free' // Will use default if exists
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Error ensuring profile exists:', profileError);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    signUp: async (email: string, password: string, firstName: string, lastName: string) => {
      return supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });
    },
    signIn: async (email: string, password: string) => {
      return supabase.auth.signInWithPassword({
        email,
        password,
      });
    },
    signInWithGoogle: async () => {
      return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'profile email',
          skipBrowserRedirect: false
        }
      });
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 