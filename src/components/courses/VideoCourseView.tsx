import React, { useEffect, useState } from 'react';
import { Spin, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CourseContainer } from './VideoCourseStyles';
import TopicView from './TopicView';
import { VideoData, LessonInfo, Topic } from './types';

interface Props {
  courseId: string;
}

const VideoCourseView: React.FC<Props> = ({ courseId }) => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [lessonInfo, setLessonInfo] = useState<LessonInfo[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videoResponse, lessonResponse] = await Promise.all([
          fetch('/data/courses/construction_safety_video_course/video_data.json'),
          fetch('/data/lesson_info.json')
        ]);

        if (!videoResponse.ok || !lessonResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const videoData = await videoResponse.json();
        const lessonData = await lessonResponse.json();

        const filteredVideos = videoData.videos;
        const sortedVideos = filteredVideos.sort((a: VideoData, b: VideoData) => {
          if (a.lessonNumber !== b.lessonNumber) {
            return a.lessonNumber - b.lessonNumber;
          }
          return a.segmentNumber - b.segmentNumber;
        });

        setVideos(sortedVideos);
        setLessonInfo(lessonData.lessons);
        setTopics(lessonData.topics);
        setLoading(false);
      } catch (err) {
        setError('Error loading course data: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" />;
  }

  // Group videos by lesson number
  const videosByLesson = videos.reduce((acc, video) => {
    const lessonNumber = video.lessonNumber;
    if (!acc[lessonNumber]) {
      acc[lessonNumber] = [];
    }
    acc[lessonNumber].push(video);
    return acc;
  }, {} as Record<number, VideoData[]>);

  const handleVideoClick = (video: VideoData, lessonId: number) => {
    const lesson = lessonInfo.find(l => l.id === lessonId);
    const topic = topics.find(t => t.lessons.includes(lessonId));
    
    if (lesson && topic) {
      navigate(`/admin/courses/safety/video/${video.vimeoId}`, {
        state: {
          video,
          lesson,
          topicTitle: topic.title,
          returnPath: `/admin/courses/safety`
        }
      });
    }
  };

  return (
    <CourseContainer>
      {topics.map(topic => (
        <TopicView
          key={topic.id}
          title={topic.title}
          lessons={topic.lessons}
          lessonInfo={lessonInfo}
          videosByLesson={videosByLesson}
          onVideoClick={handleVideoClick}
        />
      ))}
    </CourseContainer>
  );
};

export default VideoCourseView; 