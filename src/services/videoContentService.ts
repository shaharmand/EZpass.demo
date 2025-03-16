import { VideoContent, VideoSource } from '../types/videoContent';

interface ProcessedVideo {
  video_id: string;
  video_title: string;
  content: string;
  embedding: number[];
  subtopic_id: string;
  lesson_number: number;
  segment_number: number;
}

interface ProcessedSummaries {
  summaries: ProcessedVideo[];
}

class VideoContentService {
  private videos: ProcessedVideo[] = [];
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;

    try {
      const response = await fetch('/data/processed_summaries.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ProcessedSummaries = await response.json();
      this.videos = data.summaries;
      this.initialized = true;
      console.log('Loaded video summaries:', this.videos.length);
    } catch (error) {
      console.error('Error loading video summaries:', error);
      this.videos = [];
    }
  }

  private processedToVideoContent(processed: ProcessedVideo): VideoContent {
    return {
      id: processed.video_id,
      title: processed.video_title,
      description: processed.content,
      videoSource: VideoSource.VIMEO,
      videoId: processed.video_id.replace('video_', ''),
      subtopicId: processed.subtopic_id,
      duration: '0:00', // We'll need to add this to the processed data
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async getVideo(id: string): Promise<VideoContent | null> {
    await this.initialize();
    const video = this.videos.find(v => v.video_id === id);
    return video ? this.processedToVideoContent(video) : null;
  }

  async getSubtopicVideos(subtopicId: string): Promise<VideoContent[]> {
    await this.initialize();
    return this.videos
      .filter(v => v.subtopic_id === subtopicId)
      .map(v => this.processedToVideoContent(v));
  }

  async getActiveVideos(): Promise<VideoContent[]> {
    await this.initialize();
    return this.videos.map(v => this.processedToVideoContent(v));
  }

  async getVideoEmbedding(id: string): Promise<number[] | null> {
    await this.initialize();
    const video = this.videos.find(v => v.video_id === id);
    return video?.embedding || null;
  }
}

export const videoContentService = new VideoContentService(); 