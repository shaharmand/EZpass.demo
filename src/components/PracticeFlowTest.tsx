import React, { useState } from 'react';
import { Card, Space, Button, Typography, Divider } from 'antd';
import { useExam } from '../contexts/ExamContext';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import LegacyQuestionDisplay from './LegacyQuestionDisplay';

const { Title, Text } = Typography;

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartPractice = async () => {
    try {
      setLoading(true);
      setError(null);

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
            topic_id: 'algebra_101',
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
      setError(error instanceof Error ? error.message : 'Failed to start practice');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    try {
      setLoading(true);
      // Add isCorrect parameter (mock value for testing)
      await submitPracticeAnswer(answer, true);
      const nextQuestion = await getNextPracticeQuestion();
      setCurrentQuestion(nextQuestion);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit answer');
    } finally {
      setLoading(false);
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
              loading={loading}
              disabled={!!practiceState}
            >
              Start Practice
            </Button>
            <Button 
              danger 
              onClick={endPractice}
              disabled={!practiceState}
            >
              End Practice
            </Button>
          </Space>

          {error && (
            <Text type="danger">{error}</Text>
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

          {/* Current Question Display */}
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