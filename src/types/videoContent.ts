export enum VideoSource {
  VIMEO = 'vimeo',
  YOUTUBE = 'youtube'
}

export interface VideoContent {
  id: string;
  title: string;
  description?: string;
  videoSource: VideoSource;
  vimeo_id: string; // Vimeo ID
  subtopic_id: string;
  duration: string;
  duration_minutes?: number; // Duration in minutes as a number
  thumbnail?: string;
  order?: number;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lesson_id?: string;
  lessons?: {
    id: string;
    title: string;
    description: string;
    lesson_number: number;
  };
}

export interface VideoContentWithLesson extends VideoContent {
  lessons?: {
    id: string;
    title: string;
    description: string;
    lesson_number: number;
  };
}

export interface CreateVideoContentInput {
  title: string;
  description?: string;
  videoSource: VideoSource;
  vimeo_id: string;
  subtopic_id: string;
  duration: string;
  duration_minutes?: number;
  thumbnail?: string;
  order?: number;
  tags?: string[];
  is_active?: boolean;
}

export interface UpdateVideoContentInput extends Partial<CreateVideoContentInput> {
  id: string;
} 