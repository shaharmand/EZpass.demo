import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Typography, Card, Button } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined, BookOutlined, LeftOutlined, RightOutlined, LoadingOutlined } from '@ant-design/icons';
import Player from '@vimeo/player';
import CourseLayout from './CourseLayout';
import CourseNavigation from './CourseNavigation';
import { CourseData, VideoData } from './types';
import CourseHeader from './CourseHeader';

const { Title, Text } = Typography;

const VideoContainer = styled.div`
  padding: 32px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  overflow: hidden;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const PlayerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;

  iframe {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .thumbnail {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    .play-button {
      font-size: 64px;
      color: white;
      opacity: 0.8;
      transition: all 0.3s ease;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    &:hover .play-button {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
  }
`;

const VideoInfo = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .ant-card-body {
    padding: 24px;
  }
`;

const VideoTitle = styled(Title)`
  margin-bottom: 16px !important;
  font-size: 24px !important;
`;

const VideoMeta = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  color: #666;
  font-size: 14px;

  span {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .progress-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: #f0f9ff;
    border-radius: 16px;
    color: #3b82f6;
    font-weight: 500;
  }
`;

const VideoDescription = styled(Text)`
  font-size: 16px;
  line-height: 1.6;
  color: #4a4a4a;
`;

const WelcomeContainer = styled(Card)`
  text-align: center;
  padding: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;

  .ant-card-body {
    max-width: 600px;
  }
`;

const WelcomeTitle = styled(Title)`
  margin-bottom: 16px !important;
  font-size: 32px !important;
  background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}ש' ${mins}ד'` : `${mins}ד'`;
};

const NavigationButtons = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
  justify-content: space-between;
`;

const NavButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
  
  &[disabled] {
    pointer-events: none;
  }
`;

interface VideoProgress {
  videoId: string;
  progress: number;
  completed: boolean;
}

interface TimeUpdateEvent {
  seconds: number;
  percent: number;
  duration: number;
}

interface CourseViewProps {
  courseData: CourseData;
  isAdmin?: boolean;
}

