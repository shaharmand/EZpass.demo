import React, { useState } from 'react';
import { Card, Space, Button, Typography, Divider } from 'antd';
import { useExam } from '../contexts/ExamContext';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import QuestionDisplay from './QuestionDisplay';

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

      // Create a mock exam for testing
      const mockExam = {
        id: 'test_exam',
        name: 'Test Exam',
        description: 'A test exam for development purposes',
        subject: {
          id: 'mathematics',
          name: 'Mathematics'
        },
        topics: [
          {
            id: 'algebra',
            name: 'Algebra',
            subtopics: [
              {
                id: 'linear_equations',
                name: 'Linear Equations'
              },
              {
                id: 'quadratic_equations',
                name: 'Quadratic Equations'
              }
            ]
          }
        ],
        duration: 120,
        totalQuestions: 10,
        passingScore: 60
      };

      // Start practice with mock data
      await startPractice(
        mockExam,
        mockExam.topics,
        '3' // Default difficulty
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
      await submitPracticeAnswer(answer);
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
              <QuestionDisplay 
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