import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Typography, Card, Button } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined, BookOutlined, LeftOutlined, RightOutlined, LoadingOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import Player from '@vimeo/player';
import CourseLayout from './CourseLayout';
import CourseNavigation from './CourseNavigation';
import { CourseData, VideoData } from './types';
import CourseHeader from './CourseHeader';
import { VideoPlayer } from '../practice/VideoPlayer';
import { VideoSource } from '../../types/videoContent';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const CourseContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const VideoContainer = styled.div`
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
  overflow-y: auto;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-top: min(56.25%, calc(100vh - 600px)); /* 16:9 Aspect Ratio with max height */
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex: 1 1 auto;
  min-height: 0; /* Allow shrinking */
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

const VideoDetailsCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
  flex: 0 0 auto;

  .ant-card-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const LessonName = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const VideoTitle = styled(Title)`
  margin-bottom: 12px !important;
  font-size: 20px !important;
  color: #1e293b;
  line-height: 1.3;
`;

const VideoMeta = styled.div`
  display: flex;
  gap: 12px;
  color: #666;
  font-size: 13px;
  flex: 0 0 auto;
  margin-bottom: 0;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .progress-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    background: #f0f9ff;
    border-radius: 12px;
    color: #3b82f6;
    font-weight: 500;
  }
`;

const VideoDescription = styled(Text)`
  font-size: 14px;
  line-height: 1.5;
  color: #4a4a4a;
  margin-bottom: 0;
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
  // Round to nearest minute
  const roundedMinutes = Math.round(minutes);
  
  const hours = Math.floor(roundedMinutes / 60);
  const mins = roundedMinutes % 60;
  
  return hours > 0 ? `${hours}ש' ${mins}ד'` : `${mins}ד'`;
};

const VideoDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1001;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #1e293b;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    line-height: 1.4;
  }
`;

const NavigationButtons = styled.div`
  display: flex;
  gap: 6px;
  justify-content: space-between;
  margin: 0;
  padding: 0;
  width: 100%;
`;

const NavButtonGroup = styled.div`
  display: flex;
  gap: 6px;
`;

const NavButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: ${props => props.$variant === 'primary' ? '#3b82f6' : '#f3f4f6'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#4b5563'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 28px;

  &:hover {
    background: ${props => props.$variant === 'primary' ? '#2563eb' : '#e5e7eb'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BackButton = styled(NavButton)`
  background: #f3f4f6;
  color: #4b5563;
  
  &:hover {
    background: #e5e7eb;
  }
