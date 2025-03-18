import React, { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import CourseView from '../../components/courses/CourseView';
import { CourseData } from '../../components/courses/types';
import { UserHeader } from '../../components/layout/UserHeader';
import { supabase } from '../../lib/supabaseClient';
import './SafetyCoursePage.css';

const SafetyCoursePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseData>({
    id: 'CIV-SAF',
    title: 'קורס בטיחות בעבודה',
    description: 'קורס מקיף בנושא בטיחות בעבודה בענף הבנייה',
    topics: [],
    lessonInfo: [],
    videos: [],
    initialLessonId: lessonId ? parseInt(lessonId) : undefined
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fall back to JSON files instead of trying to use the database
        // This approach is more reliable until we have the course properly set up in the database
        const [videoResponse, lessonResponse] = await Promise.all([
          fetch('/data/course/CIV-SAF/content/video_data.json'),
          fetch('/data/course/CIV-SAF/content/lesson_info.json')
        ]);

        if (!videoResponse.ok || !lessonResponse.ok) {
          throw new Error('Failed to fetch course data');
        }

        const videoData = await videoResponse.json();
        const lessonData = await lessonResponse.json();

        setCourseData(prev => ({
          ...prev,
          videos: videoData.videos || [],
          lessonInfo: lessonData.lessons || [],
          topics: lessonData.topics || prev.topics,
          initialLessonId: lessonId ? parseInt(lessonId) : undefined
        }));
      } catch (error) {
        console.error('Failed to load course data:', error);
        message.error('שגיאה בטעינת נתוני הקורס');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lessonId]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      );
    }

    return (
      <div className="course-content">
        <CourseView courseData={courseData} />
      </div>
    );
  };

  return (
    <div className="course-page-layout">
      <UserHeader
        pageType="קורס"
        pageContent="קורס בטיחות בעבודה"
        variant="default"
      />
      {renderContent()}
    </div>
  );
};

export default SafetyCoursePage; 