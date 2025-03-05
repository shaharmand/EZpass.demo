import React from 'react';
import { Typography, Button } from 'antd';
import { StarOutlined, BookOutlined, ReadOutlined } from '@ant-design/icons';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { BasicQuestionFeedback } from '../../types/feedback/types';
import styles from './MultipleChoiceFeedbackExplanation.module.css';

const { Text, Title } = Typography;

interface MultipleChoiceFeedbackExplanationProps {
  feedback: BasicQuestionFeedback;
  showDetailedFeedback?: boolean;
  onUpgradeClick?: () => void;
}

export const MultipleChoiceFeedbackExplanation: React.FC<MultipleChoiceFeedbackExplanationProps> = ({
  feedback,
  showDetailedFeedback = true,
  onUpgradeClick
}) => {
  if (!showDetailedFeedback) {
    return (
      <div className={styles['limited-feedback']}>
        <div className={styles['limited-feedback-content']}>
          <StarOutlined className={styles['star-icon']} />
          <Text strong>
            הצטרף לאיזיפס+ וקבל הסברים מפורטים לתשובות
          </Text>
          <Button 
            type="primary"
            className={styles['join-button']}
            onClick={onUpgradeClick}
          >
            הצטרף עכשיו
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['feedback-details']}>
      <Title level={5} className={styles['explanation-title']}>
        <BookOutlined /> הסבר
      </Title>
      <div className={styles['detailed-feedback']}>
        <MarkdownRenderer content={feedback.basicExplanation} />
        {feedback.fullExplanation && (
          <div className={styles['detailed-explanation']}>
            <Title level={5} className={styles['explanation-title']}>
              <ReadOutlined /> הסבר מפורט
            </Title>
            <MarkdownRenderer content={feedback.fullExplanation} />
          </div>
        )}
      </div>
    </div>
  );
}; 