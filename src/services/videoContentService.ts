import { VideoContent, VideoSource } from '../types/videoContent';

interface ProcessedVideo {
  video_id: string;
  video_title: string;
  content: string;
  embedding: number[];
  subtopic_id: string;
  lesson_number: number;
  segment_number: number;
  duration?: number;
}

interface ProcessedSummaries {
  summaries: ProcessedVideo[];
}

interface LessonSummary {
  lessonNumber: number;
  subtopicId: string;
  totalDuration: number;
  videoCount: number;
}

class VideoContentService {
  private videos: ProcessedVideo[] = [];
  private initialized = false;
  private lessonSummaries: Map<number, LessonSummary> = new Map();

  private async initialize() {
    if (this.initialized) return;

    try {
      const response = await fetch('/data/processed_summaries.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ProcessedSummaries = await response.json();
      this.videos = data.summaries;
      this.buildLessonSummaries();
      this.initialized = true;
      console.log('=== Debug: Video Summaries Structure ===');
      console.log('First video example:', this.videos[0]);
      console.log('Number of videos with lesson numbers:', 
        this.videos.filter(v => v.lesson_number !== undefined).length);
      console.log('Total videos:', this.videos.length);
      console.log('=====================================');
    } catch (error) {
      console.error('Error loading video summaries:', error);
      this.videos = [];
    }
  }

  private buildLessonSummaries() {
    this.lessonSummaries.clear();
    
    // Group videos by lesson number
    this.videos.forEach(video => {
      if (!this.lessonSummaries.has(video.lesson_number)) {
        this.lessonSummaries.set(video.lesson_number, {
          lessonNumber: video.lesson_number,
          subtopicId: video.subtopic_id,
          totalDuration: 0,
          videoCount: 0
        });
      }
      
      const summary = this.lessonSummaries.get(video.lesson_number)!;
      summary.totalDuration += video.duration || 0;
      summary.videoCount += 1;
    });

    console.log('Built lesson summaries:', Array.from(this.lessonSummaries.entries()));
  }

  private processedToVideoContent(processed: ProcessedVideo): VideoContent {
    return {
      id: processed.video_id,
      title: processed.video_title,
      description: processed.content,
      videoSource: VideoSource.VIMEO,
      videoId: processed.video_id.replace('video_', ''),
      subtopicId: processed.subtopic_id,
      lessonNumber: processed.lesson_number,
      duration: this.formatDuration(0), // We'll need to add this to the processed data
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours} שעות ו-${remainingMinutes} דקות`;
    }
    return `${remainingMinutes} דקות`;
  }

  async getRelatedLessons(subtopicId: string, currentLessonNumber: number): Promise<LessonSummary[]> {
    await this.initialize();
    
    // Simply filter lessons by matching subtopicId
    const relatedLessons = Array.from(this.lessonSummaries.values())
      .filter(summary => summary.subtopicId === subtopicId)
      .sort((a, b) => a.lessonNumber - b.lessonNumber);

    console.log('Found lessons for subtopic:', subtopicId, relatedLessons);
    return relatedLessons.slice(0, 2); // Return at most 2 related lessons
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