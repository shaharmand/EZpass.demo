import subjectsDomains from '../../data/subjects/subjects_domains.json';
import cs_data_structures_hsp from '../../data/subjects/cs_data_structures_hsp.json';
import cs_programming_fundamentals_hsp from '../../data/subjects/cs_programming_fundamentals_hsp.json';
import construction_safety from '../../data/subjects/construction_safety.json';

import { logger } from '../utils/logger';
import { Topic, Subject, Domain, SubTopic } from '../types/subject';
import { TopicValidationResult } from '../types/validation';

class UniversalTopics {
  private subjects: Subject[] = [];
  private subjectsMap: Map<string, Subject> = new Map();
  private domainsMap: Map<string, { domain: Domain; subjectId: string }> = new Map();
  private topicsMap: Map<string, { topic: Topic; subjectId: string; domainId: string }> = new Map();
  private subtopicsMap: Map<string, { subtopic: SubTopic; topicId: string }> = new Map();

  constructor() {
    this.init();
    this.verifyStructure();
    this.logSubjectsAndDomains();
  }

  private init() {
    // First load all subjects and domains structure with full objects
    this.subjects = subjectsDomains.Subjects.map(subject => {
      const subjectObj: Subject = {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        description: subject.description || '',
        domains: subject.domains.map(domain => ({
          id: domain.id,
          code: domain.code,
          name: domain.name,
          description: domain.description || '',
          topics: [],
          subjects: []
        }))
      };

      // Build lookup maps
      this.subjectsMap.set(subject.id, subjectObj);
      subjectObj.domains.forEach(domain => {
        this.domainsMap.set(domain.id, { domain, subjectId: subject.id });
      });

      return subjectObj;
    });

    // Log initial structure after loading subjects_domains.json
    logger.info('Initial subjects and domains loaded:', {
      subjectsCount: this.subjects.length,
      subjects: this.subjects.map(s => ({
        id: s.id,
        name: s.name,
        domainsCount: s.domains.length,
        domains: s.domains.map(d => ({
          id: d.id,
          name: d.name
        }))
      }))
    }, 'UniversalTopics');

    // Load domain data files
    logger.info('Loading domain data files...', null, 'UniversalTopics');

    // Load each domain file
    const domainFiles = [
      { data: construction_safety, name: 'construction_safety' },
      { data: cs_data_structures_hsp, name: 'cs_data_structures_hsp' },
      { data: cs_programming_fundamentals_hsp, name: 'cs_programming_fundamentals_hsp' }
    ];

    domainFiles.forEach(({ data, name }) => {
      try {
        logger.info(`Loading domain file: ${name}`, null, 'UniversalTopics');
        this.loadDomainDataFile(data);
      } catch (error) {
        logger.error(`Error loading domain file ${name}:`, error, 'UniversalTopics');
      }
    });

    // Log complete final structure with detailed counts
    logger.info('COMPLETE HIERARCHY LOADED:', {
      totalSubjects: this.subjects.length,
      totalDomains: this.domainsMap.size,
      totalTopics: this.topicsMap.size,
      totalSubtopics: this.subtopicsMap.size,
      subjectsDetail: this.subjects.map(subject => ({
        subjectId: subject.id,
        subjectName: subject.name,
        domains: subject.domains.map(domain => ({
          domainId: domain.id,
          domainName: domain.name,
          topics: domain.topics.map(topic => ({
            topicId: topic.id,
            topicName: topic.name,
            subtopicsCount: topic.subTopics.length,
            subtopics: topic.subTopics.map(st => ({
              id: st.id,
              name: st.name
            }))
          }))
        }))
      }))
    }, 'UniversalTopics');

    // Log validation maps
    logger.info('Validation Maps Status:', {
      subjectsInMap: Array.from(this.subjectsMap.keys()),
      domainsInMap: Array.from(this.domainsMap.keys()),
      topicsInMap: Array.from(this.topicsMap.keys()),
      subtopicsInMap: Array.from(this.subtopicsMap.keys())
    }, 'UniversalTopics');
  }

