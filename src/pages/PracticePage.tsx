import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Space, Button, Layout, Typography, Card, message, Result } from 'antd';
import { HomeOutlined, ArrowLeftOutlined, MessageOutlined, RobotOutlined } from '@ant-design/icons';
import { PracticeHeader } from '../components/PracticeHeader';
import { QuestionInteractionContainer } from '../components/practice/QuestionInteractionContainer';
import { WelcomeScreen } from '../components/practice/WelcomeScreen';
import type { ActivePracticeQuestion, SkipReason } from '../types/prepUI';
import type { Question, FullAnswer } from '../types/question';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { QuestionStatus } from '../types/prepState';
import type { StudentPrep } from '../types/prepState';
import { logger } from '../utils/logger';
import { usePracticeAttempts } from '../contexts/PracticeAttemptsContext';
import { useAuth } from '../contexts/AuthContext';
import { GuestLimitDialog } from '../components/dialogs/GuestLimitDialog';
import { UserLimitDialog } from '../components/dialogs/UserLimitDialog';
import './PracticePage.css';
import { memo } from 'react';
import moment from 'moment';
import { examService } from '../services/examService';
import { PrepStateManager } from '../services/PrepStateManager';
import RelatedContent from '../components/practice/RelatedContent';
import { universalTopics } from '../services/universalTopics';
import QuestionProperties from '../components/practice/QuestionProperties';
import { FirstPanel, MainContent, ThirdPanel, AssistanceSection, PropertiesSection } from '../components/practice/LayoutComponents';
import { UserHeader } from '../components/layout/UserHeader';
import PracticeHeaderProgress from '../components/PracticeHeaderProgress/PracticeHeaderProgress';
import styled from 'styled-components';

interface PageState {
  error?: string;
  prep?: StudentPrep;
  isLoading: boolean;
}

const ContentContainer = styled.div`
  display: flex;
  gap: 20px;
  padding: 16px 16px 0 16px;
  height: calc(100vh - var(--total-header-height));
  overflow: hidden;
  width: 100%;
  max-width: 100%;
`;

const SidePanel = styled.div<{ $position: 'left' | 'right' }>`
  display: flex;
  flex-direction: column;
  flex: ${props => props.$position === 'left' ? '1' : '1.2'};
  min-width: ${props => props.$position === 'left' ? '220px' : '280px'};
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  padding: 12px;
  
  ${props => props.$position === 'left' && `
    border-right: 1px solid #e5e7eb;
  `}
  
  ${props => props.$position === 'right' && `
    border-left: 1px solid #e5e7eb;
  `}

  @media (max-width: 1200px) {
    min-width: ${props => props.$position === 'left' ? '200px' : '240px'};
  }
`;

const MainPanel = styled.div`
  flex: 3;
  min-width: 500px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
`;

const PanelTitle = styled(Typography.Title)`
  font-size: 14px !important;
  margin-bottom: 12px !important;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
  color: #64748b;
`;

