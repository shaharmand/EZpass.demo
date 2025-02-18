import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { Alert, Space, Button, Spin, Typography, Card } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import PracticeQuestionDisplay from '../components/practice/PracticeQuestionDisplay';
import { PracticeHeader } from '../components/PracticeHeader';

const { Title } = Typography;

const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const { prepId } = useParams();
  const { 
    selectedExam,
    practiceState,
    startPractice,
    submitPracticeAnswer,
    endPractice,
    getNextPracticeQuestion,
    setCurrentQuestion,
    currentQuestion
  } = useExam();
  
  const { activePrep, setActivePrep, getStoredPrep } = useStudentPrep();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [currentPrep, setCurrentPrep] = useState<any>(null);
  
  // Request locking mechanism
  const isRequestInProgress = useRef(false);
  const isComponentMounted = useRef(true);

  // Debug logging for component state
  console.log('PracticePage Render:', {
    prepId,
    loading,
    error,
    initialized,
    hasActivePrep: !!activePrep,
    hasPracticeState: !!practiceState,
    hasCurrentQuestion: !!currentQuestion,
    requestInProgress: isRequestInProgress.current
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  // Load prep data on mount
  useEffect(() => {
    const loadPrepData = async () => {
      if (!prepId) return;

      try {
        setLoading(true);
        
        // First check if this is the active prep
        if (activePrep && activePrep.id === prepId) {
          setCurrentPrep(activePrep);
          return;
        }

        // If not active, try to load from storage
        const storedPrep = await getStoredPrep(prepId);
        if (storedPrep) {
          setCurrentPrep(storedPrep);
          return;
        }

        // If we couldn't find the prep, show error
        setError('לא נמצא מידע על התרגול המבוקש');
      } catch (error) {
        console.error('Error loading prep:', error);
        setError('אירעה שגיאה בטעינת התרגול');
      } finally {
        setLoading(false);
      }
    };

    loadPrepData();
  }, [prepId, activePrep, getStoredPrep]);

  // Initialize practice when component mounts
  useEffect(() => {
    const initializePractice = async () => {
      console.log('🔄 Checking initialization conditions:', {
        prepId,
        initialized,
        requestInProgress: isRequestInProgress.current,
        activePrep: !!activePrep
      });

      if (!prepId || initialized || isRequestInProgress.current) {
        console.log('⏭️ Skipping practice initialization:', {
          reason: !prepId ? 'no prepId' : initialized ? 'already initialized' : 'request in progress'
        });
        return;
      }

      try {
        console.log('🚀 Starting initialization process');
        isRequestInProgress.current = true;
        setLoading(true);
        setError(null);

        // Get prep instance
        const prep = activePrep;
        if (!prep || prep.id !== prepId) {
          console.error('❌ No matching prep found:', { prepId, activePrepId: prep?.id });
          setError('לא נמצא מידע על התרגול המבוקש');
          setLoading(false);
          isRequestInProgress.current = false;
          return;
        }

        console.log('📋 Starting practice with:', {
          prepId,
          examId: prep.exam.id,
          selectedTopics: prep.selectedTopics
        });

        // Start practice with selected topics
        await startPractice(
          prep.exam,
          prep.selectedTopics
        );

        console.log('🎯 Practice started, fetching first question');
        // Get first question
        const firstQuestion = await getNextPracticeQuestion();
        console.log('📝 First question received:', {
          questionId: firstQuestion?.id,
          hasQuestion: !!firstQuestion
        });
        
        if (isComponentMounted.current) {
          console.log('✅ Updating component state');
          setActivePrep({
            ...prep,
            status: 'in_progress'
          });

          setCurrentQuestion(firstQuestion);
          setInitialized(true);
          setLoading(false);
          console.log('🏁 Initialization complete:', {
            hasQuestion: !!firstQuestion,
            initialized: true,
            loading: false
          });
        } else {
          console.log('⚠️ Component unmounted during initialization');
        }
      } catch (error) {
        console.error('❌ Error during initialization:', error);
        if (isComponentMounted.current) {
          setError(error instanceof Error ? error.message : 'אירעה שגיאה בהתחלת התרגול');
          setLoading(false);
        }
      } finally {
        if (isComponentMounted.current) {
          isRequestInProgress.current = false;
          console.log('🔓 Request lock released');
        }
      }
    };

    initializePractice();
  }, [prepId, initialized, activePrep, startPractice, getNextPracticeQuestion, setCurrentQuestion, setActivePrep]);

  // Handle practice completion
  useEffect(() => {
    if (practiceState && activePrep && !isRequestInProgress.current) {
      // Update prep status when practice is completed
      if (practiceState.currentQuestionIndex >= practiceState.answers.length) {
        setActivePrep({
          ...activePrep,
          status: 'completed',
          completedAt: new Date().toISOString()
        });
      }
    }
  }, [practiceState, activePrep, setActivePrep]);

  const handleAnswer = async (answer: string, isCorrect: boolean) => {
    if (isRequestInProgress.current || !isComponentMounted.current) return;

    try {
      isRequestInProgress.current = true;
      setLoading(true);
      
      await submitPracticeAnswer(answer, isCorrect);
      
      if (isComponentMounted.current) {
        const nextQuestion = await getNextPracticeQuestion();
        setCurrentQuestion(nextQuestion);
      }
    } catch (error) {
      if (isComponentMounted.current) {
        setError(error instanceof Error ? error.message : 'אירעה שגיאה בשליחת התשובה');
      }
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
        isRequestInProgress.current = false;
      }
    }
  };

  // Get prep instance early
  if (!prepId || !currentPrep) {
    return (
      <div style={{ 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Alert
          message="שגיאה"
          description={error || 'לא נמצא מידע על התרגול המבוקש'}
          type="error"
          showIcon
        />
        <Space>
          <Button 
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
          >
            חזרה לדף הבית
          </Button>
        </Space>
      </div>
    );
  }

  // If we're here, we have a valid practice - always show header
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Practice Header - Always visible when practice exists */}
      <PracticeHeader prep={currentPrep} />
      
      <div style={{ 
        padding: '24px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        width: '100%',
        flex: 1
      }}>
        {error ? (
          <Alert
            message="שגיאה"
            description={error}
            type="error"
            showIcon
          />
        ) : loading && !initialized ? (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh'
          }}>
            <Spin size="large" />
          </div>
        ) : currentQuestion ? (
          <Card>
            <PracticeQuestionDisplay
              question={currentQuestion}
              onAnswer={handleAnswer}
            />
          </Card>
        ) : initialized ? (
          <Card style={{ textAlign: 'center', padding: '48px' }}>
            <Space direction="vertical" size="large">
              <Title level={3}>התרגול הסתיים</Title>
              <Button 
                type="primary"
                size="large"
                onClick={() => navigate('/')}
              >
                חזרה לדף הבית
              </Button>
            </Space>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default PracticePage; 