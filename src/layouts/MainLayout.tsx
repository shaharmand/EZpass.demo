import React from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import PracticeHeader from '../components/PracticeHeader';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const location = useLocation();
  const isPracticePage = location.pathname.includes('/prep') && location.pathname.includes('/practice');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isPracticePage && <PracticeHeader />}
      <Content style={{ padding: '0', position: 'relative' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainLayout; 