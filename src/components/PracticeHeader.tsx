import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Spin, Dropdown, DatePicker, notification, Drawer } from 'antd';
import type { MenuProps } from 'antd';
import { 
  UserOutlined, LoginOutlined, ExperimentFilled,
  SettingOutlined, CalendarOutlined
} from '@ant-design/icons';
import moment, { Moment } from 'moment';
import { usePracticeProgress } from '../hooks/usePracticeProgress';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import type { StudentPrep } from '../types/prepState';
import { formatTimeUntilExam } from '../utils/dateUtils';
import { PrepConfigDialog } from './practice/PrepConfigDialog';
import { ExamContentDialog } from './practice/ExamContentDialog';
import type { Question } from '../types/question';
import PracticeHeaderProgress from './PracticeHeaderProgress/PracticeHeaderProgress';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PrepStateManager } from '../services/PrepStateManager';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './Auth/AuthModal';

const { Text, Title } = Typography;

// Consistent color scheme
const colors = {
  background: {
    header: '#ffffff',
    metrics: '#f8fafc', // Lighter gray for metrics section
    highlight: '#f0f7ff'
  },
  border: {
    light: '#e5e7eb',
    separator: '#f0f0f0'
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    brand: '#3b82f6'
  },
  icon: {
    left: '#ff9800', // Warmer orange for left part
    right: '#3b82f6' // Consistent blue for right part
  }
};

interface QuestionState {
  feedback?: {
    score: number;
    isCorrect: boolean;
  };
}

interface PracticeQuestion {
  question: Question;
  state: QuestionState;
}

interface PracticeHeaderProps {
  prepId: string;
}

