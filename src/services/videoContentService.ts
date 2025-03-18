import { VideoContent, VideoSource } from '../types/videoContent';

// Import video data directly
let videoDataJson: any = { videos: [] };
try {
  videoDataJson = require('../data/course/CIV-SAF/content/video_data.json');
} catch (error) {
  console.warn('Warning: Could not load video_data.json:', error);
}

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
  videos: { id: string; title: string }[];
}

class VideoContentService {
  private videos: ProcessedVideo[] = [];
  private videoTitles: Map<string, string> = new Map();
  private initialized = false;
  private lessonSummaries: Map<number, LessonSummary> = new Map();

  private async initialize() {
    if (this.initialized) return;

    try {
      // Load processed summaries
      const summariesResponse = await fetch('/data/videos/embeddings/processed_summaries.json');
      if (!summariesResponse.ok) {
        console.error(`Failed to load video summaries: ${summariesResponse.status} ${summariesResponse.statusText}`);
        // Initialize with empty data instead of throwing
        this.videos = [];
        this.initialized = true;
        return;
      }
      
      const data: ProcessedSummaries = await summariesResponse.json();
      if (!data || !data.summaries) {
        console.error('Invalid video summaries data format');
        this.videos = [];
        this.initialized = true;
        return;
      }

      // Create maps for durations and titles from bundled video data
      const lessonDurations = new Map<number, number>();
      this.videoTitles.clear();
      
      if (videoDataJson && videoDataJson.videos) {
        videoDataJson.videos.forEach((video: { id: string; lessonNumber: number; duration: number; title: string }) => {
          // Sum durations per lesson
          const current = lessonDurations.get(video.lessonNumber) || 0;
          lessonDurations.set(video.lessonNumber, current + video.duration);
          
          // Store updated titles
          this.videoTitles.set(`video_${video.id}`, video.title);
        });
      }
      
      // Set videos and build summaries
      this.videos = data.summaries;
      this.buildLessonSummaries(lessonDurations);
      this.initialized = true;
    } catch (error) {
      console.error('Error loading video data:', error);
      this.videos = [];
      this.initialized = true;
    }
  }

  private buildLessonSummaries(lessonDurations: Map<number, number>) {
    this.lessonSummaries.clear();
    
    // Group videos by lesson number only
    this.videos.forEach(video => {
      if (!this.lessonSummaries.has(video.lesson_number)) {
        this.lessonSummaries.set(video.lesson_number, {
          lessonNumber: video.lesson_number,
          subtopicId: video.subtopic_id,
          totalDuration: lessonDurations.get(video.lesson_number) || 0,
          videoCount: 0,
          videos: []
        });
      }
      
      const summary = this.lessonSummaries.get(video.lesson_number)!;
      summary.videoCount += 1;
      
      // Add video with updated title to the summary
      const updatedTitle = this.videoTitles.get(video.video_id) || video.video_title;
      summary.videos.push({
        id: video.video_id,
        title: updatedTitle
      });
    });
  }

  private processedToVideoContent(processed: ProcessedVideo): VideoContent {
    return {
      id: processed.video_id,
      title: this.videoTitles.get(processed.video_id) || processed.video_title,
      description: processed.content,
      videoSource: VideoSource.VIMEO,
      videoId: processed.video_id.replace('video_', ''),
      subtopicId: processed.subtopic_id,
      lessonNumber: processed.lesson_number,
      duration: this.formatDuration(processed.duration || 0),
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
    
    // Debug: Log all videos for this subtopic
    console.log('All videos for subtopic:', subtopicId, 
      this.videos.filter(v => v.subtopic_id === subtopicId)
        .map(v => ({
          lessonNumber: v.lesson_number,
          duration: v.duration,
          title: v.video_title
        }))
    );
    
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