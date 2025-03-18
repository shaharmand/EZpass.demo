import { VideoContent } from './videoContent';
import { LessonInfo } from '../components/courses/types';

export interface LearningContent {
  id: string;
  type: 'video' | 'interactive' | 'article' | 'lesson';
  title: string;
  description?: string;
  subtopic_id: string;
  duration?: string | number;
  thumbnail?: string;
  progress?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  relevance?: 'direct' | 'related' | 'supplementary';
  content?: VideoContent | LessonInfo;
} 