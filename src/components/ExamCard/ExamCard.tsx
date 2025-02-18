import React, { useState } from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { 
  InfoCircleOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import type { FormalExam } from '../../types/shared/exam';
import { ExamTopicsDialog } from './ExamTopicsDialog';
import './ExamCard.css';

const { Title, Text } = Typography;

interface ExamCardProps {
  exam: FormalExam;
  onStartExam?: (exam: FormalExam) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({ 
  exam, 
  onStartExam
}) => {
  const [isTopicsDialogOpen, setIsTopicsDialogOpen] = useState(false);
  
  // Calculate topic and subtopic counts
  const topicCount = exam.topics?.length || 0;
  const subtopicCount = exam.topics?.reduce((sum, topic) => sum + (topic.subTopics?.length || 0), 0) || 0;

  // Extract exam code from description (format: "CODE - Full Name")
  const examCode = exam.description.split(' - ')[0];

  return (
    <>
      <Card 
        className="exam-card"
        hoverable
        style={{ 
          borderRadius: '12px',
          overflow: 'hidden',
        }}
        onClick={() => setIsTopicsDialogOpen(true)}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Header with title and code */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div>
              <Title 
                level={4} 
                style={{ 
                  margin: 0,
                  marginBottom: '4px',
                  fontSize: '1.1rem',
                  color: '#1f2937'
                }}
              >
                {exam.names.short}
              </Title>
              <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                קוד: {examCode}
              </Text>
            </div>

            <Button 
              type="text"
              icon={<InfoCircleOutlined style={{ 
                fontSize: '20px', 
                color: '#1890ff'
              }} />}
              onClick={(e) => {
                e.stopPropagation();
                setIsTopicsDialogOpen(true);
              }}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.3s'
              }}
              className="info-button"
            />
          </div>

          {/* Topics count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOutlined style={{ color: '#6b7280' }} />
            <Text>
              {topicCount} נושאים ({subtopicCount} תתי-נושאים)
            </Text>
          </div>

          {/* Start Practice Button */}
          <Button 
            type="primary"
            size="large"
            block
            onClick={() => onStartExam?.(exam)}
            style={{ marginTop: '8px' }}
          >
            התחל תרגול
          </Button>
        </div>
      </Card>

      {/* Topics Dialog */}
      <ExamTopicsDialog
        exam={exam}
        open={isTopicsDialogOpen}
        onClose={() => setIsTopicsDialogOpen(false)}
        onStartPractice={() => onStartExam?.(exam)}
      />
    </>
  );
}; 