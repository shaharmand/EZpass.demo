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
import ProgressBar from './ProgressBar/ProgressBar';
import { formatTimeUntilExam } from '../utils/dateUtils';
import { PrepConfigDialog } from './practice/PrepConfigDialog';
import type { Question } from '../types/question';

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
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    content: {
      maxWidth: '1600px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    topRow: {
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${colors.border.separator}`,
      backgroundColor: colors.background.header
    },
    metricsRow: {
      padding: '16px 24px',
      backgroundColor: colors.background.metrics,
      borderBottom: `1px solid ${colors.border.light}`
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    examTitle: {
      margin: 0,
      fontSize: '18px',
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
              position: 'relative',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ExperimentFilled style={{ 
                fontSize: '24px',
                color: colors.icon.left,
                position: 'absolute',
                left: 0,
                clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              }} />
              <ExperimentFilled style={{ 
                fontSize: '24px',
                color: colors.icon.right,
                position: 'absolute',
                right: 0,
                clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
              }} />
            </div>
            <div>
              <Text strong style={{ fontSize: '18px', color: colors.text.brand }}>
                EZpass
              </Text>
              <Text style={{ fontSize: '12px', color: colors.icon.left, marginRight: '4px' }}>
                פשוט להצליח
              </Text>
            </div>
          </div>

          {/* Center Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Title level={4} style={headerStyle.examTitle}>
              {prep.exam.names.medium}
            </Title>
            <Button 
              type="text"
              onClick={() => setIsDatePickerOpen(true)}
              style={headerStyle.dateButton}
            >
              <CalendarOutlined style={{ fontSize: '16px' }} />
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
            <ProgressBar metrics={{
              // Success rate should be N/A if no questions answered
              successRate: prep.state.status === 'initializing' || 
                prep.state.status === 'not_started' ||
                prep.state.completedQuestions === 0
                ? -1 // Special value to indicate N/A
                : Math.round(prep.state.averageScore),
              
              // Calculate total questions goal (50 per subtopic)
              totalQuestions: prep.exam.topics.reduce((acc, topic) => 
                acc + (topic.subTopics?.length || 0), 0) * 50,

              // Use completed questions count from state
              questionsAnswered: prep.state.status === 'initializing' || prep.state.status === 'not_started'
                ? 0
                : prep.state.completedQuestions,
              
              // Overall progress in hours
              overallProgress: {
                current: prep.state.status === 'initializing' || prep.state.status === 'not_started'
                  ? 0
                  : Math.round(prep.state.activeTime / (60 * 60 * 1000)), // Convert ms to hours
                target: prep.goals.totalHours
              },
              
              // Weekly progress in hours
              weeklyProgress: {
                current: prep.state.status === 'initializing' || prep.state.status === 'not_started'
                  ? 0
                  : Math.round(prep.state.activeTime / (60 * 60 * 1000)), // Convert ms to hours
                target: prep.goals.weeklyHours
              },
              
              // Daily progress in minutes
              dailyProgress: {
                current: prep.state.status === 'initializing' || prep.state.status === 'not_started'
                  ? 0
                  : Math.round((prep.state.activeTime / (60 * 1000))), // Convert ms to minutes
                target: Math.round(prep.goals.dailyHours * 60) // Convert hours to minutes
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