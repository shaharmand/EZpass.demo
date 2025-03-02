import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  InfoCircleOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import type { ExamTemplate } from '../../types/examTemplate';
import { ExamTopicsDialog } from './ExamTopicsDialog';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import './ExamCard.css';
import { QuestionType } from '../../types/question';

const { Title, Text } = Typography;

interface ExamCardProps {
  exam: ExamTemplate;
}

const colors = {
  icon: {
    left: '#ff9800',
    right: '#3b82f6'
  },
  text: {
    primary: '#1f2937',
    secondary: '#64748b'
  },
  button: {
    primary: {
      background: '#3b82f6',
      hover: '#2563eb',
      text: '#ffffff'
    }
  }
};

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
  const examCode = exam.code;

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
          background: '#F7F9FC',
          border: '1px solid #e5e7eb'
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
                  color: colors.text.primary
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
                color: '#1e40af'
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
            <FolderOutlined style={{ color: colors.text.secondary }} />
            <Text>
              {topicCount} נושאים ({subtopicCount} תתי-נושאים)
            </Text>
          </div>

          {/* Question Types */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {exam.allowedQuestionTypes.map((type) => (
              <div
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: type === 'open' ? 'rgba(16, 185, 129, 0.1)' :
                            type === 'multiple_choice' ? 'rgba(99, 102, 241, 0.1)' :
                            type === QuestionType.NUMERICAL ? 'rgba(245, 158, 11, 0.1)' :
                            'rgba(236, 72, 153, 0.1)',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}
              >
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: type === 'open' ? '#10b981' :
                             type === 'multiple_choice' ? '#6366f1' :
                             type === QuestionType.NUMERICAL ? '#f59e0b' :
                             '#ec4899'
                }} />
                <Text style={{ 
                  color: type === 'open' ? '#065f46' :
                          type === 'multiple_choice' ? '#3730a3' :
                          type === QuestionType.NUMERICAL ? '#92400e' :
                          '#831843',
                  fontSize: '14px'
                }}>
                  {type === 'open' ? 'פתוחות' :
                   type === 'multiple_choice' ? 'סגורות' :
                   type === QuestionType.NUMERICAL ? 'חישוביות' :
                   'קוד'}
                </Text>
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message="שגיאה"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {/* Start Practice Button */}
          <Button 
            type="primary"
            size="large"
            block
            onClick={handleStartPractice}
            loading={loading}
            className="practice-button"
            style={{ 
              marginTop: '8px',
              height: '48px',
              borderRadius: '24px',
              fontSize: '16px',
              fontWeight: 500,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {loading ? 'מתחיל תרגול...' : 'תרגל עכשיו'}
          </Button>
        </div>
      </Card>

      <ExamTopicsDialog
        exam={exam}
        open={isTopicsDialogOpen}
        onClose={() => setIsTopicsDialogOpen(false)}
      />
    </>
  );
}; 