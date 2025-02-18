// Main dashboard for exam selection and practice
// Contains exam cards and development tools in development mode

import React from 'react';
import { Typography, Space, Spin, Collapse } from 'antd';
import { useExam } from '../contexts/ExamContext';
import { ExamCard } from '../components/ExamCard/ExamCard';
import PracticeFlowTest from '../components/PracticeFlowTest';
import type { FormalExam } from '../types/shared/exam';

const { Title } = Typography;
const { Panel } = Collapse;

const ExamDashboard: React.FC = () => {
  const { bagrutExams, mahatExams, loading } = useExam();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (loading) {
    return (
      <div style={{ 
        padding: '48px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Spin size="large" />
        <span style={{ color: '#666' }}>טוען מבחנים...</span>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '48px 24px',
      maxWidth: '1200px', 
      margin: '0 auto'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Development Tools Section */}
        {isDevelopment && (
          <div>
            <Title level={2} style={{ 
              marginBottom: '24px',
              color: '#1f2937',
              fontSize: '1.5rem'
            }}>
              Development Tools
            </Title>
            <Collapse>
              <Panel header="Practice Flow Test" key="practice-test">
                <PracticeFlowTest />
              </Panel>
            </Collapse>
          </div>
        )}

        {/* Bagrut Section */}
        {bagrutExams.length > 0 && (
          <div>
            <Title level={2} style={{ 
              marginBottom: '24px',
              color: '#1f2937',
              fontSize: '1.5rem'
            }}>
              בחינות בגרות
            </Title>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {bagrutExams.map(exam => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mahat Section */}
        {mahatExams.length > 0 && (
          <div>
            <Title level={2} style={{ 
              marginBottom: '24px',
              color: '#1f2937',
              fontSize: '1.5rem'
            }}>
              בחינות מה״ט
            </Title>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {mahatExams.map(exam => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                />
              ))}
            </div>
          </div>
        )}
      </Space>
    </div>
  );
};

export default ExamDashboard; 