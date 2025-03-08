import type { CSSProperties } from 'react';
import { BinaryEvalLevel, DetailedEvalLevel } from '../types/feedback/levels';
import { FeedbackStatus, getFeedbackStatus } from '../types/feedback/status';

// Define colors inline since we don't have a colors module
export const colors = {
  success: '#10b981',    // Green for success (80%+ or CORRECT)
  warning: '#f59e0b',    // Yellow/Orange for good (55-79%)
  error: '#ef4444',      // Red for needs improvement (<55%)
  gray: '#6b7280',       // Gray for default/unknown
  premium: '#6366f1',    // Indigo for premium features
  premiumLight: '#e0e7ff', // Light indigo for premium backgrounds
  successLight: '#f0fdf4',  // Light green for success backgrounds
  warningLight: '#fefce8',  // Light yellow for warning backgrounds
  errorLight: '#fef2f2'     // Light red for error backgrounds
};

export const transitionStyles = {
  entering: { opacity: 0, transform: 'scale(0.9)' },
  entered: { opacity: 1, transform: 'scale(1)' },
  exiting: { opacity: 0, transform: 'scale(0.9)' },
  exited: { opacity: 0, transform: 'scale(0.9)' },
  unmounted: { opacity: 0, transform: 'scale(0.95)' },
  feedbackTransition: {
    transition: 'all 0.3s ease-in-out',
    opacity: 1,
    transform: 'translateY(0)'
  }
};

export const getFeedbackColor = (statusOrLevel: FeedbackStatus | BinaryEvalLevel | DetailedEvalLevel): string => {
  // If it's already a FeedbackStatus, use it directly
  if (Object.values(FeedbackStatus).includes(statusOrLevel as FeedbackStatus)) {
    const status = statusOrLevel as FeedbackStatus;
    switch (status) {
      case FeedbackStatus.SUCCESS:
        return colors.success;
      case FeedbackStatus.PARTIAL:
        return colors.warning;
      case FeedbackStatus.FAILURE:
        return colors.error;
    }
  }

  // Otherwise, convert the evaluation level to a FeedbackStatus
  const status = getFeedbackStatus(statusOrLevel as BinaryEvalLevel | DetailedEvalLevel);
  switch (status) {
    case FeedbackStatus.SUCCESS:
      return colors.success;
    case FeedbackStatus.PARTIAL:
      return colors.warning;
    case FeedbackStatus.FAILURE:
      return colors.error;
  }
  
  return colors.gray; // Default fallback
};

export const getFeedbackTitle = (score: number, level: DetailedEvalLevel | BinaryEvalLevel): string => {
  // Binary feedback
  if (level === BinaryEvalLevel.CORRECT) return 'נכון! ✅';
  if (level === BinaryEvalLevel.INCORRECT) return 'לא נכון ❌';
  
  // Detailed feedback - use the Hebrew values directly from the enum
  switch (level) {
    case DetailedEvalLevel.PERFECT: return `${DetailedEvalLevel.PERFECT} 🌟`;
    case DetailedEvalLevel.EXCELLENT: return `${DetailedEvalLevel.EXCELLENT} ✨`;
    case DetailedEvalLevel.VERY_GOOD: return `${DetailedEvalLevel.VERY_GOOD} 🎉`;
    case DetailedEvalLevel.GOOD: return `${DetailedEvalLevel.GOOD} 👏`;
    case DetailedEvalLevel.FAIR: return `${DetailedEvalLevel.FAIR} 👍`;
    case DetailedEvalLevel.POOR: return `${DetailedEvalLevel.POOR} 💪`;
    case DetailedEvalLevel.IRRELEVANT: return `${DetailedEvalLevel.IRRELEVANT} ❓`;
    default: return 'תשובה לא מוגדרת';
  }
};

// Base styles for all feedback types
const baseStyles = {
  container: {
    padding: '16px 24px',
    borderRadius: '8px',
    marginBottom: '16px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '24px'
  },
  text: {
    fontSize: '16px',
    fontWeight: 500,
    margin: 0
  }
};

