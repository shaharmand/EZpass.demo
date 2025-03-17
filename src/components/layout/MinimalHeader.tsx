import React from 'react';
import styled from 'styled-components';
import { UserProfile } from '../user/UserProfile';

const HeaderContainer = styled.header`
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e2e8f0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
`;

interface VideoPlayerProps {
  youtubeId: string;
  title: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ youtubeId, title }) => {
  return (
    <iframe
      width="100%"
      height="480"
      src={`https://www.youtube.com/embed/${youtubeId}`}
      title={title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

export const MinimalHeader: React.FC = () => {
  return (
    <HeaderContainer>
      <UserProfile variant="base" />
    </HeaderContainer>
  );
}; 