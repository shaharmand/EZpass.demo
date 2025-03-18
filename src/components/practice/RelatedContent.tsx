import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { VideoContent, VideoSource } from '../../types/videoContent';
import { Question } from '../../types/question';
import { LearningContentService } from '../../services/learningContentService';
import { VideoContentService } from '../../services/videoContentService';
import { VideoPlayer } from './VideoPlayer';
import { CloseOutlined, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { lessonInfoService } from '../../services/lessonInfoService';
import { supabase } from '../../lib/supabase';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

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
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

const VideoPlayerContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: black;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  max-width: 100%;
  object-fit: contain;
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
  z-index: 3;
  direction: rtl;
  height: 48px;
  pointer-events: auto;
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
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  background: #fff;
  position: relative;
  transition: all 0.3s ease;
  flex: ${props => props.$isPlaying ? '1' : 'initial'};
  contain: layout size;
`;

const VideoSection = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  background: #000;
  opacity: ${props => props.$isVisible ? 1 : 0};
  pointer-events: ${props => props.$isVisible ? 'auto' : 'none'};
  display: ${props => props.$isVisible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.3s ease;
  flex: 1;
  overflow: hidden;
  contain: layout paint size;
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  overflow: hidden;
  flex: 1;

  .video-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex: 1;
  }

  iframe, video {
    width: 100% !important;
    height: 100% !important;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border: none;
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

const LessonCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  h4 {
    margin: 0 0 8px 0;
    color: #1e293b;
  }

  .lesson-info {
    color: #64748b;
    font-size: 0.9em;
  }
`;

interface RelatedLesson {
  lessonNumber: number;
  subtopicId: string;
  totalDuration: number;
  videoCount: number;
  videos: Array<{
    id: string;
    title: string;
    duration: number;
  }>;
  lessonTitle: string;
}

interface VideoContentWithLesson extends VideoContent {
  lessons?: {
    id: string;
    title: string;
    description: string;
    lesson_number: number;
  };
}

interface RelatedContentProps {
  currentQuestion: Question;
  subtopicId?: string;
  isVideoPlaying: boolean;
  onVideoPlayingChange: (isPlaying: boolean) => void;
}

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
`;

interface SupabaseVideoResponse {
  id: string;
  title: string;
  description?: string;
  vimeo_id: string;
  subtopic_id: string;
  duration: string;
  thumbnail?: string;
  order?: number;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lesson_id?: string;
  lessons: Array<{
    id: string;
    title: string;
    description: string;
    lesson_number: number;
  }>;
}

export const RelatedContent: React.FC<RelatedContentProps> = ({ 
  currentQuestion,
  subtopicId,
  isVideoPlaying,
  onVideoPlayingChange
}) => {
  const [videos, setVideos] = useState<VideoContentWithLesson[]>([]);
  const [relatedLessons, setRelatedLessons] = useState<RelatedLesson[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoContentWithLesson | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      if (!currentQuestion) return;
      
      try {
        // First get related video IDs using similarity search
        const relatedVideosList = await LearningContentService.findRelatedContent(
          currentQuestion,
          [] // Pass empty array since we'll fetch the full data next
        );

        // Get only the related videos with their lessons
        const { data: videosWithLessons, error } = await supabase
          .from('video_content')
          .select(`
            id,
            title,
            description,
            vimeo_id,
            subtopic_id,
            duration,
            thumbnail,
            order,
            tags,
            is_active,
            created_at,
            updated_at,
            lesson_id,
            lessons (
              id,
              title,
              description,
              lesson_number
            )
          `)
          .in('id', relatedVideosList.map(v => v.id))
          .not('lesson_id', 'is', null);

        if (error) {
          console.error('Error fetching videos:', error);
          return;
        }

        // Transform the data to include videoSource and ensure proper typing
        const videosWithSource = (videosWithLessons || []).map((video: any) => {
          const lessonData = Array.isArray(video.lessons) ? video.lessons[0] : video.lessons;
          return {
            ...video,
            videoSource: VideoSource.VIMEO,
            lessons: {
              id: String(lessonData?.id || ''),
              title: String(lessonData?.title || ''),
              description: String(lessonData?.description || ''),
              lesson_number: Number(lessonData?.lesson_number || 0)
            }
          };
        }) as VideoContentWithLesson[];

        console.log('Videos with source:', videosWithSource);
        setVideos(videosWithSource);
      } catch (error) {
        console.error('Failed to fetch related videos:', error);
      }
    };

    fetchVideos();
  }, [currentQuestion]);

  useEffect(() => {
    const fetchRelatedLessons = async () => {
      try {
        if (!currentQuestion) return;

        console.log('Fetching related lessons with:', {
          currentLessonNumber: currentQuestion.metadata.source?.type === 'exam' ? currentQuestion.metadata.source.order : undefined,
          subtopicId: subtopicId
        });

        // First, get the actual subtopic UUID using the code
        const { data: subtopicData, error: subtopicError } = await supabase
          .from('subtopics')
          .select('id')
          .eq('code', subtopicId)
          .single();

        if (subtopicError || !subtopicData) {
          console.error('Error fetching subtopic:', subtopicError);
          return;
        }

        console.log('Found subtopic:', subtopicData);

        const subtopicUuid = subtopicData.id;

        // Get videos with their lessons for the same subtopic
        const { data: videosWithLessons, error: lessonsError } = await supabase
          .from('video_content')
          .select(`
            *,
            lessons (
              id,
              title,
              description,
              lesson_number
            )
          `)
          .eq('subtopic_id', subtopicUuid)
          .not('lesson_id', 'is', null);

        if (lessonsError) {
          console.error('Error fetching related lessons:', lessonsError);
          return;
        }

        console.log('Found videos with lessons:', videosWithLessons);

        // Group videos by lesson
        const lessonsMap = new Map<string, {
          lessonNumber: number;
          subtopicId: string;
          totalDuration: number;
          videoCount: number;
          videos: any[];
          lessonTitle: string;
        }>();

        videosWithLessons?.forEach(video => {
          if (!video.lesson_id || !video.lessons) return;

          if (!lessonsMap.has(video.lesson_id)) {
            lessonsMap.set(video.lesson_id, {
              lessonNumber: video.lessons.lesson_number,
              subtopicId: video.subtopic_id,
              totalDuration: 0,
              videoCount: 0,
              videos: [],
              lessonTitle: video.lessons.title
            });
          }

          const lesson = lessonsMap.get(video.lesson_id)!;
          const durationMinutes = VideoContentService.parseDuration(video.duration);
          lesson.videoCount += 1;
          lesson.totalDuration += durationMinutes;
          lesson.videos.push({
            id: video.id,
            title: video.title,
            duration: durationMinutes
          });
        });

        // Convert to array and sort by lesson number
        const relatedLessons = Array.from(lessonsMap.values())
          .filter(lesson => {
            const currentLessonNumber = currentQuestion.metadata.source?.type === 'exam' 
              ? currentQuestion.metadata.source.order 
              : undefined;
            return currentLessonNumber ? lesson.lessonNumber !== currentLessonNumber : true;
          })
          .sort((a, b) => a.lessonNumber - b.lessonNumber)
          .slice(0, 2);

        setRelatedLessons(relatedLessons);
      } catch (error) {
        console.error('Error in fetchRelatedLessons:', error);
      }
    };

    fetchRelatedLessons();
  }, [currentQuestion?.metadata.source, subtopicId]);

  const handleVideoClick = (video: VideoContentWithLesson) => {
    setCurrentVideo(video);
    onVideoPlayingChange(true);
  };

  const handleVideoClose = () => {
    onVideoPlayingChange(false);
    setCurrentVideo(null);
  };

  const handleWrapperClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleVideoClose();
    }
  }, []);

  useEffect(() => {
    // When component unmounts, make sure to notify parent that video is no longer playing
    return () => {
      if (isVideoPlaying) {
        onVideoPlayingChange(false);
      }
    };
  }, [isVideoPlaying, onVideoPlayingChange]);

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  const relatedVideosList = videos.slice(1, 4);

  return (
    <ContentSection $isPlaying={isVideoPlaying} style={{ position: 'relative', overflow: 'hidden', maxWidth: '100%', contain: 'strict' }}>
      <VideoSection $isVisible={isVideoPlaying}>
        <VideoContainer>
          <VideoHeader>
            <VideoTitle>
              <span className="lesson-name">
                {currentVideo?.lessons?.title || 'ללא שם'}
                <br />
                <small style={{ fontSize: '0.85em', opacity: 0.7 }}>
                  שיעור {currentVideo?.lessons?.lesson_number}
                </small>
              </span>
              <span className="separator">|</span>
              <span className="title">{currentVideo?.title}</span>
            </VideoTitle>
            <CloseButton onClick={handleVideoClose}>
              <CloseOutlined />
              סגור וידאו
            </CloseButton>
          </VideoHeader>

          <div className="video-wrapper" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <VideoPlayer
              videoId={currentVideo?.vimeo_id || ''}
              videoSource={VideoSource.VIMEO}
              title={currentVideo?.title || ''}
              isOpen={isVideoPlaying}
              onClose={handleVideoClose}
            />
          </div>

          <VideoControls>
            {/* Additional controls can be added here if needed */}
          </VideoControls>
        </VideoContainer>
      </VideoSection>

      {!isVideoPlaying && (
        <>
          <FeaturedSection $isPlaying={isVideoPlaying}>
            {videos[0] && (
              <VideoListItem 
                $isFeatured 
                onClick={() => handleVideoClick(videos[0])}
              >
                <img 
                  src={`https://vumbnail.com/${videos[0].vimeo_id}.jpg`}
                  alt={videos[0].title} 
                />
                <div className="content">
                  <span className="lesson-name">
                    {videos[0].lesson_id ? (
                      <>
                        {videos[0].lessons?.title || 'ללא שם'}
                        <br />
                        <small style={{ fontSize: '0.85em', opacity: 0.7 }}>
                          שיעור {videos[0].lessons?.lesson_number || videos[0].lesson_id}
                          <br />
                          <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>
                            {videos[0].title}
                          </span>
                        </small>
                      </>
                    ) : 'שיעור ללא מספר'}
                  </span>
                  <span className="video-title">{videos[0].title}</span>
                </div>
              </VideoListItem>
            )}
          </FeaturedSection>

          <RelatedSection>
            <h3>סרטונים קשורים</h3>
            <div className="videos-container">
              {relatedVideosList.map((video) => (
                <VideoListItem 
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                >
                  <img 
                    src={`https://vumbnail.com/${video.vimeo_id}.jpg`}
                    alt={video.title} 
                  />
                  <div className="content">
                    <span className="lesson-name">
                      {video.lesson_id ? (
                        <>
                          {video.lessons?.title || 'ללא שם'}
                          <br />
                          <small style={{ fontSize: '0.85em', opacity: 0.7 }}>
                            שיעור {video.lessons?.lesson_number || video.lesson_id}
                            <br />
                            <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>
                              {video.title}
                            </span>
                          </small>
                        </>
                      ) : 'שיעור ללא מספר'}
                    </span>
                    <span className="video-title">{video.title}</span>
                  </div>
                </VideoListItem>
              ))}
            </div>
          </RelatedSection>

          {relatedLessons.length > 0 && (
            <NextLessonsSection $isPlaying={isVideoPlaying}>
              <h3>שיעורים קשורים</h3>
              <div className="lessons-container">
                {relatedLessons.map(lesson => (
                  <LessonCard
                    key={lesson.lessonNumber}
                    onClick={() => navigate(`/courses/safety?lessonId=${lesson.lessonNumber}`)}
                  >
                    <h4>{lesson.lessonTitle}</h4>
                    <div className="lesson-info">
                      <span>
                        {lesson.videoCount} סרטונים • {Math.round(lesson.totalDuration)} דקות
                      </span>
                    </div>
                  </LessonCard>
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