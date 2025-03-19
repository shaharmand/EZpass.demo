import React, { useState, useEffect } from 'react';
import { 
  ClockCircleOutlined, 
  BookOutlined, 
  PlayCircleOutlined, 
  RightOutlined,
  ExpandOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Modal } from 'antd';
import { 
  TopicSection,
  TopicHeader, 
  TopicTitleWrapper,
  TopicIcon,
  TopicContent,
  TopicTitle, 
  TopicStats,
  LessonsContainer,
  LessonList,
  LessonItem,
  LessonInfo,
  LessonNumber,
  LessonTitle,
  LessonMeta,
  Badge,
  VideoSegmentsGrid,
  VideoSegmentCard,
  SegmentNumber,
  SegmentInfo,
  SegmentTitle,
  VideoPreviewModal,
  VideoPreviewOverlay,
  VideoActions
} from './VideoCourseStyles';
import { LessonInfo as LessonInfoType, VideoData } from './types';

interface VimeoThumbnail {
  thumbnail_url: string;
  width: number;
  height: number;
}

interface TopicViewProps {
  title: string;
  lessons: number[];
  lessonInfo: LessonInfoType[];
  videosByLesson: Record<number, VideoData[]>;
  onVideoClick: (video: VideoData, lessonId: number) => void;
}

const TopicView: React.FC<TopicViewProps> = ({
  title,
  lessons,
  lessonInfo,
  videosByLesson,
  onVideoClick
}) => {
  console.log('TopicView render:', { title, lessons, lessonInfo, videosByLesson });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [previewVideo, setPreviewVideo] = useState<VideoData | null>(null);

  // Calculate total videos and duration for the topic
  const topicStats = lessons.reduce((acc, lessonId) => {
    const lessonVideos = videosByLesson[lessonId] || [];
    const lesson = lessonInfo.find(l => l.id === lessonId);
    return {
      totalVideos: acc.totalVideos + lessonVideos.length,
      totalDuration: acc.totalDuration + (lesson?.durationMinutes || 0)
    };
  }, { totalVideos: 0, totalDuration: 0 });

  console.log('Topic stats calculated:', topicStats);

  useEffect(() => {
    const fetchThumbnails = async () => {
      const allVideos = lessons.flatMap(lessonId => videosByLesson[lessonId] || []);
      console.log('Fetching thumbnails for videos:', allVideos);
      
      const newThumbnails: Record<string, string> = {};
      
      // Fetch in batches of 10 to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < allVideos.length; i += batchSize) {
        const batch = allVideos.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (video) => {
            try {
              const response = await fetch(
                `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${video.vimeoId}`
              );
              if (response.ok) {
                const data: VimeoThumbnail = await response.json();
                newThumbnails[video.id] = data.thumbnail_url;
              }
            } catch (error) {
              console.error(`Error fetching thumbnail for video ${video.id}:`, error);
            }
          })
        );
      }

      setThumbnails(newThumbnails);
    };

    fetchThumbnails();
  }, [lessons, videosByLesson]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ש' ${mins}ד'` : `${mins}ד'`;
  };

  const handleLessonClick = (lessonId: number) => {
    console.log('Lesson clicked:', lessonId);
    if (expandedLesson === lessonId) {
      setExpandedLesson(null);
    } else {
      setExpandedLesson(lessonId);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent, video: VideoData) => {
    e.stopPropagation();
    console.log('Preview clicked for video:', video);
    setPreviewVideo(video);
  };

  const handleFullPageClick = (e: React.MouseEvent, video: VideoData, lessonId: number) => {
    e.stopPropagation();
    console.log('Full page clicked for video:', video, 'in lesson:', lessonId);
    onVideoClick(video, lessonId);
  };

  return (
    <TopicSection>
      <TopicHeader onClick={() => setIsExpanded(!isExpanded)}>
        <TopicTitleWrapper>
          <TopicIcon>
            <BookOutlined />
          </TopicIcon>
          <TopicContent>
            <TopicTitle>{title}</TopicTitle>
          </TopicContent>
        </TopicTitleWrapper>
        <TopicStats>
          <span>
            <ClockCircleOutlined /> {formatDuration(topicStats.totalDuration)}
          </span>
          <span>
            <PlayCircleOutlined /> {topicStats.totalVideos} סרטונים
          </span>
          <RightOutlined 
            style={{ 
              transform: isExpanded ? 'rotate(-90deg)' : 'rotate(90deg)',
              transition: 'transform 0.3s ease'
            }} 
          />
        </TopicStats>
      </TopicHeader>

      {isExpanded && (
        <LessonsContainer $isExpanded={isExpanded}>
          <LessonList>
            {lessons.map((lessonId, index) => {
              const lesson = lessonInfo.find(l => l.id === lessonId);
              const lessonVideos = (videosByLesson[lessonId] || [])
                .sort((a, b) => a.segmentNumber - b.segmentNumber);
              const isLessonExpanded = expandedLesson === lessonId;
              
              console.log('Rendering lesson:', { lessonId, lesson, lessonVideos, isLessonExpanded });
              
              if (!lesson) {
                console.warn('No lesson found for ID:', lessonId);
                return null;
              }

              return (
                <div key={lessonId}>
                  <LessonItem onClick={() => handleLessonClick(lessonId)}>
                    <LessonInfo>
                      <LessonNumber>{index + 1}</LessonNumber>
                      <LessonTitle>{lesson.name}</LessonTitle>
                    </LessonInfo>
                    <LessonMeta>
                      <span>
                        <PlayCircleOutlined /> {lessonVideos.length} סרטונים
                      </span>
                      <span>
                        <ClockCircleOutlined /> {formatDuration(lesson.durationMinutes)}
                      </span>
                    </LessonMeta>
                  </LessonItem>

                  {isLessonExpanded && (
                    <VideoSegmentsGrid>
                      {lessonVideos.map((video) => (
                        <VideoSegmentCard key={video.id}>
                          <SegmentNumber>{video.segmentNumber}</SegmentNumber>
                          <SegmentInfo>
                            <SegmentTitle>
                              {video.title}
                            </SegmentTitle>
                            <VideoActions>
                              <EyeOutlined 
                                title="צפה בסרטון" 
                                onClick={(e) => handlePreviewClick(e, video)} 
                              />
                              <ExpandOutlined 
                                title="פתח במסך מלא" 
                                onClick={(e) => handleFullPageClick(e, video, lessonId)} 
                              />
                            </VideoActions>
                          </SegmentInfo>
                        </VideoSegmentCard>
                      ))}
                    </VideoSegmentsGrid>
                  )}
                </div>
              );
            })}
          </LessonList>
        </LessonsContainer>
      )}

      {previewVideo && (
        <Modal
          visible={true}
          onCancel={() => setPreviewVideo(null)}
          footer={null}
          width="80%"
          centered
        >
          <iframe
            src={`${previewVideo.embedUrl}?autoplay=1`}
            width="100%"
            height="500px"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </Modal>
      )}
    </TopicSection>
  );
};

export default TopicView; 