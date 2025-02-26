import React, { useState, useCallback } from 'react';
import { Card, Space, Button, Typography, Divider, Alert } from 'antd';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import PracticeQuestionDisplay from './practice/PracticeQuestionDisplay';
import type { QuestionState, QuestionStatus, HelpType } from '../types/prepState';
import { logger } from '../utils/logger';
import { ExamType, ExamTemplate } from '../types/examTemplate';
import { DifficultyLevel } from '../types/question';

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
    currentQuestion,
    startPrep,
    submitAnswer,
    completePrep,
    getNextQuestion,
    setCurrentQuestion,
    getPrep
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
      const mockExam: ExamTemplate = {
        id: 'test_exam',
        code: 'TEST_101',
        examType: ExamType.BAGRUT_EXAM,
        difficulty: 3 as DifficultyLevel,
        subjectId: 'safety',
        domainId: 'workplace_safety',
        allowedQuestionTypes: ['multiple_choice', 'open'],
        duration: 120,
        totalQuestions: 10,
        names: {
          short: 'Test Exam',
          medium: 'Test Exam',
          full: 'Test Exam for Development'
        },
        topics: [
          {
            id: 'safety_management',
            name: 'Safety Management',
            description: 'Basic safety management concepts',
            order: 0,
            subTopics: [
              {
                id: 'risk_assessment',
                name: 'Risk Assessment',
                description: 'Understanding and performing risk assessments',
                order: 0
              },
              {
                id: 'safety_procedures',
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
      
      // Get current prep before submitting answer
      if (!currentQuestion) {
        throw new Error('No active question');
      }
      
      const prep = await getPrep(currentQuestion.question.id);
      if (!prep) {
        throw new Error('Practice session not found');
      }
      
      // Submit answer with prep
      await submitAnswer(answer, prep);
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
      
      if (currentQuestion) {
        await completePrep(currentQuestion.question.id);
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
              disabled={!!currentQuestion}
            >
              Start Practice
            </Button>
            <Button 
              danger 
              onClick={handleEndPractice}
              loading={loading.practice}
              disabled={!currentQuestion}
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
          {currentQuestion && (
            <div>
              <Title level={5}>Practice State:</Title>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px' 
              }}>
                {JSON.stringify(currentQuestion, null, 2)}
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