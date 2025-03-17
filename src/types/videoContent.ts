export enum VideoSource {
  VIMEO = 'vimeo',
  YOUTUBE = 'youtube'
}

export interface VideoContent {
  id: string;
  title: string;
  description?: string;
  videoSource: VideoSource;
  videoId: string; // Either Vimeo ID or YouTube ID
  subtopicId: string;
  duration: string;
  thumbnail?: string;
  order?: number;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lessonNumber?: number;
}

export interface CreateVideoContentInput {
  title: string;
  description?: string;
  videoSource: VideoSource;
  videoId: string;
  subtopicId: string;
  duration: string;
  thumbnail?: string;
  order?: number;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateVideoContentInput extends Partial<CreateVideoContentInput> {
  id: string;
} 