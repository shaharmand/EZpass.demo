export interface VideoData {
  id: string;
  title: string;
  url: string;
  vimeoId: string;
  lessonNumber: number;
  segmentNumber: number;
  embedUrl: string;
  duration: number;
  description?: string;
}

export interface LessonInfo {
  id: number;
  name: string;
  description?: string;
  hasQuiz: boolean;
  duration: string;
  durationMinutes: number;
}

export interface Topic {
  id: string;
  title: string;
  lessons: number[];
}

export interface CourseData {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
  lessonInfo: LessonInfo[];
  videos: VideoData[];
}

export interface VimeoThumbnail {
  type: string;
  version: string;
  provider_name: string;
  provider_url: string;
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  width: number;
  height: number;
} 