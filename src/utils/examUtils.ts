import type { ExamData } from '../types/exam';
import type { FormalExam, Topic, SubTopic } from '../types/shared/exam';
import { ExamType } from '../types/exam';

export const convertToFormalExam = (exam: ExamData): FormalExam => {
  return {
    id: exam.id,
    title: exam.names.short,
    description: `${exam.code} - ${exam.names.full}`,
    names: exam.names,
    duration: 180, // Default duration in minutes
    totalQuestions: exam.topics.reduce((total, topic) => total + topic.subTopics.length, 0),
    examType: exam.exam_type === ExamType.BAGRUT ? 'bagrut' : 'mahat',
    status: 'not_started',
    topics: exam.topics.map((topic, index) => ({
      id: `${exam.id}_${topic.topicId}`,
      name: topic.topicId, // This will be enriched with subject data
      code: topic.topicId, // Use topicId as code for lookup
      topicId: topic.topicId, // Add the required topicId field
      description: '', // This will be enriched with subject data
      order: index,
      subTopics: topic.subTopics.map((subTopicId, subIndex) => ({
        id: `${exam.id}_${topic.topicId}_${subTopicId}`,
        code: subTopicId,
        name: subTopicId, // This will be enriched with subject data
        description: '', // This will be enriched with subject data
        order: subIndex
      }))
    }))
  };
};

export const startQuickPractice = (
  exam: FormalExam,
  setActivePrep: (prep: any) => void,
  navigate: (path: string) => void
) => {
  // Create a new prep instance with all topics
  const prepId = `prep_${exam.id}_${Date.now()}`;
  const prep = {
    id: prepId,
    exam,
    selectedTopics: exam.topics?.flatMap(topic => topic.subTopics.map(st => st.code)) || [],
    status: 'not_started' as const,
    startTime: Date.now(),
  };
  
  // Set active prep and navigate to practice page
  setActivePrep(prep);
  navigate(`/practice/${prepId}`);
}; 