import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PlayCircleOutlined, ClockCircleOutlined, CaretLeftOutlined } from '@ant-design/icons';
import type { VideoData, LessonInfo, Topic } from './types';

const NavContainer = styled.div`
  width: 100%;
  max-width: 400px;
  height: 100%;
  background: #ffffff;
  overflow-y: auto;
  direction: rtl;
  padding: 16px 0;
  border-left: 1px solid #e5e7eb;
  margin-right: auto;

  @media (max-width: 768px) {
    margin-right: 0;
  }

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
  padding: 0 24px 20px 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;

  h1 {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px 0;
    padding: 16px 0 0 0;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 14px;
    color: #6b7280;

    .stats-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
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
  margin: 8px 16px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  
  &:last-child {
    margin-bottom: 16px;
  }
`;

const TopicHeader = styled.div<{ $isOpen: boolean }>`
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${props => props.$isOpen ? '#f8fafc' : '#ffffff'};
  transition: all 0.3s ease;
  border-bottom: 1px solid ${props => props.$isOpen ? '#e5e7eb' : 'transparent'};

  &:hover {
    background: #f8fafc;
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
  }

  .topic-metadata {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .topic-duration {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .topic-progress {
    font-size: 13px;
    color: #10b981;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .topic-progress-bar {
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

  .caret {
    color: #6b7280;
    transform: ${props => props.$isOpen ? 'rotate(-90deg)' : 'rotate(0deg)'};
    transition: transform 0.3s ease;
  }
`;

const LessonContainer = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'block' : 'none'};
  background: #ffffff;
  padding: 8px 12px;
`;

const LessonHeader = styled.div<{ $isActive: boolean; $isCompleted: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 6px;
  background: ${props => {
    if (props.$isActive) return '#eff6ff';
    if (props.$isCompleted) return '#ecfdf5';
    return 'transparent';
  }};
  border: 2px solid ${props => {
    if (props.$isActive) return '#3b82f6';
    if (props.$isCompleted) return '#10b981';
    return 'transparent';
  }};
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => {
      if (props.$isActive) return '#eff6ff';
      if (props.$isCompleted) return '#d1fae5';
      return '#f3f4f6';
    }};
    transform: translateX(-4px);
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
  margin: 4px 0;
  transition: all 0.2s ease;

  &:first-child {
    margin-top: 0;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const LessonTitle = styled.div<{ $isActive: boolean; $isCompleted: boolean }>`
  font-size: 14px;
  font-weight: ${props => (props.$isActive || props.$isCompleted) ? '600' : '500'};
  color: ${props => {
    if (props.$isActive) return '#3b82f6';
    if (props.$isCompleted) return '#10b981';
    return '#1f2937';
  }};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  }

  .lesson-progress {
    color: #10b981;
    font-weight: 500;
  }
`;

const VideoList = styled.div<{ $isVisible: boolean }>`
  max-height: ${props => props.$isVisible ? '1000px' : '0'};
  opacity: ${props => props.$isVisible ? '1' : '0'};
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  padding: ${props => props.$isVisible ? '8px 4px' : '0'};
  background: ${props => props.$isVisible ? '#ffffff' : 'transparent'};
  border-radius: 0 0 8px 8px;
  margin: 0 4px;
