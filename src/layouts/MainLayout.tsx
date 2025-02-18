import React from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';

const { Header, Content } = Layout;

const MainLayout: React.FC = () => {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Main Content */}
      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainLayout; 