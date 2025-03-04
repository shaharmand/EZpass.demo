import React from 'react';
import { Layout } from 'antd';

export const PracticeFooter: React.FC = () => {
  return (
    <Layout.Footer style={{ textAlign: 'center', padding: '12px' }}>
      EZpass © {new Date().getFullYear()}
    </Layout.Footer>
  );
};

export default PracticeFooter; 