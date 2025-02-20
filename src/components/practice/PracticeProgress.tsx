import React from 'react';
import { Typography, Tooltip } from 'antd';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface PracticeProgressProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  correctAnswers: number;
  score: number;
  answeredQuestions?: {
    index: number;
    isCorrect: boolean;
    score?: number;
  }[];
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

const MAX_QUESTIONS = 10;

const PracticeProgress: React.FC<PracticeProgressProps> = ({
  totalQuestions,
  currentQuestionIndex,
  correctAnswers,
  score,
  answeredQuestions = []
}) => {
  const progressStyles = {
    container: {
      display: 'flex',
      gap: '8px',
      padding: '12px 16px',
      backgroundColor: '#f8fafc',
      alignItems: 'center',
      direction: 'rtl' as const,
      width: '100%',
      overflow: 'hidden'
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
        padding: '6px 8px',
        borderRadius: '6px',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        minWidth: '32px',
        maxWidth: '32px',
        justifyContent: 'center',
        fontSize: '12px'
      },
      states: {
        correct: {
          backgroundColor: '#dcfce7',
          border: '1px solid #22c55e',
          color: '#166534'
        },
        wrong: {
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b'
        },
        current: {
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
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
    stats: {
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginRight: 'auto'
      },
      item: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb',
        minWidth: '80px',
        justifyContent: 'center'
      },
      label: {
        fontSize: '12px',
        color: '#64748b'
      },
      value: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#0f172a',
        transition: 'color 0.3s ease'
      }
    }
  };

  const getItemState = (index: number) => {
    const answeredQuestion = answeredQuestions.find(q => q.index === index);
    console.log('🎨 Determining button state:', {
      index,
      currentQuestionIndex,
      answeredQuestion,
      hasScore: answeredQuestion?.score !== undefined,
      isCorrect: answeredQuestion?.isCorrect,
      score: answeredQuestion?.score
    });
    
    if (answeredQuestion) {
      // Use score threshold of 80% if score is available, otherwise use isCorrect
      const isSuccess = answeredQuestion.score !== undefined
        ? answeredQuestion.score >= 80 
        : answeredQuestion.isCorrect;
      const state = isSuccess ? 'correct' : 'wrong';
      console.log(`✨ Button ${index + 1} state determined:`, {
        state,
        basedOn: answeredQuestion.score !== undefined ? 'score' : 'isCorrect'
      });
      return state;
    }
    if (index === currentQuestionIndex) {
      console.log(`🔵 Button ${index + 1} is current question`);
      return 'current';
    }
    console.log(`⚪ Button ${index + 1} is upcoming`);
    return 'upcoming';
  };

  // Calculate real success rate based on feedback scores
  const calculateSuccessRate = () => {
    const completedQuestions = answeredQuestions.filter(q => q.score !== undefined || q.isCorrect !== undefined);
    if (completedQuestions.length === 0) return 0;
    
    const totalScore = completedQuestions.reduce((sum, q) => {
      // If we have a score, use it, otherwise use 100 for correct and 40 for incorrect
      if (q.score !== undefined) return sum + q.score;
      return sum + (q.isCorrect ? 100 : 40);
    }, 0);
    
    return Math.round(totalScore / completedQuestions.length);
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={progressStyles.container}>
        <div className="progress-list" style={progressStyles.progressList}>
          {Array.from({ length: Math.min(MAX_QUESTIONS, totalQuestions) }).map((_, index) => {
            const state = getItemState(index);
            return (
              <Tooltip 
                key={index}
                title={`שאלה ${index + 1} ${
                  state === 'correct' ? '(נכון)' : 
                  state === 'wrong' ? '(לא נכון)' :
                  state === 'current' ? '(נוכחי)' : ''}`}
              >
                <div style={{
                  ...progressStyles.item.base,
                  ...progressStyles.item.states[state]
                }}>
                  {state === 'correct' ? (
                    <CheckCircleFilled style={{ fontSize: '12px' }} />
                  ) : state === 'wrong' ? (
                    <Text>✕</Text>
                  ) : state === 'current' ? (
                    <LoadingOutlined style={{ fontSize: '12px' }} />
                  ) : (
                    <Text>{index + 1}</Text>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>

        {/* Stats Section */}
        <div style={progressStyles.stats.container}>
          {/* Success Rate */}
          <div style={progressStyles.stats.item}>
            <Text style={progressStyles.stats.label}>הצלחה:</Text>
            <Text style={progressStyles.stats.value}>
              {calculateSuccessRate()}%
            </Text>
          </div>
        </div>
      </div>
    </>
  );
};

export default PracticeProgress; 