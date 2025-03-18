import { supabase } from '../lib/supabaseClient';
import { CourseData, LessonInfo, VideoData } from '../components/courses/types';

export interface CourseResponse {
  courseData: CourseData;
  error?: string;
}

export const courseService = {
  /**
   * Fetch course data from the database
   * @param courseId - The ID of the course to fetch
   * @returns CourseResponse containing the course data or an error
   */
  fetchCourseData: async (courseId: string): Promise<CourseResponse> => {
    try {
      console.log(`Fetching course data for: ${courseId}`);
      // Step 1: Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('id', courseId)
        .single();

      if (courseError) throw new Error(`Failed to fetch course: ${courseError.message}`);
      if (!courseData) throw new Error(`Course not found: ${courseId}`);

      // Step 2: Fetch topics for this course
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('id, name')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (topicsError) throw new Error(`Failed to fetch topics: ${topicsError.message}`);

      // Step 3: Fetch lessons for this course
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id, 
          title, 
          description,
          lesson_number,
          topic_id,
          duration,
          has_quiz
        `)
        .eq('course_id', courseId)
        .order('lesson_number', { ascending: true });

      if (lessonsError) throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);

      // Step 4: Fetch videos for this course
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          vimeo_id,
          duration,
          lesson_id,
          topic_id,
          segment_number
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (videosError) throw new Error(`Failed to fetch videos: ${videosError.message}`);

      // Format topics with lessons
      const formattedTopics = topicsData.map(topic => {
        const topicLessons = lessonsData
          .filter(lesson => lesson.topic_id === topic.id)
          .map(lesson => lesson.lesson_number);

        return {
          id: topic.id,
          title: topic.name,
          lessons: topicLessons
        };
      });

      // Format lessons info
      const lessonInfo: LessonInfo[] = lessonsData.map(lesson => {
        // Calculate duration in minutes from seconds
        const durationMinutes = Math.round((lesson.duration || 0) / 60);
        
        // Format duration as string (e.g., "5 דקות")
        const durationFormatted = `${durationMinutes} דקות`;
        
        return {
          id: lesson.lesson_number,
          name: lesson.title,
          description: lesson.description || '',
          hasQuiz: lesson.has_quiz || false,
          duration: durationFormatted,
          durationMinutes: durationMinutes
        };
      });

      // Format videos
      const videos: VideoData[] = videosData.map(video => {
        // Find the lesson for this video
        const lesson = lessonsData.find(l => l.id === video.lesson_id);
        
        return {
          id: video.id,
          title: video.title,
          description: video.description || '',
          vimeoId: video.vimeo_id,
          url: `https://vimeo.com/${video.vimeo_id}`,
          embedUrl: `https://player.vimeo.com/video/${video.vimeo_id}`,
          duration: video.duration || 0,
          lessonNumber: lesson?.lesson_number || 0,
          segmentNumber: video.segment_number || 0
        };
      });

      // Build the final course data object
      const result: CourseData = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description || '',
        topics: formattedTopics,
        lessonInfo,
        videos
      };

      console.log('Fetched course data:', result);
      return { courseData: result };
    } catch (error: any) {
      console.error('Error fetching course data:', error);
      return {
        courseData: {
          id: '',
          title: '',
          description: '',
          topics: [],
          lessonInfo: [],
          videos: []
        },
        error: error.message
      };
    }
  }
}; 