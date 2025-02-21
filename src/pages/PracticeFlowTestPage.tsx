import React, { useState } from 'react';
import { Card, Space, Button, Typography, Divider, Alert, Tag, Statistic, Row, Col } from 'antd';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import type { FormalExam } from '../types/shared/exam';
import type { PrepState } from '../types/prepState';
import { ClockCircleOutlined, CheckCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Helper function to safely get active time
const getActiveTime = (state: PrepState): number => {
  if (state.status === 'active') {
    return state.activeTime + (Date.now() - state.lastTick);
  }
  if ('activeTime' in state) {
    return state.activeTime;
  }
  return 0;
};

const PracticeFlowTestPage: React.FC = () => {
  const { 
    activePrep,
    currentQuestion,
    startPrep,
    pausePrep,
    completePrep,
    getNextQuestion,
    submitAnswer,
    setCurrentQuestion
  } = useStudentPrep();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStartPractice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create a mock exam
      const mockExam: FormalExam = {
        id: 'test_exam',
        title: 'Test Exam',
        description: 'A test exam for development purposes',
        names: {
          short: 'Test Exam',
          medium: 'Test Exam',
          full: 'Test Exam for Development Purposes'
        },
        examType: 'bagrut' as const,
        duration: 120,
        totalQuestions: 10,
        status: 'not_started' as const,
        topics: [
          {
            id: 'safety_management',
            name: 'Safety Management',
            code: 'safety_101',
            topicId: 'safety_management',
            description: 'Basic safety management concepts',
            order: 0,
            subTopics: [
              {
                id: 'risk_assessment',
                code: 'risk_101',
                name: 'Risk Assessment',
                description: 'Understanding and performing risk assessments',
                order: 0
              }
            ]
          }
        ]
      };

      // Start practice directly
      const prepId = await startPrep(mockExam);
      
      // Get first question
      const firstQuestion = await getNextQuestion();
      if (firstQuestion) {
        setCurrentQuestion({
          question: firstQuestion,
          state: {
            status: 'active',
            startedAt: Date.now(),
            lastUpdatedAt: Date.now(),
            helpRequests: [],
            questionIndex: 0,
            correctAnswers: 0,
            averageScore: 0
          }
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start practice');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      if (!activePrep) {
        throw new Error('No active prep session');
      }
      setLoading(true);
      setError(null);
      setFeedback('Pausing practice...');

      pausePrep(activePrep.id);
      setFeedback('Practice paused');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to pause practice');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      if (!activePrep) {
        throw new Error('No active prep session');
      }
      setLoading(true);
      setError(null);
      setFeedback('Completing practice...');

      completePrep(activePrep.id);
      setFeedback('Practice completed');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete practice');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    try {
      if (!activePrep || !currentQuestion) {
        throw new Error('No active question');
      }
      setLoading(true);
      setError(null);
      setFeedback('Submitting test answer...');

      await submitAnswer('test_answer');
      setFeedback('Answer submitted and next question loaded');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  // Format time in minutes and seconds
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Practice Flow Test">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Status Display */}
          <div style={{ 
            padding: '16px', 
            background: '#f8fafc', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <Row gutter={[24, 24]}>
              <Col span={8}>
                <Statistic
                  title="Practice Status"
                  value={activePrep ? activePrep.state.status : 'No Active Practice'}
                  valueStyle={{ 
                    color: !activePrep ? '#999' :
                      activePrep.state.status === 'active' ? '#52c41a' :
                      activePrep.state.status === 'paused' ? '#faad14' :
                      activePrep.state.status === 'completed' ? '#1890ff' :
                      '#999'
                  }}
                />
              </Col>
              {activePrep && activePrep.state.status !== 'initializing' && (
                <>
                  <Col span={8}>
                    <Statistic
                      title="Active Time"
                      value={formatTime(getActiveTime(activePrep.state))}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Question Index"
                      value={currentQuestion?.state.questionIndex || 0}
                      prefix={<QuestionCircleOutlined />}
                    />
                  </Col>
                </>
              )}
            </Row>
          </div>

          {/* Action Buttons */}
          <Space wrap>
            <Button 
              type="primary"
              onClick={handleStartPractice}
              loading={loading}
              disabled={!!activePrep}
            >
              Start New Practice
            </Button>
            <Button
              onClick={handlePause}
              loading={loading}
              disabled={!activePrep || activePrep.state.status !== 'active'}
            >
              Pause Practice
            </Button>
            <Button
              onClick={handleComplete}
              loading={loading}
              disabled={!activePrep || activePrep.state.status !== 'active'}
            >
              Complete Practice
            </Button>
            <Button
              onClick={handleSubmitAnswer}
              loading={loading}
              disabled={!activePrep || activePrep.state.status !== 'active' || !currentQuestion}
            >
              Submit Test Answer
            </Button>
          </Space>

          {/* Feedback Display */}
          {feedback && (
            <Alert
              message="Operation Feedback"
              description={feedback}
              type="info"
              showIcon
              closable
              onClose={() => setFeedback(null)}
            />
          )}

          {/* Error Display */}
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          <Divider />

          {/* Current Question Display */}
          {currentQuestion && (
            <Card title="Current Question" size="small">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Topic:</Text>
                  <div>{currentQuestion.question.metadata.topicId}</div>
                </Col>
                <Col span={12}>
                  <Text strong>Status:</Text>
                  <div>{currentQuestion.state.status}</div>
                </Col>
                <Col span={24}>
                  <Text strong>Content:</Text>
                  <div style={{ 
                    marginTop: '8px',
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '4px'
                  }}>
                    {currentQuestion.question.content.text}
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Debug State Display (Collapsible) */}
          {activePrep && (
            <div>
              <Title level={5}>Debug State:</Title>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                maxHeight: '200px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify({
                  id: activePrep.id,
                  status: activePrep.state.status,
                  activeTime: getActiveTime(activePrep.state),
                  currentQuestion: currentQuestion ? {
                    id: currentQuestion.question.id,
                    status: currentQuestion.state.status,
                    index: currentQuestion.state.questionIndex
                  } : null
                }, null, 2)}
              </pre>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PracticeFlowTestPage; 