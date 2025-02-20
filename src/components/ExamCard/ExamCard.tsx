import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert } from 'antd';
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

export const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const navigate = useNavigate();
  const { startPrep, getPrep } = useStudentPrep();
  const [isTopicsDialogOpen, setIsTopicsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Calculate topic and subtopic counts
  const topicCount = exam.topics?.length || 0;
  const subtopicCount = exam.topics?.reduce((sum, topic) => sum + (topic.subTopics?.length || 0), 0) || 0;

  // Extract exam code from description (format: "CODE - Full Name")
  const examCode = exam.description.split(' - ')[0];

  const handleStartPractice = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (!exam || loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting practice session...');
      
      // Start the prep and get ID
      const prepId = await startPrep(exam);
      console.log('Prep created with ID:', prepId);
      
      // Small delay to ensure state updates are complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate immediately to practice page and keep loading true
      // The loading state will be handled by the practice page
      navigate(`/practice/${prepId}`, { replace: true });
    } catch (error) {
      console.error('Error starting practice:', {
        error,
        examId: exam.id,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : 'Failed to start practice');
      setLoading(false); // Only reset loading on error
    }
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
          {error && (
            <Alert
              message="שגיאה"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}
          <Button 
            type="primary"
            size="large"
            block
            onClick={handleStartPractice}
            loading={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'מתחיל תרגול...' : 'התחל תרגול מהיר'}
          </Button>
        </div>
      </Card>

      <ExamTopicsDialog
        exam={exam}
        open={isTopicsDialogOpen}
        onClose={() => setIsTopicsDialogOpen(false)}
        startPrep={startPrep}
        getPrep={getPrep}
      />
    </>
  );
}; 