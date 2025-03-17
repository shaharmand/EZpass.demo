import lessonData from '../../public/data/lesson_info.json';

interface Lesson {
  id: number;
  name: string;
  duration: string;
  durationMinutes: number;
  hasQuiz: boolean;
}

class LessonInfoService {
  private lessons: Map<number, Lesson>;

  constructor() {
    this.lessons = new Map(lessonData.lessons.map(lesson => [lesson.id, lesson]));
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
}

export const lessonInfoService = new LessonInfoService(); 