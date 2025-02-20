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
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!exam) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting practice session with topic selection...');
      
      // If topics are selected, create a TopicSelection
      const selection: TopicSelection | undefined = selectedTopics.length > 0
        ? {
            topics: selectedTopics.map(t => t.topicId),
            subTopics: selectedTopics.flatMap(t => t.subTopics.map(st => st.id))
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
        selectedTopics: selectedTopics.length,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : 'Failed to start practice');
      setLoading(false);
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
              checked={selectedTopics.some(t => t.id === topic.id)}
              onChange={e => {
                if (e.target.checked) {
                  setSelectedTopics([...selectedTopics, topic]);
                } else {
                  setSelectedTopics(selectedTopics.filter(t => t.id !== topic.id));
                }
              }}
            >
              {topic.name}
            </Checkbox>
          </List.Item>
        )}
      />
    </Modal>
  );
}; 