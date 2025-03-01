import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, DatePicker, Alert, Row, Col, notification } from 'antd';
import { 
  BookOutlined, 
  CalendarOutlined, 
  CheckSquareOutlined,
  MessageOutlined,
  ReadOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import type { Moment } from 'moment';
import type { StudentPrep } from '../../types/prepState';
import { ExamContentDialog } from './ExamContentDialog';
import { PrepStateManager } from '../../services/PrepStateManager';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

interface WelcomeScreenProps {
  onStart: () => void;
  onExamDateChange: (date: Moment) => void;
  prep?: StudentPrep;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  onExamDateChange,
  prep
}) => {
  const { user } = useAuth();
  const [isExamContentDialogOpen, setIsExamContentDialogOpen] = useState(false);
  const [examDate, setExamDate] = useState<Moment | null>(null);

  // Set default exam date for guests (1 month from now)
  useEffect(() => {
    if (!user && !examDate) {
      const defaultDate = moment().add(1, 'month');
      handleExamDateChange(defaultDate);
    }
  }, [user]);

  const handleExamDateChange = (date: Moment | null) => {
    if (date && prep) {
      setExamDate(date);
      onExamDateChange(date);

      // Update prep with new exam date
      const updatedPrep: StudentPrep = {
        ...prep,
        goals: {
          ...prep.goals,
          examDate: date.valueOf()
        }
      };
      
      // Save to storage using PrepStateManager
      PrepStateManager.updatePrep(updatedPrep);

      // Show success notification only for logged-in users
      if (user) {
        notification.success({
          message: 'תאריך הבחינה עודכן',
          description: `תאריך הבחינה נקבע ל-${date.format('DD/MM/YYYY')}`,
          placement: 'topLeft',
          duration: 3,
        });
      }
    }
  };

  // Calculate total topics and subtopics
  const totalTopics = prep?.exam.topics.length || 0;
  const totalSubtopics = prep?.exam.topics.reduce((acc, topic) => acc + topic.subTopics.length, 0) || 0;

  return (
    <Card
      style={{
        maxWidth: '800px',
        margin: '32px auto',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Welcome Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ 
            marginBottom: '16px',
            background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700
          }}>
            ברוכים הבאים לאיזיפס
          </Title>
          <Paragraph style={{ 
            fontSize: '16px', 
            color: '#4B5563',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            המערכת תתאים את התרגול באופן אישי להתקדמות שלך לקראת הצלחה בבחינה
          </Paragraph>
        </div>

        {/* Setup Steps */}
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Exam Date Selection - Only show for logged-in users */}
          {user && (
            <Card
              size="small"
              style={{ 
                borderRadius: '8px', 
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s'
              }}
              hoverable
            >
              <Space align="start">
                <CalendarOutlined style={{ fontSize: '24px', color: '#3B82F6' }} />
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    תאריך הבחינה
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                    בחר את תאריך הבחינה כדי שנוכל לתכנן את קצב הלמידה המתאים
                  </Text>
                  <DatePicker
                    onChange={handleExamDateChange}
                    style={{ width: '200px' }}
                    placeholder="בחר תאריך"
                    disabledDate={(current) => {
                      // Can't select days before today
                      return current && current.isBefore(moment().startOf('day'));
                    }}
                  />
                </div>
              </Space>
            </Card>
          )}

          {/* Exam Content */}
          <Card
            size="small"
            style={{ 
              borderRadius: '8px', 
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              transition: 'all 0.2s'
            }}
            hoverable
          >
            <Space align="start">
              <BookOutlined style={{ fontSize: '24px', color: '#3B82F6' }} />
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  תוכן הבחינה
                </Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                  תוכן הבחינה כולל כרגע את כל {totalTopics} הנושאים ו-{totalSubtopics} תתי הנושאים
                  <br />
                  ניתן להסיר נושאים שאינם כלולים בבחינה שלך
                </Text>
                <Button 
                  type="default"
                  onClick={() => setIsExamContentDialogOpen(true)}
                  icon={<CheckSquareOutlined />}
                >
                  הגדר תכולת בחינה
                </Button>
              </div>
            </Space>
          </Card>
        </Space>

        {/* Features Preview */}
        <Card
          size="small"
          style={{ 
            borderRadius: '8px', 
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD'
          }}
        >
          <Title level={5} style={{ marginBottom: '24px', color: '#0369A1', textAlign: 'center' }}>
            מה מחכה לך בהמשך?
          </Title>
          <Row gutter={[24, 32]}>
            <Col span={8}>
              <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                <MessageOutlined style={{ color: '#0EA5E9', fontSize: '28px' }} />
                <Text strong style={{ fontSize: '16px', marginTop: '8px' }}>פידבק אישי</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  משוב מפורט על כל שאלה עם הנחיות לשיפור
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                <ReadOutlined style={{ color: '#0EA5E9', fontSize: '28px' }} />
                <Text strong style={{ fontSize: '16px', marginTop: '8px' }}>חומר לימוד רלוונטי</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  חומר לימוד מותאם לשאלות התרגול ולקשיים שלך
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                <QuestionCircleOutlined style={{ color: '#0EA5E9', fontSize: '28px' }} />
                <Text strong style={{ fontSize: '16px', marginTop: '8px' }}>עזרה אישית</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  סיוע מותאם להתמודדות עם כל שאלה
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Start Button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button
            type="primary"
            size="large"
            onClick={onStart}
            disabled={!examDate}
            style={{ 
              height: '48px', 
              padding: '0 32px',
              fontSize: '16px',
              borderRadius: '8px',
              background: examDate ? 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)' : '#E5E7EB',
              border: 'none',
              boxShadow: examDate ? '0 4px 6px -1px rgba(59, 130, 246, 0.5)' : 'none',
              color: examDate ? '#ffffff' : '#9CA3AF',
              cursor: examDate ? 'pointer' : 'not-allowed',
              opacity: examDate ? 1 : 0.8,
              transition: 'all 0.2s'
            }}
          >
            התחל לתרגל
          </Button>
          {!examDate && user && (
            <Alert
              message="יש לבחור תאריך בחינה לפני תחילת התרגול"
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}
        </div>
      </Space>

      {/* Exam Content Dialog */}
      {prep && (
        <ExamContentDialog
          exam={prep.exam}
          open={isExamContentDialogOpen}
          onClose={() => setIsExamContentDialogOpen(false)}
          prepId={prep.id}
        />
      )}
    </Card>
  );
};

export default WelcomeScreen; 