const PracticePage: React.FC = () => {
  const { prepId } = useParams<{ prepId: string }>();
  const navigate = useNavigate();
  const { 
    prep,
    currentQuestion,
    submitAnswer,
    skipQuestion,
    getPreviousQuestion,
    isQuestionLoading,
    questionState,
    setQuestionState,
    getNext,
    startPrep,
    startPractice
  } = useStudentPrep();
  const { incrementAttempt, hasExceededLimit, getCurrentAttempts, getMaxAttempts } = usePracticeAttempts();
  const { user } = useAuth();
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [state, setState] = useState<PageState>({
    isLoading: false,
    prep: prep || undefined
  });
  const hasInitialized = useRef(false);
  const [activeTab, setActiveTab] = useState('videos');

  const handleContentSelect = useCallback((topic: string) => {
    // Implementation of handleContentSelect
  }, []);

  const handleVideoSelect = useCallback((videoId: string) => {
    // Implementation of handleVideoSelect
  }, []);

  const getTopicName = useCallback((question: Question) => {
    const { topicId, subtopicId } = question.metadata;
    return universalTopics.getMostSpecificTopicName(topicId, subtopicId);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
  }, []);

  // Handle new prep creation
  useEffect(() => {
    const initializePrep = async () => {
      if (!prepId) return;
      
      // Check if this is a new prep request
      if (prepId.startsWith('new/')) {
        const examId = prepId.split('/')[1];
        try {
          setState(prev => ({ ...prev, isLoading: true }));
          const exam = await examService.getExamById(examId);
          if (!exam) {
            throw new Error('Failed to load exam template');
          }
          const newPrepId = await startPrep(exam);
          
          // If user is guest, store the prep ID
          if (!user) {
            PrepStateManager.storeGuestPrepId(newPrepId);
          }
          
          navigate(`/practice/${newPrepId}`, { replace: true });
        } catch (error) {
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Failed to start practice'
          }));
        } finally {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializePrep();
  }, [prepId, startPrep, navigate, user]);

  // Update state.prep when prep changes
  useEffect(() => {
    setState(prev => ({ ...prev, prep: prep || undefined }));
  }, [prep]);

  // Helper function to create new question state
  const createQuestionState = useCallback((question: Question): ActivePracticeQuestion => {
    return {
      question,
      practiceState: {
        status: 'idle',
        currentAnswer: null,
        practiceStartedAt: Date.now(),
        submissions: [],
        helpRequests: []
      }
    };
  }, []);

  const handleSkip = useCallback(async (reason: SkipReason) => {
    await skipQuestion(reason);
  }, [skipQuestion]);

  const handleNext = useCallback(async () => {
    // Show dialog when moving to next question after exceeding limit
    console.log('=== handleNext called ===', {
      hasExceededLimit,
      showLimitDialog,
      isGuest: !user,
      attempts: getCurrentAttempts(),
      maxAttempts: getMaxAttempts()
    });

    if (hasExceededLimit) {
      console.log('Showing limit dialog due to exceeded limit in handleNext');
      setShowLimitDialog(true);
    }
    
    // Always proceed to next question
    await getNext();
  }, [getNext, hasExceededLimit, user, getCurrentAttempts, getMaxAttempts]);

  const handlePrevious = useCallback(() => {
    getPreviousQuestion();
  }, [getPreviousQuestion]);

  const handleSubmit = useCallback(async (answer: FullAnswer) => {
    const currentAttempts = getCurrentAttempts();
    const maxAttempts = getMaxAttempts();
    
    console.log('=== handleSubmit called ===', {
      hasExceededLimit,
      showLimitDialog,
      isGuest: !user,
      currentAttempts,
      maxAttempts
    });

    // First increment the attempt
    await incrementAttempt();
    
    // Always submit the answer
    submitAnswer(answer);
  }, [submitAnswer, incrementAttempt, getCurrentAttempts, getMaxAttempts, user]);

  const handleExamDateChange = useCallback((date: moment.Moment) => {
    if (!state.prep) return;
    
    // Update prep goals with new exam date
    const updatedPrep = {
      ...state.prep,
      goals: {
        ...state.prep.goals,
        examDate: date.valueOf()
      }
    };
    
    setState(prev => ({ ...prev, prep: updatedPrep }));
  }, [state.prep]);

  const handleStartPractice = useCallback(async () => {
    if (!state.prep) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await startPractice();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start practice'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.prep, startPractice]);

  // Add logging for dialog visibility changes
  useEffect(() => {
    console.log('=== Dialog visibility state changed ===', {
      showLimitDialog,
      hasExceededLimit,
      isGuest: !user,
      attempts: getCurrentAttempts(),
      maxAttempts: getMaxAttempts()
    });
  }, [showLimitDialog, hasExceededLimit, user, getCurrentAttempts, getMaxAttempts]);

  if (!prep) {
    return (
      <Result
        status="warning"
        title="No active preparation session"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Return Home
          </Button>
        }
      />
    );
  }

  const activePracticeQuestion = currentQuestion ? {
    question: currentQuestion,
    practiceState: questionState
  } : undefined;

  return (
    <Layout style={{ minHeight: '100vh', width: '100%' }}>
      <div className="practice-headers">
        <PracticeHeader 
          prep={prep}
          isLoading={isQuestionLoading}
          onPrepUpdate={(updatedPrep) => {
            // Handle prep updates if needed
            console.log('Prep updated:', updatedPrep);
          }}
        />
      </div>
      <Layout.Content className="practice-content" style={{ width: '100%' }}>
        {state.error && (
          <Alert
            message="שגיאה"
            description={state.error}
            type="error"
            showIcon
            closable
            onClose={() => setState(prev => ({ ...prev, error: undefined }))}
          />
        )}
        {!currentQuestion && !state.isLoading && !state.error && state.prep && (
          <WelcomeScreen
            onStart={handleStartPractice}
            onExamDateChange={handleExamDateChange}
            prep={state.prep}
          />
        )}
        {state.isLoading && !currentQuestion && (
          <LoadingSpinner />
        )}
        {currentQuestion && state.prep && (
          <ContentContainer className="ContentContainer">
            <SidePanel $position="left">
              <PanelTitle level={4}>תוכן לימודי</PanelTitle>
              {currentQuestion?.data && (
                <div className="related-content">
                  <RelatedContent
                    currentQuestion={currentQuestion.data}
                    subtopicId={currentQuestion.data.metadata.subtopicId || ''}
                    onVideoSelect={handleVideoSelect}
                  />
                </div>
              )}
            </SidePanel>

            <MainPanel className="MainPanel">
              {currentQuestion?.data && (
                <QuestionInteractionContainer
                  question={currentQuestion.data}
                  onSubmit={handleSubmit}
                  onSkip={handleSkip}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  prep={prep}
                  isQuestionLoading={isQuestionLoading}
                  state={questionState}
                  setState={setQuestionState}
                />
              )}
            </MainPanel>

            <SidePanel $position="right">
              <div style={{ marginBottom: '24px' }}>
                <PanelTitle level={4}>פרטים</PanelTitle>
                {currentQuestion?.data && (
                  <QuestionProperties
                    question={currentQuestion.data}
                    questionNumber={questionState.submissions.length + 1}
                    totalQuestions={state.prep.exam.totalQuestions}
                    onSkip={handleSkip}
                  />
                )}
              </div>
              
              <div>
                <PanelTitle level={4}>עזרה</PanelTitle>
                <div style={{ 
                  padding: '16px', 
                  background: '#f8fafc', 
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Typography.Text style={{ color: '#64748b' }}>
                    לחץ על כפתור העזרה בשאלה כדי לקבל הסבר מפורט
                  </Typography.Text>
                </div>
              </div>
            </SidePanel>
          </ContentContainer>
        )}
      </Layout.Content>

      {/* Dialogs handle their own visibility state */}
      {!user && (
        <GuestLimitDialog 
          open={showLimitDialog} 
          onClose={() => {
            console.log('Dialog onClose called, setting showLimitDialog to false');
            setShowLimitDialog(false);
          }} 
        />
      )}
      {user && (
        <UserLimitDialog 
          open={showLimitDialog} 
          onClose={() => setShowLimitDialog(false)}
        />
      )}
    </Layout>
  );
};

export default memo(PracticePage); 