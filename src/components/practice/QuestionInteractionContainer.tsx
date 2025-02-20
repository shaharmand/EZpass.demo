import React, { useEffect, useRef } from 'react';
import { Space, Spin, Typography, Button } from 'antd';
import type { Question } from '../../types/question';
import type { QuestionFeedback as QuestionFeedbackType } from '../../types/question';
import QuestionContent from '../QuestionContent';
import QuestionMetadata from '../QuestionMetadata';
import { default as QuestionFeedbackComponent } from '../QuestionFeedback';
import QuestionResponseInput from '../QuestionResponseInput';
import QuestionActions from './QuestionActions';
import PracticeProgress from './PracticeProgress';
import AnimatedScore from './AnimatedScore';
import { getFeedbackStyles, transitionStyles } from '../../utils/feedbackStyles';
import { ArrowLeftOutlined, RedoOutlined } from '@ant-design/icons';
import type { FilterState } from '../../types/question';
import type { PracticeQuestion } from '../../types/prepUI';

const { Text } = Typography;

interface QuestionInteractionContainerProps {
  question: Question;
  onAnswer: (answer: string) => Promise<void>;
  onSkip: (reason: 'too_hard' | 'too_easy' | 'not_in_material') => Promise<void>;
  onHelp: () => void;
  onNext: () => void;
  onRetry: () => void;
  state: {
    status: string;
    feedback?: QuestionFeedbackType;
    questionIndex: number;
    correctAnswers: number;
    averageScore: number;
    answeredQuestions?: Array<{
      index: number;
      isCorrect: boolean;
      score?: number;
    }>;
  };
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  activePrep?: any; // Assuming activePrep is of type any
}

const QuestionInteractionContainer: React.FC<QuestionInteractionContainerProps> = ({
  question,
  onAnswer,
  onSkip,
  onHelp,
  onNext,
  onRetry,
  state,
  filters,
  onFiltersChange,
  activePrep
}) => {
  const lastTimeLogRef = useRef<number>(Date.now());
  const startTimeRef = useRef<number>(Date.now());

  // Reset time tracking on new question
  useEffect(() => {
    startTimeRef.current = Date.now();
    lastTimeLogRef.current = Date.now();
  }, [question?.id]);

  const handleAnswer = async (answer: string) => {
    try {
      await onAnswer(answer);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleSkip = async (reason: 'too_hard' | 'too_easy' | 'not_in_material') => {
    try {
      await onSkip(reason);
    } catch (error) {
      console.error('Error skipping question:', error);
    }
  };

  if (!question || state.status === 'loading') {
    return (
      <div style={{ 
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%'
      }}>
        {/* Progress Bar */}
        <PracticeProgress
          totalQuestions={10}
          currentQuestionIndex={state.questionIndex}
          correctAnswers={state.correctAnswers}
          score={state.averageScore}
          answeredQuestions={activePrep?.questions?.map((q: PracticeQuestion, index: number) => ({
            index,
            isCorrect: q.state.feedback?.isCorrect || false,
            score: q.state.feedback?.score
          })) || []}
        />

        {/* Loading Question Card */}
        <div className="question-content loading">
          <div className="loading-header">
            <Space direction="vertical" align="center" size="large">
              <Spin size="large" />
              <Text>טוען שאלה...</Text>
            </Space>
          </div>
          <div className="loading-response">
            <Space direction="vertical" align="center" size="middle">
              <div style={{ width: '100%', maxWidth: '600px', height: '120px', background: '#f5f5f5', borderRadius: '8px' }} />
              <Button
                type="primary"
                disabled
                size="large"
                style={{
                  minWidth: '200px',
                  height: '48px',
                  fontSize: '16px',
                  borderRadius: '24px'
                }}
              >
                שלח תשובה
              </Button>
            </Space>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '100%'
    }}>
      {/* Progress Bar */}
      <PracticeProgress
        totalQuestions={10}
        currentQuestionIndex={state.questionIndex}
        correctAnswers={state.correctAnswers}
        score={state.averageScore}
        answeredQuestions={activePrep?.questions?.map((q: PracticeQuestion, index: number) => ({
          index,
          isCorrect: q.state.feedback?.isCorrect || false,
          score: q.state.feedback?.score
        })) || []}
      />

      {/* Question Card */}
      <div className="question-content">
        {/* Question Header */}
        <div className="question-header">
          <h3>שאלה {(activePrep?.state.completedQuestions || 0) + 1}</h3>
        </div>

        {/* Question Content */}
        <div className="question-body">
          <QuestionContent
            content={question.content.text}
            isLoading={state.status === 'submitted' && !state.feedback}
          />
        </div>

        {/* Actions Bar */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e5e7eb',
          padding: '12px 20px'
        }}>
          <QuestionActions 
            onHelp={onHelp}
            onSkip={onSkip}
            disabled={state.status !== 'active'}
          />
        </div>
      </div>

      {/* Answer Card */}
      <div className="question-content">
        <div className="answer-section">
          <div className="answer-header">
            <h3>התשובה שלך</h3>
          </div>
          <QuestionResponseInput
            question={question}
            onAnswer={handleAnswer}
            onRetry={onRetry}
            disabled={state.status !== 'active'}
            feedback={state.feedback ? {
              isCorrect: state.feedback.isCorrect,
              correctOption: state.feedback.correctOption
            } : undefined}
          />
        </div>
      </div>

      {/* Response and Feedback Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Loading State */}
        {state.status === 'submitted' && !state.feedback && (
          <div style={{ 
            padding: '24px',
            backgroundColor: '#f8fafc',
            textAlign: 'center',
            borderTop: '1px solid #e5e7eb'
          }}>
            <Space direction="vertical">
              <Spin size="large" />
              <Text>בודק את התשובה שלך...</Text>
            </Space>
          </div>
        )}

        {/* Feedback Section */}
        {state.status === 'submitted' && state.feedback && (
          <div style={{
            padding: '24px',
            backgroundColor: getFeedbackStyles(state.feedback.score).background,
            borderTop: `1px solid ${getFeedbackStyles(state.feedback.score).border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            ...transitionStyles.feedbackTransition
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <AnimatedScore 
                score={state.feedback.score}
                style={{ color: getFeedbackStyles(state.feedback.score).text }}
              />
              <Text strong style={{ 
                fontSize: '16px',
                color: getFeedbackStyles(state.feedback.score).text
              }}>
                {getFeedbackStyles(state.feedback.score).message}
              </Text>
            </div>
            <QuestionFeedbackComponent feedback={state.feedback} />
            
            {/* Navigation Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(0,0,0,0.1)'
            }}>
              <Button 
                type="default"
                icon={<RedoOutlined />}
                onClick={onRetry}
              >
                נסה שוב
              </Button>
              <Button 
                type="primary"
                size="large"
                onClick={onNext}
                icon={<ArrowLeftOutlined />}
              >
                המשך לשאלה הבאה
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionInteractionContainer; 