import React from 'react';
import { usePracticeProgress } from '../hooks/usePracticeProgress';
import ProgressBar from './ProgressBar/ProgressBar';
import { useExam } from '../contexts/ExamContext';
import { Typography, Space, Spin, Divider } from 'antd';
import type { Prep } from '../types/prep';

const { Text } = Typography;

interface PracticeHeaderProps {
  prep: Prep;
}

export const PracticeHeader: React.FC<PracticeHeaderProps> = ({ prep }) => {
  const { metrics, isLoading } = usePracticeProgress();
  const { practiceState } = useExam();

  const headerStyle = {
    backgroundColor: '#ffffff',
    borderBottom: '2px solid #1890ff',
    padding: '16px 24px',
    position: 'sticky' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    width: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    display: 'block',
    minHeight: '64px'
  };

  const contentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  };

  // If we're here, we know the practice is valid because PracticePage validated it
  return (
    <div style={headerStyle} className="practice-header">
      <div style={contentStyle}>
        {/* Top Section: Logo, User, Exam Info - Always visible */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '8px 0'
        }}>
          {/* Logo - Always visible */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px'
          }}>
            <img 
              src="/logo.png" 
              alt="EZpass Logo" 
              style={{ 
                height: '32px',
                width: 'auto'
              }}
            />
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              EZpass
            </Text>
          </div>

          {/* Exam Info - Always visible since we have prep */}
          <div style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '16px' }}>
              {prep.exam.title}
            </Text>
          </div>

          {/* User Info - Always visible */}
          <div style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: '14px' }}>
              שלום, משתמש
            </Text>
          </div>
        </div>

        <Divider style={{ margin: '0' }} />

        {/* Bottom Section: Progress Metrics or Loading */}
        <div style={{ padding: '8px 0' }}>
          {!metrics ? (
            <Space>
              <Spin size="small" />
              <Text>טוען שאלה...</Text>
            </Space>
          ) : (
            <ProgressBar metrics={metrics} />
          )}
        </div>
      </div>
    </div>
  );
}; 