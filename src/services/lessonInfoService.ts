import lessonData from '../data/course/CIV-SAF/content/lesson_info.json';

interface Lesson {
  id: number;
  name: string;
  duration: string;
  durationMinutes: number;
  hasQuiz: boolean;
}

interface Topic {
  id: string;
  title: string;
  lessons: number[];
}

interface LessonData {
  topics: Topic[];
  lessons: Lesson[];
}

class LessonInfoService {
  private lessons: Map<number, Lesson>;
  private topics: Map<string, { title: string; lessons: number[] }>;

  constructor() {
    const data = lessonData as LessonData;
    
    // Initialize lessons map
    this.lessons = new Map(data.lessons.map((lesson: Lesson) => [lesson.id, lesson]));
    
    // Initialize topics map
    this.topics = new Map(data.topics.map((topic: Topic) => [topic.id, {
      title: topic.title,
      lessons: topic.lessons
    }]));
  }

  getLessonName(lessonId: number | undefined): string {
    if (lessonId === undefined) {
      return 'שיעור לא ידוע';
    }
    const lesson = this.lessons.get(lessonId);
    return lesson ? lesson.name : `שיעור ${lessonId}`;
  }

  getLessonInfo(lessonId: number | undefined): Lesson | null {
    if (lessonId === undefined) {
      return null;
    }
    return this.lessons.get(lessonId) || null;
  }

  getTopicInfo(topicId: string): { title: string; lessons: number[] } | null {
    return this.topics.get(topicId) || null;
  }

  getTopicTitle(topicId: string): string {
    return this.topics.get(topicId)?.title || 'נושא לא ידוע';
  }

  getTopicLessons(topicId: string): number[] {
    return this.topics.get(topicId)?.lessons || [];
  }
}

export const lessonInfoService = new LessonInfoService(); 