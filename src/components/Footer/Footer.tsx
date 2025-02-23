import React from 'react';
import { Typography, Space, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer style={{
      background: '#1e293b',
      padding: '48px 24px 32px',
      color: '#ffffff',
      borderTop: '1px solid #334155',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '48px',
          marginBottom: '48px'
        }}>
          {/* Company Info */}
          <div>
            <Title level={4} style={{ color: '#ffffff', marginBottom: '24px' }}>
              איזיפס
            </Title>
            <Text style={{ color: '#94a3b8', display: 'block', marginBottom: '16px' }}>
              מערכת מתקדמת להכנה למבחנים המשלבת טכנולוגיה חדשנית עם שיטות למידה מוכחות
            </Text>
            <Space size="middle">
              <Button type="text" style={{ color: '#ffffff' }}>אודות</Button>
              <Button type="text" style={{ color: '#ffffff' }}>צור קשר</Button>
              <Button type="text" style={{ color: '#ffffff' }}>תנאי שימוש</Button>
            </Space>
          </div>

          {/* Quick Links */}
          <div>
            <Title level={4} style={{ color: '#ffffff', marginBottom: '24px' }}>
              מבחנים
            </Title>
            <Space direction="vertical">
              <Button type="text" style={{ color: '#94a3b8', padding: 0 }} onClick={() => navigate('/dashboard')}>
                מבחני מה״ט
              </Button>
              <Button type="text" style={{ color: '#94a3b8', padding: 0 }} onClick={() => navigate('/safety-courses')}>
                בטיחות בעבודה
              </Button>
              <Button type="text" style={{ color: '#94a3b8', padding: 0 }} onClick={() => navigate('/dashboard')}>
                מבחני הסמכה
              </Button>
            </Space>
          </div>

          {/* Contact Info */}
          <div>
            <Title level={4} style={{ color: '#ffffff', marginBottom: '24px' }}>
              יצירת קשר
            </Title>
            <Space direction="vertical" style={{ color: '#94a3b8' }}>
              <Text style={{ color: '#94a3b8' }}>טלפון: 03-1234567</Text>
              <Text style={{ color: '#94a3b8' }}>דוא״ל: info@easypass.co.il</Text>
              <Text style={{ color: '#94a3b8' }}>כתובת: רחוב הברזל 3, תל אביב</Text>
            </Space>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          borderTop: '1px solid #334155',
          paddingTop: '24px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Text>© 2024 איזיפס - כל הזכויות שמורות</Text>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 