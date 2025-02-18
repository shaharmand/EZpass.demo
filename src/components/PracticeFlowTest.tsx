import React, { useState } from 'react';
import { Card, Space, Button, Typography, Divider, Alert } from 'antd';
import { useExam } from '../contexts/ExamContext';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import LegacyQuestionDisplay from './LegacyQuestionDisplay';

const { Title, Text } = Typography;

// Simplified loading state - we only care about practice operations
interface LoadingState {
  practice: boolean;
}

interface ErrorState {
  type: 'practice' | 'question' | 'answer' | null;
  message: string | null;
  retryFn?: () => Promise<void>;
}

const PracticeFlowTest: React.FC = () => {
  const { 
    practiceState,
    startPractice,
    submitPracticeAnswer,
    endPractice,
    getNextPracticeQuestion,
    setCurrentQuestion,
    currentQuestion
  } = useExam();

  // Simplified loading state
  const [loading, setLoading] = useState<LoadingState>({
    practice: false
  });

  const [error, setError] = useState<ErrorState>({
    type: null,
    message: null
  });

  const handleStartPractice = async () => {
    try {
      setLoading({ practice: true });
      setError({ type: null, message: null });

      // Create a mock exam that matches FormalExam type
      const mockExam = {
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
            id: 'algebra',
            name: 'Algebra',
            code: 'algebra_101',
            topicId: 'algebra_101',
            description: 'Basic algebra concepts',
            order: 0,
            subTopics: [
              {
                id: 'linear_equations',
                code: 'linear_eq_101',
                name: 'Linear Equations',
                description: 'Solving linear equations',
                order: 0
              },
              {
                id: 'quadratic_equations',
                code: 'quad_eq_101',
                name: 'Quadratic Equations',
                description: 'Solving quadratic equations',
                order: 1
              }
            ]
          }
        ]
      };

      // Start practice with mock data
      await startPractice(
        mockExam,
        ['linear_equations', 'quadratic_equations']
      );

      // Get first question
      const firstQuestion = await getNextPracticeQuestion();
      setCurrentQuestion(firstQuestion);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start practice';
      setError({ 
        type: 'practice', 
        message,
        retryFn: handleStartPractice
      });
    } finally {
      setLoading({ practice: false });
    }
  };

  const handleAnswer = async (answer: string) => {
    try {
      setError({ type: null, message: null });
      
      // Submit answer and get next question in one operation
      await submitPracticeAnswer(answer, true);
      const nextQuestion = await getNextPracticeQuestion();
      setCurrentQuestion(nextQuestion);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit answer';
      setError({ 
        type: 'answer', 
        message,
        retryFn: () => handleAnswer(answer)
      });
    }
  };

  const handleEndPractice = async () => {
    try {
      setLoading({ practice: true });
      setError({ type: null, message: null });
      await endPractice();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to end practice';
      setError({ 
        type: 'practice', 
        message,
        retryFn: handleEndPractice
      });
    } finally {
      setLoading({ practice: false });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Practice Flow Test">
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Controls */}
          <Space>
            <Button 
              type="primary" 
              onClick={handleStartPractice}
              loading={loading.practice}
              disabled={!!practiceState}
            >
              Start Practice
            </Button>
            <Button 
              danger 
              onClick={handleEndPractice}
              loading={loading.practice}
              disabled={!practiceState}
            >
              End Practice
            </Button>
          </Space>

          {/* Error Display with Retry */}
          {error.message && (
            <Alert
              message={`Error: ${error.type === 'practice' ? 'Practice' : error.type === 'answer' ? 'Answer' : 'Question'}`}
              description={
                <Space direction="vertical">
                  <Text>{error.message}</Text>
                  {error.retryFn && (
                    <Button type="link" onClick={error.retryFn}>
                      Retry
                    </Button>
                  )}
                </Space>
              }
              type="error"
              showIcon
            />
          )}

          <Divider />

          {/* Practice State Display */}
          {practiceState && (
            <div>
              <Title level={5}>Practice State:</Title>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px' 
              }}>
                {JSON.stringify(practiceState, null, 2)}
              </pre>
            </div>
          )}

          {/* Current Question Display - Simplified */}
          {currentQuestion && (
            <div>
              <Title level={5}>Current Question:</Title>
              <LegacyQuestionDisplay 
                question={currentQuestion}
                onNext={() => handleAnswer('test_answer')}
              />
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PracticeFlowTest; 