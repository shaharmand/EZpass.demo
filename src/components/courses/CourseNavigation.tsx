import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PlayCircleOutlined, ClockCircleOutlined, CaretLeftOutlined } from '@ant-design/icons';
import type { VideoData, LessonInfo, Topic } from './types';

const NavContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow-y: auto;
  direction: rtl;
  padding: 0;
  border-left: 1px solid #e5e7eb;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f3f4f6;
  }
`;

const CourseTitle = styled.div`
  padding: 16px 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  width: 100%;

  h1 {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px 0;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 14px;
    color: #6b7280;
    width: 100%;

    .stats-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      width: 100%;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      
      .anticon {
        font-size: 16px;
      }
    }

    .progress {
      color: #10b981;
      font-weight: 500;
    }

    .progress-bar {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
      width: 100%;

      .progress-fill {
        height: 100%;
        background: #10b981;
        border-radius: 2px;
        transition: width 0.3s ease;
      }
    }
  }
`;

const Progress = styled.div`
  display: none;
`;

const TopicItem = styled.div`
  margin: 16px 16px;
  background: #ffffff;
  width: calc(100% - 32px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #334155;
  
  &:last-child {
    margin-bottom: 24px;
  }
`;

const TopicHeader = styled.div<{ $isOpen: boolean }>`
  padding: 16px 24px;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${props => props.$isOpen ? '#334155' : '#475569'};
  transition: all 0.3s ease;
  width: 100%;
  border-radius: ${props => props.$isOpen ? '12px 12px 0 0' : '12px'};

  &:hover {
    background: #334155;
  }

  .topic-header-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .topic-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 17px;
    color: #f8fafc;
    font-weight: 600;
  }

  .topic-metadata {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .topic-duration {
    font-size: 13px;
    color: #cbd5e1;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .topic-progress {
    font-size: 13px;
    color: #4ade80;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .topic-progress-bar {
    height: 4px;
    background: #1e293b;
    border-radius: 2px;
    overflow: hidden;
    width: 100%;
    margin-top: 4px;

    .progress-fill {
      height: 100%;
      background: #4ade80;
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  }

  .caret {
    color: #cbd5e1;
    transform: ${props => props.$isOpen ? 'rotate(-90deg)' : 'rotate(0deg)'};
    transition: transform 0.3s ease;
  }
`;

const LessonContainer = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'block' : 'none'};
  background: #ffffff;
  padding: 12px 12px 12px 24px;
  width: 100%;
  border-radius: 0 0 12px 12px;
  border-top: 1px solid #475569;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  width: 100%;
  margin-top: 4px;

  .progress-fill {
    height: 100%;
    background: #10b981;
    border-radius: 2px;
    transition: width 0.3s ease;
    width: ${props => Math.min(Math.max(props.$progress, 0), 100)}%;
  }
`;

const LessonHeader = styled.div<{ $isActive: boolean; $isCompleted: boolean; $isExpanded: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${props => {
    if (props.$isActive) return '#eff6ff';
    if (props.$isCompleted) return '#dcfce7';
    return '#f1f5f9';
  }};
  border: 2px solid ${props => {
    if (props.$isActive) return '#3b82f6';
    return 'transparent';
  }};
  width: 100%;
  transition: all 0.2s ease;
  border-radius: 8px;
  position: relative;

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  &:hover {
    background: ${props => {
      if (props.$isActive) return '#eff6ff';
      if (props.$isCompleted) return '#bbf7d0';
      return '#e2e8f0';
    }};
    border-color: ${props => props.$isActive ? '#3b82f6' : '#e5e7eb'};
  }

  .lesson-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .lesson-metadata {
    margin-right: auto;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .expand-indicator {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${props => props.$isActive ? '#eff6ff' : '#f3f4f6'};
    color: ${props => props.$isActive ? '#3b82f6' : '#6b7280'};
    transition: all 0.3s ease;
    font-size: 12px;
    margin-left: -4px;
  }

  &[data-expanded="true"] .expand-indicator {
    transform: rotate(180deg);
  }

  &:hover .expand-indicator {
    background: #eff6ff;
    color: #3b82f6;
  }

  .progress-indicator {
    width: 4px;
    height: 4px;
    border-radius: 2px;
    background: ${props => props.$isCompleted ? '#10b981' : '#e5e7eb'};
    margin-right: 8px;
  }
`;

const LessonItem = styled.div<{ $isOpen: boolean; $isActive: boolean; $isCompleted: boolean }>`
  margin: 4px 4px;
  transition: all 0.2s ease;
  border-radius: 8px;
  border: 1px solid ${props => props.$isOpen ? '#e5e7eb' : 'transparent'};
  background: ${props => props.$isOpen ? '#ffffff' : 'transparent'};
  box-shadow: ${props => props.$isOpen ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none'};
  position: relative;

  &:first-child {
    margin-top: 0;
  }

  &:last-child {
    margin-bottom: 0;
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: -16px;
    width: 2px;
    background: #e5e7eb;
  }

  &:after {
    content: '';
    position: absolute;
    top: 50%;
    right: -16px;
    width: 12px;
    height: 2px;
    background: #e5e7eb;
  }

  .lesson-progress-bar {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
    width: 100%;
    margin-top: 4px;

    .progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  }
`;

const LessonTitle = styled.div<{ $isActive: boolean; $isCompleted: boolean }>`
  font-size: 15px;
  font-weight: ${props => (props.$isActive || props.$isCompleted) ? '600' : '500'};
  color: ${props => {
    if (props.$isActive) return '#3b82f6';
    if (props.$isCompleted) return '#10b981';
    return '#1f2937';
  }};
  flex: 1;
  white-space: normal;
  overflow: visible;
  line-height: 1.4;
`;

const LessonMetadata = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #6b7280;
  font-size: 12px;
  transition: opacity 0.2s ease;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .lesson-duration {
    color: #6b7280;
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    background: #f3f4f6;
    border-radius: 12px;
    margin-right: auto;
  }

  .lesson-progress {
    color: #10b981;
    font-weight: 500;
  }

  .video-count {
    color: #6b7280;
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    background: #f3f4f6;
    border-radius: 12px;
  }
`;

const VideoList = styled.div<{ $isVisible: boolean }>`
  max-height: ${props => props.$isVisible ? '1000px' : '0'};
  opacity: ${props => props.$isVisible ? '1' : '0'};
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  padding: ${props => props.$isVisible ? '8px 8px 8px 32px' : '0'};
  background: #ffffff;
  width: 100%;
  border-radius: 0 0 8px 8px;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: 40px;
    width: 2px;
    background: #e5e7eb;
  }
`;

const VideoItem = styled.div<{ $isActive: boolean; $isWatched: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${props => {
    if (props.$isActive) return '#eff6ff';
    if (props.$isWatched) return '#f8fafc';
    return '#ffffff';
  }};
  border: 1px solid ${props => {
    if (props.$isActive) return '#3b82f6';
    if (props.$isWatched) return '#e5e7eb';
    return 'transparent';
  }};
  border-radius: 8px;
  transition: all 0.2s ease;
  margin: 4px 0;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 50%;
    right: -24px;
    width: 16px;
    height: 2px;
    background: #e5e7eb;
  }

  &:hover {
    background: ${props => {
      if (props.$isActive) return '#eff6ff';
      if (props.$isWatched) return '#f1f5f9';
      return '#f8fafc';
    }};
    border-color: ${props => {
      if (props.$isActive) return '#3b82f6';
      return '#e5e7eb';
    }};
  }

  .video-content {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .video-icon {
    color: ${props => {
      if (props.$isActive) return '#3b82f6';
      if (props.$isWatched) return '#10b981';
      return '#6b7280';
    }};
    font-size: 16px;
    transition: all 0.2s ease;
  }

  .segment-number {
    color: ${props => {
      if (props.$isActive) return '#3b82f6';
      if (props.$isWatched) return '#10b981';
      return '#6b7280';
    }};
    font-size: 12px;
    font-weight: 500;
    min-width: 20px;
    text-align: center;
  }

  .duration-badge {
    margin-right: auto;
    padding: 2px 8px;
    background: ${props => props.$isWatched ? '#d1fae5' : '#f3f4f6'};
    border-radius: 12px;
    font-size: 12px;
    color: ${props => props.$isWatched ? '#10b981' : '#6b7280'};
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;
  }

  &:hover .duration-badge {
    background: ${props => props.$isWatched ? '#a7f3d0' : '#e5e7eb'};
  }
`;

const VideoTitle = styled.div<{ $isActive?: boolean; $isWatched?: boolean }>`
  font-size: 13px;
  color: ${props => {
    if (props.$isActive) return '#3b82f6';
    if (props.$isWatched) return '#10b981';
    return '#111827';
  }};
  font-weight: ${props => (props.$isActive || props.$isWatched) ? '500' : '400'};
  flex: 1;
  white-space: normal;
  overflow: visible;
  line-height: 1.4;
`;

const VideoInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 12px;
`;

interface VideoProgress {
  vimeoId: string;
  progress: number;
  completed: boolean;
}

interface CourseNavigationProps {
  topics: Topic[];
  lessonInfo: LessonInfo[];
  videos: VideoData[];
  onVideoSelect: (video: VideoData) => void;
  selectedVideo?: VideoData | null;
  courseTitle: string;
  courseDescription: string;
  watchedVideos: number;
  videoProgress?: Array<VideoProgress>;
}

const roundToQuarter = (minutes: number): string => {
  const quarters = Math.round(minutes / 15) * 15;
  if (quarters >= 60) {
    const hours = Math.floor(quarters / 60);
    const mins = quarters % 60;
    if (mins === 0) return `${hours} ש\'`;
    if (mins === 30) return `${hours}½ ש\'`;
    return `${hours} ש\'${mins} ד\'`;
  }
  if (quarters === 45) return '¾ ש\'';
  if (quarters === 30) return '½ ש\'';
  if (quarters === 15) return '¼ ש\'';
  return `${quarters} ד\'`;
};

const roundToHalfHour = (minutes: number): string => {
  const halfHours = Math.round(minutes / 30) * 30;
  const hours = Math.floor(halfHours / 60);
  const mins = halfHours % 60;
  if (mins === 0) return `${hours} ש\'`;
  return `${hours}½ ש\'`;
};

// Format video duration in minutes and seconds (for video player)
const formatVideoTime = (minutes: number): string => {
  // Round to the nearest minute for display
  const roundedMinutes = Math.round(minutes);
  return `${roundedMinutes} ד\'`;
};

// Format video duration in rounded minutes (for navigation)
const formatNavigationTime = (minutes: number): string => {
  // Ensure we never show 0 minutes
  const displayMinutes = Math.max(1, Math.round(minutes || 0));
  return `${displayMinutes} ד\'`;
};

const CourseNavigation: React.FC<CourseNavigationProps> = ({
  topics,
  lessonInfo,
  videos,
  onVideoSelect,
  selectedVideo,
  courseTitle,
  courseDescription,
  watchedVideos,
  videoProgress = []
}): JSX.Element => {
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [openLessons, setOpenLessons] = useState<number[]>([]);
  const selectedLessonRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Update state management to handle selectedVideo changes more safely
  useEffect(() => {
    if (selectedVideo) {
      const topic = topics.find(t => t.lessons.includes(selectedVideo.lessonNumber));
      if (topic) {
        setOpenTopics(prev => {
          if (!prev.includes(topic.id)) {
            return [...prev, topic.id];
          }
          return prev;
        });
        
        setOpenLessons(prev => {
          if (!prev.includes(selectedVideo.lessonNumber)) {
            return [...prev, selectedVideo.lessonNumber];
          }
          return prev;
        });

        // Clear any existing scroll timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Set new scroll timeout
        scrollTimeoutRef.current = setTimeout(() => {
          if (selectedLessonRef.current) {
            try {
              selectedLessonRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            } catch (error) {
              console.warn('Failed to scroll to selected lesson:', error);
            }
          }
        }, 300); // Increased delay to ensure animations complete
      }
    }

    // Cleanup function
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [selectedVideo, topics]);

  const toggleTopic = (topicId: string) => {
    setOpenTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  // Calculate lesson progress
  const getLessonProgress = (lessonId: number) => {
    const lessonVideos = videos.filter(v => v.lessonNumber === lessonId);
    const completedVideos = lessonVideos.filter(video => 
      videoProgress.find(p => p.vimeoId === video.vimeoId)?.completed
    );

    return {
      completed: completedVideos.length,
      total: lessonVideos.length,
      percentage: (completedVideos.length / lessonVideos.length) * 100
    };
  };

  const toggleLesson = (lessonId: number) => {
    setOpenLessons(prev => {
      if (prev.includes(lessonId)) {
        // Don't close if it's the active lesson
        if (selectedVideo && selectedVideo.lessonNumber === lessonId) {
          return prev;
        }
        return prev.filter(id => id !== lessonId);
      }
      // Keep currently selected lesson open when opening a new one
      const currentLessonId = selectedVideo?.lessonNumber;
      if (currentLessonId) {
        return [...prev.filter(id => id === currentLessonId), lessonId];
      }
      return [...prev, lessonId];
    });
  };

  // Calculate progress
  const totalVideos = videos.length;
  const progress = (watchedVideos / totalVideos) * 100;

  // Calculate topic progress and duration
  const getTopicStats = (topicId: string) => {
    const lessonIds = topics.find(t => t.id === topicId)?.lessons || [];
    const completedLessons = lessonIds.filter(lessonId => isLessonCompleted(lessonId));
    
    // Calculate total duration from all videos in the topic
    const topicVideos = videos.filter(v => lessonIds.includes(v.lessonNumber));
    const totalMinutes = topicVideos.reduce((total, video) => total + (video.duration || 0), 0);

    return {
      duration: roundToHalfHour(totalMinutes),
      completed: completedLessons.length,
      total: lessonIds.length,
      percentage: (completedLessons.length / lessonIds.length) * 100
    };
  };

  // Calculate lesson duration by summing video durations
  const getLessonDuration = (lessonId: number): string => {
    const lessonVideos = videos.filter(v => v.lessonNumber === lessonId);
    const totalMinutes = lessonVideos.reduce((total, video) => total + (video.duration || 0), 0);
    
    // Ensure we always return at least "1 ד'" even for very short videos
    if (totalMinutes <= 0) return "1 ד'";
    
    return roundToQuarter(totalMinutes);
  };

  // Calculate total course duration
  const getTotalCourseDuration = () => {
    const totalMinutes = videos.reduce((total, video) => total + (video.duration || 0), 0);
    return roundToHalfHour(totalMinutes);
  };

  // Calculate completed lessons
  const getCompletedLessonsCount = () => {
    return lessonInfo.filter(lesson => {
      const lessonVideos = videos.filter(v => v.lessonNumber === lesson.id);
      return lessonVideos.every(video => 
        videoProgress.find(p => p.vimeoId === video.vimeoId)?.completed
      );
    }).length;
  };

  // Check if a lesson is completed
  const isLessonCompleted = (lessonId: number) => {
    const lessonVideos = videos.filter(v => v.lessonNumber === lessonId);
    return lessonVideos.every(video => 
      videoProgress.find(p => p.vimeoId === video.vimeoId)?.completed
    );
  };

  const isVideoCompleted = (video: VideoData) => {
    const progress = videoProgress.find(p => p.vimeoId === video.vimeoId);
    return progress?.completed || false;
  };

  const getVideoProgress = (video: VideoData) => {
    const progress = videoProgress.find(p => p.vimeoId === video.vimeoId);
    return progress?.progress || 0;
  };

  return (
    <NavContainer>
      <CourseTitle>
        <h1>תוכן הקורס</h1>
        <div className="stats">
          <div className="stats-row">
            <span className="stat-item">
              <ClockCircleOutlined />
              {getTotalCourseDuration()}
            </span>
            <span className="stat-item">
              {topics.length} נושאים
            </span>
            <span className="stat-item">
              {lessonInfo.length} שיעורים
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-item progress">
              <PlayCircleOutlined />
              {getCompletedLessonsCount()}/{lessonInfo.length} שיעורים הושלמו
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(getCompletedLessonsCount() / lessonInfo.length) * 100}%` }} 
            />
          </div>
        </div>
      </CourseTitle>

      {topics.map(topic => {
        const isTopicActive = selectedVideo && topic.lessons.includes(selectedVideo.lessonNumber);
        const topicStats = getTopicStats(topic.id);
        
        return (
          <TopicItem key={topic.id}>
            <TopicHeader 
              $isOpen={openTopics.includes(topic.id)}
              onClick={() => toggleTopic(topic.id)}
            >
              <div className="topic-header-main">
                <div className="topic-info">
                  {topic.title}
                </div>
                <div className="topic-metadata">
                  {topicStats.completed > 0 && (
                    <span className="topic-progress">
                      <PlayCircleOutlined /> {topicStats.completed}/{topicStats.total}
                    </span>
                  )}
                  <span className="topic-duration">
                    <ClockCircleOutlined />
                    {topicStats.duration}
                  </span>
                  <CaretLeftOutlined className="caret" />
                </div>
              </div>
              <div className="topic-progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.round(topicStats.percentage)}%` }} 
                />
              </div>
            </TopicHeader>
            
            <LessonContainer $isOpen={openTopics.includes(topic.id)}>
              {topic.lessons.map(lessonId => {
                const lesson = lessonInfo.find(l => l.id === lessonId);
                if (!lesson) return null;

                const isLessonActive = selectedVideo?.lessonNumber === lessonId;
                const lessonProgress = getLessonProgress(lessonId);
                const lessonDuration = getLessonDuration(lessonId);
                const completed = isLessonCompleted(lessonId);

                return (
                  <LessonItem 
                    key={lessonId} 
                    $isOpen={openLessons.includes(lessonId)}
                    $isActive={isLessonActive}
                    $isCompleted={completed}
                    ref={isLessonActive ? selectedLessonRef : undefined}
                  >
                    <LessonHeader 
                      onClick={() => {
                        toggleLesson(lessonId);
                        const lessonVideos = videos.filter(v => v.lessonNumber === lessonId);
                        if (lessonVideos.length === 1) {
                          onVideoSelect(lessonVideos[0]);
                        }
                      }}
                      $isActive={isLessonActive}
                      $isCompleted={completed}
                      $isExpanded={openLessons.includes(lessonId)}
                    >
                      <div className="header-content">
                        <div className="progress-indicator" />
                        <div className="lesson-content">
                          <LessonTitle 
                            $isActive={isLessonActive}
                            $isCompleted={completed}
                          >
                            {lesson.name}
                          </LessonTitle>
                          <LessonMetadata>
                            <span className="lesson-duration">
                              <ClockCircleOutlined /> {lessonDuration}
                            </span>
                            {videos.filter(v => v.lessonNumber === lessonId).length > 1 && (
                              <span className="video-count">
                                {videos.filter(v => v.lessonNumber === lessonId).length} סרטונים
                              </span>
                            )}
                          </LessonMetadata>
                        </div>
                        {videos.filter(v => v.lessonNumber === lessonId).length > 1 && (
                          <CaretLeftOutlined className="expand-indicator" />
                        )}
                      </div>
                      <div className="lesson-progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${Math.round(lessonProgress.percentage)}%` }} 
                        />
                      </div>
                      {lessonProgress.completed > 0 && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#10b981', 
                          fontWeight: '500',
                          textAlign: 'left',
                          marginTop: '-4px'
                        }}>
                          {lessonProgress.completed}/{lessonProgress.total} סרטונים הושלמו
                        </div>
                      )}
                    </LessonHeader>
                    
                    {videos.filter(v => v.lessonNumber === lessonId).length > 1 && (
                      <VideoList $isVisible={openLessons.includes(lessonId)}>
                        {videos
                          .filter(v => v.lessonNumber === lessonId)
                          .sort((a, b) => a.segmentNumber - b.segmentNumber)
                          .map((video, index) => {
                            const videoProgressData = videoProgress.find(p => p.vimeoId === video.vimeoId);
                            const isWatched = videoProgressData?.completed || false;

                            return (
                              <VideoItem 
                                key={video.id}
                                onClick={() => onVideoSelect(video)}
                                $isActive={selectedVideo?.id === video.id}
                                $isWatched={isWatched}
                              >
                                <div className="video-content">
                                  <PlayCircleOutlined className="video-icon" />
                                  <span className="segment-number">{index + 1}</span>
                                  <VideoTitle $isActive={selectedVideo?.id === video.id} $isWatched={isWatched}>
                                    {video.title}
                                  </VideoTitle>
                                  <span className="duration-badge">
                                    <ClockCircleOutlined />
                                    {formatNavigationTime(video.duration)}
                                  </span>
                                </div>
                              </VideoItem>
                            );
                          })}
                      </VideoList>
                    )}
                  </LessonItem>
                );
              })}
            </LessonContainer>
          </TopicItem>
        );
      })}
    </NavContainer>
  );
};

export default CourseNavigation; 