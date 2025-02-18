import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { Alert, Space, Button, Spin } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import QuestionDisplay from '../components/QuestionDisplay';

const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const { prepId } = useParams();
  const { 
    currentExam,
    practiceState,
    startPractice,
    submitPracticeAnswer,
    endPractice,
    getNextPracticeQuestion,
    setCurrentQuestion,
    currentQuestion
  } = useExam();
  
  const { activePrep } = useStudentPrep();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize practice when component mounts
  useEffect(() => {
    const initializePractice = async () => {
      if (!prepId || initialized) return;

      try {
        setLoading(true);
        setError(null);

        // Get prep instance
        const prep = activePrep;
        if (!prep || prep.id !== prepId) {
          setError('לא נמצא מידע על התרגול המבוקש');
          return;
        }

        // Start practice with selected topics
        await startPractice(
          prep.formalExam,
          prep.formalExam.topics.filter(t => prep.content.selectedTopics.includes(t.id)),
          prep.content.difficulty
        );

        // Wait for state updates
        await new Promise<void>(resolve => setTimeout(resolve));
        
        // Verify practice state is initialized
        if (!practiceState) {
          throw new Error('Practice state initialization failed');
        }
        
        // Get the first question
        const firstQuestion = await getNextPracticeQuestion();
        setCurrentQuestion(firstQuestion);
        
        // Mark as initialized
        setInitialized(true);
        
      } catch (error) {
        console.error('Practice initialization error:', error);
        if (error instanceof Error && error.message === 'No active practice session') {
          setError('אין תרגול פעיל');
        } else {
          setError('אירעה שגיאה בטעינת התרגול');
        }
      } finally {
        setLoading(false);
      }
    };

    initializePractice();
  }, [prepId, activePrep, startPractice, getNextPracticeQuestion, setCurrentQuestion, initialized]);

  // Reset initialization when prep changes
  useEffect(() => {
    if (!activePrep || activePrep.id !== prepId) {
      setInitialized(false);
    }
  }, [activePrep, prepId]);

  const handleAnswer = async (answer: string, isCorrect: boolean) => {
    try {
      await submitPracticeAnswer(answer, isCorrect);
      const nextQuestion = await getNextPracticeQuestion();
      setCurrentQuestion(nextQuestion);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get next question');
    }
  };

  if (error) {
    return (
      <div className="practice-page">
        <Alert
          message="שגיאה"
          description={error === 'No active practice session' ? 'אין תרגול פעיל' : error}
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate('/exams')} type="primary">
              חזרה לדף הבית
            </Button>
          }
        />
      </div>
    );
  }

  if (loading || !practiceState || !currentQuestion || !activePrep) {
    return (
      <div className="practice-page loading">
        <Spin size="large" />
        <p>טוען תרגול...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <QuestionDisplay
        question={currentQuestion}
        onNext={async () => {
          try {
            const nextQuestion = await getNextPracticeQuestion();
            setCurrentQuestion(nextQuestion);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to get next question');
          }
        }}
        onHelp={(action) => {
          console.log('Help requested:', action);
          // TODO: Implement help functionality
        }}
      />
    </div>
  );
};

export default PracticePage; 