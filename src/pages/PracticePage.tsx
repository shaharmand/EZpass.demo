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
import styled, { css } from 'styled-components';
import { ExamContentDialog } from '../components/practice/ExamContentDialog';

interface PageState {
  error?: string;
  prep?: StudentPrep;
  isLoading: boolean;
}

interface StyledContainerProps {
  $isVideoPlaying: boolean;
}

interface StyledSidePanelProps {
  $position: 'left' | 'right';
  $isCollapsed?: boolean;
  $isExpanded?: boolean;
}

const ContentContainer = styled.div<StyledContainerProps>`
  display: flex;
  gap: 12px;
  padding: 24px 24px 12px 24px;
  height: calc(100vh - var(--total-header-height));
  overflow: hidden;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  transition: all 0.3s ease;

  @media (max-width: 1600px) {
    padding: 20px 20px 10px 20px;
  }

  @media (max-width: 1366px) {
    gap: 8px;
    padding: 16px 16px 8px 16px;
  }
`;

const SidePanel = styled.div<StyledSidePanelProps>`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: all 0.3s ease;
  height: 100%;
  margin-bottom: 0;
  
  /* Left panel (properties) */
  ${props => props.$position === 'left' && css`
    flex: ${props.$isCollapsed ? '0 0 0' : '1 1 320px'};
    border-right: 1px solid #e5e7eb;
    min-width: ${props.$isCollapsed ? '0' : '280px'};
    max-width: ${props.$isCollapsed ? '0' : '320px'};
    
    @media (min-width: 1920px) {
      flex: ${props.$isCollapsed ? '0 0 0' : '1 1 360px'};
      min-width: ${props.$isCollapsed ? '0' : '320px'};
      max-width: ${props.$isCollapsed ? '0' : '360px'};
    }
    
    @media (max-width: 1366px) {
      flex: ${props.$isCollapsed ? '0 0 0' : '1 1 280px'};
      min-width: ${props.$isCollapsed ? '0' : '240px'};
      max-width: ${props.$isCollapsed ? '0' : '280px'};
    }
  `};
  
  /* Right panel (learning content) */
  ${props => props.$position === 'right' && css`
    flex: ${props.$isCollapsed ? '0 0 0' : props.$isExpanded ? '1 1 960px' : '1 1 480px'};
    border-left: 1px solid #e5e7eb;
    min-width: ${props.$isCollapsed ? '0' : props.$isExpanded ? '960px' : '400px'};
    max-width: ${props.$isCollapsed ? '0' : props.$isExpanded ? '1280px' : '480px'};
    
    @media (min-width: 1920px) {
      flex: ${props.$isCollapsed ? '0 0 0' : props.$isExpanded ? '1 1 1280px' : '1 1 560px'};
      min-width: ${props.$isCollapsed ? '0' : props.$isExpanded ? '1280px' : '480px'};
      max-width: ${props.$isCollapsed ? '0' : props.$isExpanded ? '1440px' : '560px'};
    }
    
    @media (max-width: 1366px) {
      flex: ${props.$isCollapsed ? '0 0 0' : props.$isExpanded ? '1 1 720px' : '1 1 400px'};
      min-width: ${props.$isCollapsed ? '0' : props.$isExpanded ? '720px' : '360px'};
      max-width: ${props.$isCollapsed ? '0' : props.$isExpanded ? '840px' : '400px'};
    }
  `};

  padding: ${props => props.$isCollapsed ? '0' : '12px 12px 4px 12px'};
  opacity: ${props => props.$isCollapsed ? '0' : '1'};
  visibility: ${props => props.$isCollapsed ? 'hidden' : 'visible'};
`;

const MainPanel = styled.div<StyledContainerProps>`
  flex: ${props => props.$isVideoPlaying ? '1 1 400px' : '1.5 1.5 auto'};
  min-width: ${props => props.$isVideoPlaying ? '400px' : '480px'};
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  padding: 16px 16px 4px 16px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  margin: 0 12px;
  margin-bottom: 0;

  @media (max-width: 1366px) {
    padding: 12px 12px 4px 12px;
    margin: 0 8px;
    min-width: ${props => props.$isVideoPlaying ? '360px' : '400px'};
  }
`;

