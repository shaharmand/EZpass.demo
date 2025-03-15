import React from 'react';
import styled from 'styled-components';
import { Card, Typography, Space, Spin } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { VideoContent, VideoSource } from '../../types/videoContent';

const { Text, Title } = Typography;

const SidebarContainer = styled.div`
  position: fixed;
  top: 64px; // Account for header height
  right: 0;
  width: 320px;
  height: calc(100vh - 64px);
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 98;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const VideoList = styled.div`
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 3px;
  }
`;

const VideoCard = styled(Card)`
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  gap: 16px;
`;

interface SubtopicVideoBarProps {
  subtopicId: string;
  subtopicName: string;
  videos: VideoContent[];
  onVideoSelect: (videoId: string) => void;
  isLoading?: boolean;
}

export const SubtopicVideoBar: React.FC<SubtopicVideoBarProps> = ({
  subtopicId,
  subtopicName,
  videos,
  onVideoSelect,
  isLoading = false
}) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <LoadingContainer>
          <Spin size="large" />
          <Text>טוען סרטונים...</Text>
        </LoadingContainer>
      );
    }

    if (videos.length === 0) {
      return (
        <LoadingContainer>
          <Text type="secondary">אין סרטונים זמינים לנושא זה</Text>
        </LoadingContainer>
      );
    }

    return (
      <VideoList>
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            hoverable
            cover={
              <img 
                alt={video.title} 
                src={video.thumbnail || 
                  (video.videoSource === VideoSource.YOUTUBE 
                    ? `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`
                    : `https://vumbnail.com/${video.videoId}.jpg`)}
                style={{ height: 157, objectFit: 'cover' }}
              />
            }
            onClick={() => onVideoSelect(video.id)}
          >
            <Card.Meta
              title={video.title}
              description={
                <Space direction="vertical" size={4}>
                  <Space>
                    <PlayCircleOutlined />
                    <Text type="secondary">{video.duration}</Text>
                  </Space>
                  {video.description && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {video.description}
                    </Text>
                  )}
                </Space>
              }
            />
          </VideoCard>
        ))}
      </VideoList>
    );
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <Title level={4}>{subtopicName}</Title>
      </SidebarHeader>
      {renderContent()}
    </SidebarContainer>
  );
}; 