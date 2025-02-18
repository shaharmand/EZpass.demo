// TODO: This will be the construction safety courses section
// Features to implement:
// - List of available safety courses
// - Course details and requirements
// - Registration process
// - Course materials
// - Progress tracking
// - Certification process

import React from 'react';
import { Typography, Card, Space, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const SafetyCoursesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>קורסי בטיחות בעבודה</Title>
          <Paragraph>
            קורסים מקיפים להכשרה בבטיחות בעבודה, מותאמים לדרישות התקן
          </Paragraph>
        </div>

        <Card title="קורסים זמינים בקרוב">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card type="inner" title="בטיחות בעבודות בנייה">
              <Paragraph>
                קורס מקיף לעובדי בניין, כולל הכשרה בנושאי בטיחות באתר בנייה,
                שימוש בציוד מגן, והתמודדות עם מצבי חירום.
              </Paragraph>
              <Button type="primary" disabled>בקרוב</Button>
            </Card>

            <Card type="inner" title="הכשרת ממוני בטיחות">
              <Paragraph>
                קורס מתקדם להכשרת ממוני בטיחות, כולל היבטים משפטיים,
                ניהול סיכונים, ותכנון תוכניות בטיחות.
              </Paragraph>
              <Button type="primary" disabled>בקרוב</Button>
            </Card>
          </Space>
        </Card>

        <Button 
          onClick={() => navigate('/dashboard')} 
          style={{ alignSelf: 'flex-start' }}
        >
          חזרה לדף הבית
        </Button>
      </Space>
    </div>
  );
};

export default SafetyCoursesPage; 