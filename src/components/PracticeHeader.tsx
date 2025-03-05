import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Spin, DatePicker, notification, Input, Tooltip } from 'antd';
import { CalendarOutlined, EditOutlined } from '@ant-design/icons';
import moment, { Moment } from 'moment';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import type { StudentPrep } from '../types/prepState';
import { formatTimeUntilExam } from '../utils/dateUtils';
import { PrepConfigDialog } from './practice/PrepConfigDialog';
import { ExamContentDialog } from './practice/ExamContentDialog';
import type { Question } from '../types/question';
import PracticeHeaderProgress from './PracticeHeaderProgress/PracticeHeaderProgress';
import { useNavigate } from 'react-router-dom';
import { PrepStateManager } from '../services/PrepStateManager';
import { useAuth } from '../contexts/AuthContext';
import type { ActivePracticeQuestion } from '../types/prepUI';
import { BaseHeader } from './base/BaseHeader';

const { Text, Title } = Typography;

// Colors from BaseHeader
const colors = {
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    brand: '#3b82f6'
  }
};

interface PracticeHeaderProps {
  prepId: string;
  question?: Question;
  currentQuestion?: ActivePracticeQuestion;
  onBack?: () => void;
  prep?: StudentPrep;
}

export const PracticeHeader: React.FC<PracticeHeaderProps> = ({
  prepId,
  question,
  currentQuestion,
  onBack,
  prep: initialPrep
}) => {
  const { getPrep } = useStudentPrep();
  const [prep, setPrep] = useState<StudentPrep | null>(initialPrep || null);
  const [isLoading, setIsLoading] = useState(false);
  const { startPrep } = useStudentPrep();
  const [configOpen, setConfigOpen] = useState(false);
  const navigate = useNavigate();
  const [examContentOpen, setExamContentOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { user } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    // If we have initialPrep, use it
    if (initialPrep) {
      setPrep(initialPrep);
      return;
    }

    const loadPrep = async () => {
      console.log('Loading prep state for ID:', prepId);
      // Get fresh prep state from storage
      const freshPrep = PrepStateManager.getPrep(prepId);
      console.log('Fresh prep state:', freshPrep ? 'found' : 'not found');
      
      if (freshPrep) {
        // Only update if the state has actually changed
        const shouldUpdate = !prep || 
            freshPrep.state.status !== prep.state.status ||
            freshPrep.customName !== prep.customName ||
            ('activeTime' in freshPrep.state && 'activeTime' in prep.state && freshPrep.state.activeTime !== prep.state.activeTime) ||
            ('completedQuestions' in freshPrep.state && 'completedQuestions' in prep.state && freshPrep.state.completedQuestions !== prep.state.completedQuestions);
            
        console.log('Should update prep state:', shouldUpdate);
        if (shouldUpdate) {
          setPrep(freshPrep);
        }
      } else {
        console.log('No prep found in storage, trying context');
        // If not in storage, try getting from context
        const contextPrep = await getPrep(prepId);
        if (contextPrep) {
          console.log('Found prep in context, updating state');
          setPrep(contextPrep);
        }
      }
    };

    // Load initially
    loadPrep();

    // Refresh every 5 seconds if we don't have initialPrep
    const refreshInterval = setInterval(loadPrep, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [prepId, prep, getPrep, initialPrep]);

  if (!prep) return null;
  
  // Calculate topic counts
  const topicCount = prep.exam.topics?.length || 0;
  const subTopicCount = prep.exam.topics?.reduce(
    (count: number, topic) => count + (topic.subTopics?.length || 0), 
    0
  ) || 0;

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

  const handleNameUpdate = (newName: string) => {
    if (prep) {
      const updatedPrep: StudentPrep = {
        ...prep,
        customName: newName.trim() || null
      };
      
      PrepStateManager.updatePrep(updatedPrep);
      setPrep(updatedPrep);
      setIsEditingName(false);

      notification.success({
        message: 'שם המבחן עודכן',
        placement: 'topLeft',
        duration: 2,
      });
    }
  };

  const topRowContent = (
    <Space size={16} align="center">
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '2px'
      }}>
        <Text style={{
          color: colors.text.secondary,
          fontSize: '13px',
          marginBottom: '-4px'
        }}>
          מתכוןן ל:
        </Text>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {isEditingName ? (
            <Input
              autoFocus
              defaultValue={prep.customName || prep.exam.names.medium}
              onPressEnter={(e) => handleNameUpdate(e.currentTarget.value)}
              onBlur={(e) => handleNameUpdate(e.target.value)}
              style={{
                fontSize: '18px',
                width: '300px',
                height: '32px'
              }}
              placeholder="הכנס שם אישי למבחן..."
            />
          ) : (
            <>
              <Title level={4} style={{
                margin: 0,
                fontSize: '18px',
                color: colors.text.primary,
                maxWidth: '400px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {prep.customName || prep.exam.names.medium}
              </Title>
              <Tooltip title="שנה שם מבחן">
                <Button
                  type="text"
                  icon={<EditOutlined style={{ fontSize: '16px', color: colors.text.secondary }} />}
                  onClick={() => setIsEditingName(true)}
                  style={{
                    padding: '4px',
                    height: 'auto'
                  }}
                />
              </Tooltip>
            </>
          )}
        </div>
        {prep.customName && (
          <Text style={{
            color: colors.text.secondary,
            fontSize: '12px',
            marginTop: '-2px'
          }}>
            {prep.exam.names.medium}
          </Text>
        )}
      </div>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Button 
          type="text"
          onClick={() => setIsDatePickerOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '6px',
            color: colors.text.brand,
            backgroundColor: '#f0f7ff',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
            height: '40px'
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
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '6px',
          color: colors.text.brand,
          backgroundColor: '#f0f7ff',
          border: '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'all 0.2s',
          height: '40px'
        }}
      >
        <Text>
          {prep.selection.subTopics.length}/{subTopicCount} נושאים
        </Text>
      </Button>
    </Space>
  );

  const metricsContent = isLoading ? (
    <Space>
      <Spin size="small" />
      <Text>טוען נתונים...</Text>
    </Space>
  ) : (
    <PracticeHeaderProgress 
      metrics={PrepStateManager.getHeaderMetrics(prep)}
      prep={prep}
    />
  );

  return (
    <>
      <BaseHeader
        variant="practice"
        pageTitle="תרגול שאלות"
        topRowContent={topRowContent}
        showMetricsRow
        metricsContent={metricsContent}
      />
      
      <ExamContentDialog
        open={examContentOpen}
        onClose={() => setExamContentOpen(false)}
        exam={prep.exam}
        prepId={prep.id}
      />
    </>
  );
}; 