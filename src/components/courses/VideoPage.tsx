import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { VideoData, LessonInfo } from './types';
import { UserHeader } from '../layout/UserHeader';

const { Title, Text } = Typography;

const VideoContainer = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
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

const VideoPlayer = styled.div`
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
    border: none;
  }
`;

const VideoInfo = styled.div`
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const VideoTitle = styled(Title)`
  margin-bottom: 16px !important;
`;

const VideoMeta = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  color: #666;
`;

interface LocationState {
  video: VideoData;
  lesson: LessonInfo;
  topicTitle: string;
  returnPath: string;
}

const VideoPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  if (!state?.video) {
    return null;
  }

  const { video, lesson, topicTitle, returnPath } = state;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <UserHeader
        pageTitle={`${lesson?.name || 'שיעור'} - ${video.title}`}
        leftContent={
          <Button
            type="text"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate(returnPath || '/courses/safety')}
          >
            חזרה לקורס
          </Button>
        }
      />
      <VideoContainer>
        <VideoWrapper>
          <VideoPlayer>
            <iframe
              src={`https://player.vimeo.com/video/${video.vimeoId}?autoplay=1`}
              allow="autoplay; fullscreen"
              allowFullScreen
              title={video.title}
            />
          </VideoPlayer>
        </VideoWrapper>
        <VideoInfo>
          <VideoTitle level={3}>{video.title}</VideoTitle>
          <VideoMeta>
            <Text>{topicTitle}</Text>
            <Text>•</Text>
            <Text>חלק {video.segmentNumber}</Text>
          </VideoMeta>
          {video.description && (
            <Text style={{ fontSize: '16px', color: '#4a4a4a' }}>
              {video.description}
            </Text>
          )}
        </VideoInfo>
      </VideoContainer>
    </div>
  );
};

export default VideoPage; 