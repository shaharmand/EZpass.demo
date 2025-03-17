import videoData from '../../public/data/courses/construction_safety_video_course/video_data.json';

interface Video {
  id: string;
  vimeoId: string;
  title: string;
  lessonNumber: number;
  segmentNumber: number;
  subtopicId: string;
  embedUrl: string;
  duration: number;
}

interface LessonSummary {
  lessonNumber: number;
  subtopicId: string;
  totalDuration: number;
  videoCount: number;
}

class VideoService {
  private videos: Video[];
  private lessonSummaries: Map<number, LessonSummary>;

  constructor() {
    this.videos = videoData.videos;
    this.lessonSummaries = this.buildLessonSummaries();
  }

  private buildLessonSummaries(): Map<number, LessonSummary> {
    const summaries = new Map<number, LessonSummary>();
    
    this.videos.forEach(video => {
      if (!summaries.has(video.lessonNumber)) {
        summaries.set(video.lessonNumber, {
          lessonNumber: video.lessonNumber,
          subtopicId: video.subtopicId,
          totalDuration: 0,
          videoCount: 0
        });
      }
      
      const summary = summaries.get(video.lessonNumber)!;
      summary.totalDuration += video.duration;
      summary.videoCount += 1;
    });

    return summaries;
  }

  getRelatedLessons(subtopicId: string, currentLessonNumber: number): LessonSummary[] {
    const relatedLessons = Array.from(this.lessonSummaries.values())
      .filter(summary => 
        summary.subtopicId === subtopicId && 
        summary.lessonNumber !== currentLessonNumber
      )
      .sort((a, b) => a.lessonNumber - b.lessonNumber);

    return relatedLessons.slice(0, 2); // Return at most 2 related lessons
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours} שעות ו-${remainingMinutes} דקות`;
    }
    return `${remainingMinutes} דקות`;
  }
}

export const videoService = new VideoService(); 