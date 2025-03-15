import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Alert } from 'antd';

const PlayerContainer = styled.div`
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
  }
`;

interface VimeoPlayerProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  playerOptions?: {
    autoplay?: boolean;
    title?: boolean;
    byline?: boolean;
    portrait?: boolean;
    color?: string;
  };
}

export const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  videoId,
  isOpen,
  onClose,
  playerOptions = {
    autoplay: true,
    title: true,
    byline: false,
    portrait: false,
    color: '1890ff'
  }
}) => {
  const [error, setError] = useState<string | null>(null);

  // Build the video URL with options
  const buildVideoUrl = () => {
    const baseUrl = `https://player.vimeo.com/video/${videoId}`;
    const params = new URLSearchParams({
      autoplay: playerOptions.autoplay ? '1' : '0',
      title: playerOptions.title ? '1' : '0',
      byline: playerOptions.byline ? '1' : '0',
      portrait: playerOptions.portrait ? '1' : '0',
      ...(playerOptions.color && { color: playerOptions.color.replace('#', '') })
    });
    return `${baseUrl}?${params.toString()}`;
  };

  // Handle iframe load error
  const handleIframeError = () => {
    setError('לא ניתן לטעון את הסרטון. ייתכן שהוא פרטי או שנדרשת הרשאה מיוחדת.');
  };

  return (
    <Modal
      title={error ? 'שגיאה' : null}
      open={isOpen}
      onCancel={() => {
        setError(null);
        onClose();
      }}
      footer={null}
      width={800}
      centered
    >
      {error ? (
        <Alert
          message={error}
          type="error"
          showIcon
        />
      ) : (
        <PlayerContainer>
          <iframe
            src={buildVideoUrl()}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Vimeo Player"
            onError={handleIframeError}
          />
        </PlayerContainer>
      )}
    </Modal>
  );
}; 