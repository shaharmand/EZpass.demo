import React from 'react';
import { Typography, Tooltip } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TimeToExamProps {
  examDate: number;  // timestamp of the exam date
}

const TimeToExam: React.FC<TimeToExamProps> = ({ examDate }) => {
  const getTimeToExam = () => {
    const now = Date.now();
    const diffInDays = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays > 30) {
      const weeks = Math.ceil(diffInDays / 7);
      return `הבחינה בעוד ${weeks} שבועות`;
    } else if (diffInDays > 1) {
      return `הבחינה בעוד ${diffInDays} ימים`;
    } else if (diffInDays === 1) {
      return 'הבחינה מחר';
    } else if (diffInDays === 0) {
      return 'הבחינה היום';
    } else {
      return 'הבחינה הסתיימה';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#64748b',
      padding: '8px 12px',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      height: '36px',
      minWidth: '80px'
    }}>
      <CalendarOutlined style={{ 
        fontSize: '16px',
        color: '#64748b'
      }} />
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        fontWeight: '600',
        lineHeight: '1.2'
      }}>{getTimeToExam()}</Text>
    </div>
  );
};

export default TimeToExam; 