import React from 'react';
import { Button } from 'antd';
import { motion } from 'framer-motion';
import { ArrowLeftOutlined, RedoOutlined } from '@ant-design/icons';

interface SubmitAnswerBarProps {
  onSubmit: () => void;
  disabled?: boolean;
}

interface FeedbackNavigationBarProps {
  onRetry: () => void;
  onNext: () => void;
  isLastQuestion?: boolean;
}

export const SubmitAnswerBar: React.FC<SubmitAnswerBarProps> = ({ onSubmit, disabled }) => {
  return (
    <motion.div 
      className="submit-answer-bar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="action-bar-container">
        <div className="action-buttons">
          <Button 
            type="primary" 
            onClick={onSubmit}
            icon={<ArrowLeftOutlined />}
            disabled={disabled}
            className="submit-button"
            size="large"
          >
            הגש תשובה
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const FeedbackNavigationBar: React.FC<FeedbackNavigationBarProps> = ({ 
  onRetry,
  onNext,
  isLastQuestion
}) => {
  return (
    <motion.div 
      className="feedback-navigation-bar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="action-bar-container">
        <div className="action-buttons">
          <Button 
            onClick={onRetry}
            type="default"
            icon={<RedoOutlined />}
          >
            נסה שוב
          </Button>
          <Button 
            onClick={onNext}
            type="primary"
            icon={<ArrowLeftOutlined />}
          >
            {isLastQuestion ? 'סיים' : 'הבא'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const styles = `
  .submit-answer-bar,
  .feedback-navigation-bar {
    width: 100%;
    background: #f8fafc;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
  }

  .submit-answer-bar:hover,
  .feedback-navigation-bar:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .feedback-navigation-bar {
    position: sticky;
    bottom: 24px;
    z-index: 10;
  }

  .action-bar-container {
    width: 100%;
    pointer-events: auto;
  }

  .action-buttons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .submit-button {
    min-width: 200px;
    height: 48px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 500;
    background: #2563eb;  /* Primary blue */
    border: none;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    transition: all 0.3s ease;
  }

  .submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
    background: #2563eb;  /* Keep consistent */
  }

  .submit-button:disabled {
    opacity: 0.7;
    background: #94a3b8;
    box-shadow: none;
  }

  .ant-btn-icon {
    margin: 0 0 0 8px !important;
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 