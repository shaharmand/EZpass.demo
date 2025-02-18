import React, { useState } from 'react';
import { Card, Button, Typography, Space, Tag } from 'antd';
import { 
  ExpandAltOutlined, 
  RightOutlined,
  BookOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { FormalExam } from '../../types/shared/exam';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import './ExamCard.css';

const { Title, Text } = Typography;

interface ExamCardProps {
  exam: FormalExam;
  onStartExam?: (exam: FormalExam) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam, onStartExam }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { createPrep } = useStudentPrep();

  const topicsCount = exam.topics.length;
  const subtopicsCount = exam.topics.reduce((count, topic) => 
    count + (Array.isArray(topic.subtopics) ? topic.subtopics.length : 0), 
    0
  );

  const handleStartExam = async () => {
    try {
      // Create a new prep instance
      const prep = await createPrep({
        formalExam: exam,
        // Other fields will use defaults
      });

      // Call the parent's onStartExam if provided
      if (onStartExam) {
        onStartExam(exam);
      }
    } catch (error) {
      console.error('Failed to start exam:', error);
    }
  };

  return (
    <Card 
      className="exam-card"
      hoverable
      style={{ 
        borderRadius: '12px',
        overflow: 'hidden',
        height: showDetails ? 'auto' : '140px'
      }}
    >
      {/* Main content */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div style={{ flex: 1 }}>
          <Title 
            level={4} 
            style={{ 
              margin: 0,
              marginBottom: '8px',
              fontSize: '1.1rem',
              color: '#1f2937'
            }}
          >
            {exam.names.elaborate}
          </Title>
          
          <Space size={[0, 8]} wrap style={{ marginBottom: '12px' }}>
            <Tag color="blue" style={{ marginRight: '8px' }}>
              <BookOutlined /> {exam.subject.name}
            </Tag>
            {exam.metadata?.timeLimit && (
              <Tag color="green">
                <ClockCircleOutlined /> {exam.metadata.timeLimit} דקות
              </Tag>
            )}
            {exam.metadata?.questionCount && (
              <Tag color="purple">
                <CheckCircleOutlined /> {exam.metadata.questionCount} שאלות
              </Tag>
            )}
          </Space>

          <div style={{ 
            fontSize: '0.9rem',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{topicsCount} נושאים</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span>{subtopicsCount} תתי-נושאים</span>
          </div>
        </div>

        <Space direction="vertical" align="end" size={8}>
          <Button 
            type="primary"
            onClick={handleStartExam}
            style={{
              backgroundColor: '#2563eb',
              borderColor: '#2563eb',
              borderRadius: '6px',
              height: '36px',
              padding: '0 16px'
            }}
          >
            התחל תרגול
          </Button>
          
          <Button
            type="text"
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            style={{
              color: '#6b7280',
              padding: '4px 8px',
              height: 'auto',
              fontSize: '0.9rem'
            }}
            icon={showDetails ? <ExpandAltOutlined /> : <RightOutlined />}
          >
            {showDetails ? 'הסתר פרטים' : 'הצג פרטים'}
          </Button>
        </Space>
      </div>

      {/* Expandable details */}
      {showDetails && (
        <div style={{ 
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <Title level={5} style={{ marginBottom: '12px' }}>נושאי לימוד</Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {exam.topics.map((topic, index) => (
              <div key={index}>
                <Text strong>{topic.name}</Text>
                {topic.subtopics && topic.subtopics.length > 0 && (
                  <div style={{ 
                    marginTop: '4px',
                    marginRight: '16px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    {topic.subtopics.map((subtopic, subIndex) => (
                      <Tag 
                        key={subIndex}
                        style={{ 
                          marginRight: 0,
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#4b5563'
                        }}
                      >
                        {typeof subtopic === 'string' ? subtopic : subtopic.name}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}; 