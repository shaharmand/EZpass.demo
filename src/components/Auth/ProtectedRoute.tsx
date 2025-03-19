import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Result, Button } from 'antd';
import { AuthModal } from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Allow guest access to practice routes
  const isPracticeRoute = location.pathname.startsWith('/practice');
  const isHomePage = location.pathname === '/' || location.pathname === '' || location.pathname === '/home';
  
  // If auth is not required or it's a practice route, allow access
  if (!requireAuth || isPracticeRoute) {
    return <>{children}</>;
  }

  // For home page, just show the children without redirecting
  if (isHomePage) {
    return <>{children}</>;
  }

  // For other routes, require authentication
  if (!user) {
    // Save the attempted path to redirect back after auth
    localStorage.setItem('returnUrl', location.pathname);
    
    // Instead of redirecting, show a login prompt
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '20px',
        direction: 'rtl'
      }}>
        <Result
          status="warning"
          title="נדרשת התחברות"
          subTitle="עליך להתחבר כדי לגשת לדף זה"
          extra={
            <Button type="primary" onClick={() => setIsAuthModalOpen(true)}>
              התחבר
            </Button>
          }
        />
        <AuthModal
          open={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  // Allow access to all authenticated routes without role checks
  return <>{children}</>;
} 