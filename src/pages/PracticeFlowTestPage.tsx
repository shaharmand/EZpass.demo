import React, { useState } from 'react';
import { Card, Space, Button, Typography, Divider, Select } from 'antd';
import { useExam } from '../contexts/ExamContext';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import QuestionViewer from '../components/QuestionViewer';
import type { FormalExam } from '../types/shared/exam';
import type { Question } from '../types/question';

const { Title, Text } = Typography;
const { Option } = Select;

const PracticeFlowTestPage: React.FC = () => {
  const { 
    practiceState,
    startPractice,
    submitPracticeAnswer,
    endPractice,
    getNextPracticeQuestion,
    setCurrentQuestion,
    currentQuestion
  } = useExam();

  const [selectedTopic, setSelectedTopic] = useState<string>('linear_equations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartPractice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create a mock exam that matches FormalExam type
      const mockExam: FormalExam = {
        id: 'test_exam',
        title: 'Test Exam',
        description: 'A test exam for development purposes',
        names: {
          short: 'Test Exam',
          medium: 'Test Exam',
          full: 'Test Exam for Development Purposes'
        },
        examType: 'bagrut',
        duration: 120,
        totalQuestions: 10,
        status: 'not_started',
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

      // Start practice with selected topic
      await startPractice(
        mockExam,
        [selectedTopic]
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
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Controls */}
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Select Topic:</Text>
            <Select
              value={selectedTopic}
              onChange={setSelectedTopic}
              style={{ width: '100%' }}
            >
              <Option value="linear_equations">Linear Equations</Option>
              <Option value="quadratic_equations">Quadratic Equations</Option>
            </Select>
            <Button 
              type="primary"
              onClick={handleStartPractice}
              loading={loading}
              style={{ width: '100%' }}
            >
              Start Practice
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
                borderRadius: '4px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {JSON.stringify(practiceState, null, 2)}
              </pre>
            </div>
          )}

          {/* Current Question Display */}
          {currentQuestion && (
            <div>
              <Title level={5}>Current Question:</Title>
              <Card>
                <QuestionViewer 
                  question={currentQuestion}
                  showOptions={true}
                  showSolution={true}
                />
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Button 
                    type="primary"
                    onClick={() => handleAnswer('test_answer')}
                  >
                    Next Question
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PracticeFlowTestPage; 