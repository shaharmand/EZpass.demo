import React, { useState, useEffect } from 'react';
import { Spin, Alert } from 'antd';
import { useSearchParams } from 'react-router-dom';
import CourseView from '../../components/courses/CourseView';
import { CourseData, LessonInfo, VideoData } from '../../components/courses/types';
import { UserHeader } from '../../components/layout/UserHeader';
import { supabase } from '../../lib/supabaseClient';
import './SafetyCoursePage.css';

// Pre-defined topics as fallback
const FALLBACK_TOPICS = [
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
];

// Add interfaces for database models at the top of the file
interface DbLesson {
  id: string;
  title?: string;
  description?: string;
  lesson_number: number;
  topic_id?: string;
  duration?: number;
  has_quiz?: boolean;
  course_id?: string;
}

interface DbVideo {
  id: string;
  title?: string;
  description?: string;
  vimeo_id: string;
  duration?: number;
  lesson_id?: string;
  topic_id?: string;
  segment_number?: number;
  course_id?: string;
  created_at?: string;
}

// Helper function to format duration in minutes to a friendly string
function formatDuration(minutes: number): string {
  // Handle zero case
  if (minutes === 0) {
    return `0 דקות`;
  }
  
  // Round to nearest whole minute, but ensure at least 1 minute
  const roundedMinutes = Math.max(1, Math.round(minutes));
  
  if (roundedMinutes < 60) {
    return `${roundedMinutes} דקות`;
  }
  
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} שעות`;
  }
  
  return `${hours} שעות ו-${remainingMinutes} דקות`;
}

const SafetyCoursePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<CourseData>({
    id: 'safety-course',
    title: 'קורס בטיחות בעבודה',
    description: 'קורס מקיף בנושא בטיחות בעבודה בענף הבנייה',
    topics: [],
    lessonInfo: [],
    videos: [],
    initialLessonId: lessonId ? parseInt(lessonId) : undefined
  });

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching safety course data from database');

        // Just get all courses first for debugging
        const { data: allCourses, error: coursesError } = await supabase
          .from('courses')
          .select('*');
        
        if (coursesError) {
          console.error('Error fetching all courses:', coursesError);
        } else {
          console.log('Available courses:', allCourses);
        }

        // Try direct ID approach without any filtering first - get first course
        const { data: coursesList, error: coursesListError } = await supabase
          .from('courses')
          .select('*')
          .limit(1);

        if (coursesListError) {
          console.error('Error fetching courses list:', coursesListError);
          throw new Error('Failed to fetch courses list');
        }

        if (!coursesList || coursesList.length === 0) {
          throw new Error('No courses found in the database');
        }

        // Use the first course from the list
        const courseInfo = coursesList[0];
        console.log('Using course:', courseInfo);

        // Try to get all topics first to check schema
        const { data: allTopics, error: allTopicsError } = await supabase
          .from('topics')
          .select('*')
          .limit(5);
          
        if (allTopicsError) {
          console.error('Error fetching topics sample:', allTopicsError);
        } else {
          console.log('Topics schema sample:', allTopics);
        }

        // Since we know 'topics' doesn't have 'course_id', use the fallback topics
        console.log('Using fallback topics instead of database query');
        const formattedTopics = FALLBACK_TOPICS;

        // 3. Fetch lessons for this course (try both possibilities based on db schema)
        let lessonsData: DbLesson[] = [];
        try {
          // Try first approach with course_id
          const { data, error } = await supabase
            .from('lessons')
            .select(`
              id, 
              title, 
              description,
              lesson_number,
              topic_id
            `)
            .eq('course_id', courseInfo.id)
            .order('lesson_number', { ascending: true });

          if (error) {
            // Try alternative without course_id
            console.warn('Error with first lessons approach, trying alternative:', error);
            
            const { data: altData, error: altError } = await supabase
              .from('lessons')
              .select('*')
              .limit(30);
              
            if (altError) {
              console.error('Error with alternative lessons approach:', altError);
              throw new Error('Failed to fetch lessons');
            }
            
            lessonsData = altData || [];
          } else {
            lessonsData = data || [];
          }
        } catch (lessonsError) {
          console.error('Error fetching lessons:', lessonsError);
          lessonsData = [];
        }

        console.log('Lessons fetched:', lessonsData);

        // 4. Fetch videos for this course from video_content table
        let videosData: DbVideo[] = [];
        try {
          console.log('Fetching videos from video_content table');
          
          // First try to get video_content with course_id
          const { data: videosByCourseId, error: courseError } = await supabase
            .from('video_content')
            .select(`
              id,
              title,
              description,
              vimeo_id,
              duration,
              lesson_id,
              subtopic_id
            `)
            .eq('course_id', courseInfo.id);
            
          if (courseError) {
            console.warn('Error fetching video_content with course_id:', courseError);
            
            // Try without course_id filter
            console.log('Trying to fetch video_content without course filter');
            const { data: allVideoContent, error: allError } = await supabase
              .from('video_content')
              .select(`
                id,
                title,
                description,
                vimeo_id,
                duration,
                lesson_id,
                subtopic_id
              `)
              .limit(200);
              
            if (allError) {
              console.error('Error fetching all video_content:', allError);
            } else {
              console.log(`Found ${allVideoContent?.length || 0} videos in video_content table`);
              console.log('Sample video data:', allVideoContent?.slice(0, 3));
              console.log('Sample duration value:', allVideoContent?.[0]?.duration, 'Type:', typeof allVideoContent?.[0]?.duration);
              videosData = (allVideoContent || []).map(video => ({
                id: video.id,
                title: video.title,
                description: video.description,
                vimeo_id: video.vimeo_id,
                duration: video.duration,
                lesson_id: video.lesson_id,
                topic_id: video.subtopic_id
              }));
            }
          } else {
            console.log(`Found ${videosByCourseId?.length || 0} videos for course ${courseInfo.id}`);
            videosData = (videosByCourseId || []).map(video => ({
              id: video.id,
              title: video.title,
              description: video.description,
              vimeo_id: video.vimeo_id,
              duration: video.duration,
              lesson_id: video.lesson_id,
              topic_id: video.subtopic_id
            }));
          }
          
          // Once we have the videos, parse duration strings
          videosData = videosData.map(video => {
            // Add duration calculation - assuming duration in database is in minutes
            const durationValue = video.duration as unknown as string | number | undefined;
            console.log(`Processing duration for video ${video.id}: ${durationValue}, Type: ${typeof durationValue}`);
            
            let durationMinutes = 0;
            
            if (typeof durationValue === 'string') {
              // Try parsing as a decimal number string
              if (!isNaN(parseFloat(durationValue))) {
                durationMinutes = parseFloat(durationValue);
              }
              // Handle time format if present (MM:SS)
              else if (durationValue.includes(':')) {
                const parts = durationValue.split(':').map(Number);
                if (parts.length === 2) { // MM:SS
                  durationMinutes = parts[0] + (parts[1] / 60);
                } else if (parts.length === 3) { // HH:MM:SS
                  durationMinutes = (parts[0] * 60) + parts[1] + (parts[2] / 60);
                }
              }
            } 
            // Handle if it's already a number
            else if (typeof durationValue === 'number') {
              durationMinutes = durationValue;
            }
            
            // Store the minutes directly in the duration field
            // We don't need to convert to seconds since we're using minutes throughout
            console.log(`Calculated duration for video ${video.id}: ${durationMinutes} minutes`);
            
            return {
              ...video,
              duration: durationMinutes
            };
          });
          
          console.log('Processed videos data:', videosData.length);
        } catch (videosError) {
          console.error('Error fetching videos:', videosError);
          videosData = [];
        }

        // Organize videos by lesson for more efficient lookup
        const videosByLesson: Record<string, DbVideo[]> = {};
        videosData.forEach(video => {
          if (video.lesson_id) {
            if (!videosByLesson[video.lesson_id]) {
              videosByLesson[video.lesson_id] = [];
            }
            videosByLesson[video.lesson_id].push(video);
          }
        });

        console.log(`Organized videos by lesson: ${Object.keys(videosByLesson).length} lessons have videos`);

        // Update the lesson info formatter to calculate duration from videos
        const lessonInfo: LessonInfo[] = lessonsData.map(lesson => {
          // Calculate total duration from all videos associated with this lesson
          const lessonVideos = videosByLesson[lesson.id] || [];
          const totalDurationMinutes = lessonVideos.reduce((sum, video) => sum + (video.duration || 0), 0);
          
          const durationFormatted = formatDuration(totalDurationMinutes);
          
          return {
            id: lesson.lesson_number,
            name: lesson.title || `שיעור ${lesson.lesson_number}`,
            description: lesson.description || '',
            hasQuiz: false, // Default to false since has_quiz doesn't exist
            duration: durationFormatted,
            durationMinutes: totalDurationMinutes
          };
        });

        // Calculate total course duration
        const totalCourseDurationMinutes = lessonInfo.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
        console.log(`Total course duration: ${totalCourseDurationMinutes} minutes (${formatDuration(totalCourseDurationMinutes)})`);

        // Log video durations for debugging
        console.log('Video durations (minutes):', videosData.map(v => ({ 
          id: v.id, 
          title: v.title, 
          duration: v.duration,
          originalDuration: v.duration
        })));
        
        // Format videos
        const videos: VideoData[] = videosData.map(video => {
          // Find the lesson for this video
          const lesson = video.lesson_id 
            ? lessonsData.find(l => l.id === video.lesson_id) 
            : undefined;
          
          return {
            id: video.id,
            title: video.title || 'סרטון ללא כותרת',
            description: video.description || '',
            vimeoId: video.vimeo_id,
            url: `https://vimeo.com/${video.vimeo_id}`,
            embedUrl: `https://player.vimeo.com/video/${video.vimeo_id}`,
            duration: video.duration || 0,
            lessonNumber: lesson?.lesson_number || 0,
            segmentNumber: video.segment_number || 0
          };
        });

        console.log('Successfully loaded course data');
        console.log('Topics:', formattedTopics.length);
        console.log('Lessons:', lessonInfo.length);
        console.log('Videos:', videos.length);
        
        setCourseData({
          id: courseInfo.id,
          title: courseInfo.title,
          description: courseInfo.description || '',
          topics: formattedTopics,
          lessonInfo: lessonInfo,
          videos: videos,
          initialLessonId: lessonId ? parseInt(lessonId) : undefined
        });
      } catch (error) {
        console.error('Failed to load course data:', error);
        setError('שגיאה בטעינת נתוני הקורס');
        
        // Set fallback data on error
        setCourseData(prev => ({
          ...prev,
          topics: FALLBACK_TOPICS,
          initialLessonId: lessonId ? parseInt(lessonId) : 1
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
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
        {error && (
          <Alert
            message="שגיאה בטעינת נתוני הקורס"
            description="חלק מתכני הקורס עשויים להיות חסרים. נסה לרענן את העמוד או פנה לתמיכה."
            type="warning"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
          />
        )}
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