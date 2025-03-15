import React, { useState } from 'react';
import { Collapse } from 'antd';
import styled from 'styled-components';

const { Panel } = Collapse;

interface Video {
  id: string;
  title: string;
  courseNumber: string;
  subTopicId: string;
  vimeoId: string;
  embedUrl: string;
  duration?: number;
  thumbnailUrl?: string;
}

interface VideoListProps {
  videos: Video[];
  groupBySubTopic?: boolean;
}

const VideoContainer = styled.div`
  margin: 16px 0;
`;

const VideoEmbed = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  max-width: 100%;
  
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const VideoInfo = styled.div`
  margin-top: 8px;
  color: #666;
  
  .duration {
    font-size: 0.9em;
  }
`;

const VideoList: React.FC<VideoListProps> = ({ videos, groupBySubTopic = false }) => {
  const [activeKey, setActiveKey] = useState<string | string[]>(['1']);

  // Function to format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (groupBySubTopic) {
    // Group videos by subTopicId
    const videosBySubTopic = videos.reduce((acc, video) => {
      const subTopicId = video.subTopicId;
      if (!acc[subTopicId]) {
        acc[subTopicId] = [];
      }
      acc[subTopicId].push(video);
      return acc;
    }, {} as Record<string, Video[]>);

    return (
      <Collapse activeKey={activeKey} onChange={setActiveKey}>
        {Object.entries(videosBySubTopic).map(([subTopicId, subTopicVideos]) => (
          <Panel header={`נושא ${subTopicId}`} key={subTopicId}>
            {subTopicVideos.map((video) => (
              <VideoContainer key={video.id}>
                <VideoEmbed>
                  <iframe
                    src={video.embedUrl}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </VideoEmbed>
                <VideoInfo>
                  <h3>{video.title}</h3>
                  {video.duration && (
                    <span className="duration">Duration: {formatDuration(video.duration)}</span>
                  )}
                </VideoInfo>
              </VideoContainer>
            ))}
          </Panel>
        ))}
      </Collapse>
    );
  }

  // Display videos in course order
  return (
    <Collapse activeKey={activeKey} onChange={setActiveKey}>
      {videos.map((video) => (
        <Panel header={video.title} key={video.id}>
          <VideoContainer>
            <VideoEmbed>
              <iframe
                src={video.embedUrl}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </VideoEmbed>
            <VideoInfo>
              {video.duration && (
                <span className="duration">Duration: {formatDuration(video.duration)}</span>
              )}
            </VideoInfo>
          </VideoContainer>
        </Panel>
      ))}
    </Collapse>
  );
};

export default VideoList; 