  private verifyStructure() {
    logger.info('Verifying structure integrity', {
      subjectsCount: this.subjects.length,
      domainsMapSize: this.domainsMap.size,
      topicsMapSize: this.topicsMap.size,
      subtopicsMapSize: this.subtopicsMap.size,
      sample: {
        constructionSafety: {
          domain: this.domainsMap.get('construction_safety'),
          topics: Array.from(this.topicsMap.entries())
            .filter(([_, info]) => info.domainId === 'construction_safety')
            .map(([id]) => id)
        }
      }
    }, 'UniversalTopics');
  }

  private logValidationPaths() {
    this.subjects.forEach(subject => {
      subject.domains.forEach(domain => {
        domain.topics.forEach(topic => {
          logger.debug(`Validation path: ${subject.id} -> ${domain.id} -> ${topic.id}`, {
            subjectName: subject.name,
            domainName: domain.name,
            topicName: topic.name,
            subTopics: topic.subTopics.map(st => st.id)
          });
        });
      });
    });
  }

  private logSubjectsAndDomains() {
    logger.info('🔍 Detailed Information', null, 'UniversalTopics');
    
    // Log subjects with detailed domain information
    logger.info('📚 Subjects', null, 'UniversalTopics');
    
    this.subjects.forEach(subject => {
      logger.info(`Subject: ${subject.name} (${subject.id})`, null, 'UniversalTopics');
      
      // For each domain in the subject
      subject.domains.forEach(domain => {
        const topicsCount = domain.topics.length;
        const subtopicsCount = domain.topics.reduce((sum, topic) => sum + topic.subTopics.length, 0);
        
        logger.info(`Domain: ${domain.name} (${domain.id})`, {
          topicsCount,
          topics: domain.topics.map(t => ({
            name: t.name,
            id: t.id,
            subtopicsCount: t.subTopics.length,
            subtopics: t.subTopics.map(st => ({
              name: st.name,
              id: st.id
            }))
          }))
        }, 'UniversalTopics');
      });
    });

    // Log domains summary with counts
    logger.info('🏷️ Domains Summary', {
      totalDomains: this.domainsMap.size,
      domainDetails: Array.from(this.domainsMap.entries()).map(([domainId, info]) => {
        const domain = info.domain;
        const topicsCount = domain.topics.length;
        const subtopicsCount = domain.topics.reduce((sum, topic) => sum + topic.subTopics.length, 0);
        return {
          domainId,
          domainName: domain.name,
          subjectId: info.subjectId,
          topicsCount,
          subtopicsCount,
          totalItems: topicsCount + subtopicsCount
        };
      })
    }, 'UniversalTopics');
  }

