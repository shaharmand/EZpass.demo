import { getSupabase } from '../lib/supabase';
import { VideoContent } from '../types/videoContent';

class VideoContentService {
  private supabase = getSupabase();

  async getVideo(id: string): Promise<VideoContent | null> {
    const { data, error } = await this.supabase
      .from('VideoContent')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching video:', error);
      throw error;
    }

    return data;
  }

  async getSubtopicVideos(subtopicId: string): Promise<VideoContent[]> {
    const { data, error } = await this.supabase
      .from('VideoContent')
      .select('*')
      .eq('subtopicId', subtopicId)
      .eq('isActive', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }

    return data || [];
  }

  async getActiveVideos(): Promise<VideoContent[]> {
    const { data, error } = await this.supabase
      .from('VideoContent')
      .select('*')
      .eq('isActive', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching active videos:', error);
      throw error;
    }

    return data || [];
  }
}

export const videoContentService = new VideoContentService(); 