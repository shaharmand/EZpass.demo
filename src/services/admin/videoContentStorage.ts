import { VideoContent, CreateVideoContentInput, UpdateVideoContentInput, VideoSource } from '../../types/videoContent';
import { logger } from '../../utils/logger';
import { getSupabase } from '../../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

interface VideoContentFilters {
  subtopicId?: string;
  isActive?: boolean;
  searchText?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  sortBy?: 'order' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export class VideoContentStorage {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient | null) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    this.supabase = supabaseClient;
  }

  /**
   * Retrieves all video content with optional filtering
   */
  async getVideos(filters?: VideoContentFilters): Promise<VideoContent[]> {
    try {
      let query = this.supabase
        .from('video_content')
        .select('*');

      // Apply filters
      if (filters) {
        if (filters.subtopicId) {
          query = query.eq('subtopic_id', filters.subtopicId);
        }
        if (typeof filters.isActive === 'boolean') {
          query = query.eq('is_active', filters.isActive);
        }
        if (filters.searchText) {
          query = query.or(`title.ilike.%${filters.searchText}%,description.ilike.%${filters.searchText}%`);
        }
        if (filters.dateRange) {
          if (filters.dateRange.start) {
            query = query.gte('created_at', filters.dateRange.start.toISOString());
          }
          if (filters.dateRange.end) {
            query = query.lte('created_at', filters.dateRange.end.toISOString());
          }
        }
        // Apply sorting
        if (filters.sortBy) {
          query = query.order(filters.sortBy, { 
            ascending: filters.sortOrder === 'asc',
            nullsFirst: false 
          });
        }
      }

      // Default sorting if no specific sort is requested
      if (!filters?.sortBy) {
        query = query
          .order('order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch videos:', error);
      throw error;
    }
  }

  /**
   * Retrieves a single video by ID
   */
  async getVideo(id: string): Promise<VideoContent | null> {
    try {
      const { data, error } = await this.supabase
        .from('video_content')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch video:', error);
      throw error;
    }
  }

  /**
   * Creates a new video
   */
  async createVideo(input: CreateVideoContentInput): Promise<VideoContent> {
    try {
      // Validate required fields
      if (!input.title || !input.videoId || !input.subtopicId || !input.duration) {
        throw new Error('Missing required fields');
      }

      const { data, error } = await this.supabase
        .from('video_content')
        .insert([{
          title: input.title,
          description: input.description,
          video_source: input.videoSource,
          video_id: input.videoId,
          subtopic_id: input.subtopicId,
          duration: input.duration,
          thumbnail: input.thumbnail || (
            input.videoSource === VideoSource.YOUTUBE 
              ? `https://img.youtube.com/vi/${input.videoId}/maxresdefault.jpg`
              : `https://vumbnail.com/${input.videoId}.jpg`
          ),
          order: input.order,
          tags: input.tags || [],
          is_active: input.isActive ?? true
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create video:', error);
      throw error;
    }
  }

  /**
   * Updates an existing video
   */
  async updateVideo(id: string, input: UpdateVideoContentInput): Promise<VideoContent> {
    try {
      const { data, error } = await this.supabase
        .from('video_content')
        .update({
          title: input.title,
          description: input.description,
          video_source: input.videoSource,
          video_id: input.videoId,
          subtopic_id: input.subtopicId,
          duration: input.duration,
          thumbnail: input.thumbnail,
          order: input.order,
          tags: input.tags,
          is_active: input.isActive
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Video not found');
      return data;
    } catch (error) {
      logger.error('Failed to update video:', error);
      throw error;
    }
  }

  /**
   * Deletes a video
   */
  async deleteVideo(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('video_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to delete video:', error);
      throw error;
    }
  }

  /**
   * Gets videos by subtopic ID
   */
  async getVideosBySubtopic(subtopicId: string): Promise<VideoContent[]> {
    return this.getVideos({ subtopicId });
  }
} 