  private loadDomainDataFile(domainData: any) {
    // Normalize ID fields to handle case sensitivity
    const domainId = domainData.domainID || domainData.domainId;
    const subjectId = domainData.subjectID || domainData.subjectId;

    // Validate domain data has required fields
    if (!domainId || !subjectId) {
      logger.error('Invalid domain data file', { domainData }, 'domain loading');
      throw new Error(`Invalid domain data file - missing domain or subject ID`);
    }

    const domainInfo = this.domainsMap.get(domainId);
    if (!domainInfo) {
      logger.error('Domain not found when loading domain data', { 
        domainId,
        subjectId,
        availableDomains: Array.from(this.domainsMap.keys())
      }, 'domain loading');
      throw new Error(`Domain ${domainId} not found`);
    }

    const { domain } = domainInfo;
    
    // Clear existing topics to prevent duplicates
    domain.topics = [];

    // Process topics
    if (Array.isArray(domainData.topics)) {
      domainData.topics.forEach((topicData: any) => {
        if (!topicData.id || !topicData.name) {
          logger.error('Invalid topic data', { topicData }, 'topic loading');
          throw new Error(`Invalid topic data in domain ${domainId} - missing required fields`);
        }

        const topic: Topic = {
          id: topicData.id,
          name: topicData.name,
          description: topicData.description || '',
          order: topicData.order || 0,
          subTopics: []
        };

        // Process subtopics
        if (Array.isArray(topicData.subTopics)) {
          topic.subTopics = topicData.subTopics.map((st: any) => {
            const subtopic: SubTopic = {
              id: st.id,
              name: st.name,
              description: st.description || '',
              questionTemplate: st.questionTemplate || '',
              order: st.order || 0
            };
            this.subtopicsMap.set(st.id, { subtopic, topicId: topic.id });
            return subtopic;
          });
        }

        // Add to maps
        this.topicsMap.set(topic.id, { 
          topic, 
          subjectId, 
          domainId 
        });
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
    const subtopicInfo = this.subtopicsMap.get(subtopicId);
    if (subtopicInfo?.topicId === topicId) {
      return subtopicInfo.subtopic;
    }
    return undefined;
  }

  /**
   * Gets full topic information including name, description, and subtopics
   */
  getTopic(topicId: string): Topic | undefined {
    return this.topicsMap.get(topicId)?.topic;
  }

  /**
   * Gets the subject that contains a specific topic
   */
  getSubjectForTopic(topicId: string): Subject | undefined {
    const topicInfo = this.topicsMap.get(topicId);
    if (topicInfo) {
      return this.subjectsMap.get(topicInfo.subjectId);
    }
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

  // Validation helpers using maps
  isValidSubject(subjectId: string): boolean {
    const exists = this.subjectsMap.has(subjectId);
    logger.debug('Subject validation', {
      subjectId,
      exists,
      availableSubjects: Array.from(this.subjectsMap.keys())
    }, 'UniversalTopics');
    return exists;
  }

  isValidDomainForSubject(subjectId: string, domainId: string): boolean {
    // Add detailed debug logging
    logger.info('Starting domain validation for subject', {
      input: {
        subjectId,
        domainId
      },
      availableSubjects: Array.from(this.subjectsMap.keys()),
      availableDomains: Array.from(this.domainsMap.entries()).map(([id, info]) => ({
        id,
        subjectId: info.subjectId,
        name: info.domain.name
      })),
      subjectDetails: this.subjectsMap.get(subjectId) ? {
        name: this.subjectsMap.get(subjectId)?.name,
        domains: this.subjectsMap.get(subjectId)?.domains.map(d => ({
          id: d.id,
          name: d.name
        }))
      } : 'Subject not found',
      domainDetails: this.domainsMap.get(domainId) ? {
        name: this.domainsMap.get(domainId)?.domain.name,
        subjectId: this.domainsMap.get(domainId)?.subjectId
      } : 'Domain not found'
    }, 'UniversalTopics');

    // 1. First check if subject exists
    const subject = this.subjectsMap.get(subjectId);
    if (!subject) {
      logger.warn('Subject not found during domain validation', { 
        subjectId,
        availableSubjects: Array.from(this.subjectsMap.keys())
      }, 'UniversalTopics');
      return false;
    }

    // 2. Check if domain exists in the domains map
    const domainInfo = this.domainsMap.get(domainId);
    if (!domainInfo) {
      logger.warn('Domain not found during validation', { 
        domainId,
        availableDomains: Array.from(this.domainsMap.keys())
      }, 'UniversalTopics');
      return false;
    }

    // 3. Check if this domain belongs to this subject by checking the stored subjectId
    const belongsToSubject = domainInfo.subjectId === subjectId;

    logger.info('Domain validation result', {
      isValid: belongsToSubject,
      subjectId,
      domainId,
      foundDomainSubjectId: domainInfo.subjectId,
      domainName: domainInfo.domain.name,
      subjectName: subject.name,
      subjectDomains: subject.domains.map(d => ({
        id: d.id,
        name: d.name
      })),
      comparison: {
        domainSubjectId: domainInfo.subjectId,
        requestedSubjectId: subjectId,
        match: domainInfo.subjectId === subjectId
      }
    }, 'UniversalTopics');

    return belongsToSubject;
  }

  isValidTopicForDomain(subjectId: string, domainId: string, topicId: string): TopicValidationResult {
    const subject = this.getAllSubjects().find(s => s.id === subjectId);
    if (!subject) {
      return { 
        isValid: false, 
        error: `נושא רחב לא קיים: ${subjectId}` 
      };
    }

    const domain = subject.domains.find(d => d.id === domainId);
    if (!domain) {
      return { 
        isValid: false, 
        error: `תחום לא קיים: ${domainId}`,
        details: {
          subjectName: subject.name
        }
      };
    }

    const topic = domain.topics?.find(t => t.id === topicId);
    if (!topic) {
      return { 
        isValid: false, 
        error: `נושא לא קיים בתחום: ${topicId}`,
        details: {
          subjectName: subject.name,
          domainName: domain.name
        }
      };
    }

    return { isValid: true };
  }

  isValidSubtopicForTopic(subjectId: string, domainId: string, topicId: string, subtopicId: string): TopicValidationResult {
    const topicValidation = this.isValidTopicForDomain(subjectId, domainId, topicId);
    if (!topicValidation.isValid) {
      return topicValidation;
    }

    const subject = this.getAllSubjects().find(s => s.id === subjectId)!;
    const domain = subject.domains.find(d => d.id === domainId)!;
    const topic = domain.topics?.find(t => t.id === topicId)!;

    const subtopic = topic.subTopics?.find(st => st.id === subtopicId);
    if (!subtopic) {
      return { 
        isValid: false, 
        error: `תת-נושא לא קיים בנושא: ${subtopicId}`,
        details: {
          subjectName: subject.name,
          domainName: domain.name,
          topicName: topic.name
        }
      };
    }

    return { isValid: true };
  }

  public validateTopicHierarchy(data: {
    subjectId: string;
    domainId: string;
    topicId: string;
    subtopicId?: string;
  }): { isValid: boolean; error?: string } {
    logger.info('🔍 Validating topic hierarchy:', data, 'UniversalTopics');

    // Validate subject
    if (!this.isValidSubject(data.subjectId)) {
      logger.info('❌ Invalid subject:', { subjectId: data.subjectId }, 'UniversalTopics');
      return { isValid: false, error: "נושא רחב לא קיים במערכת" };
    }

    // Validate domain under subject
    if (!this.isValidDomainForSubject(data.subjectId, data.domainId)) {
      logger.info('❌ Invalid domain:', { 
        subjectId: data.subjectId, 
        domainId: data.domainId 
      }, 'UniversalTopics');
      return { isValid: false, error: "תחום לא קיים בנושא הרחב שנבחר" };
    }

    // Validate topic under domain
    const topicValidation = this.isValidTopicForDomain(data.subjectId, data.domainId, data.topicId);
    if (!topicValidation.isValid) {
      logger.info('❌ Invalid topic:', { 
        subjectId: data.subjectId, 
        domainId: data.domainId,
        topicId: data.topicId 
      }, 'UniversalTopics');
      return { isValid: false, error: topicValidation.error };
    }

    // Validate subtopic under topic (if provided)
    if (data.subtopicId && !this.isValidSubtopicForTopic(
      data.subjectId,
      data.domainId,
      data.topicId,
      data.subtopicId
    )) {
      logger.info('❌ Invalid subtopic:', { 
        subjectId: data.subjectId, 
        domainId: data.domainId,
        topicId: data.topicId,
        subtopicId: data.subtopicId 
      }, 'UniversalTopics');
      return { isValid: false, error: "תת-נושא לא קיים בנושא שנבחר" };
    }

    logger.info('✅ Topic hierarchy is valid:', data, 'UniversalTopics');
    return { isValid: true };
  }

  getTopicSafe(subjectId: string, domainId: string, topicId: string): Topic | null {
    const domain = universalTopicsV2.getDomainSafe(subjectId, domainId);
    const topic = domain?.topics.find(t => t.id === topicId);
    return topic || null;
  }
}

export const universalTopicsV2 = {
  getSubjectSafe: (subjectId: string): Subject | null => {
    return universalTopics.getAllSubjects().find(s => s.id === subjectId) || null;
  },

  getDomainSafe: (subjectId: string, domainId: string): Domain | null => {
    const subject = universalTopicsV2.getSubjectSafe(subjectId);
    return subject?.domains.find(d => d.id === domainId) || null;
  },

  getTopicSafe: (subjectId: string, domainId: string, topicId: string): Topic | null => {
    const domain = universalTopicsV2.getDomainSafe(subjectId, domainId);
    const topic = domain?.topics.find(t => t.id === topicId);
    return topic || null;
  },

  getSubTopicSafe: (subjectId: string, domainId: string, topicId: string, subtopicId: string): SubTopic | null => {
    const topic = universalTopicsV2.getTopicSafe(subjectId, domainId, topicId);
    return topic?.subTopics?.find(st => st.id === subtopicId) || null;
  },

  debugTopicValidation: (subjectId: string, domainId: string, topicId: string): void => {
    logger.info('🔍 DEBUG TOPIC VALIDATION', { 
      subjectId, 
      domainId, 
      topicId 
    }, 'validation');
    
    // Check subject
    const subject = universalTopicsV2.getSubjectSafe(subjectId);
    logger.info('Subject check result', { 
      subjectId,
      exists: !!subject,
      subjectDetails: subject ? { id: subject.id, name: subject.name } : 'Subject not found',
      availableSubjects: universalTopics.getAllSubjects().map(s => ({ id: s.id, name: s.name }))
    }, 'validation');
    
    // Check domain
    const domain = universalTopicsV2.getDomainSafe(subjectId, domainId);
    logger.info('Domain check result', { 
      domainId,
      exists: !!domain,
      domainDetails: domain ? { id: domain.id, name: domain.name } : 'Domain not found',
      availableDomains: subject?.domains.map(d => ({ id: d.id, name: d.name })) || []
    }, 'validation');
    
    // Check topic
    const topic = universalTopicsV2.getTopicSafe(subjectId, domainId, topicId);
    logger.info('Topic check result', { 
      topicId,
      exists: !!topic,
      topicDetails: topic ? { id: topic.id, name: topic.name } : 'Topic not found',
      availableTopics: domain?.topics.map(t => ({ id: t.id, name: t.name })) || []
    }, 'validation');
    
    logger.info('🔍 DEBUG TOPIC VALIDATION COMPLETE', { 
      subjectId, 
      domainId, 
      topicId,
      result: {
        subjectExists: !!subject,
        domainExists: !!domain,
        topicExists: !!topic
      }
    }, 'validation');
  },

  getFullName: (path: {
    subjectId?: string;
    domainId?: string;
    topicId?: string;
    subtopicId?: string;
  }): string => {
    const { subjectId, domainId, topicId, subtopicId } = path;
    const parts: string[] = [];

    if (subjectId) {
      const subject = universalTopicsV2.getSubjectSafe(subjectId);
      if (subject) parts.push(subject.name);

      if (domainId) {
        const domain = universalTopicsV2.getDomainSafe(subjectId, domainId);
        if (domain) parts.push(domain.name);

        if (topicId) {
          const topic = universalTopicsV2.getTopicSafe(subjectId, domainId, topicId);
          if (topic) parts.push(topic.name);

          if (subtopicId) {
            const subtopic = universalTopicsV2.getSubTopicSafe(subjectId, domainId, topicId, subtopicId);
            if (subtopic) parts.push(subtopic.name);
          }
        }
      }
    }

    return parts.join(' › ') || 'לא נמצא';
  },

  validatePath: (path: {
    subjectId?: string;
    domainId?: string;
    topicId?: string;
    subtopicId?: string;
  }): { isValid: boolean; error?: string } => {
    const { subjectId, domainId, topicId, subtopicId } = path;

    if (subjectId && !universalTopicsV2.getSubjectSafe(subjectId)) {
      return { isValid: false, error: `נושא ראשי לא קיים: ${subjectId}` };
    }

    if (domainId && !universalTopicsV2.getDomainSafe(subjectId!, domainId)) {
      return { isValid: false, error: `תחום לא קיים: ${domainId} בנושא ${subjectId}` };
    }

    if (topicId && !universalTopicsV2.getTopicSafe(subjectId!, domainId!, topicId)) {
      return { isValid: false, error: `נושא לא קיים: ${topicId} בתחום ${domainId}` };
    }

    if (subtopicId && !universalTopicsV2.getSubTopicSafe(subjectId!, domainId!, topicId!, subtopicId)) {
      return { isValid: false, error: `תת-נושא לא קיים: ${subtopicId} בנושא ${topicId}` };
    }

    return { isValid: true };
  }
};

export const universalTopics = new UniversalTopics(); 