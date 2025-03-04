import React, { createContext, useContext, useState, useEffect } from 'react';
import { Modal } from 'antd';
import { useAuth } from './AuthContext';
import { AuthModal } from '../components/Auth/AuthModal';
import { AuthForms } from '../components/Auth/AuthForms';
import { Tabs, Typography } from 'antd';
import { CheckCircleOutlined, StarOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { RubricFeedback } from '../components/feedback/RubricFeedback';

const { Text } = Typography;

interface PracticeAttemptsContextType {
  incrementAttempt: () => Promise<boolean>;
  attemptsCount: number;
  userAttemptsCount: number;
  getFeedbackMode: () => 'none' | 'limited' | 'detailed';
  checkAndShowGuestLimitIfNeeded: () => boolean;
  getGuestFeedbackMessage: () => string | null;
  isGuestLimitExceeded: boolean;
  MAX_DETAILED_FEEDBACK_ATTEMPTS: number;
}

const PracticeAttemptsContext = createContext<PracticeAttemptsContextType | undefined>(undefined);

const MAX_GUEST_ATTEMPTS = 2; // Guest users get 2 free questions
export const MAX_DETAILED_FEEDBACK_ATTEMPTS = 5; // Users get detailed feedback for first 5 submissions

const TOTAL_ALLOWED_ATTEMPTS = 5;
const STORAGE_KEY = 'practice_attempts';

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
  const [completedQuestions, setCompletedQuestions] = useState(0);

  // Reset user attempts when user logs in
  useEffect(() => {
    if (user) {
      setShowAuthModal(false);
      setShowGuestModal(false);
      setUserAttemptsCount(0); // Reset attempts for newly logged in user
    }
  }, [user]);

  useEffect(() => {
    const storedAttempts = localStorage.getItem(STORAGE_KEY);
    if (storedAttempts) {
      setCompletedQuestions(parseInt(storedAttempts, 10));
    }
  }, []);

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
      title: 'כל הכבוד על ההתקדמות שלך היום! 🎉',
      content: (
        <div style={{ 
          direction: 'rtl', 
          textAlign: 'center',
          margin: '0 -24px' // Compensate for Modal's default padding
        }}>
          <div style={{
            margin: '0 24px 28px',
            padding: '16px 24px',
            background: '#f0f9ff',
            borderRadius: '12px',
            border: '1px solid #93c5fd'
          }}>
            <p style={{ 
              fontSize: '16px',
              color: '#1e40af',
              lineHeight: '1.5',
              margin: 0,
              fontWeight: 500
            }}>
              הגעת למכסת המשובים המפורטים היומית שלך ({MAX_DETAILED_FEEDBACK_ATTEMPTS})
            </p>
          </div>
          
          <div style={{
            margin: '0 24px 32px',
            fontSize: '15px',
            color: '#374151',
            lineHeight: '1.6'
          }}>
            מעתה תקבל משוב על נכונות הפתרון והציון שלו בלבד.
          </div>

          <div style={{
            margin: '0 24px',
            padding: '28px 32px',
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                fontSize: '20px',
                color: '#1d4ed8',
                margin: 0,
                fontWeight: 600
              }}>
                הצטרף לאיזיפס פלוס
              </h3>
              <span style={{ fontSize: '24px' }}>⭐</span>
            </div>
            <div className="feedback-content">
              <div className="limited-feedback">
                <div className="limited-feedback-content">
                  <StarOutlined className="star-icon" />
                  <Text>הצטרף לאיזיפס פלוס וקבל פתרון מלא, הסברים מפורטים, עזרה והנחיה אישית ותכני לימוד מותאמים לצרכיך</Text>
                  <Button 
                    type="primary" 
                    className="join-button"
                    onClick={() => window.open('https://ezpass.co.il/plus', '_blank')}
                  >
                    פרטים נוספים
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      okText: 'הבנתי',
      onOk: () => setHasShownLimitNotification(true),
      className: 'detailed-feedback-limit-modal',
      width: 520
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

  const getFeedbackMode = () => {
    if (!user) {
      return guestAttemptsCount > MAX_GUEST_ATTEMPTS ? 'none' : 'detailed';
    }
    return userAttemptsCount >= MAX_DETAILED_FEEDBACK_ATTEMPTS ? 'limited' : 'detailed';
  };

  const incrementAttempts = () => {
    const newCount = completedQuestions + 1;
    setCompletedQuestions(newCount);
    localStorage.setItem(STORAGE_KEY, newCount.toString());
  };

  const resetAttempts = () => {
    setCompletedQuestions(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PracticeAttemptsContext.Provider value={{
      incrementAttempt,
      attemptsCount,
      userAttemptsCount,
      getFeedbackMode,
      checkAndShowGuestLimitIfNeeded,
      getGuestFeedbackMessage,
      isGuestLimitExceeded: !user && guestAttemptsCount > MAX_GUEST_ATTEMPTS,
      MAX_DETAILED_FEEDBACK_ATTEMPTS
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
        {!hasShownInitialGuestLimit ? 
          <InitialGuestLimitContent onClose={handleModalClose} /> :
          <SubsequentGuestLimitContent onClose={handleModalClose} />
        }
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