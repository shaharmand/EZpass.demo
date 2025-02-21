import React, { useState, useCallback } from 'react';
import { Card, Space, Button, Typography, Divider, Alert } from 'antd';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import PracticeQuestionDisplay from './practice/PracticeQuestionDisplay';
import type { QuestionState, QuestionStatus, HelpType } from '../types/prepState';
import { logger } from '../utils/logger';

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
    activePrep,
    currentQuestion,
    startPrep,
    submitAnswer,
    completePrep,
    getNextQuestion,
    setCurrentQuestion
  } = useStudentPrep();

  // Simplified loading state
  const [loading, setLoading] = useState<LoadingState>({
    practice: false
  });

  const [error, setError] = useState<ErrorState>({
    type: null,
    message: null
  });

  // Initialize question state with all required fields
  const [questionState, setQuestionState] = useState<QuestionState>({
    status: 'active' as QuestionStatus,
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
    correctAnswers: 0,
    averageScore: 0,
    helpRequests: [],
    questionIndex: 0
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
              },
              {
                id: 'safety_procedures',
                code: 'proc_101',
                name: 'Safety Procedures',
                description: 'Implementing safety procedures',
                order: 1
              }
            ]
          }
        ]
      };

      // Start practice with mock data
      await startPrep(mockExam, {
        topics: ['safety_management'],
        subTopics: ['risk_assessment', 'safety_procedures']
      });

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
      await submitAnswer(answer);
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
      
      if (activePrep) {
        await completePrep(activePrep.id);
      }
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

  const handleHelp = () => {
    logger.info('Help requested', {
      questionId: currentQuestion?.question.id
    });
    
    // Update question state with help request
    setQuestionState(prev => ({
      ...prev,
      helpRequests: [
        ...prev.helpRequests,
        {
          timestamp: Date.now(),
          type: 'explanation' as HelpType
        }
      ],
      lastUpdatedAt: Date.now()
    }));
  };

  const handleSkip = async (reason: 'too_hard' | 'too_easy' | 'not_in_material') => {
    console.log('Skip requested:', reason);
    await handleAnswer('skipped');
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
              disabled={!!activePrep}
            >
              Start Practice
            </Button>
            <Button 
              danger 
              onClick={handleEndPractice}
              loading={loading.practice}
              disabled={!activePrep}
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
          {activePrep && (
            <div>
              <Title level={5}>Practice State:</Title>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px' 
              }}>
                {JSON.stringify(activePrep, null, 2)}
              </pre>
            </div>
          )}

          {/* Current Question Display */}
          {currentQuestion && (
            <div>
              <Title level={5}>Current Question:</Title>
              <PracticeQuestionDisplay 
                question={currentQuestion.question}
                state={questionState}
                onHelp={handleHelp}
                onSkip={handleSkip}
              />
              <Button 
                type="primary" 
                onClick={() => handleAnswer('test_answer')}
                style={{ marginTop: '16px' }}
              >
                Submit Test Answer
              </Button>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PracticeFlowTest; 