export const PracticeHeader: React.FC<PracticeHeaderProps> = ({ prepId }) => {
  const { getPrep } = useStudentPrep();
  const [prep, setPrep] = useState<StudentPrep | null>(null);
  const { metrics, isLoading } = usePracticeProgress();
  const { startPrep } = useStudentPrep();
  const [configOpen, setConfigOpen] = useState(false);
  const navigate = useNavigate();
  const [examContentOpen, setExamContentOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const loadPrep = async () => {
      // Get fresh prep state from storage
      const freshPrep = PrepStateManager.getPrep(prepId);
      if (freshPrep) {
        // Only update if the state has actually changed
        if (!prep || 
            freshPrep.state.status !== prep.state.status ||
            ('activeTime' in freshPrep.state && 'activeTime' in prep.state && freshPrep.state.activeTime !== prep.state.activeTime) ||
            ('completedQuestions' in freshPrep.state && 'completedQuestions' in prep.state && freshPrep.state.completedQuestions !== prep.state.completedQuestions)
        ) {
          setPrep(freshPrep);
        }
      }
    };
    
    // Load immediately
    loadPrep();

    // Set up interval to refresh prep state - use 2 seconds instead of 1
    const refreshInterval = setInterval(loadPrep, 2000);

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [prepId, prep]); // Add prep as dependency to compare states

  if (!prep) return null; // Return nothing if no prep
  
  // Calculate topic counts
  const topicCount = prep.exam.topics?.length || 0;
  const subTopicCount = prep.exam.topics?.reduce(
    (count: number, topic) => count + (topic.subTopics?.length || 0), 
    0
  ) || 0;

  const headerStyle = {
    container: {
      backgroundColor: colors.background.header,
      borderBottom: `1px solid ${colors.border.light}`,
      width: '100%',
      position: 'sticky' as const,
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column' as const,
      minHeight: 'fit-content',
      overflow: 'visible'
    },
    content: {
      maxWidth: '1600px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'visible'
    },
    topRow: {
      padding: '12px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${colors.border.separator}`,
      backgroundColor: colors.background.header,
      minHeight: '72px',
      overflow: 'visible'
    },
    metricsRow: {
      padding: '12px 40px',
      backgroundColor: colors.background.metrics,
      borderBottom: `1px solid ${colors.border.light}`,
      minHeight: '64px',
      display: 'flex',
      alignItems: 'center',
      position: 'relative' as const,
      zIndex: 900
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column' as const,
      gap: '4px',
      minWidth: '200px'
    },
    examTitle: {
      margin: 0,
      fontSize: '20px',
      color: colors.text.primary,
      maxWidth: '400px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const
    },
    dateButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      borderRadius: '6px',
      color: colors.text.brand,
      backgroundColor: colors.background.highlight,
      border: `1px solid ${colors.border.light}`,
      cursor: 'pointer',
      transition: 'all 0.2s',
      ':hover': {
        backgroundColor: colors.background.highlight,
        borderColor: colors.text.brand
      }
    }
  };

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    if (e.key === 'login') {
      setShowAuthModal(true);
    } else if (e.key === 'logout') {
      try {
        await signOut();
        notification.success({
          message: 'התנתקת בהצלחה',
          description: 'להתראות!',
          placement: 'topLeft',
        });
      } catch (error) {
        notification.error({
          message: 'שגיאה בהתנתקות',
          description: 'אנא נסה שוב',
          placement: 'topLeft',
        });
      }
    } else if (e.key === 'profile') {
      navigate('/profile');
    }
  };

  const userMenuItems = [
    ...(user ? [
      {
        key: 'profile',
        label: 'פרופיל',
        icon: <UserOutlined />,
      },
      {
        key: 'logout',
        label: 'התנתק',
        icon: <LoginOutlined />,
        danger: true,
      }
    ] : [
      {
        key: 'login',
        label: 'התחברות',
        icon: <LoginOutlined />,
      }
    ])
  ];

  const handleDateChange = (date: Moment | null) => {
    if (date && date.isValid()) {
      setIsDatePickerOpen(false);

      // Update prep state with new exam date
      if (prep) {
        const updatedPrep: StudentPrep = {
          ...prep,
          goals: {
            ...prep.goals,
            examDate: date.startOf('day').valueOf() // Ensure consistent time of day
          }
        };
        
        // Save to storage and update local state
        PrepStateManager.updatePrep(updatedPrep);
        setPrep(updatedPrep);

        notification.success({
          message: 'תאריך היעד עודכן',
          description: formatTimeUntilExam(date.toDate()),
          placement: 'topLeft',
          duration: 2,
        });
      }
    }
  };

  return (
    <>
      <div style={headerStyle.container}>
        <div style={headerStyle.content}>
          {/* Top Row */}
          <div style={headerStyle.topRow}>
            {/* Logo */}
            <div style={headerStyle.logo}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <motion.div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/')}
                >
                  <motion.img
                    src="/EZpass_A6_cut.png"
                    alt="איזיפס - פשוט להצליח"
                    style={{
                      height: '48px',
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    style={{
                      height: '32px',
                      borderRight: '2px solid #e5e7eb',
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Text style={{ 
                      fontSize: '16px',
                      color: '#ff9800',
                      fontWeight: 500,
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                      marginRight: '8px'
                    }}>
                      פשוט להצליח
                    </Text>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Center Section */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1
            }}>
              <Space size={16} align="center">
                <Title level={4} style={headerStyle.examTitle}>
                  {prep.exam.names.medium}
                </Title>
                
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Button 
                    type="text"
                    onClick={() => setIsDatePickerOpen(true)}
                    style={{
                      ...headerStyle.dateButton,
                      backgroundColor: '#f0f9ff',
                      borderColor: '#bae6fd',
                      color: '#0369a1',
                      height: '40px',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    <CalendarOutlined style={{ fontSize: '18px' }} />
                    <Text>{formatTimeUntilExam(new Date(prep.goals.examDate))}</Text>
                  </Button>
                  <DatePicker
                    open={isDatePickerOpen}
                    value={moment(prep.goals.examDate)}
                    onChange={handleDateChange}
                    onOpenChange={(open) => setIsDatePickerOpen(open)}
                    allowClear={false}
                    disabledDate={(current) => current && current.isBefore(moment().startOf('day'))}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: 0,
                      height: 0,
                      pointerEvents: 'none',
                      right: 0
                    }}
                    dropdownAlign={{
                      points: ['tc', 'bc'],
                      offset: [-100, 8],
                      overflow: { adjustX: true, adjustY: true }
                    }}
                    getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
                    direction="rtl"
                  />
                </div>

                <Button
                  type="text"
                  onClick={() => setExamContentOpen(true)}
                  style={{
                    ...headerStyle.dateButton,
                    backgroundColor: '#f0f9ff',
                    borderColor: '#bae6fd',
                    color: '#0369a1',
                    height: '40px',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <Text>
                    {prep.selection.subTopics.length}/{subTopicCount} נושאים
                  </Text>
                </Button>
              </Space>
            </div>

            {/* User Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button 
                type="text"
                icon={<SettingOutlined style={{ fontSize: '18px' }} />}
                onClick={() => setConfigOpen(true)}
              />
              <Dropdown 
                menu={{ items: userMenuItems, onClick: handleMenuClick }} 
                placement="bottomRight"
                trigger={['click']}
              >
                <Button 
                  type={user ? 'primary' : 'default'}
                  icon={<UserOutlined />}
                >
                  {user ? user.email : 'אורח'}
                </Button>
              </Dropdown>
            </div>
          </div>

          {/* Metrics Row */}
          <div style={headerStyle.metricsRow}>
            {isLoading ? (
              <Space>
                <Spin size="small" />
                <Text>טוען נתונים...</Text>
              </Space>
            ) : (
              <PracticeHeaderProgress metrics={{
                successRate: prep.state.status === 'initializing' || 
                  prep.state.status === 'not_started' ||
                  !('completedQuestions' in prep.state) ||
                  !('averageScore' in prep.state) ||
                  prep.state.completedQuestions === 0
                  ? -1
                  : Math.round(prep.state.averageScore),
                totalQuestions: prep.exam.topics.reduce((acc, topic) => 
                  acc + (topic.subTopics?.length || 0), 0) * 50,
                questionsAnswered: prep.state.status === 'initializing' || 
                  prep.state.status === 'not_started' ||
                  !('completedQuestions' in prep.state)
                  ? 0
                  : prep.state.completedQuestions,
                overallProgress: {
                  current: prep.state.status === 'initializing' || 
                    prep.state.status === 'not_started' ||
                    !('activeTime' in prep.state)
                    ? 0
                    : Math.round(prep.state.activeTime / (60 * 60 * 1000)),
                  target: prep.goals.totalHours
                },
                weeklyProgress: {
                  current: prep.state.status === 'initializing' || 
                    prep.state.status === 'not_started' ||
                    !('activeTime' in prep.state)
                    ? 0
                    : Math.round(prep.state.activeTime / (60 * 60 * 1000)),
                  target: Math.ceil(prep.goals.totalHours / moment(prep.goals.examDate).diff(moment(), 'weeks'))
                },
                dailyProgress: {
                  current: prep.state.status === 'initializing' || 
                    prep.state.status === 'not_started' ||
                    !('activeTime' in prep.state)
                    ? 0
                    : Math.round(prep.state.activeTime / (60 * 1000)),
                  target: Math.ceil((prep.goals.totalHours * 60) / Math.max(1, moment(prep.goals.examDate).diff(moment(), 'days')))
                }
              }} />
            )}
          </div>
        </div>
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        returnUrl={window.location.pathname}
      />

      <PrepConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        prep={prep}
      />
      
      <ExamContentDialog
        open={examContentOpen}
        onClose={() => setExamContentOpen(false)}
        exam={prep.exam}
        prepId={prepId}
      />
    </>
  );
}; 