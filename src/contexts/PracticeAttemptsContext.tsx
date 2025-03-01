import React, { createContext, useContext, useState, useEffect } from 'react';
import { Modal } from 'antd';
import { useAuth } from './AuthContext';
import { AuthModal } from '../components/Auth/AuthModal';
import { AuthForms } from '../components/Auth/AuthForms';

interface PracticeAttemptsContextType {
  incrementAttempt: () => Promise<boolean>;
  attemptsCount: number;
  shouldShowDetailedFeedback: boolean;
  isInLimitedFeedbackMode: boolean;
  checkAndShowGuestLimitIfNeeded: () => boolean;
  getGuestFeedbackMessage: () => string | null;
  isGuestLimitExceeded: boolean;
}

const PracticeAttemptsContext = createContext<PracticeAttemptsContextType | undefined>(undefined);

const MAX_GUEST_ATTEMPTS = 2; // Guest users get 2 free questions
const MAX_DETAILED_FEEDBACK_ATTEMPTS = 5; // Users get detailed feedback for first 5 submissions

// Create separate components for different modal content
const InitialGuestLimitContent = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();

  // Close modal when user becomes authenticated
  React.useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  return (
    <div style={{ fontSize: '16px', lineHeight: '1.6', textAlign: 'right', direction: 'rtl' }}>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>
          השלמת בהצלחה {MAX_GUEST_ATTEMPTS} שאלות תרגול!
        </p>
        <p style={{ color: '#666' }}>
          צור/י חשבון חינמי כדי:
        </p>
        <ul style={{ paddingRight: '20px', marginTop: '8px', color: '#666' }}>
          <li>לקבל משוב מפורט עבור שאלות נוספות</li>
          <li>לשמור את ההתקדמות שלך</li>
          <li>לעקוב אחר הביצועים שלך</li>
        </ul>
      </div>
      
      <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <AuthForms returnUrl={window.location.pathname} />
      </div>
    </div>
  );
};

const SubsequentGuestLimitContent = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();

  // Close modal when user becomes authenticated
  React.useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  return (
    <div style={{ fontSize: '16px', lineHeight: '1.6', textAlign: 'right', direction: 'rtl' }}>
      <p style={{ marginBottom: '16px' }}>צפה במשוב אחרי התחברות</p>
      <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <AuthForms returnUrl={window.location.pathname} />
      </div>
    </div>
  );
};

