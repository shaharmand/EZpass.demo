import React from 'react';
import { Space, Tag, Typography, Tooltip, Divider } from 'antd';
import { 
  BookOutlined, 
  ClockCircleOutlined, 
  FileTextOutlined, 
  StarFilled,
  StarOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface QuestionMetadataProps {
  metadata: {
    topicId: string;
    subtopicId?: string;
    type: string;
    difficulty: string;
    source?: any;
  };
  layout?: 'vertical' | 'horizontal';
}

export const getQuestionTypeLabel = (type: string) => {
  switch(type) {
    case 'multiple_choice': return 'סגורה';
    case 'open': return 'פתוחה';
    case 'code': return 'תכנות';
    case 'step_by_step': return 'חישובית';
    default: return type;
  }
};

const difficultyColors = {
  1: '#10b981', // Green
  2: '#34d399', // Light green
  3: '#3b82f6', // Blue
  4: '#f59e0b', // Amber/Orange
  5: '#ef4444'  // Red
};

export const getDifficultyIcons = (level: string) => {
  const numLevel = parseInt(level);
  const totalStars = 5;
  const filledStars = numLevel;
  
  return (
    <span className="difficulty-stars">
      {[...Array(totalStars)].map((_, index) => (
        <span key={index} className={index < filledStars ? 'filled' : 'empty'}>
          {index < filledStars ? (
            <StarFilled style={{ color: '#f59e0b' }} />
          ) : (
            <StarOutlined style={{ color: '#d1d5db' }} />
          )}
        </span>
      ))}
    </span>
  );
};

const getDifficultyLabel = (level: string) => {
  const numLevel = parseInt(level);
  switch(numLevel) {
    case 1: return 'קל מאוד';
    case 2: return 'קל';
    case 3: return 'בינוני';
    case 4: return 'קשה';
    case 5: return 'קשה מאוד';
    default: return `רמה ${level}`;
  }
};

const QuestionMetadata: React.FC<QuestionMetadataProps> = ({ metadata, layout = 'vertical' }) => {
  const renderMetadataItem = (icon: React.ReactNode, tooltip: string, content: React.ReactNode) => (
    <Tooltip title={tooltip}>
      <div className="metadata-item">
        {icon}
        {content}
      </div>
    </Tooltip>
  );

  const metadataItems = (
    <div className="metadata-container">
      {/* Difficulty with stars */}
      {renderMetadataItem(
        <SafetyCertificateOutlined className="metadata-icon" />,
        getDifficultyLabel(metadata.difficulty),
        <div className="difficulty-indicator">
          {getDifficultyIcons(metadata.difficulty)}
        </div>
      )}

      <Divider type="vertical" />

      {/* Question Type */}
      {renderMetadataItem(
        <FileTextOutlined className="metadata-icon" />,
        "סוג שאלה",
        <Text className="metadata-text">{getQuestionTypeLabel(metadata.type)}</Text>
      )}

      <Divider type="vertical" />

      {/* Topic */}
      {renderMetadataItem(
        <ExperimentOutlined className="metadata-icon" />,
        "נושא",
        <Text className="metadata-text">{metadata.topicId}</Text>
      )}

      {/* Source if available */}
      {metadata.source && (
        <>
          <Divider type="vertical" />
          {renderMetadataItem(
            <ClockCircleOutlined className="metadata-icon" />,
            "מקור",
            <Text className="metadata-text">{metadata.source.examType || 'תרגול'}</Text>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className={layout === 'horizontal' ? 'metadata-horizontal' : 'metadata-vertical'}>
      {metadataItems}
      
      <style>
        {`
          .metadata-container {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .metadata-item {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: help;
          }

          .metadata-icon {
            color: #6b7280;
            font-size: 16px;
          }

          .metadata-text {
            color: #4b5563;
            font-size: 14px;
          }

          .difficulty-stars {
            display: flex;
            gap: 2px;
          }

          .difficulty-stars .filled,
          .difficulty-stars .empty {
            font-size: 14px;
          }

          .difficulty-indicator {
            display: flex;
            align-items: center;
          }

          .metadata-vertical {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .metadata-horizontal {
            display: flex;
            align-items: center;
            gap: 16px;
          }
        `}
      </style>
    </div>
  );
};

export default QuestionMetadata; 