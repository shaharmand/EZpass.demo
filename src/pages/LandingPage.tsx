// TODO: This will be the main marketing/SEO-optimized landing page
// Features to implement:
// - Value proposition for exam preparation
// - Benefits of using the system
// - User testimonials
// - Call to action for registration
// - SEO optimization
// - Lightweight implementation

import React from 'react';
import { Button, Typography, Space, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExperimentOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div style={{ 
      padding: '48px 24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Development Tools Section */}
        {isDevelopment && (
          <div style={{ marginBottom: '48px', textAlign: 'left' }}>
            <Title level={2} style={{ 
              marginBottom: '24px',
              color: '#1f2937',
              fontSize: '1.5rem'
            }}>
              Development Tools
            </Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button 
                    type="primary"
                    icon={<ExperimentOutlined />}
                    onClick={() => navigate('/test/generation')}
                    size="large"
                    style={{
                      height: 'auto',
                      padding: '12px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Question Generation Test
                  </Button>
                  <Button 
                    type="primary"
                    icon={<ExperimentOutlined />}
                    onClick={() => navigate('/test/practice-flow')}
                    size="large"
                    style={{
                      height: 'auto',
                      padding: '12px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Practice Flow Test
                  </Button>
                </Space>
              </Card>
            </Space>
          </div>
        )}

        {/* Main Landing Content */}
        <div style={{ textAlign: 'center' }}>
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
        </div>
      </Space>
    </div>
  );
};

export default LandingPage; 