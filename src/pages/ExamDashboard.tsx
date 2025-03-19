// Main dashboard for exam selection and practice
// Contains exam cards and development tools in development mode

import React, { useState, useEffect } from 'react';
import { Typography, Card, Spin, Alert, Button, Divider, Badge, Progress, Space, Row, Col, Input, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardHat,
  GraduationCap,
  Books,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  Play,
  Stop
} from "@phosphor-icons/react";
import Footer from '../components/Footer/Footer';
import { ExamType, type ExamTemplate } from '../types/examTemplate';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { examService } from '../services/examService';
import { MinimalHeader } from '../components/layout/MinimalHeader';
import { PrepStateManager } from '../services/PrepStateManager';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';
import { getUserPreparations, savePreparation } from '../services/preparationService';
import type { PreparationSummary } from '../types/preparation';
import { PrepState, QuestionHistoryEntry } from '../types/prepState';
import { UserHeader } from '../components/layout/UserHeader';
import { CalendarIcon, ArrowLeftIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/dateUtils';
import styled from 'styled-components';
import { 
  CalendarOutlined, 
  QuestionCircleOutlined, 
  TrophyOutlined,
  LineChartOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { 
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const { Title, Text } = Typography;
const { Search: SearchInput } = Input;
const { Option } = Select;

// Define UI colors
const uiColors = {
  background: {
    header: '#ffffff',
    metrics: '#f8fafc'
  },
  border: {
    light: '#e5e7eb',
    separator: '#f0f0f0'
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b'
  }
};

type ExamTypeKey = 'safety' | 'mahat' | 'bagrut';

const isActiveOrCompletedState = (state: PrepState): state is (
  | { 
      status: 'active';
      startedAt: number;
      activeTime: number;
      lastTick: number;
      completedQuestions: number;
      correctAnswers: number;
      questionHistory: QuestionHistoryEntry[];
    }
  | { 
      status: 'paused';
      activeTime: number;
      pausedAt: number;
      completedQuestions: number;
      correctAnswers: number;
      questionHistory: QuestionHistoryEntry[];
    }
  | { 
      status: 'completed';
      activeTime: number;
      completedAt: number;
      completedQuestions: number;
      correctAnswers: number;
      questionHistory: QuestionHistoryEntry[];
    }
  | {
      status: 'error';
      error: string;
      activeTime: number;
      completedQuestions: number;
      correctAnswers: number;
      questionHistory: QuestionHistoryEntry[];
    }
) => {
  return state.status !== 'initializing' && state.status !== 'not_started';
};

interface Preparation {
  id: string;
  name: string;
  examDate: Date;
  progress: number;
  completedQuestions: number;
  totalQuestions: number;
  status: 'active' | 'paused' | 'completed';
  prep_state: {
    state: {
      correctAnswers: number;
    };
  };
}

interface PreparationRowProps {
  preparation: Preparation;
  onComplete: (id: string) => void;
  isCompleting?: boolean;
}

const PreparationRow: React.FC<PreparationRowProps> = ({ preparation, onComplete, isCompleting }) => {
  const navigate = useNavigate();
  const score = preparation.prep_state.state.correctAnswers > 0 
    ? Math.round((preparation.prep_state.state.correctAnswers / (preparation.completedQuestions || 1)) * 100)
    : 0;
  
  // Calculate remaining time
  const now = new Date();
  const examDate = new Date(preparation.examDate);
  const totalDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays);
  
  // Calculate progress percentage (inverse of remaining days)
  const maxDays = 365; // Consider 1 year as maximum
  const timeProgress = Math.min(100, Math.round((1 - (daysRemaining / maxDays)) * 100));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '24px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        opacity: isCompleting ? 0.5 : 1,
        pointerEvents: isCompleting ? 'none' : 'auto'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = '#3b82f6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/practice/${preparation.id}`);
      }}
    >
      <div style={{ 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: '4px', 
        background: '#3b82f6',
        opacity: 0,
        transition: 'opacity 0.2s ease'
      }} />
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '24px',
        flex: 1
      }}>
        <div style={{ flex: '0 0 200px' }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#1e293b',
            marginBottom: '4px'
          }}>
            {preparation.name}
          </div>
        </div>
        <div style={{ flex: '0 0 120px' }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={16} />
              {daysRemaining} ימים נותרו
            </div>
          </div>
        </div>
        <div style={{ flex: '0 0 120px' }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#0284c7',
            background: 'rgba(2, 132, 199, 0.08)',
            padding: '4px 12px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <QuestionCircleOutlined style={{ fontSize: '16px' }} />
            {preparation.totalQuestions}
            <span style={{ 
              color: '#64748b', 
              fontSize: '12px', 
              marginLeft: '4px' 
            }}>
              (<span style={{ color: '#16a34a' }}>{preparation.prep_state.state.correctAnswers}</span> נכונות)
            </span>
          </div>
        </div>
        <div style={{ flex: '0 0 120px' }}>
          <div style={{ 
            fontSize: '14px', 
            color: preparation.completedQuestions === 0 ? '#94a3b8' : 
                   score >= 80 ? '#16a34a' : 
                   score >= 60 ? '#eab308' : 
                   '#ef4444',
            background: preparation.completedQuestions === 0 ? 'transparent' : 
                        score >= 80 ? 'rgba(22, 163, 74, 0.08)' : 
                        score >= 60 ? 'rgba(234, 179, 8, 0.08)' : 
                        'rgba(239, 68, 68, 0.08)',
            padding: '4px 12px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircleOutlined style={{ 
              fontSize: '16px',
              color: preparation.completedQuestions === 0 ? '#94a3b8' : 
                     score >= 80 ? '#16a34a' : 
                     score >= 60 ? '#eab308' : 
                     '#ef4444'
            }} />
            {preparation.completedQuestions === 0 ? '-' : score}
          </div>
        </div>
        <div style={{ flex: '0 0 120px' }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#0284c7',
            background: 'rgba(2, 132, 199, 0.08)',
            padding: '4px 12px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <LineChartOutlined style={{ fontSize: '16px' }} />
            {preparation.progress === 0 ? '-' : `${preparation.progress}/100`}
          </div>
        </div>
        <div style={{ flex: '0 0 200px', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              type="primary"
              style={{
                background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                border: 'none',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '38px',
                borderRadius: '8px',
                padding: '0 16px',
                opacity: isCompleting ? 0.5 : 1,
                pointerEvents: isCompleting ? 'none' : 'auto'
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/practice/${preparation.id}`);
              }}
            >
              <span>המשך תרגול</span>
              <Play weight="fill" size={16} style={{ transform: 'rotate(180deg)' }} />
            </Button>
            <Button
              style={{
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '38px',
                borderRadius: '8px',
                padding: '0 16px',
                opacity: isCompleting ? 0.5 : 1,
                pointerEvents: isCompleting ? 'none' : 'auto'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onComplete(preparation.id);
              }}
            >
              <CheckCircle weight="fill" size={16} />
              <span>סיים</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  width: 100%;
  padding: 16px 24px;
  margin: 0 auto;
  direction: rtl;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const MetricGroup = styled.div<{ $hasBorder?: boolean }>`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: ${props => props.$hasBorder ? '0 0 0 24px' : '0'};
  margin: ${props => props.$hasBorder ? '0 0 0 24px' : '0'};
  border-left: ${props => props.$hasBorder ? `1px solid ${uiColors.border.light}` : 'none'};
  height: 60px;
`;

const MetricSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
`;

const MetricTitle = styled(Text)`
  font-size: 13px;
  color: ${uiColors.text.secondary};
  font-weight: 500;
`;

const MetricValue = styled.div<{ $variant?: 'success' | 'progress' | 'default' | 'warning' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  padding: 0 12px;
  background: ${props => 
    props.$variant === 'success' ? '#f0fdf4' :
    props.$variant === 'progress' ? '#f0f7ff' :
    props.$variant === 'warning' ? '#fefce8' :
    props.$variant === 'error' ? '#fef2f2' :
    '#ffffff'};
  border: 1px solid ${props =>
    props.$variant === 'success' ? '#86efac' :
    props.$variant === 'progress' ? '#93c5fd' :
    props.$variant === 'warning' ? '#fde047' :
    props.$variant === 'error' ? '#fca5a5' :
    uiColors.border.light};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: ${props => 
    props.$variant === 'progress' ? '0 2px 4px rgba(37, 99, 235, 0.1)' : 
    '0 1px 2px rgba(0, 0, 0, 0.05)'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => 
      props.$variant === 'progress' ? '0 4px 8px rgba(37, 99, 235, 0.15)' : 
      '0 2px 6px rgba(0, 0, 0, 0.1)'};
  }
`;

const ProgressBar = styled(Progress)`
  width: 120px;
  margin-right: 8px;
  
  .ant-progress-inner {
    background-color: #e5e7eb !important;
    height: 8px !important;
    border-radius: 4px !important;
  }
  
  .ant-progress-bg {
    transition: all 0.3s ease-out;
    border-radius: 4px !important;
    box-shadow: 0 1px 2px rgba(2, 132, 199, 0.2);
  }
`;

const ExamDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { startPrep, getPrep } = useStudentPrep();
  const { user } = useAuth();
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [examsByType, setExamsByType] = useState<Record<ExamTypeKey, ExamTemplate[]>>({
    safety: [],
    mahat: [],
    bagrut: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePrep, setActivePrep] = useState<any>(null);
  const [loadingActivePrep, setLoadingActivePrep] = useState(false);
  const [userPreparations, setUserPreparations] = useState<PreparationSummary[]>([]);
  const [loadingPreparations, setLoadingPreparations] = useState(false);
  const [completingPrepId, setCompletingPrepId] = useState<string | null>(null);

  // Load user's preparations
  useEffect(() => {
    const loadPreparations = async () => {
      if (!user) return;
      
      try {
        setLoadingPreparations(true);
        const preps = await getUserPreparations();
        setUserPreparations(preps);
      } catch (error) {
        console.error('Error loading user preparations:', error);
      } finally {
        setLoadingPreparations(false);
      }
    };

    loadPreparations();
  }, [user]);

  // Fetch user's active preparation if they're logged in
  useEffect(() => {
    // On the home/dashboard page, DO NOT automatically load active preps
    // This prevents unwanted redirects when landing on the home page
    console.log('Home/Dashboard page: skipping automatic active prep loading');
    
    // Only show active prep if it's already been set by the context
    // This ensures we don't trigger any redirects by attempting to load preps
  }, [user]);

  useEffect(() => {
    console.log('ExamDashboard mounted');
    const loadExams = async () => {
      try {
        console.log('Starting to load exams...');
        setLoading(true);
        const [safetyExams, mahatExams, bagrutExams] = await Promise.all([
          examService.getExamsByType(ExamType.GOVERNMENT_EXAM),
          examService.getExamsByType(ExamType.MAHAT_EXAM),
          examService.getExamsByType(ExamType.BAGRUT_EXAM)
        ]);

        console.log('Loaded exams:', {
          safety: safetyExams.length,
          mahat: mahatExams.length,
          bagrut: bagrutExams.length
        });

        // Manually add safety-related exams to safety section
        const safetyRelatedIds = ['mahat_civil_safety', 'construction_manager_certification', 'construction_manager_safety_full', 'renovation_contractor_131'];
        const allSafetyExams = [...safetyExams];
        
        // Add any matching exams from mahat section
        mahatExams.forEach((exam: ExamTemplate) => {
          if (safetyRelatedIds.includes(exam.id)) {
            allSafetyExams.push(exam);
          }
        });

        setExamsByType({
          safety: allSafetyExams,
          mahat: mahatExams,
          bagrut: bagrutExams
        });
      } catch (error) {
        console.error('Error loading exams:', error);
        setError(error instanceof Error ? error.message : 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  // Add loading and error UI
  if (loading) {
    return (
      <>
        {user ? (
          <UserHeader
            variant="default"
            pageType="בחינות"
            pageContent="מרכז הבחינות"
          />
        ) : (
          <MinimalHeader />
        )}
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          paddingTop: '64px' // Account for header height
        }}>
          <Spin size="large" />
          <Text>טוען בחינות...</Text>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {user ? (
          <UserHeader
            variant="default"
            pageType="בחינות"
            pageContent="מרכז הבחינות"
          />
        ) : (
          <MinimalHeader />
        )}
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingTop: '64px' // Account for header height
        }}>
          <Alert
            message="שגיאה בטעינת הבחינות"
            description={error}
            type="error"
            showIcon
          />
        </div>
      </>
    );
  }

  const examTypes = [
    {
      id: 'safety' as const,
      title: 'בטיחות',
      icon: <HardHat weight="duotone" />,
      color: '#3b82f6',
      description: 'מנהל עבודה, ממונה בטיחות, קבלן שיפוצים'
    },
    {
      id: 'mahat' as const,
      title: 'מה״ט',
      icon: <GraduationCap weight="duotone" />,
      color: '#10b981',
      description: 'הנדסת תוכנה, הנדסה אזרחית'
    },
    {
      id: 'bagrut' as const,
      title: 'בגרות',
      icon: <Books weight="duotone" />,
      color: '#6366f1',
      description: 'מתמטיקה, פיזיקה, מחשבים'
    }
  ] as const;

  // Update all navigation calls
  const handlePracticeClick = (prepId: string) => {
    navigate(`/practice/${prepId}`);
  };

  const handleStartPrep = async (examId: string) => {
    try {
      const examTemplate = examsByType.safety.find(e => e.id === examId) ||
                          examsByType.mahat.find(e => e.id === examId) ||
                          examsByType.bagrut.find(e => e.id === examId);
      
      if (!examTemplate) {
        throw new Error('Exam template not found');
      }
      
      const prepId = await startPrep(examTemplate);
      navigate(`/practice/${prepId}`);
    } catch (error) {
      console.error('Failed to start preparation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start preparation');
    }
  };

  const handleComplete = async (prepId: string) => {
    try {
      // Set the completing state to trigger animation
      setCompletingPrepId(prepId);

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const prep = await PrepStateManager.getPrep(prepId);
      if (!prep) {
        console.error('Could not find prep to complete:', prepId);
        return;
      }

      // Complete the preparation
      const completedPrep = await PrepStateManager.complete(prep);
      
      // Update the local state
      setUserPreparations(prev => 
        prev.map(p => 
          p.id === prepId 
            ? { ...p, status: 'completed', prep_state: completedPrep }
            : p
        )
      );

      // Clear the completing state
      setCompletingPrepId(null);
    } catch (error) {
      console.error('Error completing preparation:', error);
      setError('Failed to complete preparation');
      setCompletingPrepId(null);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      overflow: 'visible'
    }}>
      {user ? (
        <UserHeader
          variant="default"
          pageType="בחינות"
          pageContent="מרכז הבחינות"
        />
      ) : (
        <MinimalHeader />
      )}

      {/* Header Section */}
      {!user && (
        <div style={{ 
          padding: '40px 24px', 
          background: '#ffffff', 
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <img
                src="/EZpass_A6_cut.png"
                alt="איזיפס"
                style={{ height: '64px' }}
              />
              <div style={{
                width: '2px',
                height: '40px',
                background: '#e5e7eb'
              }} />
              <Text style={{ 
                fontSize: '28px', 
                color: '#ff9800',
                fontWeight: 400,
                margin: 0
              }}>
                פשוט להצליח
              </Text>
            </div>
            <Title level={2} style={{ fontSize: '48px', margin: 0 }}>
              בחר בחינה והתחל לתרגל עכשיו.
            </Title>
          </div>
        </div>
      )}

      {/* User Preparations Section */}
      {user && userPreparations.filter(prep => prep.status !== 'completed').length > 0 && (
        <div style={{
          background: '#f8fafc',
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px' 
            }}>
              <Title level={4} style={{ margin: 0, textAlign: 'right' }}>
                המבחנים שלך
              </Title>
            </div>
            
            <div style={{ 
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{ marginTop: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '24px',
                  padding: '0 24px',
                  marginBottom: '16px',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  <div style={{ flex: '0 0 200px' }}>שם הבחינה</div>
                  <div style={{ flex: '0 0 120px' }}>תאריך הבחינה</div>
                  <div style={{ flex: '0 0 120px' }}>שאלות</div>
                  <div style={{ flex: '0 0 120px' }}>ציון</div>
                  <div style={{ flex: '0 0 120px', textAlign: 'right' }}>התקדמות</div>
                  <div style={{ flex: '0 0 200px', display: 'flex', justifyContent: 'flex-start' }}>פעולות</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {userPreparations
                    .filter(prep => prep.status !== 'completed')
                    .map((prep) => (
                      <motion.div
                        key={prep.id}
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ 
                          opacity: completingPrepId === prep.id ? 0 : 1,
                          y: completingPrepId === prep.id ? -20 : 0
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{ marginBottom: '16px' }}
                      >
                        <PreparationRow
                          preparation={{
                            id: prep.id,
                            name: prep.name,
                            examDate: new Date(prep.prep_state.goals.examDate),
                            progress: prep.progress,
                            completedQuestions: prep.completedQuestions,
                            totalQuestions: prep.totalQuestions || 100,
                            status: prep.status,
                            prep_state: {
                              state: {
                                correctAnswers: prep.prep_state.state.status !== 'initializing' && prep.prep_state.state.status !== 'not_started' 
                                  ? prep.prep_state.state.correctAnswers 
                                  : 0
                              }
                            }
                          }}
                          onComplete={handleComplete}
                          isCompleting={completingPrepId === prep.id}
                        />
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Divider and Exam Cards Section */}
      <div style={{ 
        padding: '24px 24px 48px 24px', 
        background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)',
        flex: 1
      }}>
        {user && userPreparations.filter(prep => prep.status !== 'completed').length > 0 && (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto 32px auto',
          }}>
            <Divider style={{ margin: '0 0 32px 0' }}>
              <Text style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#ffffff',
                padding: '8px 24px',
                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                borderRadius: '20px',
                boxShadow: '0 4px 8px rgba(59, 130, 246, 0.25)'
              }}>
                או התחל מבחן חדש
              </Text>
            </Divider>
          </div>
        )}

        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 350px)',
          justifyContent: 'center',
          gap: '32px',
          padding: '24px'
        }}>
          <AnimatePresence>
            {examTypes.map((type, index) => (
              <motion.div 
                key={type.id}
                layout
                style={{
                  perspective: '2000px',
                  width: '350px',
                  position: 'relative',
                  gridColumn: flippedCard === type.id ? '1 / -1' : 'auto',
                  gridRow: flippedCard === type.id ? '1' : 'auto',
                  justifySelf: flippedCard === type.id ? 'center' : 'auto',
                  alignSelf: flippedCard === type.id ? 'start' : 'auto'
                }}
                animate={{ 
                  opacity: flippedCard ? (flippedCard === type.id ? 1 : 0) : 1,
                  y: flippedCard ? (
                    flippedCard === type.id ? 0 : 100
                  ) : 0,
                  scale: 1,
                  zIndex: flippedCard === type.id ? 10 : 1
                }}
                transition={{ 
                  layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.3 },
                  y: { 
                    duration: 0.5,
                    ease: [0.4, 0, 0.2, 1],
                    delay: flippedCard === type.id ? 0 : index * 0.1
                  }
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ 
                    rotateY: flippedCard === type.id ? 180 : 0,
                    height: flippedCard === type.id ? 'auto' : 500
                  }}
                  transition={{ 
                    rotateY: {
                      duration: 0.8,
                      type: "spring",
                      stiffness: 60,
                      damping: 15,
                      delay: flippedCard === type.id ? 0.3 : 0
                    },
                    height: {
                      duration: 0.5,
                      ease: [0.4, 0, 0.2, 1],
                      delay: 1.1
                    }
                  }}
                  style={{
                    width: '350px',
                    minHeight: '500px',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    cursor: 'pointer'
                  }}
                >
                  {/* Front of Card */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      width: '350px',
                      height: flippedCard === type.id ? '100%' : '500px',
                      backfaceVisibility: 'hidden',
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      border: '1px solid #e5e7eb',
                      padding: '48px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '32px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      WebkitBackfaceVisibility: 'hidden',
                      transformOrigin: 'center',
                      transformStyle: 'preserve-3d'
                    }}
                    onClick={() => setFlippedCard(type.id)}
                    whileHover={!flippedCard ? { y: -8 } : {}}
                  >
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '28px',
                      background: `${type.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '72px',
                      color: type.color
                    }}>
                      {type.icon}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={2} style={{ 
                        margin: 0,
                        marginBottom: '12px',
                        fontSize: '32px',
                        color: type.color,
                        fontWeight: 600
                      }}>
                        {type.title}
                      </Title>
                      <Text style={{ 
                        fontSize: '16px',
                        color: '#64748b',
                        display: 'block',
                        lineHeight: '1.5',
                        maxWidth: '280px',
                        margin: '0 auto'
                      }}>
                        {type.description}
                      </Text>
                    </div>
                  </motion.div>

                  {/* Back of Card */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      width: '350px',
                      height: flippedCard === type.id ? '100%' : '500px',
                      backfaceVisibility: 'hidden',
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      border: '1px solid #e5e7eb',
                      padding: '24px 20px',
                      transform: 'rotateY(180deg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      WebkitBackfaceVisibility: 'hidden',
                      transformOrigin: 'center',
                      transformStyle: 'preserve-3d',
                      overflow: 'auto'
                    }}
                  >
                    <motion.div
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlippedCard(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        width: 'fit-content',
                        marginBottom: '8px'
                      }}
                      whileHover={{ x: -5 }}
                    >
                      <ArrowLeft weight="bold" size={20} />
                      <Text style={{ fontSize: '14px' }}>חזרה</Text>
                    </motion.div>

                    {examsByType[type.id]?.map((exam: ExamTemplate, index: number) => (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          try {
                            setError(null);
                            console.log('Starting preparation for exam:', exam.id, exam.names.short);
                            
                            // Check if there's an existing preparation for this exam
                            const existingPrep = userPreparations.find(prep => 
                              prep.examId === exam.id && 
                              (prep.status === 'active' || prep.status === 'paused')
                            );

                            if (existingPrep) {
                              console.log('Continuing existing preparation:', existingPrep.id);
                              navigate(`/practice/${existingPrep.id}`);
                              return;
                            }
                            
                            // Create new preparation
                            try {
                              const prepId = await startPrep(exam);
                              console.log('Created new preparation:', prepId);
                              
                              if (!prepId) {
                                throw new Error('Failed to create preparation: Invalid ID');
                              }
                              
                              navigate(`/practice/${prepId}`);
                            } catch (prepError) {
                              console.error('Error creating preparation:', prepError);
                              throw new Error('Failed to create preparation');
                            }
                          } catch (error) {
                            console.error('Failed to handle exam selection:', error);
                            setError(error instanceof Error ? error.message : 'Failed to handle exam selection');
                          }
                        }}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                        whileHover={{
                          backgroundColor: '#f8fafc',
                          scale: 1.02,
                          borderColor: type.color,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <Text strong style={{ 
                          fontSize: '16px', 
                          color: type.color,
                          flex: 1,
                          minWidth: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {exam.names.short}
                        </Text>
                        <ArrowLeft weight="bold" style={{ 
                          color: type.color,
                          flexShrink: 0,
                          fontSize: '16px'
                        }} />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {error && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          zIndex: 1000
        }}>
          <Alert message={error} type="error" showIcon />
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        .preparation-row {
          position: relative;
          overflow: hidden;
        }
        
        .preparation-row::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background: #2563eb;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .preparation-row:hover {
          background-color: #f8fafc !important;
        }
        
        .preparation-row:hover::after {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ExamDashboard;