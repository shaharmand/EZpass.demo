import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import { useSearchParams } from 'react-router-dom';
import CourseView from '../../components/courses/CourseView';
import { CourseData } from '../../components/courses/types';
import { UserHeader } from '../../components/layout/UserHeader';
import './SafetyCoursePage.css';

const SafetyCoursePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseData>({
    id: 'construction_safety',
    title: 'קורס בטיחות בעבודה',
    description: 'קורס מקיף בנושא בטיחות בעבודה בענף הבנייה',
    topics: [
      {
        id: 'safety_management_fundamentals',
        title: 'יסודות ניהול הבטיחות',
        lessons: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 'Construction_methods_and_Works',
        title: 'שיטות בנייה ועבודות',
        lessons: [7, 8, 9, 10, 11, 12, 13, 14]
      },
      {
        id: 'height_work',
        title: 'עבודה בגובה',
        lessons: [16, 17, 18, 19]
      },
      {
        id: 'lifting_and_cranes',
        title: 'ציוד הרמה ועגורנים',
        lessons: [20, 21, 22, 23]
      },
      {
        id: 'specialized_safety',
        title: 'בטיחות בעבודות מיוחדות',
        lessons: [15, 24, 25]
      },
      {
        id: 'equipment_and_health',
        title: 'ציוד מכני ובריאות',
        lessons: [26, 27]
      }
    ],
    lessonInfo: [],
    videos: [],
    initialLessonId: lessonId ? parseInt(lessonId) : undefined
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
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
          topics: lessonData.topics || prev.topics
        }));
      } catch (error) {
        console.error('Failed to load course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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