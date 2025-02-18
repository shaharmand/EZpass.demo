import React, { useState } from 'react';
import { usePracticeProgress } from '../hooks/usePracticeProgress';
import ProgressBar from './ProgressBar/ProgressBar';
import { useExam } from '../contexts/ExamContext';
import { Typography, Space, Spin, Divider, Button, Tag, DatePicker, Dropdown, notification } from 'antd';
import type { DatePickerProps, MenuProps } from 'antd';
import { ExperimentFilled, BookOutlined, CalendarOutlined, UserOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { ExamTopicsDialog } from './ExamCard/ExamTopicsDialog';
import type { Prep } from '../types/prep';
import moment from 'moment';
import type { Moment } from 'moment';

const { Text, Title } = Typography;

// Utility function to format time until exam
const formatTimeUntilExam = (targetDate: Date): string => {
  const today = new Date();
  const diffTime = Math.abs(targetDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Validate if date is in the past
  if (targetDate.getTime() < today.getTime()) {
    return 'תאריך היעד עבר';
  }

  if (diffDays <= 21) {
    return `הבחינה שלך בעוד ${diffDays} ימים`;
  } else if (diffDays <= 90) {
    const weeks = Math.floor(diffDays / 7);
    return `הבחינה שלך בעוד ${weeks} שבועות`;
  } else {
    const months = Math.floor(diffDays / 30.44); // More accurate month calculation
    return `הבחינה שלך בעוד ${months} חודשים`;
  }
};

interface PracticeHeaderProps {
  prep: Prep;
}

export const PracticeHeader: React.FC<PracticeHeaderProps> = ({ prep }) => {
  const { metrics, isLoading } = usePracticeProgress();
  const { practiceState } = useExam();
  const [topicsDialogOpen, setTopicsDialogOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<Moment>(moment().add(4, 'weeks'));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const defaultUserName = 'אורח';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(defaultUserName);
  const [practiceMode, setPracticeMode] = useState<'practice' | 'simulation'>('practice');

  // Calculate topic counts
  const topicCount = prep.exam.topics?.length || 0;
  const subTopicCount = prep.exam.topics?.reduce(
    (count, topic) => count + (topic.subTopics?.length || 0), 
    0
  ) || 0;

  const headerStyle = {
    backgroundColor: '#ffffff',
    borderBottom: 'none',
    padding: '0',
    position: 'sticky' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    width: '100%',
    boxShadow: 'none',
    display: 'block'
  };

  const topSectionStyle = {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
    padding: '8px 16px',
  };

  const bottomSectionStyle = {
    backgroundColor: '#ffffff',
    padding: '8px 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };

  const contentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  };

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'login') {
      // Show loading notification
      const key = 'loginNotification';
      notification.info({
        key,
        message: 'מתחבר...',
        description: 'אנא המתן',
        placement: 'topLeft',
        duration: 0,
      });

      // Mock successful login after 1 second
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
    } else if (e.key === 'signup') {
      notification.info({
        message: 'הרשמה',
        description: 'בקרוב... 😊',
        placement: 'topLeft',
      });
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
      },
      {
        key: 'signup',
        label: 'הרשמה',
        icon: <UserAddOutlined />,
      }
    ])
  ];

  // Handle date change with proper validation
  const handleDateChange = (date: Moment | null) => {
    if (date && date.isValid()) {
      setTargetDate(date);
      setIsDatePickerOpen(false);
      
      // Show confirmation notification
      notification.success({
        message: 'תאריך היעד עודכן',
        description: formatTimeUntilExam(date.toDate()),
        placement: 'topLeft',
        duration: 2,
      });
    }
  };

  // Add styles for the DatePicker dropdown
  const datePickerStyle = {
    '.practice-header-datepicker': {
      zIndex: 1100, // Higher than the header's z-index (1000)
    }
  };

  // Add the style to the document head
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .ant-picker-dropdown {
        z-index: 1500 !important;
      }
    `;
    document.head.appendChild(styleElement);

    // Cleanup
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleModeChange = () => {
    const newMode = practiceMode === 'practice' ? 'simulation' : 'practice';
    setPracticeMode(newMode);
    
    // Show notification about mode change
    notification.info({
      message: newMode === 'practice' ? 'מצב תרגול' : 'מצב סימולציה',
      description: newMode === 'practice' 
        ? 'עברת למצב תרגול - תוכל לראות פתרונות ולקבל משוב מיידי'
        : 'עברת למצב סימולציה - הבחינה תדמה את תנאי הבחינה האמיתיים',
      placement: 'topLeft',
      duration: 3,
    });
  };

  // If we're here, we know the practice is valid because PracticePage validated it
  return (
    <div style={headerStyle} className="practice-header">
      {/* Top Section with Logo, Title, and User */}
      <div style={topSectionStyle}>
        <div style={contentStyle}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            height: '40px'
          }}>
            {/* Logo Section */}
            <div style={logoStyle}>
              <div style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* Blue version of icon */}
                <ExperimentFilled style={{ 
                  position: 'absolute',
                  fontSize: '28px',
                  color: '#1890ff',
                  clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
                  left: '6px'
                }} />
                {/* Orange version of icon */}
                <ExperimentFilled style={{ 
                  position: 'absolute',
                  fontSize: '28px',
                  color: '#ffb067',
                  clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
                  right: '6px'
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Text strong style={{ 
                  fontSize: '20px',
                  color: '#1890ff',
                  lineHeight: '1'
                }}>
                  EZpass
                </Text>
                <Text style={{ 
                  fontSize: '12px',
                  color: '#ffb067',
                  lineHeight: '1'
                }}>
                  פשוט להצליח
                </Text>
              </div>
            </div>

            {/* Center Title Section */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px'
            }}>
              <Title level={4} style={{ margin: 0, fontSize: '16px' }}>
                {prep.exam.names.medium}
              </Title>
              <Tag 
                color={practiceMode === 'practice' ? 'blue' : 'orange'}
                style={{ cursor: 'pointer', marginRight: 0 }}
                onClick={handleModeChange}
              >
                {practiceMode === 'practice' ? 'תרגול' : 'סימולציה'}
              </Tag>
            </div>

            {/* User Section */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Text style={{ fontSize: '14px' }}>
                שלום, {userName}
              </Text>
              <Dropdown 
                menu={{ items: userMenuItems, onClick: handleMenuClick }} 
                placement="bottomRight"
                trigger={['click']}
              >
                <Button 
                  type="text" 
                  icon={<UserOutlined />} 
                  style={{ 
                    color: isLoggedIn ? '#52c41a' : '#1890ff',
                    padding: '4px',
                    height: 'auto'
                  }}
                />
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section with Metadata and Progress */}
      <div style={bottomSectionStyle}>
        <div style={contentStyle}>
          {/* Exam Details Row */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginBottom: '8px'
          }}>
            {/* Topics Count */}
            <Button 
              type="link" 
              onClick={() => setTopicsDialogOpen(true)}
              style={{ 
                padding: 0,
                height: 'auto',
                color: 'rgba(0, 0, 0, 0.65)'
              }}
            >
              <BookOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
              <Text>{topicCount} נושאים ({subTopicCount} תתי-נושאים)</Text>
            </Button>

            {/* Target Date */}
            <div style={{ position: 'relative' }}>
              <Button 
                type="link" 
                onClick={() => setIsDatePickerOpen(true)}
                style={{ 
                  padding: 0,
                  height: 'auto',
                  color: 'rgba(0, 0, 0, 0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CalendarOutlined style={{ color: '#1890ff' }} />
                <span>{formatTimeUntilExam(targetDate.toDate())}</span>
              </Button>
              <DatePicker
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
                onChange={handleDateChange}
                value={targetDate}
                allowClear={false}
                bordered={false}
                placement="bottomRight"
                getPopupContainer={() => document.body}
                disabledDate={(current) => current && current < moment().startOf('day')}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  opacity: 0,
                  width: '100%',
                  height: '100%'
                }}
                popupClassName="ant-picker-dropdown"
              />
            </div>
          </div>

          {/* Progress Section */}
          <div>
            {!metrics ? (
              <Space>
                <Spin size="small" />
                <Text>טוען שאלה...</Text>
              </Space>
            ) : (
              <ProgressBar metrics={{
                successRate: 100,
                questionsAnswered: metrics.reduce((sum, m) => sum + m.value, 0),
                totalQuestions: subTopicCount * 50,
                overallProgress: {
                  current: Math.min(metrics.reduce((sum, m) => sum + m.value, 0) / 10, 50),
                  target: 50
                },
                weeklyProgress: {
                  current: Math.min(metrics.reduce((sum, m) => sum + m.value, 0) / 10, 14),
                  target: 14
                },
                dailyProgress: {
                  current: Math.min(metrics.reduce((sum, m) => sum + m.value, 0) / 10, 2),
                  target: 2
                }
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Topics Selection Dialog */}
      <ExamTopicsDialog
        exam={prep.exam}
        open={topicsDialogOpen}
        onClose={() => setTopicsDialogOpen(false)}
      />
    </div>
  );
}; 