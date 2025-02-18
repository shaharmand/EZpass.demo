export type ExamNames = {
  short: string;
  medium: string;
  full: string;
};

export type SubTopic = string;

export type Topic = {
  topicId: string;
  subTopics: SubTopic[];
};

export type Exam = {
  id: string;
  code: string;
  names: ExamNames;
  exam_type: 'bagrut' | 'mahat';
  difficulty: number;
  programming_language: 'java' | 'c#' | 'python';
  topics: Topic[];
};

export type MahatExams = {
  faculty: string;
  exams: Exam[];
};

export type BagrutExams = {
  exams: Exam[];
}; 