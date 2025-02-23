import React, { useState } from 'react';
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
import type { Question } from '../types/question';
import PracticeHeaderProgress from './PracticeHeaderProgress/PracticeHeaderProgress';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
  prep: StudentPrep;
}

export const PracticeHeader: React.FC<PracticeHeaderProps> = ({ prep }) => {
  const { metrics, isLoading } = usePracticeProgress();
  const { startPrep, getPrep } = useStudentPrep();
  const [configOpen, setConfigOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<Moment>(moment().add(4, 'weeks'));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const defaultUserName = 'אורח';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(defaultUserName);
  const navigate = useNavigate();

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

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'login') {
      const key = 'loginNotification';
      notification.info({
        key,
        message: 'מתחבר...',
        description: 'אנא המתן',
        placement: 'topLeft',
        duration: 0,
      });

      setTimeout(() => {
        setIsLoggedIn(true);
        setUserName('ישראל ישראלי');
        notification.success({
          key,
          message: 'התחברת בהצלחה',
          description: 'ברוך הבא ישראל!',
          placement: 'topLeft',
          duration: 2,
        });
      }, 1000);
    } else if (e.key === 'logout') {
      setIsLoggedIn(false);
      setUserName(defaultUserName);
      notification.success({
        message: 'התנתקת בהצלחה',
        description: 'להתראות!',
        placement: 'topLeft',
      });
    }
  };

  const userMenuItems = [
    ...(isLoggedIn ? [
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
      setTargetDate(date);
      setIsDatePickerOpen(false);
      notification.success({
        message: 'תאריך היעד עודכן',
        description: formatTimeUntilExam(date.toDate()),
        placement: 'topLeft',
        duration: 2,
      });
    }
  };

  return (
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
            gap: '24px',
            flex: 1,
            justifyContent: 'center'
          }}>
            <Title level={4} style={headerStyle.examTitle}>
              {prep.exam.names.medium}
            </Title>
            <Button 
              type="text"
              onClick={() => setIsDatePickerOpen(true)}
              style={headerStyle.dateButton}
            >
              <CalendarOutlined style={{ fontSize: '18px' }} />
              <Text>{formatTimeUntilExam(targetDate.toDate())}</Text>
            </Button>
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
                type={isLoggedIn ? 'primary' : 'default'}
                icon={<UserOutlined />}
              >
                {userName}
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
                target: prep.goals.weeklyHours
              },
              dailyProgress: {
                current: prep.state.status === 'initializing' || 
                  prep.state.status === 'not_started' ||
                  !('activeTime' in prep.state)
                  ? 0
                  : Math.round((prep.state.activeTime / (60 * 1000))),
                target: Math.round(prep.goals.dailyHours * 60)
              }
            }} />
          )}
        </div>
      </div>

      {/* Config Drawer */}
      <Drawer
        title="הגדרות מבחן"
        placement="right"
        width={400}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={5}>פרטי מבחן</Title>
            <Text>נושאים: {topicCount}</Text>
            <br />
            <Text>תתי-נושאים: {subTopicCount}</Text>
          </div>
          <PrepConfigDialog
            prep={prep}
            open={configOpen}
            onClose={() => setConfigOpen(false)}
          />
        </Space>
      </Drawer>

      {/* Hidden DatePicker */}
      <DatePicker
        open={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
        onChange={handleDateChange}
        value={targetDate}
        allowClear={false}
        style={{ display: 'none' }}
        disabledDate={(current) => current && current < moment().startOf('day')}
      />
    </div>
  );
}; 