const PanelTitle = styled(Typography.Title)<{ collapsed?: boolean }>`
  font-size: 14px !important;
  margin-bottom: 12px !important;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
  
  .collapse-icon {
    font-size: 12px;
    transition: transform 0.3s ease;
    transform: ${props => props.collapsed ? 'rotate(-90deg)' : 'rotate(0)'};
  }
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
    startPractice,
    setPrep
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
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const [helpCollapsed, setHelpCollapsed] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isExamContentOpen, setIsExamContentOpen] = useState(false);

  const handleContentSelect = useCallback((topic: string) => {
    // Implementation of handleContentSelect
  }, []);

  const getTopicName = useCallback((question: Question) => {
    const { topicId, subtopicId } = question.metadata;
    return universalTopics.getMostSpecificTopicName(topicId, subtopicId);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
  }, []);

  // Handle prep initialization
  useEffect(() => {
    const initializePrep = async () => {
      if (!prepId) return;
      
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Check if this is a new prep request
        if (prepId.startsWith('new/')) {
          const examId = prepId.split('/')[1];
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
        } else {
          // Load existing prep data
          console.log('Loading existing prep data for ID:', prepId);
          
          // Get prep from storage
          const existingPrep = PrepStateManager.getPrep(prepId);
          if (!existingPrep) {
            throw new Error('Practice session not found');
          }
          
          // Initialize progress tracker with existing data
          const tracker = PrepStateManager.getHeaderMetrics(existingPrep);
          console.log('Loaded prep progress:', tracker);
          
          // Initialize question sequencer if needed
          const questionSequencer = PrepStateManager.getSetProgress(prepId);
          console.log('Loaded question sequencer state:', questionSequencer);
          
          // Update state with loaded prep
          setState(prev => ({ 
            ...prev, 
            prep: existingPrep,
            isLoading: false 
          }));
        }
      } catch (error) {
        console.error('Error initializing prep:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize practice session',
          isLoading: false
        }));
      }
    };

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializePrep();
    }
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

  useEffect(() => {
    const handleVideoPlayingState = (event: CustomEvent<{ isPlaying: boolean }>) => {
      setIsVideoPlaying(event.detail.isPlaying);
    };

    window.addEventListener('videoPlayingStateChanged', handleVideoPlayingState as EventListener);
    return () => {
      window.removeEventListener('videoPlayingStateChanged', handleVideoPlayingState as EventListener);
    };
  }, []);

  // Add handler for showing exam content
  const handleShowTopicDetails = () => {
    setIsExamContentOpen(true);
  };

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
    <Layout style={{ minHeight: '100vh', width: '100%', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div className="practice-headers">
        <UserHeader 
          variant="practice"
          pageType="תרגול שאלות"
          pageContent={prep?.exam.names?.full }
        />
        <PracticeHeaderProgress 
          prep={prep}
          onShowTopicDetails={handleShowTopicDetails}
          metrics={PrepStateManager.getHeaderMetrics(prep)}
        />
      </div>
      <Layout.Content className="practice-content">
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
          <ContentContainer $isVideoPlaying={isVideoPlaying}>
            {/* Learning content panel on the right */}
            <SidePanel 
              $position="right" 
              $isCollapsed={false}
              $isExpanded={isVideoPlaying}
            >
              <PanelTitle level={4}>תוכן לימודי</PanelTitle>
              {currentQuestion?.data && (
                <div className="related-content" style={{ height: '100%' }}>
                  <RelatedContent
                    currentQuestion={currentQuestion.data}
                    subtopicId={currentQuestion.data.metadata.subtopicId || ''}
                    isVideoPlaying={isVideoPlaying}
                    onVideoPlayingChange={setIsVideoPlaying}
                  />
                </div>
              )}
            </SidePanel>

            {/* Main content in the middle */}
            <MainPanel $isVideoPlaying={isVideoPlaying}>
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

            {/* Properties panel on the left */}
            <SidePanel $position="left" $isCollapsed={isVideoPlaying}>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: '1 1 auto', marginBottom: '24px' }}>
                  <PanelTitle 
                    level={4}
                    onClick={() => setPropertiesCollapsed(!propertiesCollapsed)}
                    collapsed={propertiesCollapsed}
                  >
                    פרטי שאלה
                    <span className="collapse-icon">
                      {propertiesCollapsed ? '▶' : '▼'}
                    </span>
                  </PanelTitle>
                  {!propertiesCollapsed && currentQuestion?.data && (
                    <QuestionProperties
                      question={currentQuestion.data}
                      questionNumber={questionState.submissions.length + 1}
                      totalQuestions={state.prep.exam.totalQuestions}
                      onSkip={handleSkip}
                    />
                  )}
                </div>
                
                <div style={{ flex: '1 1 auto' }}>
                  <PanelTitle 
                    level={4}
                    onClick={() => setHelpCollapsed(!helpCollapsed)}
                    collapsed={helpCollapsed}
                  >
                    עזרה
                    <span className="collapse-icon">
                      {helpCollapsed ? '▶' : '▼'}
                    </span>
                  </PanelTitle>
                  {!helpCollapsed && (
                    <div style={{ 
                      padding: '16px', 
                      background: '#f0f9ff', 
                      borderRadius: '6px',
                      border: '1px solid #bae6fd'
                    }}>
                      <Typography.Text style={{ color: '#1890ff', fontWeight: 500 }}>
                        עזרה אישית בקרוב
                      </Typography.Text>
                    </div>
                  )}
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

      {/* Add ExamContentDialog */}
      {prep && isExamContentOpen && (
        <ExamContentDialog
          key={`exam-content-${Date.now()}`}
          open={true}
          onClose={async () => {
            console.log('🔄 PracticePage - Dialog onClose triggered');
            
            // Get the fresh prep state after the dialog's update
            const updatedPrep = PrepStateManager.getPrep(prep.id);
            if (updatedPrep) {
              console.log('📚 PracticePage - Got updated prep:', {
                oldTopics: prep.selection.subTopics.length,
                newTopics: updatedPrep.selection.subTopics.length,
                timestamp: new Date().toISOString()
              });

              // Update local state with fresh prep
              setState(prev => ({ 
                ...prev, 
                prep: updatedPrep
              }));
            }
            
            console.log('🚪 PracticePage - Closing dialog');
            setIsExamContentOpen(false);
          }}
          exam={prep.exam}
          prepId={prep.id}
          onPrepUpdate={(updatedPrep) => {
            console.log('📚 PracticePage - Received prep update:', {
              oldTopics: prep.selection.subTopics.length,
              newTopics: updatedPrep.selection.subTopics.length,
              timestamp: new Date().toISOString()
            });

            // Update local state with fresh prep
            setState(prev => ({ 
              ...prev, 
              prep: updatedPrep
            }));
          }}
        />
      )}
    </Layout>
  );
};

export default memo(PracticePage); 