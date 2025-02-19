import React, { useEffect, useRef } from 'react';
import { Space, Spin, Typography, Button } from 'antd';
import type { PracticeContainerProps } from '../../types/prepUI';
import type { QuestionFeedback as QuestionFeedbackType } from '../../types/question';
import QuestionContent from '../QuestionContent';
import { default as QuestionFeedbackComponent } from '../QuestionFeedback';
import QuestionResponseInput from '../QuestionResponseInput';
import QuestionActions from './QuestionActions';
import QuestionMetadata from '../QuestionMetadata';
import PracticeProgress from './PracticeProgress';
import AnimatedScore from './AnimatedScore';
import { getFeedbackStyles, transitionStyles } from '../../utils/feedbackStyles';
import { ArrowLeftOutlined, RedoOutlined } from '@ant-design/icons';

const { Text } = Typography;

const PracticeContainer: React.FC<PracticeContainerProps> = ({
  question,
  onAnswer,
  onSkip,
  onHelp,
  onNext,
  onRetry,
  state
}) => {
  const lastTimeLogRef = useRef<number>(Date.now());
  const startTimeRef = useRef<number>(Date.now());

  // Reset time tracking on new question
  useEffect(() => {
    startTimeRef.current = Date.now();
    lastTimeLogRef.current = Date.now();
  }, [question.id]);

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
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        padding: '24px'
      }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>טוען שאלה...</Text>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Progress Bar */}
      <PracticeProgress
        totalQuestions={10} // Replace with actual total
        currentQuestionIndex={state.questionIndex || 0}
        correctAnswers={state.correctAnswers}
        score={state.averageScore}
      />

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Main Content Column */}
        <div style={{ 
          flex: '1',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Question Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            ...transitionStyles.questionTransition
          }}>
            {/* Question Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#ffffff'
            }}>
              <Space align="center">
                <Text strong style={{ fontSize: '16px' }}>שאלה</Text>
                <Button 
                  type="link"
                  onClick={() => window.open(`/questions/${question.id}`, '_blank')}
                  style={{ padding: '0 4px', fontSize: '15px' }}
                >
                  {question.id}
                </Button>
              </Space>
            </div>

            {/* Question Content */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '32px 24px',
              minHeight: '200px'
            }}>
              <QuestionContent
                content={question.content.text}
                isLoading={state.status === 'submitted' && !state.feedback}
              />
            </div>

            {/* Actions Bar */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e5e7eb',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Left side - Question status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  {state.status === 'active' ? 'שאלה פעילה' : 'שאלה הושלמה'}
                </Text>
              </div>

              {/* Right side - Actions */}
              <Space size="middle">
                <QuestionActions 
                  onHelp={onHelp}
                  onSkip={handleSkip}
                  disabled={state.status !== 'active'}
                />
              </Space>
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
            {/* Response Input Section */}
            <div style={{
              padding: '24px',
              backgroundColor: '#ffffff'
            }}>
              <div style={{
                marginBottom: '16px'
              }}>
                <Text strong style={{ fontSize: '15px', color: '#374151' }}>
                  התשובה שלך
                </Text>
              </div>
              <QuestionResponseInput
                question={question}
                onAnswer={handleAnswer}
                disabled={state.status !== 'active'}
              />
            </div>

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

        {/* Side Info Column */}
        <div style={{ 
          width: '320px',
          flexShrink: 0,
          position: 'sticky',
          top: '24px',
          alignSelf: 'flex-start'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <Text strong style={{ 
              display: 'block', 
              marginBottom: '16px', 
              fontSize: '15px',
              color: '#374151'
            }}>
              מידע נוסף
            </Text>
            <QuestionMetadata metadata={{
              topicId: question.metadata.topicId,
              subtopicId: question.metadata.subtopicId,
              type: question.type === 'multiple_choice' ? 'רב-ברירה' : 'פתוח',
              difficulty: question.metadata.difficulty.toString(),
              source: 'איזיפס'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeContainer; 