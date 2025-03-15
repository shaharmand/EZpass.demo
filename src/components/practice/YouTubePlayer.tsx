import React from 'react';
import { Modal } from 'antd';
import styled from 'styled-components';

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

interface YouTubePlayerProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
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
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </VideoContainer>
    </Modal>
  );
}; 