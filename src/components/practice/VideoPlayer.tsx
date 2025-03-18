import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Spin } from 'antd';
import { CloseOutlined, ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import Player from '@vimeo/player';
import { VideoSource } from '../../types/videoContent';

interface VideoPlayerProps {
  videoId: string;
  videoSource?: VideoSource;
  title?: string;
  thumbnail?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VimeoPlayerElement extends HTMLIFrameElement {
  style: CSSStyleDeclaration;
}

interface VimeoPlayer extends Player {
  element: Promise<VimeoPlayerElement>;
  setAutopause: (autopause: boolean) => void;
}

const ModalOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 0;
  overflow: hidden;
`;

const AspectRatioContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  max-height: calc(100vh - 48px);
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &::before {
    content: '';
    display: block;
    padding-top: 56.25%;
  }
`;

const VideoWrapper = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  height: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const VideoContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  iframe {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    max-width: min(177.78vh, 100%);
    max-height: min(56.25vw, 100%);
    object-fit: contain;
  }
`;

const LoadingContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: white;
`;

const NavigationButton = styled.button<{ $direction: 'next' | 'prev' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  direction: rtl;

  &:hover {
    background: #e5e7eb;
    color: #1f2937;
  }

  &:active {
    background: #d1d5db;
  }

  .icon {
    font-size: 16px;
    ${props => props.$direction === 'next' ? 'margin-right: -4px;' : 'margin-left: -4px;'}
  }

  .label {
    ${props => props.$direction === 'next' ? 'margin-left: 4px;' : 'margin-right: 4px;'}
  }
`;

const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  direction: rtl;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoSource = VideoSource.VIMEO,
  title,
  thumbnail,
  isOpen,
  onClose,
}) => {
  console.log('DEBUG: VideoPlayer component rendered', { videoId, isOpen });

  // Add immediate resize handler
  useEffect(() => {
    const handleResize = () => {
      console.log('IMMEDIATE RESIZE EVENT');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<VimeoPlayer | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const aspectRatioRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug mount and resize
  useEffect(() => {
    console.log('VideoPlayer mounted');

    const handleResize = () => {
      console.log('Window resized:', {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    console.log('Added resize listener');

    return () => {
      window.removeEventListener('resize', handleResize);
      console.log('Removed resize listener');
    };
  }, []);

  // Debug isOpen changes
  useEffect(() => {
    console.log('isOpen changed:', isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && iframeRef.current && videoSource === VideoSource.VIMEO) {
      console.log('Initializing Vimeo player');
      const player = new Player(iframeRef.current) as VimeoPlayer;
      playerRef.current = player;

      player.setAutopause(false);
      
      return () => {
        if (playerRef.current) {
          console.log('Destroying Vimeo player');
          playerRef.current.destroy();
          playerRef.current = null;
        }
      };
    }
  }, [isOpen, videoSource]);

  useEffect(() => {
    const player = playerRef.current;
    if (isOpen && player && videoSource === VideoSource.VIMEO) {
      console.log('Setting up Vimeo resize handler');
      const handleResize = async () => {
        console.log('Vimeo resize handler called');
        try {
          const element = await player.element;
          if (element) {
            const container = element.parentElement;
            if (container) {
              console.log('Resizing Vimeo player', {
                containerWidth: container.clientWidth,
                containerHeight: container.clientHeight
              });
              element.style.width = '100%';
              element.style.height = '100%';
            }
          }
        } catch (error) {
          console.error('Error resizing video player:', error);
        }
      };

      handleResize();
      console.log('Adding Vimeo resize listener');
      window.addEventListener('resize', handleResize);

      return () => {
        console.log('Removing Vimeo resize listener');
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, videoSource]);

  const handleClose = (e: React.MouseEvent) => {
    console.log('DEBUG: Video player close clicked');
    e.preventDefault();
    e.stopPropagation();
    if (playerRef.current && videoSource === VideoSource.VIMEO) {
      playerRef.current.pause();
    }
    onClose();
  };

  const handleIframeLoad = () => {
    console.log('DEBUG: Video iframe loaded');
    setIsLoading(false);
  };

  const getVideoUrl = () => {
    if (videoSource === VideoSource.YOUTUBE) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0`;
    }
    return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  };

  // Check if being rendered inside the sidebar
  const isInSidebar = !document.querySelector('.ant-modal-root');

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: isInSidebar ? 'absolute' : 'fixed' }}
        >
          <VideoWrapper
            ref={wrapperRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%', maxWidth: '100%' }}
          >
            <AspectRatioContainer ref={aspectRatioRef}>
              <CloseButton onClick={handleClose}>
                <CloseOutlined />
              </CloseButton>
              
              <VideoContainer ref={containerRef}>
                {isLoading && (
                  <LoadingContainer>
                    <Spin size="large" />
                    <div>Loading video...</div>
                  </LoadingContainer>
                )}

                {videoSource === VideoSource.VIMEO && (
                  <iframe
                    ref={iframeRef}
                    src={getVideoUrl()}
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={title || 'Video Player'}
                    onLoad={handleIframeLoad}
                    style={{
                      width: '100%',
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )}
              </VideoContainer>
            </AspectRatioContainer>
          </VideoWrapper>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
}; 