export function PracticeAttemptsProvider({ children }: { children: React.ReactNode }) {
  const [guestAttemptsCount, setGuestAttemptsCount] = useState(0);
  const [userAttemptsCount, setUserAttemptsCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [hasShownInitialGuestLimit, setHasShownInitialGuestLimit] = useState(false);
  const [hasShownSubmissionLimit, setHasShownSubmissionLimit] = useState(false);
  const [hasShownFeedbackMessage, setHasShownFeedbackMessage] = useState(false);
  const { user } = useAuth();
  const [hasShownLimitNotification, setHasShownLimitNotification] = useState(false);

  // Reset user attempts when user logs in
  useEffect(() => {
    if (user) {
      setShowAuthModal(false);
      setShowGuestModal(false);
      setUserAttemptsCount(0); // Reset attempts for newly logged in user
    }
  }, [user]);

  const handleModalClose = () => {
    setShowGuestModal(false);
    if (!hasShownInitialGuestLimit) {
      setHasShownInitialGuestLimit(true);
    }
  };

  const showGuestLimitModal = () => {
    setShowGuestModal(true);
  };

  const showDetailedFeedbackLimit = () => {
    Modal.info({
      title: 'מעבר למצב תרגול מתקדם',
      content: (
        <div>
          <p>השלמת {MAX_DETAILED_FEEDBACK_ATTEMPTS} שאלות עם משוב מפורט.</p>
          <p>מעכשיו תקבל/י משוב מצומצם יותר כדי לדמות תנאי מבחן אמיתיים.</p>
          <p>המשוב יכלול רק:</p>
          <ul>
            <li>האם התשובה נכונה או לא</li>
            <li>ציון כללי</li>
          </ul>
        </div>
      ),
      okText: 'הבנתי',
      onOk: () => setHasShownLimitNotification(true)
    });
  };

  const incrementAttempt = async (): Promise<boolean> => {
    if (!user) {
      // For guest users
      const newCount = guestAttemptsCount + 1;
      setGuestAttemptsCount(newCount);
      
      // If we've exceeded the limit and haven't shown the feedback message yet
      if (guestAttemptsCount >= MAX_GUEST_ATTEMPTS && !hasShownFeedbackMessage) {
        setHasShownFeedbackMessage(true);
        showGuestLimitModal();
      }
      
      return true; // Always allow submission
    }
    
    // For logged-in users
    const newCount = userAttemptsCount + 1;
    setUserAttemptsCount(newCount);
    
    // Show feedback limit notification when transitioning to limited feedback mode
    if (newCount === MAX_DETAILED_FEEDBACK_ATTEMPTS && !hasShownLimitNotification) {
      showDetailedFeedbackLimit();
    }
    
    return true;
  };

  const checkAndShowGuestLimitIfNeeded = (): boolean => {
    console.log('Dialog Check State:', {
      guestAttemptsCount,
      userAttemptsCount,
      isGuest: !user,
      hasShownInitialGuestLimit,
      hasShownSubmissionLimit,
      hasShownFeedbackMessage,
      isLimitReached: !user && guestAttemptsCount >= MAX_GUEST_ATTEMPTS,
      MAX_GUEST_ATTEMPTS
    });

    if (!user && guestAttemptsCount >= MAX_GUEST_ATTEMPTS && !hasShownInitialGuestLimit) {
      console.log('Showing congratulations dialog');
      showGuestLimitModal();
    }
    return true;
  };

  const getGuestFeedbackMessage = (): string | null => {
    if (!user && guestAttemptsCount > MAX_GUEST_ATTEMPTS) {
      return "התחבר כדי לצפות במשוב";
    }
    return null;
  };

  // Get the current attempts count based on user status
  const attemptsCount = user ? userAttemptsCount : guestAttemptsCount;

  // Determine if we should show detailed feedback
  const shouldShowDetailedFeedback = user ? userAttemptsCount < MAX_DETAILED_FEEDBACK_ATTEMPTS : true;
  const isInLimitedFeedbackMode = user ? userAttemptsCount >= MAX_DETAILED_FEEDBACK_ATTEMPTS : false;

  const isGuestLimitExceeded = !user && guestAttemptsCount > MAX_GUEST_ATTEMPTS;

  return (
    <PracticeAttemptsContext.Provider value={{
      incrementAttempt,
      attemptsCount,
      shouldShowDetailedFeedback,
      isInLimitedFeedbackMode,
      checkAndShowGuestLimitIfNeeded,
      getGuestFeedbackMessage,
      isGuestLimitExceeded
    }}>
      {children}
      {showAuthModal && (
        <AuthModal 
          open={true}
          onClose={() => setShowAuthModal(false)}
          returnUrl={window.location.pathname}
        />
      )}
      <Modal
        title={!hasShownInitialGuestLimit ? "כל הכבוד! 🎓" : "התחבר כדי לצפות במשוב"}
        open={showGuestModal}
        onCancel={handleModalClose}
        footer={null}
        width={!hasShownInitialGuestLimit ? 600 : 400}
        centered
        maskClosable
        closable
        className="guest-limit-modal"
      >
        {(() => {
          console.log('Rendering Modal Content:', {
            hasShownInitialGuestLimit,
            showGuestModal,
            guestAttemptsCount,
            userAttemptsCount
          });
          return !hasShownInitialGuestLimit ? 
            <InitialGuestLimitContent onClose={handleModalClose} /> :
            <SubsequentGuestLimitContent onClose={handleModalClose} />;
        })()}
      </Modal>
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