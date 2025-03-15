import React from 'react';
import { Avatar, Button, Dropdown, MenuProps, Space } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  LoginOutlined,
  ControlOutlined 
} from '@ant-design/icons';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types/userTypes';

const UserButton = styled(Button)<{ $isLoggedIn: boolean }>`
  height: 40px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  background: ${props => props.$isLoggedIn ? '#2563eb' : '#ffffff'};
  border-color: ${props => props.$isLoggedIn ? '#2563eb' : '#e2e8f0'};
  color: ${props => props.$isLoggedIn ? '#ffffff' : '#475569'};
  box-shadow: ${props => props.$isLoggedIn 
    ? '0 2px 4px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    : '0 1px 2px rgba(0, 0, 0, 0.05)'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isLoggedIn ? '#1d4ed8' : '#ffffff'};
    border-color: ${props => props.$isLoggedIn ? '#1d4ed8' : '#94a3b8'};
    color: ${props => props.$isLoggedIn ? '#ffffff' : '#475569'};
    transform: translateY(-1px);
    box-shadow: ${props => props.$isLoggedIn
      ? '0 4px 8px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      : '0 4px 6px rgba(0, 0, 0, 0.05)'};
  }

  .anticon {
    font-size: 16px;
    margin-left: 4px;
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
`;

const UserContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
  min-width: max-content;
  height: 40px;
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
  onLoginClick?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  variant = 'base',
  showAvatar = false,
  onLoginClick
}) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    switch (e.key) {
      case 'profile':
        navigate('/profile');
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
        onLoginClick?.();
        break;
    }
  };

  const menuItems: MenuProps['items'] = user ? [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'פרופיל'
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
      icon: <LoginOutlined />,
      label: 'התחברות'
    }
  ];

  const displayName = user ? (
    profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ''}`
      : user.email?.split('@')[0]
  ) : 'אורח';

  return (
    <UserContainer>
      <Dropdown 
        menu={{ items: menuItems, onClick: handleMenuClick }}
        placement="bottomRight"
        trigger={['click']}
      >
        <UserButton $isLoggedIn={!!user}>
          <UserOutlined />
          <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
            <span className="user-name">{displayName}</span>
            {user && profile?.role && (
              <span className="user-role">{getRoleLabel(profile.role as UserRole)}</span>
            )}
          </Space>
        </UserButton>
      </Dropdown>
    </UserContainer>
  );
};

export default UserProfile; 