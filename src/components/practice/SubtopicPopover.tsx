import React from 'react';
import { Button, Space, Divider, Typography } from 'antd';
import { AimOutlined, StopOutlined } from '@ant-design/icons';
import { Question, FilterState } from '../../types/question';
import { universalTopics } from '../../services/universalTopics';
import { getQuestionTopicName } from '../../utils/questionUtils';
import './SubtopicPopover.css';

const { Text } = Typography;

interface SubtopicPopoverContentProps {
  question: Question;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
}

export const SubtopicPopoverContent: React.FC<SubtopicPopoverContentProps> = ({
  question,
  filters,
  onFiltersChange,
  onClose
}) => {
  const subtopicInfo = getSubtopicInfo(question);
  const isSubtopicFocused = question.metadata.subtopicId && 
    filters.subTopics?.length === 1 && 
    filters.subTopics[0] === question.metadata.subtopicId;

  // Get the topic name from the parent topic of the subtopic
  const topicName = universalTopics.getTopic(question.metadata.topicId)?.name || getQuestionTopicName(question);

  // Handle removing focus (filter only)
  const handleRemoveFocus = () => {
    // Create new filters object without subTopics, preserving all other filters
    const { subTopics, ...otherFilters } = filters;
    onFiltersChange(otherFilters);
    onClose();
  };

  // Handle setting focus on current subtopic
  const handleSetFocus = () => {
    if (question.metadata.subtopicId) {
      onFiltersChange({ ...filters, subTopics: [question.metadata.subtopicId] });
    }
    onClose();
  };

  return (
    <div className="subtopic-popover-content">
      <div className="subtopic-header">
        <Text strong className="subtopic-title">
          {subtopicInfo?.name} ({topicName})
        </Text>
        {subtopicInfo?.description && (
          <Text className="subtopic-description">
            {subtopicInfo.description}
          </Text>
        )}
      </div>

      <Space direction="vertical" className="subtopic-actions">
        <Button
          type="default"
          onClick={handleRemoveFocus}
          className={`subtopic-action ${!isSubtopicFocused ? 'selected' : ''}`}
        >
          תרגול בכל הנושאים
        </Button>
        <Button
          type="default"
          icon={<AimOutlined />}
          onClick={handleSetFocus}
          className={`subtopic-action ${isSubtopicFocused ? 'selected' : ''}`}
        >
          התמקד בנושא זה
        </Button>
        <Button
          type="default"
          icon={<AimOutlined />}
          onClick={() => {
            onClose();
            // Here you would trigger the topic selection dialog
          }}
          className="subtopic-action"
        >
          התמקד בנושא אחר
        </Button>
        <Divider style={{ margin: '4px 0' }} />
        <Button
          type="default"
          icon={<StopOutlined />}
          onClick={() => {
            // Here you would handle removing from exam
            onClose();
          }}
          className="subtopic-action danger"
        >
          הורד נושא זה מתכולת המבחן
        </Button>
      </Space>
    </div>
  );
};

const getSubtopicInfo = (question: Question) => {
  if (!question.metadata.subtopicId || !question.metadata.topicId) {
    return null;
  }
  const topic = universalTopics.getTopic(question.metadata.topicId);
  return topic?.subTopics?.find(st => st.id === question.metadata.subtopicId) || null;
}; 