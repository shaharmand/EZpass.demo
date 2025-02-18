import React, { useState } from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  InfoCircleOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import type { FormalExam } from '../../types/shared/exam';
import { ExamTopicsDialog } from './ExamTopicsDialog';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import './ExamCard.css';

const { Title, Text } = Typography;

interface ExamCardProps {
  exam: FormalExam;
}

export const ExamCard: React.FC<ExamCardProps> = ({ 
  exam
}) => {
  const navigate = useNavigate();
  const { setActivePrep } = useStudentPrep();
  const [isTopicsDialogOpen, setIsTopicsDialogOpen] = useState(false);
  
  // Calculate topic and subtopic counts
  const topicCount = exam.topics?.length || 0;
  const subtopicCount = exam.topics?.reduce((sum, topic) => sum + (topic.subTopics?.length || 0), 0) || 0;

  // Extract exam code from description (format: "CODE - Full Name")
  const examCode = exam.description.split(' - ')[0];

  const handleStartPractice = () => {
    // Create a new prep instance with all topics
    const prepId = `prep_${exam.id}_${Date.now()}`;
    const prep = {
      id: prepId,
      exam,
      selectedTopics: exam.topics?.flatMap(topic => topic.subTopics.map(st => st.code)) || [],
      difficulty: 3, // Default difficulty
      status: 'not_started' as const,
      startTime: Date.now(),
    };
    
    // Set active prep and navigate to practice page
    setActivePrep(prep);
    navigate(`/practice/${prepId}`);
  };

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
            onClick={(e) => {
              e.stopPropagation();
              handleStartPractice();
            }}
            style={{ marginTop: '8px' }}
          >
            התחל תרגול מהיר
          </Button>
        </div>
      </Card>

      {/* Topics Dialog */}
      <ExamTopicsDialog
        exam={exam}
        open={isTopicsDialogOpen}
        onClose={() => setIsTopicsDialogOpen(false)}
      />
    </>
  );
}; 