import React from 'react';
import { Layout, Menu, Button, MenuProps } from 'antd';
import { 
  DashboardOutlined,
  BookOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlaySquareOutlined,
  SafetyCertificateOutlined,
  ReadOutlined,
  AppstoreOutlined,
  FileTextOutlined
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
      label: 'ספריית שאלות',
      onClick: () => navigate('/admin/questions')
    },
    {
      key: 'videos',
      icon: <PlaySquareOutlined />,
      label: 'ספריית וידאו',
      onClick: () => navigate('/admin/videos')
    },
    {
      key: 'courses',
      icon: <ReadOutlined />,
      label: 'ניהול קורסים',
      onClick: () => navigate('/admin/courses')
    },
    {
      key: 'domains',
      icon: <AppstoreOutlined />,
      label: 'ניהול תחומים',
      onClick: () => navigate('/admin/subjects')
    },
    {
      key: 'exams',
      icon: <FileTextOutlined />,
      label: 'ניהול מבחנים',
      onClick: () => navigate('/admin/exams')
    }
  ];

  return (
    <AdminPageProvider>
      <Layout style={{ minHeight: '100vh', height: 'auto', overflow: 'visible' }}>
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          theme="light"
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1,
            height: '100vh',
            position: 'sticky',
            top: 0,
            overflow: 'auto'
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
        <Layout style={{ height: 'auto', minHeight: '100vh' }}>
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
          <Content style={{ 
            padding: '24px', 
            overflow: 'auto',
            height: 'auto',
            minHeight: 'calc(100vh - 64px)',
            display: 'block'
          }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </AdminPageProvider>
  );
};

export default AdminLayout; 