const CourseView: React.FC<CourseViewProps> = ({ courseData, isAdmin = false }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const playerRef = useRef<Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const lastTimeUpdateRef = useRef<number>(0);
  const wasSeekingRef = useRef<boolean>(false);

  // Find the first video when component mounts
  useEffect(() => {
    if (!selectedVideo && courseData.topics.length > 0) {
      const firstTopic = courseData.topics[0];
      const firstLesson = firstTopic.lessons[0];
      const firstVideo = courseData.videos
        .filter(v => v.lessonNumber === firstLesson)
        .sort((a, b) => a.segmentNumber - b.segmentNumber)[0];
      
      if (firstVideo) {
        setSelectedVideo(firstVideo);
      }
    }
  }, [courseData, selectedVideo]);

  // Initialize Vimeo player when video changes
  useEffect(() => {
    if (selectedVideo?.vimeoId && playerContainerRef.current) {
      setIsLoading(true);

      // Destroy existing player if any
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // Clear the container
      playerContainerRef.current.innerHTML = '';

      // Create new player with proper iframe setup
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', `https://player.vimeo.com/video/${selectedVideo.vimeoId}`);
      iframe.setAttribute('width', '100%');
      iframe.setAttribute('height', '100%');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'autoplay; fullscreen');
      iframe.setAttribute('allowfullscreen', 'true');
      playerContainerRef.current.appendChild(iframe);

      // Wait for iframe to load before initializing player
      iframe.onload = () => {
        try {
          // Initialize player with the iframe
          playerRef.current = new Player(iframe);
          setIsLoading(false);

          let progressSaveTimeout: NodeJS.Timeout;

          // Track seeking events
          playerRef.current.on('seeked', ({ seconds }: { seconds: number }) => {
            wasSeekingRef.current = true;
            lastTimeUpdateRef.current = seconds;
          });

          // Track progress
          playerRef.current.on<TimeUpdateEvent>('timeupdate', ({ seconds, duration }) => {
            const progress = (seconds / duration) * 100;
            
            // Only consider it completed if it wasn't from seeking
            const isNaturalProgress = !wasSeekingRef.current || 
              (Math.abs(seconds - lastTimeUpdateRef.current) <= 1); // Allow 1 second difference
            
            // Only mark as completed if we reach 100% naturally
            const completed = isNaturalProgress && progress >= 100;
            
            // Reset seeking flag after we've processed this update
            wasSeekingRef.current = false;
            lastTimeUpdateRef.current = seconds;

            // Clear existing timeout to prevent multiple rapid saves
            if (progressSaveTimeout) {
              clearTimeout(progressSaveTimeout);
            }

            // Update progress state and save to localStorage after a delay
            progressSaveTimeout = setTimeout(() => {
              setVideoProgress(prev => {
                const existingProgress = prev.find(p => p.videoId === selectedVideo.id);
                const newProgress = existingProgress
                  ? prev.map(p => 
                      p.videoId === selectedVideo.id 
                        ? { ...p, progress, completed: completed || p.completed }
                        : p
                    )
                  : [...prev, { videoId: selectedVideo.id, progress, completed }];

                // Save to localStorage
                localStorage.setItem('videoProgress', JSON.stringify(newProgress));
                return [...newProgress];
              });
            }, 250);
          });

          // Handle video end
          playerRef.current.on('ended', () => {
            setVideoProgress(prev => {
              const existingProgress = prev.find(p => p.videoId === selectedVideo.id);
              const newProgress = existingProgress
                ? prev.map(p => 
                    p.videoId === selectedVideo.id 
                      ? { ...p, progress: 100, completed: true }
                      : p
                  )
                : [...prev, { videoId: selectedVideo.id, progress: 100, completed: true }];

              localStorage.setItem('videoProgress', JSON.stringify(newProgress));
              return [...newProgress]; // Force a re-render
            });
          });
        } catch (error) {
          console.error('Error initializing Vimeo player:', error);
          setIsLoading(false);
        }
      };

      return () => {
        if (playerRef.current) {
          playerRef.current.off('timeupdate');
          playerRef.current.off('ended');
          playerRef.current.destroy();
          playerRef.current = null;
        }
      };
    }
  }, [selectedVideo]); // Remove videoProgress from dependencies

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('videoProgress');
    if (savedProgress) {
      setVideoProgress(JSON.parse(savedProgress));
    }
  }, []);

  const handleVideoSelect = (video: VideoData) => {
    // Check if current video should be marked as completed before changing
    if (selectedVideo) {
      const currentProgress = videoProgress.find(p => p.videoId === selectedVideo.id);
      if (currentProgress && currentProgress.progress >= 90 && !currentProgress.completed) {
        setVideoProgress(prev => {
          const newProgress = prev.map(p => 
            p.videoId === selectedVideo.id 
              ? { ...p, completed: true }
              : p
          );
          localStorage.setItem('videoProgress', JSON.stringify(newProgress));
          return [...newProgress];
        });
      }
    }
    
    setSelectedVideo(video);
  };

  const getVideoUrl = (video: VideoData) => {
    if (video.vimeoId) {
      return `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1`;
    }
    return video.url;
  };

  const findAdjacentVideo = (direction: 'next' | 'prev'): VideoData | null => {
    if (!selectedVideo) return null;

    // Get all videos sorted by lesson and segment number
    const allVideos = courseData.videos
      .slice()
      .sort((a, b) => {
        if (a.lessonNumber !== b.lessonNumber) {
          return a.lessonNumber - b.lessonNumber;
        }
        return a.segmentNumber - b.segmentNumber;
      });

    const currentIndex = allVideos.findIndex(v => v.id === selectedVideo.id);
    if (currentIndex === -1) return null;

    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    return allVideos[targetIndex] || null;
  };

  const handleNavigate = (direction: 'next' | 'prev') => {
    const video = findAdjacentVideo(direction);
    if (video) {
      // Use handleVideoSelect to ensure completion check is performed
      handleVideoSelect(video);
    }
  };

  const renderContent = () => {
    if (!selectedVideo) {
      return (
        <WelcomeContainer>
          <div style={{ fontSize: '16px', color: '#8c8c8c' }}>
            בחר וידאו מהתפריט כדי להתחיל בצפייה
          </div>
        </WelcomeContainer>
      );
    }

    const lesson = courseData.lessonInfo.find(l => l.id === selectedVideo.lessonNumber);
    const topic = courseData.topics.find(t => t.lessons.includes(selectedVideo.lessonNumber));
    const prevVideo = findAdjacentVideo('prev');
    const nextVideo = findAdjacentVideo('next');

    const currentProgress = videoProgress.find(p => p.videoId === selectedVideo.id);

    return (
      <VideoContainer>
        <VideoWrapper>
          <PlayerContainer ref={playerContainerRef}>
            {isLoading && (
              <div className="loading-overlay">
                <LoadingOutlined spin />
              </div>
            )}
          </PlayerContainer>
        </VideoWrapper>
        <VideoInfo>
          <VideoTitle level={3}>{selectedVideo.title}</VideoTitle>
          <VideoMeta>
            <span>
              <BookOutlined /> {topic?.title}
            </span>
            <span>
              <PlayCircleOutlined /> חלק {selectedVideo.segmentNumber}
            </span>
            <span>
              <ClockCircleOutlined /> {formatDuration(selectedVideo.duration)}
            </span>
            <span className="progress-indicator">
              <PlayCircleOutlined /> 
              {Math.round(currentProgress?.progress || 0)}% הושלם
            </span>
          </VideoMeta>
          {selectedVideo.description && (
            <VideoDescription>{selectedVideo.description}</VideoDescription>
          )}
          <NavigationButtons>
            <NavButton 
              type="default"
              onClick={() => handleNavigate('prev')}
              disabled={!prevVideo}
              icon={<LeftOutlined />}
            >
              {prevVideo ? `הקודם: ${prevVideo.title}` : 'אין וידאו קודם'}
            </NavButton>
            <NavButton 
              type="primary"
              onClick={() => handleNavigate('next')}
              disabled={!nextVideo}
            >
              {nextVideo ? `הבא: ${nextVideo.title}` : 'אין וידאו הבא'}
              {nextVideo && <RightOutlined />}
            </NavButton>
          </NavigationButtons>
        </VideoInfo>
      </VideoContainer>
    );
  };

  const watchedVideos = videoProgress.filter(p => p.completed).length;
  const totalDuration = courseData.videos.reduce((total, video) => total + video.duration, 0);
  const watchedDuration = videoProgress.reduce((total, p) => {
    const video = courseData.videos.find(v => v.id === p.videoId);
    return p.completed && video ? total + video.duration : total;
  }, 0);

  console.log('CourseView rendering with data:', courseData);

  const renderNavigation = () => (
    <CourseNavigation
      topics={courseData.topics}
      lessonInfo={courseData.lessonInfo}
      videos={courseData.videos}
      onVideoSelect={handleVideoSelect}
      selectedVideo={selectedVideo}
      courseTitle={courseData.title}
      courseDescription={courseData.description}
      watchedVideos={watchedVideos}
      videoProgress={videoProgress}
    />
  );

  return (
    <>
      <CourseHeader
        courseTitle="קורס בטיחות בבניה"
      />
      <CourseLayout
        navigation={renderNavigation()}
        isAdmin={isAdmin}
      >
        {renderContent()}
      </CourseLayout>
    </>
  );
};

export default CourseView; 