import React from 'react';
import { Layout, Menu, Button, MenuProps } from 'antd';
import { 
  DashboardOutlined,
  BookOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlaySquareOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons/lib/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AdminPageProvider } from '../../contexts/AdminPageContext';
import { AdminPageIdentity } from './AdminPageIdentity';
import { BrandLogo } from '../brand/BrandLogo';
import { UserProfile } from '../user/UserProfile';

const { Sider, Content } = Layout;

const HeaderContainer = styled.div`
  padding: 0;
  background: #fff;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  height: 64px;
`;

const HeaderContent = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  width: 100%;
  padding: 0 16px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PageIdentityArea = styled.div`
  flex: 1;
  padding: 0 24px;
  border-right: 1px solid #f0f0f0;
`;

const UserArea = styled.div`
  padding: 0 24px;
`;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const navigate = useNavigate();

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'לוח בקרה',
      onClick: () => navigate('/admin')
    },
    {
      key: 'questions',
      icon: <BookOutlined />,
      label: 'שאלות',
      onClick: () => navigate('/admin/questions')
    },
    {
      key: 'videos',
      icon: <PlaySquareOutlined />,
      label: 'ספריית וידאו',
      onClick: () => navigate('/admin/videos')
    },
    {
      key: 'safety-courses',
      icon: <SafetyCertificateOutlined />,
      label: 'קורסי בטיחות',
      onClick: () => navigate('/admin/safety-courses')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'הגדרות',
      onClick: () => navigate('/admin/settings')
    }
  ];

  return (
    <AdminPageProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          theme="light"
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1
          }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            items={menuItems}
            style={{ 
              border: 'none',
              marginTop: '16px'
            }}
          />
        </Sider>
        <Layout>
          <HeaderContainer>
            <HeaderContent>
              <LeftSection>
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  style={{
                    fontSize: '16px',
                    width: 48,
                    height: 48,
                  }}
                />
                <BrandLogo
                  onClick={() => navigate('/')}
                  size="medium"
                  showSlogan={false}
                />
              </LeftSection>
              <PageIdentityArea>
                <AdminPageIdentity />
              </PageIdentityArea>
              <UserArea>
                <UserProfile variant="admin" />
              </UserArea>
            </HeaderContent>
          </HeaderContainer>
          <Content style={{ padding: '24px', minHeight: 280 }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </AdminPageProvider>
  );
};

export default AdminLayout; 