// Limited feedback for freemium users - designed to show a semi-transparent preview
export const getLimitedFeedbackStyles = (isPreview: boolean = false): {
  container: CSSProperties;
  previewOverlay: CSSProperties;
  content: CSSProperties;
  upgradeSection: CSSProperties;
} => ({
  container: {
    ...baseStyles.container,
    backgroundColor: colors.premiumLight,
    border: `1px solid ${colors.premium}`,
    flexDirection: 'column' as const,
    padding: '24px',
    gap: '16px',
    position: 'relative' as const,
    overflow: 'hidden' as const
  },
  previewOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    gap: '16px',
    padding: '24px',
    zIndex: 10
  },
  content: {
    opacity: 0.5,
    filter: 'blur(2px)',
    pointerEvents: 'none' as const,
    width: '100%'
  },
  upgradeSection: {
    textAlign: 'center' as const,
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginTop: '16px',
    width: '100%'
  }
});

// Basic feedback (correct/incorrect)
export const getBasicFeedbackStyles = (isCorrect: boolean): {
  container: CSSProperties;
  icon: CSSProperties;
  text: CSSProperties;
} => {
  if (isCorrect) {
    return {
      container: {
        ...baseStyles.container,
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f'
      },
      icon: {
        ...baseStyles.icon,
        color: '#52c41a'
      },
      text: {
        ...baseStyles.text,
        color: '#135200'
      }
    };
  }

  return {
    container: {
      ...baseStyles.container,
      backgroundColor: '#fff2f0',
      border: '1px solid #ffccc7'
    },
    icon: {
      ...baseStyles.icon,
      color: '#ff4d4f'
    },
    text: {
      ...baseStyles.text,
      color: '#a8071a'
    }
  };
};

// Detailed feedback with evaluation levels
export const getDetailedFeedbackStyles = (evalLevel: DetailedEvalLevel): {
  container: CSSProperties;
  icon: CSSProperties;
  text: CSSProperties;
  details: CSSProperties;
} => {
  const isSuccess = [
    DetailedEvalLevel.PERFECT,
    DetailedEvalLevel.VERY_GOOD
  ].includes(evalLevel);
  const isGood = evalLevel === DetailedEvalLevel.GOOD;
  
  const styles = {
    container: {
      ...baseStyles.container,
      flexDirection: 'column' as const,
      padding: '24px',
      gap: '16px',
      backgroundColor: isSuccess ? '#f6ffed' : isGood ? '#fffbe6' : '#fff2f0',
      border: `1px solid ${isSuccess ? '#b7eb8f' : isGood ? '#ffe58f' : '#ffccc7'}`
    },
    icon: {
      ...baseStyles.icon,
      fontSize: '32px',
      color: isSuccess ? '#52c41a' : isGood ? '#faad14' : '#ff4d4f'
    },
    text: {
      ...baseStyles.text,
      fontSize: '18px',
      color: isSuccess ? '#135200' : isGood ? '#614700' : '#a8071a'
    },
    details: {
      fontSize: '14px',
      color: colors.gray,
      marginTop: '8px',
      padding: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: '4px',
      width: '100%'
    }
  };

  return styles;
};

export const getHebrewEvalLevel = (level: DetailedEvalLevel | BinaryEvalLevel): string => {
  // Binary feedback
  if (level === BinaryEvalLevel.CORRECT) return 'נכון';
  if (level === BinaryEvalLevel.INCORRECT) return 'לא נכון';
  
  // Detailed feedback - use the Hebrew values directly from the enum
  switch (level) {
    case DetailedEvalLevel.PERFECT: return 'מושלם';
    case DetailedEvalLevel.EXCELLENT: return 'מצוין';
    case DetailedEvalLevel.VERY_GOOD: return 'טוב מאוד';
    case DetailedEvalLevel.GOOD: return 'טוב';
    case DetailedEvalLevel.FAIR: return 'סביר';
    case DetailedEvalLevel.POOR: return 'חלש';
    case DetailedEvalLevel.IRRELEVANT: return 'לא רלוונטי';
    default: return 'לא מוגדר';
  }
}; 