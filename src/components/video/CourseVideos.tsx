import React, { useEffect, useState } from 'react';
import { Typography, Collapse, Spin, Alert } from 'antd';
import VideoPlayer from './VideoPlayer';

const { Title } = Typography;
const { Panel } = Collapse;

interface VideoData {
  id: string;
  vimeoId: string;
  title: string;
  originalTitle: string;
  course: string;
  lessonNumber: number;
  segmentNumber: number;
  subtopicId: string;
  embedUrl: string;
}

interface CourseVideosProps {
  subtopicId?: string; // Optional - if provided, only show videos for this subtopic
}

const CourseVideos: React.FC<CourseVideosProps> = ({ subtopicId }) => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        // Load video_data.json
        const response = await fetch('/video_data.json');
        const allVideos: VideoData[] = await response.json();

        // Filter by subtopic if provided
        const filteredVideos = subtopicId 
          ? allVideos.filter(v => v.subtopicId === subtopicId)
          : allVideos;

        // Sort by lesson and segment numbers
        const sortedVideos = filteredVideos.sort((a, b) => {
          if (a.lessonNumber !== b.lessonNumber) {
            return a.lessonNumber - b.lessonNumber;
          }
          return a.segmentNumber - b.segmentNumber;
        });

        setVideos(sortedVideos);
      } catch (err) {
        setError('Failed to load video data');
        console.error('Error loading videos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [subtopicId]);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  // Group videos by lesson number
  const videosByLesson = videos.reduce((acc, video) => {
    const lesson = acc.get(video.lessonNumber) || [];
    lesson.push(video);
    acc.set(video.lessonNumber, lesson);
    return acc;
  }, new Map<number, VideoData[]>());

  return (
    <div>
      <Title level={2}>Course Videos</Title>
      {subtopicId && (
        <Alert 
          message="Filtered by Topic"
          description={`Showing videos for topic: ${subtopicId}`}
          type="info"
          className="mb-4"
        />
      )}
      <Collapse>
        {Array.from(videosByLesson.entries()).map(([lessonNum, lessonVideos]) => (
          <Panel 
            key={lessonNum} 
            header={`Lesson ${lessonNum} (${lessonVideos.length} videos)`}
          >
            {lessonVideos.map(video => (
              <VideoPlayer
                key={video.id}
                vimeoId={video.vimeoId}
                title={video.title}
                lessonNumber={video.lessonNumber}
                segmentNumber={video.segmentNumber}
              />
            ))}
          </Panel>
        ))}
      </Collapse>
    </div>
  );
};

export default CourseVideos; 