import React from 'react';
import { Button, Dropdown, Space, Typography, notification } from 'antd';
import { UserOutlined, LoginOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../Auth/AuthModal';
import type { MenuProps } from 'antd';

const { Text } = Typography;

// Consistent color scheme
const colors = {
  background: {
    header: '#ffffff',
    metrics: '#f8fafc',
    highlight: '#f0f7ff'
  },
  border: {
    light: '#e5e7eb',
    separator: '#f0f0f0'
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    brand: '#3b82f6'
  },
  icon: {
    left: '#ff9800',
    right: '#3b82f6'
  }
};

interface BaseHeaderProps {
  children?: React.ReactNode;
  showMetricsRow?: boolean;
  metricsContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  pageTitle?: string;
  leftContent?: React.ReactNode;
  variant?: 'practice' | 'admin' | 'default';
  topRowContent?: React.ReactNode;
}

export const BaseHeader: React.FC<BaseHeaderProps> = ({
  children,
  showMetricsRow = false,
  metricsContent,
  centerContent,
  rightContent,
  pageTitle,
  leftContent,
  variant = 'default',
  topRowContent
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const headerStyle = {
    container: {
      backgroundColor: colors.background.header,
      width: '100%',
      position: 'sticky' as const,
      top: 0,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column' as const,
      minHeight: 'fit-content',
      overflow: 'visible',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    content: {
      maxWidth: '1600px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'visible'
    },
    topRow: {
      padding: '12px 40px',
      display: 'grid',
      gridTemplateColumns: 'auto minmax(auto, 1fr) auto',
      alignItems: 'center',
      gap: '32px',
      backgroundColor: colors.background.header,
      minHeight: '64px',
      borderBottom: `1px solid ${colors.border.separator}`,
    },
    pageContent: {
      backgroundColor: colors.background.header,
      borderBottom: `1px solid ${colors.border.light}`,
      padding: '12px 40px',
      minHeight: '64px',
    },
    practiceContent: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: '24px',
      alignItems: 'center',
    },
    adminContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metricsRow: {
      padding: '16px 40px',
      backgroundColor: colors.background.metrics,
      borderBottom: `1px solid ${colors.border.light}`,
      minHeight: '64px',
    },
    practiceMetrics: {
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      gap: '24px',
      alignItems: 'center',
    },
    adminMetrics: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '24px',
    },
    metricsGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      justifyContent: 'center'
    },
    metricItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: colors.background.header,
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      minWidth: '200px'
    },
    pageTitle: {
      fontSize: '15px',
      color: colors.text.secondary,
      fontWeight: 500,
      margin: 0,
      padding: '0 24px',
      borderLeft: `1px solid ${colors.border.separator}`,
      whiteSpace: 'nowrap' as const,
      height: '40px',
      display: 'flex',
      alignItems: 'center'
    }
  };

  const getContentStyle = () => {
    const baseStyle = headerStyle.pageContent;
    switch (variant) {
      case 'practice':
        return { ...baseStyle, ...headerStyle.practiceContent };
      case 'admin':
        return { ...baseStyle, ...headerStyle.adminContent };
      default:
        return baseStyle;
    }
  };

  const getMetricsStyle = () => {
    const baseStyle = headerStyle.metricsRow;
    switch (variant) {
      case 'practice':
        return { ...baseStyle, ...headerStyle.practiceMetrics };
      case 'admin':
        return { ...baseStyle, ...headerStyle.adminMetrics };
      default:
        return baseStyle;
    }
  };

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    if (e.key === 'login') {
      setShowAuthModal(true);
    } else if (e.key === 'logout') {
      try {
        await signOut();
        notification.success({
          message: 'התנתקת בהצלחה',
          description: 'להתראות!',
          placement: 'topLeft',
        });
      } catch (error) {
        notification.error({
          message: 'שגיאה בהתנתקות',
          description: 'אנא נסה שוב',
          placement: 'topLeft',
        });
      }
    } else if (e.key === 'profile') {
      navigate('/profile');
    }
  };

  const userMenuItems = [
    ...(user ? [
      {
        key: 'profile',
        label: 'פרופיל',
        icon: <UserOutlined />,
      },
      {
        key: 'logout',
        label: 'התנתק',
        icon: <LoginOutlined />,
        danger: true,
      }
    ] : [
      {
        key: 'login',
        label: 'התחברות',
        icon: <LoginOutlined />,
      }
    ])
  ];

  return (
    <>
      <div style={headerStyle.container}>
        <div style={headerStyle.content}>
          <div style={headerStyle.topRow}>
            {/* Logo Section */}
            <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
              <div style={headerStyle.logo}>
                <motion.div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/')}
                >
                  <motion.img
                    src="/EZpass_A6_cut.png"
                    alt="איזיפס - פשוט להצליח"
                    style={{
                      height: '36px',
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    style={{
                      height: '32px',
                      borderRight: '2px solid #e5e7eb',
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Text style={{ 
                      fontSize: '16px',
                      color: '#ff9800',
                      fontWeight: 500,
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                      marginRight: '8px'
                    }}>
                      פשוט להצליח
                    </Text>
                  </motion.div>
                </motion.div>
              </div>
              
              {pageTitle && (
                <Text style={headerStyle.pageTitle}>
                  {pageTitle}
                </Text>
              )}
            </div>

            {/* Page-Specific Top Row Content */}
            {topRowContent && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minWidth: 0,
                height: '40px'
              }}>
                {topRowContent}
              </div>
            )}

            {/* User Section */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              justifyContent: 'flex-end',
              minWidth: 'max-content',
              height: '40px'
            }}>
              <Dropdown 
                menu={{ items: userMenuItems, onClick: handleMenuClick }} 
                placement="bottomRight"
                trigger={['click']}
              >
                <Button 
                  type={user ? 'primary' : 'default'}
                  icon={
                    <UserOutlined style={{ 
                      fontSize: '16px',
                      marginLeft: '4px'
                    }} />
                  }
                  style={{
                    height: '40px',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    borderRadius: '20px',
                    background: user ? '#2563eb' : '#ffffff',
                    borderColor: user ? '#2563eb' : '#e2e8f0',
                    color: user ? '#ffffff' : '#475569',
                    boxShadow: user 
                      ? '0 2px 4px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                      : '0 1px 2px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (user) {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                      e.currentTarget.style.borderColor = '#1d4ed8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    } else {
                      e.currentTarget.style.borderColor = '#94a3b8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (user) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    } else {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  {user?.email ? user.email.split('@')[0] : 'אורח'}
                </Button>
              </Dropdown>
            </div>
          </div>

          {/* Page Content Row */}
          {(centerContent || rightContent || leftContent) && (
            <div style={getContentStyle()}>
              {leftContent && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {leftContent}
                </div>
              )}
              {centerContent && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: variant === 'admin' ? '1' : undefined
                }}>
                  {centerContent}
                </div>
              )}
              {rightContent && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  justifyContent: variant === 'admin' ? 'flex-end' : undefined
                }}>
                  {rightContent}
                </div>
              )}
            </div>
          )}

          {/* Metrics Row */}
          {showMetricsRow && metricsContent && (
            <div style={getMetricsStyle()}>
              {variant === 'practice' ? (
                <>
                  <div style={headerStyle.metricsGroup}>
                    {/* Left metrics */}
                  </div>
                  <div style={headerStyle.metricsGroup}>
                    {metricsContent}
                  </div>
                  <div style={headerStyle.metricsGroup}>
                    {/* Right metrics */}
                  </div>
                </>
              ) : (
                metricsContent
              )}
            </div>
          )}

          {/* Additional Content */}
          {children}
        </div>
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        returnUrl={window.location.pathname}
      />
    </>
  );
}; 