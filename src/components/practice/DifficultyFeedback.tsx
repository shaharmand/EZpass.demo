import React from 'react';
import { Button, Space, Typography } from 'antd';
import { Question } from '../../types/question';
import { SkipReason } from '../../types/prepUI';
import './DifficultyFeedback.css';

const { Text } = Typography;

interface DifficultyFeedbackContentProps {
  question: Question;
  onSkip: (reason: SkipReason, filters?: any) => void;
  onClose: () => void;
}

const getDifficultyLabel = (difficulty: number): string => {
  switch (difficulty) {
    case 1: return 'קל מאוד';
    case 2: return 'קל';
    case 3: return 'בינוני';
    case 4: return 'קשה';
    case 5: return 'קשה מאוד';
    default: return `רמה ${difficulty}`;
  }
};

export const DifficultyFeedbackContent: React.FC<DifficultyFeedbackContentProps> = ({
  question,
  onSkip,
  onClose
}) => {
  const options = [
    { reason: 'ok' as any, label: 'רמת הקושי בסדר' },
    { reason: 'too_hard' as SkipReason, label: 'קשה מדי' },
    { reason: 'too_easy' as SkipReason, label: 'קלה מדי' }
  ];

  return (
    <div className="difficulty-feedback-content">
      <Text strong className="difficulty-label">
        רמת קושי: {getDifficultyLabel(question.metadata.difficulty)}
      </Text>
      <Text className="difficulty-description">
        האם רמת הקושי של השאלה מתאימה?
      </Text>
      <Space direction="vertical" className="difficulty-options">
        {options.map(({ reason, label }) => (
          <Button
            key={reason}
            onClick={() => {
              if (reason !== 'ok') {
                onSkip(reason);
              }
              onClose();
            }}
            className={`difficulty-option ${reason === 'ok' ? 'selected' : ''}`}
          >
            {label}
          </Button>
        ))}
      </Space>
    </div>
  );
};

export const DifficultyStars: React.FC<{ difficulty: number }> = ({ difficulty }) => (
  <div className="difficulty-stars">
    {[...Array(5)].map((_, i) => (
      <span key={i} className={i < difficulty ? 'star filled' : 'star'}>★</span>
    ))}
  </div>
); 