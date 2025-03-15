import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import CourseView from '../../components/courses/CourseView';
import { CourseData } from '../../components/courses/types';
import { UserHeader } from '../../components/layout/UserHeader';
import './SafetyCoursePage.css';

const SafetyCoursePage: React.FC = () => {
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
    videos: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching course data...');
        const [videoResponse, lessonResponse] = await Promise.all([
          fetch('/data/courses/construction_safety_video_course/video_data.json'),
          fetch('/data/lesson_info.json')
        ]);

        if (!videoResponse.ok || !lessonResponse.ok) {
          throw new Error('Failed to fetch course data');
        }

        const videoData = await videoResponse.json();
        const lessonData = await lessonResponse.json();

        console.log('Video data:', videoData);
        console.log('Lesson data:', lessonData);

        setCourseData(prev => {
          const updatedData = {
            ...prev,
            videos: videoData.videos || [],
            lessonInfo: lessonData.lessons || []
          };
          console.log('Updated course data:', updatedData);
          return updatedData;
        });
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
        pageTitle="קורס בטיחות בעבודה"
        variant="default"
      />
      {renderContent()}
    </div>
  );
};

export default SafetyCoursePage; 