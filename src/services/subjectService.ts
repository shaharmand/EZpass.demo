import constructionSafety from '../../data/subjects/construction_safety.json';
import csDataStructures from '../../data/subjects/cs_data_structures.json';
import csProgrammingFundamentals from '../../data/subjects/cs_programming_fundamentals.json';
import { logger } from '../utils/logger';

interface TopicInfo {
  name: string;
  description?: string;
  subtopics?: Record<string, {
    name: string;
    description: string;
  }>;
}

interface SubjectInfo {
  id: string;
  name: string;
  topics: Record<string, TopicInfo>;
}

/**
 * Transforms the raw JSON subject data into our SubjectInfo format
 */
function transformSubjectData(rawData: any): SubjectInfo {
  // Convert topics array to Record
  const topics: Record<string, TopicInfo> = {};
  
  // Handle both array and object formats
  const topicsArray = Array.isArray(rawData.topics) ? rawData.topics : Object.values(rawData.topics);
  
  for (const topic of topicsArray) {
    // Convert subtopics array to Record if it exists
    const subtopics: Record<string, { name: string; description: string }> = {};
    if (Array.isArray(topic.subTopics)) {
      for (const subtopic of topic.subTopics) {
        subtopics[subtopic.id] = {
          name: subtopic.name,
          description: subtopic.description
        };
      }
    }

    topics[topic.id] = {
      name: topic.name,
      description: topic.description,
      subtopics: Object.keys(subtopics).length > 0 ? subtopics : undefined
    };
  }

  return {
    id: rawData.id,
    name: rawData.name,
    topics
  };
}

class SubjectService {
  private subjectMap: Record<string, SubjectInfo> = {
    construction_safety: transformSubjectData(constructionSafety),
    cs_data_structures: transformSubjectData(csDataStructures),
    cs_programming_fundamentals: transformSubjectData(csProgrammingFundamentals)
  };

  /**
   * Gets the most specific topic name available (subtopic if exists, otherwise topic)
   */
  getMostSpecificTopicName(topicId: string, subtopicId?: string): string {
    const topic = this.getTopicInfo(topicId);
    if (!topic) {
      logger.warn('Topic not found, returning ID', { topicId });
      return topicId;
    }

    if (subtopicId && topic.subtopics?.[subtopicId]) {
      return topic.subtopics[subtopicId].name;
    }

    return topic.name;
  }

  /**
   * Gets the translated name for a topic
   */
  getTopicName(topicId: string): string {
    for (const subject of Object.values(this.subjectMap)) {
      if (subject.topics[topicId]) {
        return subject.topics[topicId].name;
      }
    }
    
    logger.warn('Topic not found, returning ID', { topicId });
    return topicId;
  }

  /**
   * Gets subtopic information if it exists
   */
  getSubtopicInfo(topicId: string, subtopicId: string): { name: string; description: string } | null {
    const topic = this.getTopicInfo(topicId);
    if (!topic) return null;

    const subtopic = topic.subtopics?.[subtopicId];
    if (!subtopic) {
      logger.warn('Subtopic not found', { topicId, subtopicId });
      return null;
    }

    return subtopic;
  }

  /**
   * Gets full topic information including name, description, and subtopics
   */
  getTopicInfo(topicId: string): TopicInfo | null {
    for (const subject of Object.values(this.subjectMap)) {
      const topic = subject.topics[topicId];
      if (topic) {
        return topic;
      }
    }
    
    logger.warn('Topic not found', { topicId });
    return null;
  }

  /**
   * Gets the subject that contains a specific topic
   */
  getSubjectForTopic(topicId: string): SubjectInfo | null {
    for (const subject of Object.values(this.subjectMap)) {
      if (subject.topics[topicId]) {
        return subject;
      }
    }
    
    logger.warn('Subject not found for topic', { topicId });
    return null;
  }

  /**
   * Gets just the subject name for a topic
   */
  getSubjectName(topicId: string): string {
    const subject = this.getSubjectForTopic(topicId);
    return subject?.name || topicId;
  }

  /**
   * Gets all available subjects
   */
  getAllSubjects(): SubjectInfo[] {
    return Object.values(this.subjectMap);
  }

  /**
   * Gets all topics for a subject
   */
  getTopicsForSubject(subjectId: string): Array<TopicInfo & { id: string }> {
    const subject = this.subjectMap[subjectId];
    if (!subject) return [];
    
    return Object.entries(subject.topics).map(([id, topic]) => ({
      ...topic,
      id
    }));
  }

  /**
   * Gets all subtopics for a topic
   */
  getSubtopicsForTopic(topicId: string): Array<{ id: string; name: string; description: string }> {
    const topic = this.getTopicInfo(topicId);
    if (!topic?.subtopics) return [];
    
    return Object.entries(topic.subtopics).map(([id, subtopic]) => ({
      ...subtopic,
      id
    }));
  }
}

export const subjectService = new SubjectService(); 