import React, { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import CourseView from '../../components/courses/CourseView';
import { CourseData } from '../../components/courses/types';
import { UserHeader } from '../../components/layout/UserHeader';
import { courseService } from '../../services/courseService';
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
        const { courseData: data, error } = await courseService.fetchCourseData('CIV-SAF');
        
        if (error) {
          throw new Error(error);
        }
        
        // Add the initialLessonId from URL if it exists
        if (lessonId) {
          data.initialLessonId = parseInt(lessonId);
        }
        
        setCourseData(data);
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