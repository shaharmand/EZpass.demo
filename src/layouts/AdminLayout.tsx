import React from 'react';
import { Layout, Menu, Typography, Space, Button } from 'antd';
import { 
  DashboardOutlined,
  BookOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons/lib/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AdminPageProvider } from '../contexts/AdminPageContext';
import { AdminPageHeader } from '../components/admin/AdminPageHeader';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const HeaderContainer = styled(Header)`
  padding: 0 24px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  direction: rtl;
`;

const PageIdentityArea = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  margin: 0 24px;
  justify-content: flex-start;
  direction: rtl;
`;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'לוח בקרה',
      onClick: () => navigate('/admin')
    },
    {
      key: 'questions',
      icon: <BookOutlined />,
      label: 'ניהול שאלות',
      onClick: () => navigate('/admin/questions')
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
          <div style={{ 
            height: '64px', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              {collapsed ? 'EZ' : 'EZpass'}
            </Title>
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            items={menuItems}
            style={{ border: 'none' }}
          />
        </Sider>
        <Layout>
          <HeaderContainer>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <PageIdentityArea>
              <AdminPageHeader />
            </PageIdentityArea>
            <Space>
              <Button type="text" icon={<UserOutlined />}>
                פרופיל
              </Button>
              <Button type="text" icon={<LogoutOutlined />}>
                התנתק
              </Button>
            </Space>
          </HeaderContainer>
          <Content style={{ 
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            minHeight: 280
          }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </AdminPageProvider>
  );
};

export default AdminLayout; 