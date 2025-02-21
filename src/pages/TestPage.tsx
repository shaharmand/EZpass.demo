import React from 'react';
import { Typography, Space, Card, Collapse } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PracticeFlowTest from '../components/PracticeFlowTest';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <Title level={3}>Test Page</Title>
        <Text>This page is only available in development mode.</Text>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '48px 24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <Title level={2} style={{ 
        marginBottom: '24px',
        color: '#1f2937',
        fontSize: '1.5rem'
      }}>
        Development Tools
      </Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Quick Access Buttons */}
        <Card title="Quick Access">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <Card
                hoverable
                onClick={() => navigate('/test/generation')}
                style={{ textAlign: 'center' }}
              >
                <ExperimentOutlined style={{ fontSize: '24px', color: '#2563eb', marginBottom: '8px' }} />
                <Title level={5}>Question Generation Test</Title>
                <Text type="secondary">Test question generation functionality</Text>
              </Card>

              <Card
                hoverable
                onClick={() => navigate('/test/practice-flow')}
                style={{ textAlign: 'center' }}
              >
                <ExperimentOutlined style={{ fontSize: '24px', color: '#2563eb', marginBottom: '8px' }} />
                <Title level={5}>Practice Flow Test</Title>
                <Text type="secondary">Test practice session workflow</Text>
              </Card>
            </div>
          </Space>
        </Card>

        {/* Test Components */}
        <Card title="Test Components">
          <Collapse>
            <Panel header="Practice Flow Test" key="practice-test">
              <PracticeFlowTest />
            </Panel>
          </Collapse>
        </Card>
      </Space>
    </div>
  );
};

export default TestPage; 