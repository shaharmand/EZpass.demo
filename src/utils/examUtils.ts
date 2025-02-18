import type { Exam } from '../types/exam';
import type { FormalExam } from '../types/shared/exam';

export const convertToFormalExam = (exam: Exam): FormalExam => {
  return {
    id: exam.id,
    title: exam.names.medium,
    description: `${exam.code} - ${exam.names.full}`,
    duration: 180, // Default duration in minutes
    totalQuestions: exam.topics.reduce((total, topic) => total + topic.subTopics.length, 0),
    status: 'not_started'
  };
}; 