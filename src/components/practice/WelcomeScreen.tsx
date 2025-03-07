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
import styles from './WelcomeScreen.module.css';

const { Title, Text, Paragraph } = Typography;

interface WelcomeScreenProps {
  onStart: () => void;
  onExamDateChange: (date: Moment) => void;
  prep?: StudentPrep;
}

const startButtonStyle = {
  height: '64px', 
  padding: '0 48px',
  fontSize: '24px',
  borderRadius: '32px',
  background: 'linear-gradient(90deg, #4287f5 0%, #5b9aff 100%)',
  border: 'none',
  boxShadow: '0 8px 20px rgba(66, 135, 245, 0.25)',
  color: '#ffffff',
  cursor: 'pointer',
  opacity: 1,
  transition: 'all 0.3s',
  fontWeight: 600
};

const disabledButtonStyle = {
  ...startButtonStyle,
  background: '#E5E7EB',
  boxShadow: 'none',
  color: '#9CA3AF',
  cursor: 'not-allowed',
  opacity: 0.8
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  onExamDateChange,
  prep
}) => {
  const { user } = useAuth();
  const [isExamContentDialogOpen, setIsExamContentDialogOpen] = useState(false);
  const [examDate, setExamDate] = useState<Moment | null>(moment().add(1, 'month'));

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
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        padding: '32px 24px'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Main Welcome Message */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={1} style={{ 
            marginBottom: '20px',
            background: 'linear-gradient(90deg, #4287f5 0%, #5b9aff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            fontSize: '36px',
            lineHeight: 1.3
          }}>
            איזיפס תכין אותך להצלחה במבחן
          </Title>
          <Paragraph style={{ 
            fontSize: '18px', 
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: 1.6
          }}>
            מערכת שמתאימה את התרגול בדיוק בשבילך, עם ליווי אישי בכל שלב
          </Paragraph>
          
          {/* Start Button - Moved here */}
          <Button
            type="primary"
            size="large"
            onClick={onStart}
            disabled={!examDate}
            style={examDate ? startButtonStyle : disabledButtonStyle}
            className={examDate ? styles['start-button'] : ''}
          >
            התחל לתרגל עכשיו
          </Button>
        </div>

        {/* Setup Steps */}
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Exam Content - Temporarily hidden
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
          */}
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
                <Text strong style={{ fontSize: '16px', marginTop: '8px' }}>התאמה אישית</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  בחירת שאלות מותאמות אישית ומעקב אחר ההתקדמות שלך
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                <ReadOutlined style={{ color: '#0EA5E9', fontSize: '28px' }} />
                <Text strong style={{ fontSize: '16px', marginTop: '8px' }}>משוב מיידי</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  פידבק מפורט וחומרי לימוד רלוונטיים לכל שאלה
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                <QuestionCircleOutlined style={{ color: '#0EA5E9', fontSize: '28px' }} />
                <Text strong style={{ fontSize: '16px', marginTop: '8px' }}>עזרה זמינה</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  תמיכה מיידית והכוונה בכל שלב בדרך
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>
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