import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import { Spin, Button } from 'antd';

const ViewerContainer = styled.div<{ $isExpanded: boolean }>`
  position: relative;
  height: ${props => props.$isExpanded ? '600px' : '0'};
  overflow: hidden;
  transition: height 0.3s ease;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`;

const LoadingContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 5;
  text-align: center;
  
  .ant-spin {
    .ant-spin-dot-item {
      background-color: #1890ff;
    }
  }
`;

const IframeContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  
  iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 8px;
  }
`;

const ExitButton = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.75);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.2s ease;
  font-size: 16px;
  font-weight: 600;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  .anticon {
    font-size: 18px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

interface DocumentViewerProps {
  documentUrl: string;
  isExpanded: boolean;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentUrl,
  isExpanded,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const absoluteUrl = `${window.location.origin}${documentUrl}`;

  useEffect(() => {
    if (isExpanded) {
      // Reset states when document is expanded
      setIsLoading(true);
      setLoadError(false);
    }
  }, [isExpanded]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setLoadError(true);
    setIsLoading(false);
  };

  // Set a timeout to show fallback if loading takes too long
  useEffect(() => {
    if (isLoading && isExpanded) {
      const timer = setTimeout(() => {
        if (isLoading) {
          setLoadError(true);
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    }
  }, [isLoading, isExpanded]);

  return (
    <ViewerContainer $isExpanded={isExpanded}>
      {isExpanded && (
        <>
          {isLoading && (
            <LoadingContainer>
              <Spin size="large" />
              <div>Loading document...</div>
            </LoadingContainer>
          )}
          
          {loadError ? (
            <LoadingContainer>
              <div>Unable to display the document directly.</div>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={() => window.open(absoluteUrl, '_blank')}
              >
                Open Document
              </Button>
            </LoadingContainer>
          ) : (
            <IframeContainer>
              <iframe
                src={absoluteUrl}
                title="Document Viewer"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease' }}
              />
            </IframeContainer>
          )}
          
          <ExitButton 
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <CloseOutlined />
            Close Document
          </ExitButton>
        </>
      )}
    </ViewerContainer>
  );
};

export default DocumentViewer; 