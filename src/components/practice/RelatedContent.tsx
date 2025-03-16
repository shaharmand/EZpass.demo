import React, { useEffect, useState } from 'react';
import { Typography, List, Spin } from 'antd';
import styled from 'styled-components';
import { PlayCircleOutlined } from '@ant-design/icons';
import { VideoContent } from '../../types/videoContent';
import { LearningContentService } from '../../services/learningContentService';
import { videoContentService } from '../../services/videoContentService';
import { Question } from '../../types/question';

const { Text } = Typography;

const NavigationContainer = styled.div`
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const NavigationHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  h2 {
    margin: 0;
    font-size: 1.2em;
    color: #333;
  }
`;

const ContentSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const VideoTitle = styled(Text)`
  display: block;
  
  .lesson-name {
    color: #8c8c8c;
    font-size: 12px;
    display: block;
    margin-bottom: 4px;
  }
  
  .video-title {
    font-size: 14px;
    display: block;
  }
`;

const PlayButton = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f0f0;
  transition: all 0.2s ease;

  .anticon {
    font-size: 20px;
    color: #1890ff;
  }

  &:hover {
    background: #e6f7ff;
    transform: scale(1.05);
  }
`;

const VideoListItem = styled(List.Item)`
  padding: 12px 16px !important;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 8px;
`;

interface VideoWithScore extends VideoContent {
  score?: number;
  lessonNumber?: string;
}

interface RelatedContentProps {
  subtopicId?: string;
  onVideoSelect?: (videoId: string) => void;
  currentQuestion?: Question;
}

const RelatedContent: React.FC<RelatedContentProps> = ({
  subtopicId,
  onVideoSelect,
  currentQuestion
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<VideoWithScore[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!currentQuestion) return;
      
      setIsLoading(true);
      try {
        // First get all videos for the topic/subtopic
        const allVideos = await videoContentService.getSubtopicVideos(subtopicId || '');
        
        // Then find the most relevant ones for this question
        const relatedVideos = await LearningContentService.findVideosForQuestion(
          currentQuestion,
          allVideos
        );
        
        setVideos(relatedVideos);
      } catch (error) {
        console.error('Failed to fetch related videos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [currentQuestion, subtopicId]);

  if (isLoading) {
    return (
      <NavigationContainer>
        <NavigationHeader>
          <h2>סרטונים קשורים</h2>
        </NavigationHeader>
        <LoadingContainer>
          <Spin />
          <Text>טוען סרטונים...</Text>
        </LoadingContainer>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <NavigationHeader>
        <h2>סרטונים קשורים</h2>
      </NavigationHeader>
      <ContentSection>
        <List
          dataSource={videos}
          renderItem={(video) => (
            <VideoListItem onClick={() => onVideoSelect?.(video.id)}>
              <List.Item.Meta
                avatar={<PlayButton><PlayCircleOutlined /></PlayButton>}
                title={
                  <VideoTitle>
                    {video.lessonNumber && <span className="lesson-name">שיעור {video.lessonNumber}</span>}
                    <span className="video-title">{video.title}</span>
                  </VideoTitle>
                }
              />
            </VideoListItem>
          )}
          locale={{ emptyText: 'אין סרטונים קשורים לשאלה זו' }}
        />
      </ContentSection>
    </NavigationContainer>
  );
};

export default RelatedContent; 