`;

const VideoItem = styled.div<{ $isActive: boolean; $isWatched: boolean }>`
  padding: 8px 12px;
  margin: 2px 0;
  cursor: pointer;
  border-radius: 6px;
  background: ${props => {
    if (props.$isActive) return '#eff6ff';
    if (props.$isWatched) return '#ecfdf5';
    return 'transparent';
  }};
  border: 2px solid ${props => {
    if (props.$isActive) return '#3b82f6';
    if (props.$isWatched) return '#10b981';
    return 'transparent';
  }};
  opacity: 1;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  
  &:hover {
    background: ${props => {
      if (props.$isActive) return '#eff6ff';
      if (props.$isWatched) return '#d1fae5';
      return '#f3f4f6';
    }};
    border-color: ${props => {
      if (props.$isActive) return '#3b82f6';
      if (props.$isWatched) return '#10b981';
      return '#e5e7eb';
    }};
    transform: translateX(-4px);
  }

  &:active {
    transform: translateX(-2px);
  }

  .video-icon {
    color: ${props => props.$isActive ? '#3b82f6' : props.$isWatched ? '#10b981' : '#6b7280'};
    font-size: 16px;
    transition: transform 0.2s ease;
  }

  &:hover .video-icon {
    transform: scale(1.1);
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

    .progress-text {
      color: ${props => props.$isWatched ? '#10b981' : '#3b82f6'};
      font-weight: 600;
      padding-left: 4px;
      border-left: 1px solid ${props => props.$isWatched ? '#6ee7b7' : '#e5e7eb'};
      margin-left: 4px;
    }
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const VideoInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 12px;
`;

interface CourseNavigationProps {
  topics: Topic[];
  lessonInfo: LessonInfo[];
  videos: VideoData[];
  onVideoSelect: (video: VideoData) => void;
  selectedVideo?: VideoData | null;
  courseTitle: string;
  courseDescription: string;
  watchedVideos: number;
  videoProgress?: Array<{ videoId: string; progress: number; completed: boolean }>;
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
  const totalSeconds = Math.round(minutes * 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (secs === 0) return `${mins} ד\'`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format video duration in rounded minutes (for navigation)
const formatNavigationTime = (minutes: number): string => {
  return `${Math.round(minutes)} ד\'`;
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
}) => {
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [openLessons, setOpenLessons] = useState<number[]>([]);

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
      }
    }
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
      videoProgress.find(p => p.videoId === video.id)?.completed
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
      return [...prev.filter(id => id === currentLessonId), lessonId];
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
    const totalMinutes = topicVideos.reduce((total, video) => total + video.duration, 0);

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
    const totalMinutes = lessonVideos.reduce((total, video) => total + video.duration, 0);
    return roundToQuarter(totalMinutes);
  };

  // Calculate total course duration
  const getTotalCourseDuration = () => {
    const totalMinutes = videos.reduce((total, video) => total + video.duration, 0);
    return roundToHalfHour(totalMinutes);
  };

  // Calculate completed lessons
  const getCompletedLessonsCount = () => {
    return lessonInfo.filter(lesson => {
      const lessonVideos = videos.filter(v => v.lessonNumber === lesson.id);
      return lessonVideos.every(video => 
        videoProgress.find(p => p.videoId === video.id)?.completed
      );
    }).length;
  };

  // Check if a lesson is completed
  const isLessonCompleted = (lessonId: number) => {
    const lessonVideos = videos.filter(v => v.lessonNumber === lessonId);
    return lessonVideos.every(video => 
      videoProgress.find(p => p.videoId === video.id)?.completed
    );
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
                  >
                    <LessonHeader 
                      onClick={() => {
                        toggleLesson(lessonId);
                        // If there's only one video in the lesson, select it directly
                        const lessonVideos = videos.filter(v => v.lessonNumber === lessonId);
                        if (lessonVideos.length === 1) {
                          onVideoSelect(lessonVideos[0]);
                        }
                      }}
                      $isActive={isLessonActive}
                      $isCompleted={completed}
                      data-expanded={openLessons.includes(lessonId)}
                    >
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
                          {lessonProgress.completed > 0 && (
                            <span className="lesson-progress">
                              <PlayCircleOutlined /> {lessonProgress.completed}/{lessonProgress.total}
                            </span>
                          )}
                        </LessonMetadata>
                      </div>
                      {videos.filter(v => v.lessonNumber === lessonId).length > 1 && (
                        <CaretLeftOutlined className="expand-indicator" />
                      )}
                    </LessonHeader>
                    
                    {videos.filter(v => v.lessonNumber === lessonId).length > 1 && (
                      <VideoList $isVisible={openLessons.includes(lessonId)}>
                        {videos
                          .filter(v => v.lessonNumber === lessonId)
                          .sort((a, b) => a.segmentNumber - b.segmentNumber)
                          .map(video => {
                            const videoProgressData = videoProgress.find(p => p.videoId === video.id);
                            const isWatched = videoProgressData?.completed || false;
                            const progress = videoProgressData?.progress || 0;

                            return (
                              <VideoItem 
                                key={video.id}
                                onClick={() => onVideoSelect(video)}
                                $isActive={selectedVideo?.id === video.id}
                                $isWatched={isWatched}
                              >
                                <PlayCircleOutlined className="video-icon" />
                                <span className="segment-number">{video.segmentNumber}</span>
                                <VideoTitle $isActive={selectedVideo?.id === video.id} $isWatched={isWatched}>
                                  {video.title}
                                </VideoTitle>
                                <span className="duration-badge">
                                  {progress > 0 && !isWatched && (
                                    <span className="progress-text">{Math.round(progress)}%</span>
                                  )}
                                  <ClockCircleOutlined />
                                  {formatNavigationTime(video.duration)}
                                </span>
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