import React from 'react';
import { Button, Space, Divider, Typography } from 'antd';
import { AimOutlined, StopOutlined } from '@ant-design/icons';
import { Question } from '../../types/question';
import { universalTopics } from '../../services/universalTopics';
import { getQuestionTopicName } from '../../utils/questionUtils';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import './SubtopicPopover.css';

const { Text } = Typography;

interface SubtopicPopoverContentProps {
  question: Question;
  onClose: () => void;
}

export const SubtopicPopoverContent: React.FC<SubtopicPopoverContentProps> = ({
  question,
  onClose
}) => {
  const { prep, setFocusedSubTopic } = useStudentPrep();
  const subtopicInfo = getSubtopicInfo(question);
  const isSubtopicFocused = question.metadata.subtopicId && 
    prep?.focusedSubTopic === question.metadata.subtopicId;

  // Get the topic name from the parent topic of the subtopic
  const topicName = universalTopics.getTopic(question.metadata.topicId)?.name || getQuestionTopicName(question);

  // Handle removing focus
  const handleRemoveFocus = () => {
    setFocusedSubTopic(null);
    onClose();
  };

  // Handle setting focus on current subtopic
  const handleSetFocus = () => {
    if (question.metadata.subtopicId) {
      setFocusedSubTopic(question.metadata.subtopicId);
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