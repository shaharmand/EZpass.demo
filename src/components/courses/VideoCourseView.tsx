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
  console.log('VideoCourseView render with courseId:', courseId);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [lessonInfo, setLessonInfo] = useState<LessonInfo[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching course data...');
        const [videosResponse, lessonInfoResponse] = await Promise.all([
          fetch('/data/course/CIV-SAF/content/video_data.json'),
          fetch('/data/course/CIV-SAF/content/lesson_info.json')
        ]);

        if (!videosResponse.ok || !lessonInfoResponse.ok) {
          throw new Error('Failed to fetch course data');
        }

        const [videosData, lessonInfoData] = await Promise.all([
          videosResponse.json(),
          lessonInfoResponse.json()
        ]);

        console.log('Fetched data:', {
          videosCount: videosData.videos.length,
          lessonsCount: lessonInfoData.lessons.length,
          topicsCount: lessonInfoData.topics.length,
          sampleVideo: videosData.videos[0],
          sampleLesson: lessonInfoData.lessons[0],
          sampleTopic: lessonInfoData.topics[0]
        });

        setVideos(videosData.videos);
        setLessonInfo(lessonInfoData.lessons);
        setTopics(lessonInfoData.topics);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

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
    } else {
      console.warn('Could not find lesson or topic for video:', { video, lessonId });
    }
  };

  if (loading) {
    return (
      <CourseContainer>
        <Spin size="large" />
      </CourseContainer>
    );
  }

  if (error) {
    return (
      <CourseContainer>
        <Alert type="error" message={error} />
      </CourseContainer>
    );
  }

  console.log('Rendering topics:', topics.map(topic => ({
    id: topic.id,
    title: topic.title,
    lessonsCount: topic.lessons.length,
    lessonIds: topic.lessons,
    hasVideos: topic.lessons.some(lessonId => videosByLesson[lessonId]?.length > 0)
  })));

  return (
    <CourseContainer>
      {topics.map(topic => {
        const topicVideos = topic.lessons.flatMap(lessonId => videosByLesson[lessonId] || []);
        console.log(`Rendering topic ${topic.title}:`, {
          lessonIds: topic.lessons,
          videoCount: topicVideos.length,
          videoTitles: topicVideos.map(v => v.title)
        });
        
        return (
          <TopicView
            key={topic.id}
            title={topic.title}
            lessons={topic.lessons}
            lessonInfo={lessonInfo}
            videosByLesson={videosByLesson}
            onVideoClick={handleVideoClick}
          />
        );
      })}
    </CourseContainer>
  );
};

export default VideoCourseView; 