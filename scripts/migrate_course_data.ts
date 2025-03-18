const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface VideoData {
  id: string;
  vimeoId: string;
  originalTitle: string;
  title: string;
  lessonNumber: number;
  segmentNumber: number;
  subtopicId: string;
  embedUrl: string;
  duration: number;
}

interface TopicInfo {
  id: string;
  title: string;
  lessons: number[];
}

interface LessonInfo {
  id: number;
  name: string;
  duration: string;
  durationMinutes: number;
  hasQuiz: boolean;
}

interface LessonInfoData {
  topics: TopicInfo[];
  lessons: LessonInfo[];
}

async function migrateCourseData() {
  try {
    // Read video data and lesson info
    const videoDataPath = path.join(process.cwd(), 'src/data/course/CIV-SAF/content/video_data.json');
    const lessonInfoPath = path.join(process.cwd(), 'src/data/course/CIV-SAF/content/lesson_info.json');
    
    const videoData = JSON.parse(fs.readFileSync(videoDataPath, 'utf8')) as { videos: VideoData[] };
    const lessonInfo = JSON.parse(fs.readFileSync(lessonInfoPath, 'utf8')) as LessonInfoData;

    // Get the course ID
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('code', 'CIV-SAF')
      .single();

    if (courseError) throw courseError;
    const courseId = courseData.id;

    // Get all topics first to avoid multiple queries
    const { data: allTopics, error: topicsError } = await supabase
      .from('topics')
      .select('id, code');

    if (topicsError) throw topicsError;

    // Get all subtopics
    const { data: allSubtopics, error: subtopicsError } = await supabase
      .from('subtopics')
      .select('id, code');

    if (subtopicsError) throw subtopicsError;

    // Create maps of codes to IDs
    const topicMap = new Map(allTopics.map((t: { code: string, id: string }) => [t.code, t.id]));
    const subtopicMap = new Map(allSubtopics.map((s: { code: string, id: string }) => [s.code, s.id]));

    // Delete existing lessons and their videos
    console.log('Deleting existing lessons and videos...');
    const { data: existingLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    if (lessonsError) throw lessonsError;

    if (existingLessons.length > 0) {
      const lessonIds = existingLessons.map((l: { id: string }) => l.id);
      
      // Delete videos first (due to foreign key constraint)
      const { error: deleteVideosError } = await supabase
        .from('video_content')
        .delete()
        .in('lesson_id', lessonIds);
      
      if (deleteVideosError) throw deleteVideosError;

      // Then delete lessons
      const { error: deleteLessonsError } = await supabase
        .from('lessons')
        .delete()
        .in('id', lessonIds);
      
      if (deleteLessonsError) throw deleteLessonsError;
    }

    console.log('Creating new lessons...');
    // Create lessons
    const lessons = new Map<number, string>(); // lessonNumber -> lessonId
    const uniqueLessons = Array.from(new Set(videoData.videos.map((v: VideoData) => v.lessonNumber))).sort((a: number, b: number) => a - b);

    for (const lessonNumber of uniqueLessons) {
      const lessonData = lessonInfo.lessons.find(l => l.id === lessonNumber);
      
      if (!lessonData) {
        console.warn(`No lesson info found for lesson ${lessonNumber}`);
        continue;
      }

      // Find topic for this lesson
      const topic = lessonInfo.topics.find(t => t.lessons.includes(lessonNumber));
      if (!topic) {
        console.warn(`No topic found for lesson ${lessonNumber}`);
        continue;
      }

      const topicId = topicMap.get(topic.id);
      if (!topicId) {
        console.warn(`No topic ID found in database for topic code ${topic.id}`);
        continue;
      }

      const { data: lessonInsertData, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          title: lessonData.name,
          description: `שיעור ${lessonNumber} - ${lessonData.name}`,
          lesson_number: lessonNumber,
          topic_id: topicId,
          is_active: true
        })
        .select('id')
        .single();

      if (lessonError) throw lessonError;
      lessons.set(lessonNumber, lessonInsertData.id);
    }

    // Insert videos
    console.log('Creating videos...');
    for (const video of videoData.videos) {
      const lessonId = lessons.get(video.lessonNumber);
      if (!lessonId) {
        console.warn(`Skipping video for lesson ${video.lessonNumber} - no lesson ID found`);
        continue;
      }

      const subtopicId = subtopicMap.get(video.subtopicId);
      if (!subtopicId) {
        console.warn(`Skipping video for lesson ${video.lessonNumber} - no subtopic ID found for code ${video.subtopicId}`);
        continue;
      }

      const { error: videoError } = await supabase
        .from('video_content')
        .insert({
          title: video.title,
          description: video.originalTitle,
          vimeo_id: video.vimeoId,
          subtopic_id: subtopicId,
          lesson_id: lessonId,
          duration: video.duration.toString(),
          thumbnail: `https://vumbnail.com/${video.vimeoId}.jpg`,
          order: video.lessonNumber * 100 + video.segmentNumber,
          is_active: true
        });

      if (videoError) {
        console.error(`Error inserting video for lesson ${video.lessonNumber}:`, videoError);
        continue;
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateCourseData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 