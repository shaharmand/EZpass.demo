import React from 'react';
import { SimpleHeader } from '../components/layout/SimpleHeader';
import styled from 'styled-components';
import { Card, Typography } from 'antd';
import { BookOutlined, SafetyCertificateOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 64px; // Account for fixed header
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
  text-align: center;
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 48px;
`;

const StyledCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .ant-card-body {
    width: 100%;
  }

  .icon-container {
    font-size: 48px;
    margin-bottom: 16px;
    color: #2563eb;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #f0f7ff;
    margin: 0 auto 16px;
  }
`;

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    {
      title: 'בגרות',
      description: 'מתמטיקה, פיזיקה, מחשבים',
      icon: <BookOutlined />,
      path: '/library/bagrut'
    },
    {
      title: 'מה"ט',
      description: 'הנדסה תוכנה, הנדסת אזרחית',
      icon: <SafetyCertificateOutlined />,
      path: '/library/mahat'
    },
    {
      title: 'בחינות',
      description: 'מנהל עבודה, מכונות בטיחות, קבלן שיפוצים',
      icon: <ToolOutlined />,
      path: '/library/exams'
    }
  ];

  return (
    <>
      <SimpleHeader />
      <PageContainer>
        <ContentContainer>
          <Title level={1}>בחר בחינה והתחל להתרגל עכשיו.</Title>
          <Text style={{ fontSize: '18px', color: '#475569' }}>
            פשוט להצליח עם אידיפרפ - מערכת תרגול חכמה לבחינות
          </Text>

          <CardsContainer>
            {categories.map((category) => (
              <StyledCard 
                key={category.title}
                onClick={() => navigate(category.path)}
                bordered={false}
              >
                <div className="icon-container">
                  {category.icon}
                </div>
                <Title level={3}>{category.title}</Title>
                <Text>{category.description}</Text>
              </StyledCard>
            ))}
          </CardsContainer>
        </ContentContainer>
      </PageContainer>
    </>
  );
}; 