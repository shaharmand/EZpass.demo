import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { VideoContent, VideoSource } from '../../types/videoContent';
import { Question } from '../../types/question';
import { LearningContentService } from '../../services/learningContentService';
import { videoContentService } from '../../services/videoContentService';
import { VideoPlayer } from './VideoPlayer';
import { CloseOutlined, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { lessonInfoService } from '../../services/lessonInfoService';

const VideoPlayerWrapper = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2;
  display: ${props => props.$isVisible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
`;

const VideoPlayerContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: black;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const VideoHeader = styled.div`
  padding: 12px 24px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  direction: rtl;
  height: 48px;
`;

const VideoTitle = styled.div`
  color: white;
  font-size: 16px;
  font-weight: 500;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .lesson-name {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    white-space: normal;
    line-height: 1.2;
  }

  .separator {
    color: rgba(255, 255, 255, 0.5);
    margin: 0 4px;
  }

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const CloseButton = styled.button`
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  .anticon {
    font-size: 16px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.8);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const VideoControls = styled.div`
  padding: 12px 24px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  z-index: 2;
  direction: rtl;
  height: 48px;
`;

const ContentSection = styled.div<{ $isPlaying: boolean }>`
  display: grid;
  grid-template-rows: ${props => props.$isPlaying 
    ? '1fr' 
    : '25% 45% 30%'};
  height: 100%;
  overflow: hidden;
  background: #fff;
  position: relative;
  transition: all 0.3s ease;
`;

const VideoSection = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: ${props => props.$isVisible ? 1 : 0};
  pointer-events: ${props => props.$isVisible ? 'auto' : 'none'};
  display: ${props => props.$isVisible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.3s ease;
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  overflow: hidden;

  .video-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
`;

const FeaturedSection = styled.div<{ $isPlaying: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  height: 100%;
  overflow: hidden;
  opacity: ${props => props.$isPlaying ? 0 : 1};
  pointer-events: ${props => props.$isPlaying ? 'none' : 'auto'};
  position: ${props => props.$isPlaying ? 'absolute' : 'relative'};
  z-index: ${props => props.$isPlaying ? -1 : 0};
  transition: all 0.3s ease;
`;

const RelatedSection = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #333;
  }

  .videos-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
  }
`;

const NextLessonsSection = styled.div<{ $isPlaying: boolean }>`
  padding: 12px 16px;
  height: 100%;
  overflow: hidden;
  opacity: ${props => props.$isPlaying ? 0 : 1};
  pointer-events: ${props => props.$isPlaying ? 'none' : 'auto'};
  position: ${props => props.$isPlaying ? 'absolute' : 'relative'};
  z-index: ${props => props.$isPlaying ? -1 : 0};
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #333;
  }

  .lessons-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
  }
`;

const VideoListItem = styled.div<{ $isFeatured?: boolean }>`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  height: ${props => props.$isFeatured ? '100%' : '80px'};
  margin-bottom: ${props => props.$isFeatured ? '0' : '8px'};
  background: #fff;
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

    &::after {
      opacity: 1;
    }

    img {
      transform: scale(1.05);
    }
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E");
    background-size: 24px;
    background-repeat: no-repeat;
    background-position: center;
  }

  img {
    width: ${props => props.$isFeatured ? '240px' : '120px'};
    height: ${props => props.$isFeatured ? '135px' : '67.5px'};
    object-fit: cover;
    border-radius: 6px;
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    padding-right: 8px;

    .lesson-name {
      font-size: ${props => props.$isFeatured ? '14px' : '12px'};
      color: #64748b;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .video-title {
      font-size: ${props => props.$isFeatured ? '16px' : '14px'};
      font-weight: 600;
      color: #1e293b;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: ${props => props.$isFeatured ? '2' : '2'};
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
`;

const LessonLink = styled.a`
  display: block;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 12px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s;
  cursor: pointer;

  &:hover {
    background: #e8e8e8;
  }

  h4 {
    margin: 0 0 8px;
    font-size: 16px;
    color: #333;
  }

  .lesson-info {
    font-size: 14px;
    color: #666;
    display: flex;
    gap: 12px;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
`;

interface RelatedContentProps {
  currentQuestion: Question;
  subtopicId: string;
}

export const RelatedContent: React.FC<RelatedContentProps> = ({
  currentQuestion,
  subtopicId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoContent | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [relatedLessons, setRelatedLessons] = useState<any[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!currentQuestion) return;
      
      setIsLoading(true);
      try {
        const allVideos = await videoContentService.getSubtopicVideos(subtopicId);
        const relatedVideos = await LearningContentService.findVideosForQuestion(
          currentQuestion,
          allVideos
        );

        console.log('=== Related Videos ===');
        relatedVideos.forEach((video) => {
          console.log('Video:', {
            id: video.id,
            title: video.title,
            lessonNumber: video.lessonNumber,
            videoId: video.videoId,
            subtopicId: video.subtopicId
          });
        });

        setVideos(relatedVideos);
      } catch (error) {
        console.error('Failed to fetch related videos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [currentQuestion, subtopicId]);

  useEffect(() => {
    // Notify parent components about video playing state
    const event = new CustomEvent('videoPlayingStateChanged', { 
      detail: { isPlaying: isVideoPlaying } 
    });
    window.dispatchEvent(event);

    // We don't need to modify body overflow anymore since we're contained in the panel
    if (isVideoPlaying) {
      // Find and hide the parent header if needed
      const parentHeader = document.querySelector('[data-testid="content-header"]');
      if (parentHeader) {
        (parentHeader as HTMLElement).style.display = 'none';
      }
    } else {
      // Restore the parent header
      const parentHeader = document.querySelector('[data-testid="content-header"]');
      if (parentHeader) {
        (parentHeader as HTMLElement).style.display = '';
      }
    }

    return () => {
      // Restore the parent header on unmount
      const parentHeader = document.querySelector('[data-testid="content-header"]');
      if (parentHeader) {
        (parentHeader as HTMLElement).style.display = '';
      }
    };
  }, [isVideoPlaying]);

  const featuredVideo = videos[0];
  const currentLessonNumber = activeVideo?.lessonNumber || featuredVideo?.lessonNumber;

  useEffect(() => {
    const fetchRelatedLessons = async () => {
      console.log('Fetching related lessons with:', {
        currentLessonNumber,
        subtopicId
      });

      if (currentLessonNumber && subtopicId) {
        try {
          const lessons = await videoContentService.getRelatedLessons(subtopicId, currentLessonNumber);
          console.log('Found related lessons:', lessons);
          setRelatedLessons(lessons);
        } catch (error) {
          console.error('Error fetching related lessons:', error);
        }
      } else {
        console.log('Missing required data for fetching lessons:', {
          currentLessonNumber,
          subtopicId
        });
      }
    };

    fetchRelatedLessons();
  }, [currentLessonNumber, subtopicId]);

  const handleVideoClick = (video: VideoContent) => {
    setActiveVideo(video);
    setIsVideoPlaying(true);
  };

  const handleVideoClose = () => {
    setIsVideoPlaying(false);
    setActiveVideo(null);
  };

  const handleLessonClick = (lessonNumber: number) => {
    window.location.href = `/course/construction-safety?lesson=${lessonNumber}`;
  };

  const handleWrapperClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleVideoClose();
    }
  }, []);

  const handleNextVideo = () => {
    if (!activeVideo || !videos) return;
    
    const currentIndex = videos.findIndex(v => v.videoId === activeVideo.videoId);
    if (currentIndex < videos.length - 1) {
      setActiveVideo(videos[currentIndex + 1]);
    }
  };

  const handlePreviousVideo = () => {
    if (!activeVideo || !videos) return;
    
    const currentIndex = videos.findIndex(v => v.videoId === activeVideo.videoId);
    if (currentIndex > 0) {
      setActiveVideo(videos[currentIndex - 1]);
    }
  };

  const hasNextVideo = () => {
    if (!activeVideo || !videos) return false;
    
    const currentIndex = videos.findIndex(v => v.videoId === activeVideo.videoId);
    return currentIndex < videos.length - 1;
  };

  const hasPreviousVideo = () => {
    if (!activeVideo || !videos) return false;
    
    const currentIndex = videos.findIndex(v => v.videoId === activeVideo.videoId);
    return currentIndex > 0;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const relatedVideos = videos.slice(1, 4);

  return (
    <ContentSection $isPlaying={isVideoPlaying}>
      <VideoSection $isVisible={isVideoPlaying}>
        <VideoContainer>
          <VideoHeader>
            <VideoTitle>
              {activeVideo && (
                <>
                  <span className="lesson-name">{lessonInfoService.getLessonName(activeVideo.lessonNumber)}</span>
                  <span className="separator">|</span>
                  <span className="title">{activeVideo.title}</span>
                </>
              )}
            </VideoTitle>
            <CloseButton onClick={handleVideoClose}>
              <CloseOutlined />
              סגור וידאו
            </CloseButton>
          </VideoHeader>

          <div className="video-wrapper">
            {activeVideo && (
              <VideoPlayer
                videoId={activeVideo.videoId}
                videoSource={VideoSource.VIMEO}
                title={activeVideo.title}
                isOpen={!!activeVideo}
                onClose={handleVideoClose}
              />
            )}
          </div>

          <VideoControls>
            {/* Additional controls can be added here if needed */}
          </VideoControls>
        </VideoContainer>
      </VideoSection>

      {!isVideoPlaying && (
        <>
          <FeaturedSection $isPlaying={isVideoPlaying}>
            {featuredVideo && (
              <VideoListItem 
                $isFeatured 
                onClick={() => handleVideoClick(featuredVideo)}
              >
                <img 
                  src={`https://vumbnail.com/${featuredVideo.videoId}.jpg`}
                  alt={featuredVideo.title} 
                />
                <div className="content">
                  <span className="lesson-name">{lessonInfoService.getLessonName(featuredVideo.lessonNumber)}</span>
                  <span className="video-title">{featuredVideo.title}</span>
                </div>
              </VideoListItem>
            )}
          </FeaturedSection>

          <RelatedSection>
            <h3>סרטונים קשורים</h3>
            <div className="videos-container">
              {relatedVideos.map((video) => (
                <VideoListItem 
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                >
                  <img 
                    src={`https://vumbnail.com/${video.videoId}.jpg`}
                    alt={video.title} 
                  />
                  <div className="content">
                    <span className="lesson-name">{lessonInfoService.getLessonName(video.lessonNumber)}</span>
                    <span className="video-title">{video.title}</span>
                  </div>
                </VideoListItem>
              ))}
            </div>
          </RelatedSection>

          {relatedLessons.length > 0 && (
            <NextLessonsSection $isPlaying={isVideoPlaying}>
              <h3>שיעור מלא</h3>
              <div className="lessons-container">
                {relatedLessons.map(lesson => (
                  <LessonLink 
                    key={lesson.lessonNumber}
                    href={`http://localhost:3000/courses/safety?lessonId=${lesson.lessonNumber}`}
                  >
                    <h4>{lessonInfoService.getLessonName(lesson.lessonNumber)}</h4>
                    <div className="lesson-info">
                      <span>
                        <ClockCircleOutlined />
                        {videoContentService.formatDuration(lesson.totalDuration)}
                      </span>
                      <span>
                        <PlayCircleOutlined />
                        {lesson.videoCount} סרטונים
                      </span>
                    </div>
                  </LessonLink>
                ))}
              </div>
            </NextLessonsSection>
          )}
        </>
      )}
    </ContentSection>
  );
};

export default RelatedContent; 