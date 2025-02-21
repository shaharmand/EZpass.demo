import React, { useState } from 'react';
import { Modal, Typography, Space, Divider, Card, Button, Collapse, Tag, List, Checkbox, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  BookOutlined, 
  ClockCircleOutlined, 
  QuestionCircleOutlined,
  RightCircleOutlined,
  CaretRightOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { FormalExam, Topic, SubTopic } from '../../types/shared/exam';
import type { TopicSelection, StudentPrep } from '../../types/prepState';
import { useStudentPrep } from '../../contexts/StudentPrepContext';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ExamTopicsDialogProps {
  exam: FormalExam;
  open: boolean;
  onClose: () => void;
  startPrep: (exam: FormalExam, selection?: TopicSelection) => Promise<string>;
  getPrep: (prepId: string) => Promise<StudentPrep | null>;
}

export const ExamTopicsDialog: React.FC<ExamTopicsDialogProps> = ({
  exam,
  open,
  onClose,
  startPrep,
  getPrep
}) => {
  const navigate = useNavigate();
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!exam) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting practice session with topic selection...');
      
      // If topics are selected, create a TopicSelection
      const selection: TopicSelection | undefined = selectedTopicIds.length > 0
        ? {
            topics: selectedTopicIds,
            subTopics: selectedSubtopics
          }
        : undefined;
      
      // Start practice and get ID
      const prepId = await startPrep(exam, selection);
      console.log('Prep created with ID:', prepId);
      
      // Close dialog and navigate immediately
      onClose();
      navigate(`/practice/${prepId}`, { replace: true });
    } catch (error) {
      console.error('Error starting practice:', {
        error,
        examId: exam.id,
        selectedTopics: selectedTopicIds.length,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : 'Failed to start practice');
      setLoading(false);
    }
  };

  const onTopicChange = (topicId: string, checked: boolean) => {
    if (checked) {
      setSelectedTopicIds([...selectedTopicIds, topicId]);
    } else {
      setSelectedTopicIds(prevTopicIds => prevTopicIds.filter(id => id !== topicId));
    }
  };

  const onSubtopicChange = (subtopicId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubtopics([...selectedSubtopics, subtopicId]);
    } else {
      setSelectedSubtopics(prevSubtopics => prevSubtopics.filter(id => id !== subtopicId));
    }
  };

  return (
    <Modal
      title="בחר נושאים לתרגול"
      open={open}
      onCancel={onClose}
      footer={[
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={loading}
        >
          התחל תרגול
        </Button>
      ]}
    >
      {error && (
        <Alert
          message="שגיאה"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      <List
        dataSource={exam.topics}
        renderItem={(topic: Topic) => (
          <List.Item>
            <Checkbox
              checked={selectedTopicIds.includes(topic.topicId)}
              onChange={(e) => onTopicChange(topic.topicId, e.target.checked)}
            >
              {topic.name}
            </Checkbox>
            <List
              dataSource={topic.subTopics}
              renderItem={(subtopic) => (
                <List.Item>
                  <Checkbox
                    checked={selectedSubtopics.includes(subtopic.id)}
                    onChange={(e) => onSubtopicChange(subtopic.id, e.target.checked)}
                  >
                    {subtopic.name}
                  </Checkbox>
                </List.Item>
              )}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}; 