// TODO: This will be the main marketing/SEO-optimized landing page
// Features to implement:
// - Value proposition for exam preparation
// - Benefits of using the system
// - User testimonials
// - Call to action for registration
// - SEO optimization
// - Lightweight implementation

import React from 'react';
import { Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: '48px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center' 
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title>EZpass - הדרך הקלה להצלחה במבחנים</Title>
        <Paragraph style={{ fontSize: '1.2rem' }}>
          מערכת חכמה להכנה למבחנים, כולל בגרויות ומבחני מה"ט
        </Paragraph>
        
        <Space>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/dashboard')}
          >
            התחל להתכונן עכשיו
          </Button>
          <Button 
            size="large"
            onClick={() => navigate('/safety-courses')}
          >
            קורסי בטיחות
          </Button>
        </Space>
      </Space>
    </div>
  );
};

export default LandingPage; 