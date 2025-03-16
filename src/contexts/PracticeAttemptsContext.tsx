import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface PracticeAttemptsContextType {
  incrementAttempt: () => Promise<boolean>;
  hasExceededLimit: boolean;
  getCurrentAttempts: () => number;
  getMaxAttempts: () => number;
  isAllowedFullFeedback: () => boolean;
}

const PracticeAttemptsContext = createContext<PracticeAttemptsContextType | undefined>(undefined);

const MAX_GUEST_ATTEMPTS = 2; // Guest users get 2 free questions
const MAX_DETAILED_FEEDBACK_ATTEMPTS = 5;

export function PracticeAttemptsProvider({ children }: { children: React.ReactNode }) {
  const [guestAttemptsCount, setGuestAttemptsCount] = useState(0);
  const [userAttemptsCount, setUserAttemptsCount] = useState(0);
  const { user } = useAuth();

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
      maxAttempts: MAX_DETAILED_FEEDBACK_ATTEMPTS
    });
    setUserAttemptsCount(newCount);
    return true;
  };

  // Determine if user has exceeded their limit
  const hasExceededLimit = !user ? 
    guestAttemptsCount >= MAX_GUEST_ATTEMPTS : 
    userAttemptsCount >= MAX_DETAILED_FEEDBACK_ATTEMPTS;

  // Check if user is allowed to see full feedback
  const isAllowedFullFeedback = () => {
    if (!user) {
      return guestAttemptsCount <= MAX_GUEST_ATTEMPTS;
    }
    return userAttemptsCount <= MAX_DETAILED_FEEDBACK_ATTEMPTS;
  };

  useEffect(() => {
    console.log('=== Limit status changed ===', {
      isGuest: !user,
      attempts: !user ? guestAttemptsCount : userAttemptsCount,
      maxAttempts: !user ? MAX_GUEST_ATTEMPTS : MAX_DETAILED_FEEDBACK_ATTEMPTS,
      hasExceededLimit,
      isAllowedFullFeedback: isAllowedFullFeedback()
    });
  }, [hasExceededLimit, user, guestAttemptsCount, userAttemptsCount]);

  const getCurrentAttempts = () => {
    return user ? userAttemptsCount : guestAttemptsCount;
  };

  const getMaxAttempts = () => {
    return user ? MAX_DETAILED_FEEDBACK_ATTEMPTS : MAX_GUEST_ATTEMPTS;
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