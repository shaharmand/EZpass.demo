import type { CSSProperties } from 'react';
import { BasicAnswerLevel, DetailedEvalLevel, isSuccessfulAnswer, type EvalLevel } from '../types/question';

// Define colors inline since we don't have a colors module
const colors = {
  success: '#10b981',    // Green for success (80%+ or CORRECT)
  warning: '#f59e0b',    // Yellow/Orange for good (55-79%)
  error: '#ef4444',      // Red for needs improvement (<55%)
  gray: '#6b7280',       // Gray for default/unknown
  premium: '#6366f1',    // Indigo for premium features
  premiumLight: '#e0e7ff' // Light indigo for premium backgrounds
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

export const getFeedbackColor = (score: number): string => {
  if (score >= 80) return colors.success;  // Matches isSuccessfulAnswer threshold
  if (score >= 70) return colors.warning;  // Good but not quite successful
  return colors.error;                     // Needs improvement
};

export const getFeedbackTitle = (score: number, level: BasicAnswerLevel | DetailedEvalLevel): string => {
  if (level === BasicAnswerLevel.CORRECT) return 'מצוין! 🎉';
  if (level === DetailedEvalLevel.PERFECT) return 'מושלם! 🌟';
  if (level === DetailedEvalLevel.EXCELLENT) return 'מצוין! 🎉';
  if (level === DetailedEvalLevel.VERY_GOOD) return 'טוב מאוד! 👏';
  if (level === DetailedEvalLevel.GOOD) return 'טוב! 👍';
  return 'המשך להתאמן 💪';
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
  const isSuccess = [DetailedEvalLevel.PERFECT, DetailedEvalLevel.EXCELLENT, DetailedEvalLevel.VERY_GOOD].includes(evalLevel);
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