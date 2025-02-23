import subjectsDomains from '../../data/subjects/subjects_domains.json';
import cs_data_structures_hsp from '../../data/subjects/cs_data_structures_hsp.json';
import cs_programming_fundamentals_hsp from '../../data/subjects/cs_programming_fundamentals_hsp.json';
import construction_safety from '../../data/subjects/construction_safety.json';

import { logger } from '../utils/logger';
import { Topic, Subject, Domain, SubTopic } from '../types/subject';

class UniversalTopics {
  private subjects: Subject[] = [];

  constructor() {
    this.init();
    this.logSubjectsAndDomains();
  }

  private init() {
    // First load all subjects and domains structure
    this.subjects = subjectsDomains.Subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      description: subject.description || '',
      domains: subject.domains.map(domain => ({
        id: domain.id,
        name: domain.name,
        description: domain.description || '',
        topics: [],
        subjects: []
      }))
    }));
    this.loadDomainDataFile(cs_data_structures_hsp);
    this.loadDomainDataFile(cs_programming_fundamentals_hsp);
    this.loadDomainDataFile(construction_safety);

    // Log the initialization summary
    logger.info(`Initialized UniversalTopics with ${this.subjects.length} subjects`);
  }

  private logSubjectsAndDomains() {
    const summary = this.subjects.map(subject => {
      const domainIds = subject.domains.map(d => d.id).join(', ');
      return `${subject.id}: ${domainIds}`;
    }).join('\n');
    
    logger.info('Loaded Subjects and Domains:', {
      subjectsAndDomains: summary
    });
  }

  private loadDomainDataFile(domainData: any) {
    // Validate domain data has required fields
    if (!domainData.domainID || !domainData.subjectID) {
      throw new Error(`Invalid domain data file - missing domain or subject ID`);
    }

      // Find the subject and domain in our collection
      const subject = this.subjects.find(s => s.id === domainData.subjectID);
      if (!subject) {
        throw new Error(`Subject ${domainData.subjectID} not found`);
      }

      const domain = subject.domains.find(d => d.id === domainData.domainID);
      if (!domain) {
        throw new Error(`Domain ${domainData.domainID} not found in subject ${domainData.subjectID}`);
      }

      // Process topics
      if (Array.isArray(domainData.topics)) {
        domainData.topics.forEach((topicData: any) => {
          if (!topicData.id || !topicData.name) {
            throw new Error(`Invalid topic data in domain ${domainData.domain} - missing required fields`);
          }

          const topic: Topic = {
            id: topicData.id,
            name: topicData.name,
            description: topicData.description || '',
            order: topicData.order || 0,
            subTopics: (topicData.subTopics || []).map((st: any) => ({
              id: st.id,
              name: st.name,
              description: st.description || '',
              questionTemplate: st.questionTemplate || ''
            }))
          };

          domain.topics.push(topic);
        });
      }
    }

  /**
   * Validates that a topic ID and optional subtopic ID reference valid universal topics
   * @throws Error if topic ID or subtopic ID is invalid or not found
   */
  validateTopicReference(topicId: string, subtopicId?: string): void {
    if (!topicId) {
      throw new Error('Topic ID is required');
    }

    const topic = this.getTopic(topicId);
    if (!topic) {
      throw new Error(`Invalid topic ID: ${topicId} - Topic not found in universal topics`);
    }

    if (subtopicId) {
      const subtopic = topic.subTopics.find(st => st.id === subtopicId);
      if (!subtopic) {
        throw new Error(`Invalid subtopic ID: ${subtopicId} - Subtopic not found in topic ${topicId}`);
      }
      logger.debug('Topic and subtopic references validated successfully', { topicId, subtopicId });
    } else {
      logger.debug('Topic reference validated successfully', { topicId });
    }
  }

  /**
   * Gets the most specific topic name available (subtopic if exists, otherwise topic)
   */
  getMostSpecificTopicName(topicId: string, subtopicId?: string): string {
    const topic = this.getTopic(topicId);
    if (!topic) {
      logger.warn('Topic not found, returning ID', { topicId });
      return subtopicId || topicId;
    }

    if (subtopicId) {
      const subtopic = topic.subTopics.find(st => st.id === subtopicId);
      if (subtopic) {
        return subtopic.name;
      }
    }

    return topic.name;
  }

  /**
   * Gets the translated name for a topic
   */
  getTopicName(topicId: string): string {
    for (const subject of this.subjects) {
      for (const domain of subject.domains) {
        const topic = domain.topics.find(t => t.id === topicId);
        if (topic) {
          return topic.name;
        }
      }
    }
    
    logger.warn('Topic not found, returning ID', { topicId });
    return topicId;
  }

  /**
   * Gets subtopic information if it exists
   */
  getSubtopicInfo(topicId: string, subtopicId: string): SubTopic | undefined {
    const topic = this.getTopic(topicId);
    if (!topic) return undefined;

    const subtopic = topic.subTopics.find((st: SubTopic) => st.id === subtopicId);
    if (!subtopic) {
      logger.warn('Subtopic not found', { topicId, subtopicId });
      return undefined;
    }

    return subtopic;
  }

  /**
   * Gets full topic information including name, description, and subtopics
   */
  getTopic(topicId: string): Topic | undefined {
    for (const subject of this.subjects) {
      for (const domain of subject.domains) {
        const topic = domain.topics.find((t: Topic) => t.id === topicId);
        if (topic) {
          return topic;
        }
      }
    }
    
    logger.warn('Topic not found', { topicId });
    return undefined;
  }
  /**
   * Gets the subject that contains a specific topic
   */
  getSubjectForTopic(topicId: string): Subject | undefined {
    for (const subject of this.subjects) {
      for (const domain of subject.domains) {
        const topic = domain.topics.find(t => t.id === topicId);
        if (topic) {
          return subject;
        }
      }
    }
    
    logger.warn('Subject not found for topic', { topicId });
    return undefined;
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
  getAllSubjects(): Subject[] {
    return this.subjects;
  }

  /**
   * Gets all topics for a subject
   */
  getTopicsForSubject(subjectId: string): Topic[] {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (!subject) return [];
    return subject.domains.flatMap(domain => domain.topics);
  }

  /**
   * Gets all subtopics for a topic
   */
  getSubtopicsForTopic(topicId: string): SubTopic[] {
    const topic = this.getTopic(topicId);
    return topic?.subTopics || [];
  }

  /**
   * Gets topic data without children (subTopics)
   */
  getTopicData(topicId: string): Omit<Topic, 'subTopics'> {
    const topic = this.getTopic(topicId);
    if (!topic) {
      throw new Error(`Invalid topic ID: ${topicId}`);
    }

    const { subTopics, ...topicData } = topic;
    return topicData;
  }

  /**
   * Gets subtopic data for a given subtopic ID within a topic
   */
  getSubTopicData(topicId: string, subTopicId: string): SubTopic {
    const topic = this.getTopic(topicId);
    if (!topic) {
      throw new Error(`Invalid topic ID: ${topicId}`);
    }

    const subTopic = topic.subTopics.find(st => st.id === subTopicId);
    if (!subTopic) {
      throw new Error(`Invalid subtopic ID: ${subTopicId} for topic: ${topicId}`);
    }

    return subTopic;
  }

  /**
   * Enriches a topic with universal data
   */
  private enrichTopicStructure(topic: Topic): Topic {
    const universalTopic = this.getTopic(topic.id);
    if (!universalTopic) {
      return topic;
    }
    const { subTopics: _, ...universalData } = universalTopic;
    return {
      ...topic,
      ...universalData
    };
  }

  /**
   * Enriches a subtopic with universal data
   */
  private enrichSubTopicStructure(topicId: string, subTopic: SubTopic): SubTopic {
    const universalSubTopic = this.getSubTopicData(topicId, subTopic.id);
    if (!universalSubTopic) {
      return subTopic;
    }
    return {
      ...subTopic,
      ...universalSubTopic
    };
  }

  /**
   * Enriches an array of topics with universal data
   */
  enrichTopicsArray(topics: Topic[]): Topic[] {
    return topics.map(topic => {
      // First enrich the topic itself
      const enrichedTopic = this.enrichTopicStructure(topic);

      // Then enrich each subtopic
      const enrichedSubTopics = enrichedTopic.subTopics.map(subTopic => 
        this.enrichSubTopicStructure(enrichedTopic.id, subTopic)
      );

      // Return topic with enriched subtopics
      return {
        ...enrichedTopic,
        subTopics: enrichedSubTopics
      };
    });
  }
}

export const universalTopics = new UniversalTopics(); 