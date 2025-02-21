import type { CSSProperties } from 'react';

export const transitionStyles = {
  entering: { opacity: 0, transform: 'scale(0.95)' },
  entered: { opacity: 1, transform: 'scale(1)' },
  exiting: { opacity: 0, transform: 'scale(0.95)' },
  exited: { opacity: 0, transform: 'scale(0.95)' },
  unmounted: { opacity: 0, transform: 'scale(0.95)' },
  feedbackTransition: {
    transition: 'all 0.3s ease-in-out',
    opacity: 1,
    transform: 'translateY(0)'
  }
};

export const getFeedbackStyles = (isCorrect: boolean): { 
  container: CSSProperties;
  icon: CSSProperties;
  text: CSSProperties;
} => {
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