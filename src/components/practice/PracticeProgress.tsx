import React from 'react';
import { Typography, Tooltip } from 'antd';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface PracticeProgressProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  correctAnswers: number;
  score: number;
}

// Define scrollbar styles as a CSS class
const scrollbarStyles = `
  .progress-list::-webkit-scrollbar {
    height: 4px;
  }
  .progress-list::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  .progress-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
`;

const PracticeProgress: React.FC<PracticeProgressProps> = ({
  totalQuestions,
  currentQuestionIndex,
  correctAnswers,
  score
}) => {
  const progressStyles = {
    container: {
      display: 'flex',
      gap: '8px',
      padding: '16px 24px',
      backgroundColor: '#f8fafc',
      alignItems: 'center'
    },
    progressList: {
      display: 'flex',
      gap: '8px',
      flex: 1,
      overflowX: 'auto' as const,
      padding: '4px'
    },
    item: {
      base: {
        padding: '8px 16px',
        borderRadius: '8px',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '48px',
        justifyContent: 'center'
      },
      states: {
        completed: {
          backgroundColor: '#dcfce7',
          border: '2px solid #22c55e',
          color: '#166534'
        },
        current: {
          backgroundColor: '#dbeafe',
          border: '2px solid #3b82f6',
          color: '#1e40af',
          fontWeight: 600,
          transform: 'scale(1.05)'
        },
        upcoming: {
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          color: '#64748b'
        }
      }
    },
    score: {
      container: {
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb'
      },
      label: {
        fontSize: '14px',
        color: '#64748b'
      },
      value: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#0f172a',
        transition: 'color 0.3s ease'
      }
    }
  };

  const getItemState = (index: number) => {
    if (index < currentQuestionIndex) return 'completed';
    if (index === currentQuestionIndex) return 'current';
    return 'upcoming';
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={progressStyles.container}>
        <div className="progress-list" style={progressStyles.progressList}>
          {Array.from({ length: totalQuestions }).map((_, index) => {
            const state = getItemState(index);
            return (
              <Tooltip 
                key={index}
                title={`שאלה ${index + 1} ${state === 'completed' ? '(הושלם)' : 
                       state === 'current' ? '(נוכחי)' : ''}`}
              >
                <div style={{
                  ...progressStyles.item.base,
                  ...progressStyles.item.states[state]
                }}>
                  {state === 'completed' ? (
                    <CheckCircleFilled style={{ fontSize: '16px' }} />
                  ) : state === 'current' ? (
                    <LoadingOutlined style={{ fontSize: '16px' }} />
                  ) : (
                    <Text>{index + 1}</Text>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
        
        <div style={progressStyles.score.container}>
          <Text style={progressStyles.score.label}>ציון ממוצע:</Text>
          <Text style={progressStyles.score.value}>
            {score}%
          </Text>
        </div>
      </div>
    </>
  );
};

export default PracticeProgress; 