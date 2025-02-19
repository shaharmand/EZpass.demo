export const getFeedbackStyles = (score: number) => {
  // Color gradients based on score ranges
  if (score >= 95) return {
    background: 'rgba(52, 211, 153, 0.1)',
    border: '#34d399',
    icon: '#059669',
    text: '#065f46',
    message: 'מצוין! תשובה מושלמת!'
  };
  if (score >= 85) return {
    background: 'rgba(134, 239, 172, 0.1)',
    border: '#86efac',
    icon: '#10b981',
    text: '#166534',
    message: 'כל הכבוד! תשובה טובה מאוד'
  };
  if (score >= 75) return {
    background: 'rgba(147, 197, 253, 0.1)',
    border: '#93c5fd',
    icon: '#3b82f6',
    text: '#1e40af',
    message: 'תשובה טובה'
  };
  if (score >= 60) return {
    background: 'rgba(250, 204, 21, 0.1)',
    border: '#facc15',
    icon: '#eab308',
    text: '#854d0e',
    message: 'תשובה סבירה, יש מקום לשיפור'
  };
  return {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    icon: '#dc2626',
    text: '#991b1b',
    message: 'תשובה חלקית, נסה שוב'
  };
};

export const transitionStyles = {
  questionTransition: {
    opacity: 1,
    transform: 'translateY(0)',
    transition: 'all 0.3s ease-in-out'
  },
  questionTransitionLoading: {
    opacity: 0,
    transform: 'translateY(20px)',
    transition: 'all 0.3s ease-in-out'
  },
  feedbackTransition: {
    opacity: 1,
    transform: 'translateY(0)',
    animation: 'slideIn 0.4s ease-out forwards'
  }
};

export const keyframes = `
  @keyframes slideIn {
    0% {
      opacity: 0;
      transform: translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`; 