import React from 'react';
import { Card, Space, Collapse, Button, Spin, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExamCard } from '../components/ExamCard/ExamCard';
import { useExam } from '../contexts/ExamContext';
import { convertToFormalExam } from '../utils/examUtils';

const { Panel } = Collapse;

declare const process: {
  env: {
    NODE_ENV: string;
  };
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, error, bagrutExams, mahatExams } = useExam();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const renderDevTools = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <Collapse 
        ghost 
        style={{ 
          marginBottom: '24px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }}
      >
        <Panel header="Development Tools" key="dev-tools">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              onClick={() => navigate('/test/generation')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px',
                height: 'auto'
              }}
            >
              Question Generation Test
            </Button>
            <Button 
              onClick={() => navigate('/test/practice')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px',
                height: 'auto'
              }}
            >
              Practice Flow Test
            </Button>
          </Space>
        </Panel>
      </Collapse>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      {renderDevTools()}
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="בחינות בגרות" bordered={false}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {bagrutExams.map(exam => (
              <ExamCard
                key={exam.id}
                exam={convertToFormalExam(exam)}
                onStartExam={() => {
                  navigate('/practice');
                }}
              />
            ))}
          </Space>
        </Card>

        <Card title="בחינות מהט" bordered={false}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {mahatExams.map(exam => (
              <ExamCard
                key={exam.id}
                exam={convertToFormalExam(exam)}
                onStartExam={() => {
                  navigate('/practice');
                }}
              />
            ))}
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default LandingPage; 