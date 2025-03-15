import React from 'react';
import { Modal } from 'antd';
import styled from 'styled-components';
import { VideoSource } from '../../types/videoContent';
import { VimeoPlayer } from './VimeoPlayer';
import { YouTubePlayer } from './YouTubePlayer';

const VideoContainer = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

interface VideoPlayerProps {
  videoSource: VideoSource;
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSource,
  videoId,
  isOpen,
  onClose,
}) => {
  if (!videoId) return null;

  return (
    <Modal
      title="צפייה בסרטון"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <VideoContainer>
        {videoSource === VideoSource.YOUTUBE ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <iframe
            src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </VideoContainer>
    </Modal>
  );
}; 