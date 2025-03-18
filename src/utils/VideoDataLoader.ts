import { VideoData } from '../types/video';
import { supabase } from '../lib/supabaseClient';

export class VideoDataLoader {
  private static instance: VideoDataLoader;
  private initialized = false;

  private constructor() {}

  public static getInstance(): VideoDataLoader {
    if (!VideoDataLoader.instance) {
      VideoDataLoader.instance = new VideoDataLoader();
    }
    return VideoDataLoader.instance;
  }

  private async initialize() {
    if (this.initialized) return;
    this.initialized = true;
  }

  public async loadVideoData(): Promise<VideoData[]> {
    await this.initialize();
    const { data, error } = await supabase
      .from('video_content')
      .select('*')
      .order('order');

    if (error) throw error;
    return data || [];
  }

  public async getVideoById(id: string): Promise<VideoData | undefined> {
    await this.initialize();
    const { data, error } = await supabase
      .from('video_content')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  public async getVideosBySubtopicId(subtopicId: string): Promise<VideoData[]> {
    await this.initialize();
    const { data, error } = await supabase
      .from('video_content')
      .select('*')
      .eq('subtopic_id', subtopicId)
      .order('order');

    if (error) throw error;
    return data || [];
  }

  public async getVideosByLessonNumber(lessonNumber: number): Promise<VideoData[]> {
    await this.initialize();
    const { data, error } = await supabase
      .from('video_content')
      .select('*')
      .eq('lesson_number', lessonNumber)
      .order('order');

    if (error) throw error;
    return data || [];
  }
} 