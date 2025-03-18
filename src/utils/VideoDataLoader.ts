import { VideoData } from '../types/video';

// Import video data directly
import videoDataJson from '../data/course/CIV-SAF/content/video_data.json';

export class VideoDataLoader {
  private static instance: VideoDataLoader;
  private videoData: VideoData[] = [];

  private constructor() {
    // Extract the videos array from the JSON structure
    this.videoData = videoDataJson.videos;
  }

  public static getInstance(): VideoDataLoader {
    if (!VideoDataLoader.instance) {
      VideoDataLoader.instance = new VideoDataLoader();
    }
    return VideoDataLoader.instance;
  }

  public async loadVideoData(): Promise<VideoData[]> {
    return this.videoData;
  }

  public getVideoById(id: string): VideoData | undefined {
    return this.videoData.find(video => video.id === id);
  }

  public getVideosBySubtopicId(subtopicId: string): VideoData[] {
    return this.videoData.filter(video => video.subtopicId === subtopicId);
  }

  public getVideosByLessonNumber(lessonNumber: number): VideoData[] {
    return this.videoData.filter(video => video.lessonNumber === lessonNumber);
  }
} 