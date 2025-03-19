import React, { useState } from 'react';
import { Avatar, Button, Dropdown, MenuProps, Space } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  GoogleOutlined,
  ControlOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types/userTypes';
import { AuthModal } from '../Auth/AuthModal';

const UserButton = styled(Button)<{ $isLoggedIn: boolean }>`
  height: 36px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 18px;
  background: ${props => props.$isLoggedIn ? '#2563eb' : '#ffffff'};
  border-color: ${props => props.$isLoggedIn ? '#2563eb' : '#e2e8f0'};
  color: ${props => props.$isLoggedIn ? '#ffffff' : '#475569'};
  box-shadow: ${props => props.$isLoggedIn 
    ? '0 2px 4px rgba(37, 99, 235, 0.15)'
    : '0 1px 2px rgba(0, 0, 0, 0.05)'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: ${props => props.$isLoggedIn ? '#1d4ed8' : '#f0f9ff'};
    border-color: ${props => props.$isLoggedIn ? '#1d4ed8' : '#60a5fa'};
    color: ${props => props.$isLoggedIn ? '#ffffff' : '#2563eb'};
    transform: translateY(-2px);
    box-shadow: ${props => props.$isLoggedIn
      ? '0 8px 12px rgba(37, 99, 235, 0.2), 0 4px 6px rgba(37, 99, 235, 0.1)'
      : '0 4px 6px -1px rgba(37, 99, 235, 0.1)'};
  }

  &:active {
    transform: translateY(0);
    background: ${props => props.$isLoggedIn ? '#1d4ed8' : '#e0f2fe'};
    border-color: ${props => props.$isLoggedIn ? '#1d4ed8' : '#3b82f6'};
    box-shadow: ${props => props.$isLoggedIn
      ? '0 2px 4px rgba(37, 99, 235, 0.15)'
      : '0 2px 4px -2px rgba(37, 99, 235, 0.05)'};
  }

  .anticon {
    font-size: 16px;
    margin-left: 4px;
    color: ${props => props.$isLoggedIn ? '#ffffff' : 'inherit'};
  }

  .user-name {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-role {
    font-size: 12px;
    opacity: 0.8;
  }

  .guest-text {
    color: #64748b;
    font-size: 12px;
    transition: color 0.3s ease;
  }

  &:hover .guest-text {
    color: #2563eb;
  }
`;

const UserContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
  min-width: max-content;
  height: 100%;
`;

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'מנהל';
    case UserRole.TEACHER:
      return 'מורה';
    case UserRole.STUDENT:
      return 'תלמיד';
    default:
      return role;
  }
};

export interface UserProfileProps {
  variant?: 'admin' | 'base';
  showAvatar?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  variant = 'base',
  showAvatar = false
}) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    switch (e.key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'submissions':
        navigate('/user/submissions');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'logout':
        try {
          await signOut();
          navigate('/');
        } catch (error) {
          console.error('Error signing out:', error);
        }
        break;
      case 'login':
        setIsLoginModalOpen(true);
        break;
      case 'signup':
        setIsLoginModalOpen(true);
        break;
    }
  };

  const menuItems: MenuProps['items'] = user ? [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'פרופיל'
    },
    {
      key: 'submissions',
      icon: <HistoryOutlined />,
      label: 'היסטוריית תשובות',
    },
    ...(profile?.role === UserRole.ADMIN ? [
      { type: 'divider' as const },
      {
        key: 'admin',
        icon: <ControlOutlined />,
        label: 'ניהול מערכת',
        style: { color: '#1890ff' }
      }
    ] : []),
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'התנתק',
      danger: true
    }
  ] : [
    {
      key: 'login',
      icon: <GoogleOutlined />,
      label: 'התחבר'
    }
  ];

  const displayName = user ? (
    profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ''}`
      : user.email?.split('@')[0]
  ) : 'אורח';

  return (
    <UserContainer>
      {user ? (
        <Dropdown 
          menu={{ items: menuItems, onClick: handleMenuClick }}
          placement="bottomRight"
          trigger={['click']}
        >
          <UserButton $isLoggedIn={true}>
            <UserOutlined />
            <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
              <span className="user-name">{displayName}</span>
              {profile?.role && (
                <span className="user-role">{getRoleLabel(profile.role as UserRole)}</span>
              )}
            </Space>
          </UserButton>
        </Dropdown>
      ) : (
        <UserButton $isLoggedIn={false} onClick={() => setIsLoginModalOpen(true)}>
          <UserOutlined />
          <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
            <span className="user-name">אורח</span>
            <span className="guest-text">התחבר</span>
          </Space>
        </UserButton>
      )}

      <AuthModal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        returnUrl={window.location.pathname}
      />
    </UserContainer>
  );
};

export default UserProfile; 