import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Result, Button, Space } from 'antd';
import styled from 'styled-components';
import { AuthModal } from './AuthModal';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
  direction: rtl;
`;

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isHomePage = location.pathname === '/' || location.pathname === '' || location.pathname === '/home';

  // If we're on the home page, just render the children regardless of auth state
  if (isHomePage) {
    return <>{children}</>;
  }

  // Store the attempted URL for redirecting after login
  if (!user) {
    localStorage.setItem('returnUrl', location.pathname);
  }

  if (!user) {
    return (
      <Container>
        <Result
          status="warning"
          title="נדרשת התחברות"
          subTitle="עליך להתחבר כדי לגשת לדף זה"
          extra={
            <Space>
              <Button type="primary" onClick={() => setIsAuthModalOpen(true)}>
                התחבר
              </Button>
              <Button onClick={() => navigate('/')}>
                חזור לדף הבית
              </Button>
            </Space>
          }
        />
        <AuthModal
          open={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </Container>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <Container>
        <Result
          status="403"
          title="אין לך הרשאות גישה"
          subTitle={`משתמש ${profile?.first_name || ''} אינו מורשה לגשת לאזור זה`}
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              חזור לדף הבית
            </Button>
          }
        />
      </Container>
    );
  }

  return <>{children}</>;
}; 