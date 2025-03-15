import React from 'react';
import { Card } from 'antd';

interface VideoPlayerProps {
  vimeoId: string;
  title: string;
  lessonNumber: number;
  segmentNumber: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  vimeoId, 
  title, 
  lessonNumber, 
  segmentNumber 
}) => {
  return (
    <Card 
      title={`Lesson ${lessonNumber}.${segmentNumber} - ${title}`}
      className="mb-4"
    >
      <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </Card>
  );
};

export default VideoPlayer; 