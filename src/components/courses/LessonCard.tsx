import React from 'react';
import { PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { 
  LessonCard as StyledLessonCard, 
  LessonHeader, 
  LessonTitle,
  LessonProgress,
  Badge
} from './VideoCourseStyles';
import { LessonInfo, VideoData } from './types';

interface LessonCardProps {
  lesson: LessonInfo;
  videos: VideoData[];
  onClick: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, videos, onClick }) => {
  return (
    <StyledLessonCard onClick={onClick}>
      <LessonHeader>
        <LessonTitle>שיעור {lesson.id}: {lesson.name}</LessonTitle>
        {lesson.hasQuiz && (
          <Badge color="#52c41a">מבחן</Badge>
        )}
      </LessonHeader>

      <div style={{ marginTop: '8px', color: '#666' }}>
        <span style={{ marginRight: '16px' }}>
          <PlayCircleOutlined /> {videos.length} סרטונים
        </span>
        <span>
          <ClockCircleOutlined /> {lesson.duration}
        </span>
      </div>

      <LessonProgress 
        percent={0} 
        size="small" 
        showInfo={false}
        strokeColor="#1890ff"
      />
    </StyledLessonCard>
  );
};

export default LessonCard; 