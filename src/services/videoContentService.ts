import { VideoContent, VideoSource } from '../types/videoContent';
import { supabase } from '../lib/supabaseClient';
import { embeddingService } from './embeddingService';
import { EmbeddingService } from './embeddingService';

interface VideoMatch {
  id: string;
  similarity: number;
  final_score: number;
}

export class VideoContentService {
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;
    this.initialized = true;
  }

  async getVideo(id: string): Promise<VideoContent | null> {
    await this.initialize();
    const { data, error } = await supabase
      .from('video_content')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getSubtopicVideos(subtopicId: string): Promise<VideoContent[]> {
    const { data, error } = await supabase
      .from('video_content')
      .select('*')
      .eq('subtopic_id', subtopicId)
      .order('order');

    if (error) throw error;
    return data || [];
  }

  async getActiveVideos(): Promise<VideoContent[]> {
    await this.initialize();
    const { data, error } = await supabase
      .from('video_content')
      .select('*')
      .eq('is_active', true)
      .order('order');

    if (error) throw error;
    return data || [];
  }

  static async getVideoEmbedding(videoId: string): Promise<number[] | null> {
    if (!videoId) {
      console.error('Cannot fetch embedding: videoId is undefined or empty');
      return null;
    }

    const { data, error } = await supabase
      .from('video_content')
      .select('embedding')
      .eq('vimeo_id', videoId)
      .single();

    if (error) {
      console.error(`Error fetching embedding for video ${videoId}:`, error);
      return null;
    }

    if (!data) {
      console.error(`No data found for video ${videoId}`);
      return null;
    }

    if (!data.embedding) {
      console.error(`No embedding found for video ${videoId}`);
      return null;
    }

    // Parse the embedding string into an array of numbers
    let embedding: number[];
    try {
      if (typeof data.embedding === 'string') {
        embedding = JSON.parse(data.embedding);
      } else {
        embedding = data.embedding;
      }
    } catch (error) {
      console.error(`Failed to parse embedding for video ${videoId}:`, error);
      return null;
    }

    // Log the type and structure of the embedding
    console.log(`Embedding for video ${videoId}:`, {
      type: typeof embedding,
      isArray: Array.isArray(embedding),
      length: Array.isArray(embedding) ? embedding.length : 'N/A',
      sample: Array.isArray(embedding) ? embedding.slice(0, 5) : embedding
    });

    return embedding;
  }

  static async findSimilarVideos(
    query: string | VideoContent,
    maxResults: number = 4,
    subtopicId?: string
  ): Promise<VideoContent[]> {
    // Get embedding for the query
    let queryEmbedding: number[];
    if (typeof query === 'string') {
      queryEmbedding = await EmbeddingService.getTextEmbedding(query);
    } else {
      const videoEmbedding = await this.getVideoEmbedding(query.vimeo_id);
      if (!videoEmbedding) {
        throw new Error('Could not get embedding for video');
      }
      queryEmbedding = videoEmbedding;
    }

    // Use database function for similarity search
    const { data, error } = await supabase.rpc('match_videos_weighted', {
      query_embedding: queryEmbedding,
      subtopic: subtopicId || '',
      subtopic_boost: 0.025, // 2.5% boost for same subtopic
      similarity_threshold: 0.2,
      max_results: maxResults
    });

    if (error) throw error;

    // Get full video content for matched videos
    const videoIds = (data as VideoMatch[]).map(match => match.id);
    const { data: videos, error: videosError } = await supabase
      .from('video_content')
      .select('*')
      .in('id', videoIds);

    if (videosError) throw videosError;

    // Sort videos to match the similarity order
    return (data as VideoMatch[]).map(match => 
      videos.find(v => v.id === match.id)
    ).filter((v): v is VideoContent => v !== undefined);
  }

  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours} שעות ו-${remainingMinutes} דקות`;
    }
    return `${remainingMinutes} דקות`;
  }

  static parseDuration(duration: string): number {
    // Parse duration string in format "HH:MM:SS" or "MM:SS"
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1] + parts[2] / 60;
    } else if (parts.length === 2) {
      return parts[0] + parts[1] / 60;
    }
    return 0;
  }

  static async getRelatedLessons(subtopicId: string, currentLessonNumber: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('video_content')
      .select('*, lessons(*)')
      .eq('subtopic_id', subtopicId)
      .not('lesson_id', 'is', null);

    if (error) throw error;

    // Group videos by lesson
    const lessons = new Map<number, any>();
    data?.forEach(video => {
      if (!lessons.has(video.lesson_id)) {
        lessons.set(video.lesson_id, {
          lessonNumber: video.lesson_id,
          subtopicId: video.subtopic_id,
          totalDuration: 0,
          videoCount: 0,
          videos: []
        });
      }
      
      const lesson = lessons.get(video.lesson_id)!;
      const durationMinutes = this.parseDuration(video.duration);
      lesson.videoCount += 1;
      lesson.totalDuration += durationMinutes;
      lesson.videos.push({
        id: video.id,
        title: video.title,
        duration: durationMinutes
      });
    });

    // Convert to array and sort by lesson number
    return Array.from(lessons.values())
      .filter(lesson => lesson.lessonNumber !== currentLessonNumber)
      .sort((a, b) => a.lessonNumber - b.lessonNumber)
      .slice(0, 2); // Return at most 2 related lessons
  }
}

export const videoContentService = new VideoContentService(); 