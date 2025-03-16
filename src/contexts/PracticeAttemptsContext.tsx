import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { SubscriptionTier } from '../types/userTypes';

interface PracticeAttemptsContextType {
  incrementAttempt: () => Promise<boolean>;
  hasExceededLimit: boolean;
  getCurrentAttempts: () => number;
  getMaxAttempts: () => number;
  isAllowedFullFeedback: () => boolean;
}

const PracticeAttemptsContext = createContext<PracticeAttemptsContextType | undefined>(undefined);

// Attempt limits for different user types
const MAX_GUEST_ATTEMPTS = 2; // Guest users get 2 free questions
const MAX_FREE_TIER_ATTEMPTS = 5; // Free tier users get 5 questions
const MAX_PLUS_TIER_ATTEMPTS = 50; // EZpass+ users get 50 questions
const MAX_PRO_TIER_ATTEMPTS = 500; // EZpass Pro users get 500 questions

export function PracticeAttemptsProvider({ children }: { children: React.ReactNode }) {
  const [guestAttemptsCount, setGuestAttemptsCount] = useState(0);
  const [userAttemptsCount, setUserAttemptsCount] = useState(0);
  const { user, profile } = useAuth();

  // Reset user attempts when user logs in
  useEffect(() => {
    if (user) {
      setUserAttemptsCount(0); // Reset attempts for newly logged in user
    }
  }, [user]);

  const incrementAttempt = async (): Promise<boolean> => {
    if (!user) {
      // For guest users
      const newCount = guestAttemptsCount + 1;
      console.log('=== Incrementing guest attempts ===', {
        previousCount: guestAttemptsCount,
        newCount,
        maxAttempts: MAX_GUEST_ATTEMPTS
      });
      setGuestAttemptsCount(newCount);
      return true;
    }
    
    // For logged-in users
    const newCount = userAttemptsCount + 1;
    console.log('=== Incrementing user attempts ===', {
      previousCount: userAttemptsCount,
      newCount,
      maxAttempts: getMaxAttemptsForUser()
    });
    setUserAttemptsCount(newCount);
    return true;
  };

  // Get the maximum attempts based on user's subscription tier
  const getMaxAttemptsForUser = () => {
    if (!user) return MAX_GUEST_ATTEMPTS;
    
    if (profile?.subscription_tier) {
      switch (profile.subscription_tier) {
        case SubscriptionTier.PRO:
          return MAX_PRO_TIER_ATTEMPTS;
        case SubscriptionTier.PLUS:
          return MAX_PLUS_TIER_ATTEMPTS;
        case SubscriptionTier.FREE:
        default:
          return MAX_FREE_TIER_ATTEMPTS;
      }
    }
    
    return MAX_FREE_TIER_ATTEMPTS; // Default to free tier if no profile
  };

  // Determine if user has exceeded their limit
  const hasExceededLimit = !user ? 
    guestAttemptsCount >= MAX_GUEST_ATTEMPTS : 
    userAttemptsCount >= getMaxAttemptsForUser();

  // Check if user is allowed to see full feedback
  const isAllowedFullFeedback = () => {
    if (!user) {
      return guestAttemptsCount <= MAX_GUEST_ATTEMPTS;
    }
    return userAttemptsCount <= getMaxAttemptsForUser();
  };

  useEffect(() => {
    console.log('=== Limit status changed ===', {
      isGuest: !user,
      attempts: !user ? guestAttemptsCount : userAttemptsCount,
      maxAttempts: getMaxAttemptsForUser(),
      hasExceededLimit,
      isAllowedFullFeedback: isAllowedFullFeedback(),
      subscriptionTier: profile?.subscription_tier
    });
  }, [hasExceededLimit, user, guestAttemptsCount, userAttemptsCount, profile?.subscription_tier]);

  const getCurrentAttempts = () => {
    return user ? userAttemptsCount : guestAttemptsCount;
  };

  const getMaxAttempts = () => {
    return getMaxAttemptsForUser();
  };

  return (
    <PracticeAttemptsContext.Provider value={{
      incrementAttempt,
      hasExceededLimit,
      getCurrentAttempts,
      getMaxAttempts,
      isAllowedFullFeedback
    }}>
      {children}
    </PracticeAttemptsContext.Provider>
  );
}

export function usePracticeAttempts() {
  const context = useContext(PracticeAttemptsContext);
  if (context === undefined) {
    throw new Error('usePracticeAttempts must be used within a PracticeAttemptsProvider');
  }
  return context;
} 