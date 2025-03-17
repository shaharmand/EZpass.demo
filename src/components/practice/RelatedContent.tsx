import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { VideoContent, VideoSource } from '../../types/videoContent';
import { Question } from '../../types/question';
import { LearningContentService } from '../../services/learningContentService';
import { videoContentService } from '../../services/videoContentService';
import { VideoPlayer } from './VideoPlayer';
import { CloseOutlined } from '@ant-design/icons';

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

  .lesson-number {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
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
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  height: ${props => props.$isFeatured ? '100%' : '70px'};
  margin-bottom: ${props => props.$isFeatured ? '0' : '4px'};

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  img {
    width: ${props => props.$isFeatured ? '180px' : '100px'};
    height: ${props => props.$isFeatured ? 'auto' : '100%'};
    object-fit: cover;
    border-radius: 4px;
  }

  .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    flex: 1;
    min-width: 0;

    .lesson-name {
      font-size: ${props => props.$isFeatured ? '14px' : '12px'};
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .video-title {
      font-size: ${props => props.$isFeatured ? '16px' : '13px'};
      font-weight: 500;
      color: #333;
      display: -webkit-box;
      -webkit-line-clamp: ${props => props.$isFeatured ? '2' : '1'};
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
`;

const LessonLink = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #eee;
  }

  h4 {
    margin: 0 0 2px 0;
    font-size: 14px;
    color: #333;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const featuredVideo = videos[0];
  const relatedVideos = videos.slice(1, 4);

  return (
    <ContentSection $isPlaying={isVideoPlaying}>
      <VideoSection $isVisible={isVideoPlaying}>
        <VideoContainer>
          <VideoHeader>
            <VideoTitle>
              {activeVideo && (
                <>
                  <span className="lesson-number">שיעור {activeVideo.lessonNumber}</span>
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
                isOpen={isVideoPlaying}
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
                  <span className="lesson-name">שיעור: {featuredVideo.lessonNumber || 'N/A'}</span>
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
                    <span className="lesson-name">שיעור: {video.lessonNumber || 'N/A'}</span>
                    <span className="video-title">{video.title}</span>
                  </div>
                </VideoListItem>
              ))}
            </div>
          </RelatedSection>

          <NextLessonsSection $isPlaying={isVideoPlaying}>
            <h3>שיעורים הבאים</h3>
            <div className="lessons-container">
              <LessonLink onClick={() => handleLessonClick(22)}>
                <h4>שיעור 22</h4>
                <p>עגורן צריח - בדיקות בודק מוסמך</p>
              </LessonLink>
              <LessonLink onClick={() => handleLessonClick(23)}>
                <h4>שיעור 23</h4>
                <p>עגורנאים - הרשאה להפעלה</p>
              </LessonLink>
            </div>
          </NextLessonsSection>
        </>
      )}
    </ContentSection>
  );
};

export default RelatedContent; 