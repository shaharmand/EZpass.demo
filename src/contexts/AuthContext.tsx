import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/userTypes';
import { useNavigate } from 'react-router-dom';
import { PrepStateManager } from '../services/PrepStateManager';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, first_name: string, last_name: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  // Fetch profile data whenever user changes
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setDbProfile(null);
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

      setDbProfile(profile);
    }

    loadProfile();
  }, [user]);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If user just logged in, migrate their guest prep session
      if (session?.user) {
        const migratedPrepId = PrepStateManager.migrateGuestPrep();
        if (migratedPrepId) {
          // Navigate to the migrated prep session
          navigate(`/practice/${migratedPrepId}`, { replace: true });
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const value = useMemo(() => {
    const profile = user && dbProfile ? {
      ...user,
      first_name: dbProfile.first_name,
      last_name: dbProfile.last_name,
      role: dbProfile.role,
      subscription_tier: dbProfile.subscription_tier,
      avatarUrl: user.user_metadata?.avatar_url,
      lastLoginAt: user.last_sign_in_at
    } as UserProfile : null;

    return {
      user,
      profile,
      loading,
      signUp: async (email: string, password: string, first_name: string, last_name: string) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name,
              last_name
            }
          }
        });
        return { error };
      },
      signIn: async (email: string, password: string) => {
        return supabase.auth.signInWithPassword({
          email,
          password,
        });
      },
      signInWithGoogle: async () => {
        // Always use current domain for redirect URL
        const currentDomain = window.location.origin;
        const redirectUrl = `${currentDomain}/auth/callback`;
        
        // Get stored return URL from localStorage
        const returnUrl = localStorage.getItem('returnUrl');
        
        return supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
              return_to: returnUrl || '/' // Pass return URL to auth callback
            },
            scopes: 'profile email',
            skipBrowserRedirect: false
          }
        });
      },
      signOut: async () => {
        await supabase.auth.signOut();
        navigate('/');
      },
    };
  }, [user, dbProfile, loading, navigate]);

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