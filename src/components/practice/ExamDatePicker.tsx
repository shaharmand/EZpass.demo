import React, { useState, useEffect } from 'react';
import { Button, DatePicker, Typography, notification, Tooltip } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import moment, { Moment } from 'moment';
import { formatTimeUntilExam } from '../../utils/dateUtils';
import type { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';

const { Text } = Typography;

interface ExamDatePickerProps {
  prep: StudentPrep;
  onPrepUpdate?: (updatedPrep: StudentPrep) => void;
}

export const ExamDatePicker: React.FC<ExamDatePickerProps> = ({ prep, onPrepUpdate }) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentExamDate, setCurrentExamDate] = useState(prep.goals.examDate);

  useEffect(() => {
    setCurrentExamDate(prep.goals.examDate);
  }, [prep.goals.examDate]);

  const handleDateChange = (date: Moment | null) => {
    if (date && date.isValid()) {
      setIsDatePickerOpen(false);
      const newExamDate = date.startOf('day').valueOf();
      setCurrentExamDate(newExamDate);

      const updatedPrep: StudentPrep = {
        ...prep,
        goals: {
          ...prep.goals,
          examDate: newExamDate
        }
      };
      
      PrepStateManager.updatePrep(updatedPrep);
      onPrepUpdate?.(updatedPrep);

      notification.success({
        message: 'תאריך היעד עודכן',
        description: formatTimeUntilExam(date.toDate()),
        placement: 'topLeft',
        duration: 2,
      });
    }
  };

  const formatExamDate = (date: Date) => {
    const timeUntil = formatTimeUntilExam(date);
    // Remove both "הבחינה" and "שלך"
    return timeUntil.replace(/הבחינה|שלך/g, '').trim();
  };

  return (
    <Tooltip title="לחץ כאן לשנות את מועד הבחינה" placement="top">
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '36px',
          minWidth: '140px',
          cursor: 'pointer',
          padding: '8px 0'
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsDatePickerOpen(true);
        }}
      >
        <Text style={{
          fontSize: '16px',
          color: '#64748b',
          fontWeight: '600',
          lineHeight: '1.2'
        }}>{formatExamDate(new Date(currentExamDate))}</Text>

        <DatePicker
          open={isDatePickerOpen}
          value={moment(currentExamDate)}
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
            points: ['tr', 'br'],
            offset: [0, 4],
            overflow: { adjustX: true, adjustY: true }
          }}
          getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
          direction="rtl"
        />
      </div>
    </Tooltip>
  );
}; 