import type { ExamData, TopicData } from '../types/exam';
import type { FormalExam, Topic, SubTopic } from '../types/shared/exam';
import { ExamType } from '../types/exam';

export const convertToFormalExam = (exam: ExamData): FormalExam => {
  return {
    id: exam.id,
    title: exam.names.short,
    description: `${exam.code} - ${exam.names.full}`,
    names: exam.names,
    duration: 180, // Default duration in minutes
    totalQuestions: exam.topics.reduce((total, topic) => total + topic.sub_topics.length, 0),
    examType: exam.exam_type === ExamType.BAGRUT ? 'bagrut' : 'mahat',
    status: 'not_started',
    topics: exam.topics.map((topic, index) => ({
      id: `${exam.id}_${topic.topic_id}`,
      name: topic.topic_id, // This will be enriched with subject data
      code: topic.topic_id, // Use topic_id as code for lookup
      topic_id: topic.topic_id, // Add the required topic_id field
      description: '', // This will be enriched with subject data
      order: index,
      subTopics: topic.sub_topics.map((subTopicId, subIndex) => ({
        id: `${exam.id}_${topic.topic_id}_${subTopicId}`,
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