`;

interface VideoProgress {
  vimeoId: string;
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
  const { user } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const playerRef = useRef<Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const lastTimeUpdateRef = useRef<number>(0);
  const wasSeekingRef = useRef<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const navigate = useNavigate();

  // Combined initial video selection logic
  useEffect(() => {
    if (!selectedVideo) {
      let targetVideo: VideoData | null = null;

      if (courseData.initialLessonId) {
        // Find first video of the specified lesson
        targetVideo = courseData.videos
          .filter(v => v.lessonNumber === courseData.initialLessonId)
          .sort((a, b) => a.segmentNumber - b.segmentNumber)[0];
      } 
      
      if (!targetVideo && courseData.topics.length > 0) {
        // Fallback to first video of first lesson if no specific lesson ID or video not found
        const firstTopic = courseData.topics[0];
        const firstLesson = firstTopic.lessons[0];
        targetVideo = courseData.videos
          .filter(v => v.lessonNumber === firstLesson)
          .sort((a, b) => a.segmentNumber - b.segmentNumber)[0];
      }
      
      if (targetVideo) {
        setSelectedVideo(targetVideo);
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
                const existingProgress = prev.find(p => p.vimeoId === selectedVideo.vimeoId);
                const newProgress = existingProgress
                  ? prev.map(p => 
                      p.vimeoId === selectedVideo.vimeoId 
                        ? { ...p, progress, completed: completed || p.completed }
                        : p
                    )
                  : [...prev, { vimeoId: selectedVideo.vimeoId, progress, completed }];

                // Save to localStorage
                localStorage.setItem('videoProgress', JSON.stringify(newProgress));
                return [...newProgress];
              });
            }, 250);
          });

          // Handle video end
          playerRef.current.on('ended', () => {
            setVideoProgress(prev => {
              const existingProgress = prev.find(p => p.vimeoId === selectedVideo.vimeoId);
              const newProgress = existingProgress
                ? prev.map(p => 
                    p.vimeoId === selectedVideo.vimeoId 
                      ? { ...p, progress: 100, completed: true }
                      : p
                  )
                : [...prev, { vimeoId: selectedVideo.vimeoId, progress: 100, completed: true }];

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
      const currentProgress = videoProgress.find(p => p.vimeoId === selectedVideo.vimeoId);
      if (currentProgress && currentProgress.progress >= 90 && !currentProgress.completed) {
        setVideoProgress(prev => {
          const newProgress = prev.map(p => 
            p.vimeoId === selectedVideo.vimeoId 
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

  const handleVideoClick = (video: VideoData) => {
    setSelectedVideo(video);
    setIsVideoPlaying(true);
  };

  const handleVideoClose = () => {
    setIsVideoPlaying(false);
    setSelectedVideo(null);
  };

  // Group videos by lesson number
  const videosByLesson = courseData.videos.reduce((acc, video) => {
    const lessonNumber = video.lessonNumber;
    if (!acc[lessonNumber]) {
      acc[lessonNumber] = [];
    }
    acc[lessonNumber].push(video);
    return acc;
  }, {} as Record<number, VideoData[]>);

  const getPracticePageUrl = () => {
    console.log('Auth state:', user ? 'Logged in user' : 'Guest user');

    if (user) {
      // For logged in users, check active_preps
      const activePreps = localStorage.getItem('active_preps');
      console.log('Active preps for logged in user:', activePreps);
      
      if (activePreps) {
        try {
          const parsedPreps = JSON.parse(activePreps);
          console.log('Parsed active preps:', parsedPreps);
          
          // Get the most recent active prep
          const preps = Object.entries(parsedPreps);
          if (preps.length > 0) {
            // Sort by startedAt time to get most recent
            const [id] = preps.sort(([,a]: any, [,b]: any) => 
              (b.state?.startedAt || 0) - (a.state?.startedAt || 0)
            )[0];
            
            console.log('Found most recent prep ID for logged in user:', id);
            const url = `/practice/${id}`;
            console.log('Will navigate to user prep:', url);
            return url;
          }
        } catch (e) {
          console.error('Error parsing active preps:', e);
        }
      }
      // If no active prep, just go to /practice for logged in users
      return '/practice';
    } else {
      // For guests, first check if we can find an existing practice session
      const guestPrepId = localStorage.getItem('guest_prep_id');
      console.log('Guest prep ID:', guestPrepId);
      
      if (guestPrepId) {
        // Verify the prep exists in active_preps
        const activePreps = localStorage.getItem('active_preps');
        if (activePreps) {
          try {
            const parsedPreps = JSON.parse(activePreps);
            if (parsedPreps[guestPrepId]) {
              const url = `/practice/${guestPrepId}`;
              console.log('Will navigate to guest prep:', url);
              return url;
            }
          } catch (e) {
            console.error('Error parsing active preps:', e);
          }
        }
      }
      
      // For guest users with no valid session, just stay in the course
      // Instead of redirecting to /practice which might cause issues
      console.log('No valid prep data found for guest, staying in course view');
      return '#'; // Use a hash to prevent navigation
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
    const currentProgress = videoProgress.find(p => p.vimeoId === selectedVideo.vimeoId);

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
        
        <VideoDetailsCard>
          <LessonName>{lesson?.name}</LessonName>
          <VideoTitle level={3}>{selectedVideo.title}</VideoTitle>
          <VideoMeta>
            <span>
              <PlayCircleOutlined /> חלק {selectedVideo.segmentNumber}
            </span>
            <span>
              <ClockCircleOutlined />{' '}{formatDuration(selectedVideo.duration)}
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
            {user && (
              <BackButton onClick={() => {
                const url = getPracticePageUrl();
                console.log('Would navigate to:', url);
                if (url === '#') {
                  // Don't navigate for users with no valid prep
                  return;
                }
                navigate(url);
              }}>
                <ArrowRightOutlined />
                חזרה לתרגול
              </BackButton>
            )}
            <NavButtonGroup>
              <NavButton 
                onClick={() => handleNavigate('prev')}
                disabled={!prevVideo}
              >
                <RightOutlined />
                <span>{prevVideo ? prevVideo.title : 'אין וידאו קודם'}</span>
              </NavButton>
              <NavButton 
                $variant="primary"
                onClick={() => handleNavigate('next')}
                disabled={!nextVideo}
              >
                <span>{nextVideo ? nextVideo.title : 'אין וידאו הבא'}</span>
                <LeftOutlined />
              </NavButton>
            </NavButtonGroup>
          </NavigationButtons>
        </VideoDetailsCard>
      </VideoContainer>
    );
  };

  const watchedVideos = videoProgress.filter(p => p.completed).length;
  const totalDuration = courseData.videos.reduce((total, video) => total + video.duration, 0);
  const watchedDuration = videoProgress.reduce((total, p) => {
    const foundVideo = courseData.videos.find(v => v.id === p.vimeoId);
    return p.completed && foundVideo ? total + foundVideo.duration : total;
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

  const handleNextVideo = () => {
    if (!selectedVideo || !courseData) return;
    
    const currentLessonVideos = courseData.videos.filter(v => v.lessonNumber === selectedVideo.lessonNumber);
    const currentIndex = currentLessonVideos.findIndex(v => v.id === selectedVideo.id);
    
    if (currentIndex < currentLessonVideos.length - 1) {
      setSelectedVideo(currentLessonVideos[currentIndex + 1]);
    } else {
      const allLessons = courseData.topics.flatMap(t => t.lessons);
      const currentLessonIndex = allLessons.indexOf(selectedVideo.lessonNumber);
      
      if (currentLessonIndex < allLessons.length - 1) {
        const nextLessonVideos = courseData.videos.filter(v => v.lessonNumber === allLessons[currentLessonIndex + 1]);
        if (nextLessonVideos.length > 0) {
          setSelectedVideo(nextLessonVideos[0]);
        }
      }
    }
  };

  const handlePreviousVideo = () => {
    if (!selectedVideo || !courseData) return;
    
    const currentLessonVideos = courseData.videos.filter(v => v.lessonNumber === selectedVideo.lessonNumber);
    const currentIndex = currentLessonVideos.findIndex(v => v.id === selectedVideo.id);
    
    if (currentIndex > 0) {
      setSelectedVideo(currentLessonVideos[currentIndex - 1]);
    } else {
      const allLessons = courseData.topics.flatMap(t => t.lessons);
      const currentLessonIndex = allLessons.indexOf(selectedVideo.lessonNumber);
      
      if (currentLessonIndex > 0) {
        const prevLessonVideos = courseData.videos.filter(v => v.lessonNumber === allLessons[currentLessonIndex - 1]);
        if (prevLessonVideos.length > 0) {
          setSelectedVideo(prevLessonVideos[prevLessonVideos.length - 1]);
        }
      }
    }
  };

  const hasNextVideo = () => {
    if (!selectedVideo || !courseData) return false;
    
    const currentLessonVideos = courseData.videos.filter(v => v.lessonNumber === selectedVideo.lessonNumber);
    const currentIndex = currentLessonVideos.findIndex(v => v.id === selectedVideo.id);
    
    if (currentIndex < currentLessonVideos.length - 1) return true;
    
    const allLessons = courseData.topics.flatMap(t => t.lessons);
    const currentLessonIndex = allLessons.indexOf(selectedVideo.lessonNumber);
    
    if (currentLessonIndex < allLessons.length - 1) {
      const nextLessonVideos = courseData.videos.filter(v => v.lessonNumber === allLessons[currentLessonIndex + 1]);
      return nextLessonVideos.length > 0;
    }
    
    return false;
  };

  const hasPreviousVideo = () => {
    if (!selectedVideo || !courseData) return false;
    
    const currentLessonVideos = courseData.videos.filter(v => v.lessonNumber === selectedVideo.lessonNumber);
    const currentIndex = currentLessonVideos.findIndex(v => v.id === selectedVideo.id);
    
    if (currentIndex > 0) return true;
    
    const allLessons = courseData.topics.flatMap(t => t.lessons);
    const currentLessonIndex = allLessons.indexOf(selectedVideo.lessonNumber);
    
    if (currentLessonIndex > 0) {
      const prevLessonVideos = courseData.videos.filter(v => v.lessonNumber === allLessons[currentLessonIndex - 1]);
      return prevLessonVideos.length > 0;
    }
    
    return false;
  };

  return (
    <CourseContainer>
      <CourseHeader
        courseTitle="קורס בטיחות בבניה"
      />
      <CourseLayout
        navigation={renderNavigation()}
        isAdmin={isAdmin}
      >
        {renderContent()}
      </CourseLayout>
      {isVideoPlaying && selectedVideo && (
        <>
          <VideoPlayer
            videoId={selectedVideo.vimeoId}
            videoSource={VideoSource.VIMEO}
            title={selectedVideo.title}
            isOpen={isVideoPlaying}
            onClose={handleVideoClose}
          />
          <VideoDetails>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{selectedVideo.title}</h3>
                {selectedVideo.description && <p>{selectedVideo.description}</p>}
              </div>
              <NavigationButtons>
                <NavButton
                  onClick={handlePreviousVideo}
                  disabled={!hasPreviousVideo()}
                >
                  <ArrowLeftOutlined /> Previous
                </NavButton>
                <NavButton
                  onClick={handleNextVideo}
                  disabled={!hasNextVideo()}
                  $variant="primary"
                >
                  Next <ArrowRightOutlined />
                </NavButton>
              </NavigationButtons>
            </div>
          </VideoDetails>
        </>
      )}
    </CourseContainer>
  );
};

const VideoPlayerWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TopicSection = styled.div`
  margin-bottom: 32px;

  h2 {
    font-size: 24px;
    margin-bottom: 16px;
  }
`;

const LessonSection = styled.div`
  margin-bottom: 24px;

  h3 {
    font-size: 18px;
    margin-bottom: 12px;
  }
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
`;

export default CourseView;