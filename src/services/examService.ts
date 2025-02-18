import { 
  ExamType,
  type ExamData, 
  type BagrutExams, 
  type MahatExams,
  type TopicData
} from '../types/exam';
import type { 
  FormalExam,
  ExamSession,
  Topic,
  SubTopic
} from '../types/shared/exam';
import { validateExamData } from '../schemas/exam';

// Import exam data directly
import bagrutCS from 'data/exams/bagrut_cs.json';
import mahatCS from 'data/exams/mahat_cs.json';
import csProgrammingFundamentals from 'data/subjects/cs_programming_fundamentals.json';
import csDataStructures from 'data/subjects/cs_data_structures.json';

// Transform JSON data to match our types
function transformTopic(topic: { topicId?: string; subTopics?: string[]; topic_id?: string; sub_topics?: string[] }): TopicData {
  // Normalize topic data to use consistent property names
  const normalizedTopicId = topic.topic_id || topic.topicId;
  const normalizedSubTopics = topic.sub_topics || topic.subTopics;

  if (!normalizedTopicId) {
    throw new Error('Topic is missing required topic_id/topicId field');
  }

  if (!Array.isArray(normalizedSubTopics)) {
    throw new Error(`Topic ${normalizedTopicId} is missing required sub_topics/subTopics array`);
  }

  return {
    topic_id: normalizedTopicId,
    sub_topics: normalizedSubTopics
  };
}

/**
 * Validates that all topics in an exam exist in subject files and returns only valid topics
 * @throws Error if no valid topics remain
 * @returns Array of validated topics
 */
function validateExamTopics(exam: { id: string; topics: any[] }): any[] {
  if (!exam.topics || !Array.isArray(exam.topics)) {
    throw new Error(`Exam ${exam.id} is missing required topics array`);
  }

  // Filter and validate topics
  const validTopics = exam.topics.filter(topic => {
    const topicId = topic.topic_id || topic.topicId;
    if (!topicId) {
      console.error(`Exam ${exam.id} contains a topic missing topic_id/topicId - skipping`);
      return false;
    }

    // Find the subject file containing this topic
    let subjectData;
    if (csProgrammingFundamentals.topics.some(t => t.id === topicId)) {
      subjectData = csProgrammingFundamentals;
    } else if (csDataStructures.topics.some(t => t.id === topicId)) {
      subjectData = csDataStructures;
    } else {
      console.error(
        `Exam ${exam.id} references topic "${topicId}" which does not exist in any subject file - skipping`
      );
      return false;
    }

    const topicDef = subjectData.topics.find(t => t.id === topicId);
    if (!topicDef) {
      console.error(`Could not find topic ${topicId} in its subject file - skipping`);
      return false;
    }

    const subTopics = topic.sub_topics || topic.subTopics;
    if (!Array.isArray(subTopics)) {
      console.error(`Topic ${topicId} in exam ${exam.id} is missing sub_topics/subTopics array - skipping`);
      return false;
    }

    // Validate and filter subtopics
    const validSubTopicIds = new Set(topicDef.subTopics.map(st => st.id));
    const validSubTopics = subTopics.filter(subTopicId => {
      if (!validSubTopicIds.has(subTopicId)) {
        console.error(
          `Exam ${exam.id}, topic ${topicId} references invalid subtopic "${subTopicId}". ` +
          `Available subtopics: ${Array.from(validSubTopicIds).join(', ')} - skipping`
        );
        return false;
      }
      return true;
    });

    // Only keep topics that have at least one valid subtopic
    if (validSubTopics.length === 0) {
      console.error(`Topic ${topicId} in exam ${exam.id} has no valid subtopics - skipping entire topic`);
      return false;
    }

    // Return the topic with only valid subtopics
    return {
      ...topic,
      topic_id: topicId, // Normalize to topic_id
      sub_topics: validSubTopics // Only include valid subtopics
    };
  });

  if (validTopics.length === 0) {
    throw new Error(`Exam ${exam.id} has no valid topics after validation`);
  }

  return validTopics;
}

function transformExam(exam: { 
  id: string; 
  topics: any[]; 
  exam_type: string;
  code: string;
  names: {
    short: string;
    medium: string;
    full: string;
  };
  difficulty: number;
}): ExamData {
  // Validate and get only valid topics
  const validatedTopics = validateExamTopics(exam);

  return {
    ...exam,
    exam_type: exam.exam_type === 'bagrut' ? ExamType.BAGRUT : ExamType.MAHAT,
    topics: validatedTopics.map(transformTopic)
  };
}

// Validate and transform imported JSON
let bagrutExams: BagrutExams;
let mahatExams: MahatExams;

try {
  // First validate all topics exist before transforming
  const allExams = [...bagrutCS.exams, ...mahatCS.exams];
  for (const exam of allExams) {
    validateExamTopics(exam); // This will throw if any exam has invalid topics
  }

  // Now transform the exams
  bagrutExams = {
    exams: bagrutCS.exams.map(transformExam)
  };

  mahatExams = {
    faculty: mahatCS.faculty,
    exams: mahatCS.exams.map(transformExam)
  };
} catch (error) {
  // Log the error and re-throw to prevent the app from loading with invalid data
  console.error('Failed to load exam data:', error);
  throw error;
}

// Cache for subject data
const subjectDataCache = new Map<string, any>();

/**
 * Service for loading and managing exam data.
 * Handles loading exam configurations and converting them to runtime formats.
 */
class ExamService {
  private examCache: Map<string, ExamData> = new Map();
  private sessionCache: Map<string, ExamSession> = new Map();

  /**
   * Gets subject data for a topic.
   * @param subjectId Subject identifier
   */
  async getSubjectData(subjectId: string): Promise<any> {
    switch (subjectId) {
      case 'cs_programming_fundamentals':
        return csProgrammingFundamentals;
      case 'cs_data_structures':
        return csDataStructures;
      default:
        throw new Error(`Unknown subject: ${subjectId}`);
    }
  }

  /**
   * Gets topic data directly from subject files
   * @throws Error if topic is not found or data is invalid
   */
  async getTopicData(topicId: string): Promise<any> {
    if (!topicId) {
      throw new Error('Topic ID is required');
    }

    // First check cache
    if (subjectDataCache.has(topicId)) {
      return subjectDataCache.get(topicId);
    }

    // Find the subject file containing this topic
    let subjectData;
    if (csProgrammingFundamentals.topics.some(t => t.id === topicId)) {
      subjectData = csProgrammingFundamentals;
    } else if (csDataStructures.topics.some(t => t.id === topicId)) {
      subjectData = csDataStructures;
    } else {
      const availableTopics = [
        ...csProgrammingFundamentals.topics.map(t => t.id),
        ...csDataStructures.topics.map(t => t.id)
      ].join(', ');
      throw new Error(
        `Topic ${topicId} not found in any subject file. Available topics are: ${availableTopics}`
      );
    }

    const topic = subjectData.topics.find(t => t.id === topicId);
    if (!topic) {
      throw new Error(`Topic ${topicId} not found in subject data`);
    }

    try {
      this.validateTopicData(topic, topicId);
      subjectDataCache.set(topicId, topic);
      return topic;
    } catch (err) {
      throw new Error(`Found topic ${topicId} but data is invalid: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates topic data structure
   * @throws Error if data is invalid
   */
  private validateTopicData(topic: any, topicId: string): void {
    if (!topic.name || typeof topic.name !== 'string') {
      throw new Error(`Topic ${topicId} is missing required name field`);
    }
    if (!topic.description || typeof topic.description !== 'string') {
      throw new Error(`Topic ${topicId} is missing required description field`);
    }
    if (!Array.isArray(topic.subTopics)) {
      throw new Error(`Topic ${topicId} is missing required subTopics array`);
    }
    
    topic.subTopics.forEach((subTopic: any, index: number) => {
      if (!subTopic.id || typeof subTopic.id !== 'string') {
        throw new Error(`Subtopic ${index} in topic ${topicId} is missing required id field`);
      }
      if (!subTopic.name || typeof subTopic.name !== 'string') {
        throw new Error(`Subtopic ${subTopic.id} in topic ${topicId} is missing required name field`);
      }
      if (!subTopic.description || typeof subTopic.description !== 'string') {
        throw new Error(`Subtopic ${subTopic.id} in topic ${topicId} is missing required description field`);
      }
    });
  }

  /**
   * Gets topic and subtopic information from subject files
   * @throws Error if topic or subtopic data is invalid or missing
   */
  private getTopicInfo(topicId: string, subTopicId?: string) {
    // Find the subject file that contains this topic
    let subjectData;
    if (csProgrammingFundamentals.topics.some(t => t.id === topicId)) {
      subjectData = csProgrammingFundamentals;
    } else if (csDataStructures.topics.some(t => t.id === topicId)) {
      subjectData = csDataStructures;
    } else {
      throw new Error(`Topic ${topicId} not found in any subject file`);
    }

    const topic = subjectData.topics.find((t: any) => t.id === topicId);
    
    if (!topic) {
      throw new Error(`Topic ${topicId} not found in subject data`);
    }

    if (!subTopicId) {
      return {
        name: topic.name,
        description: topic.description
      };
    }

    const subTopic = topic.subTopics?.find((st: any) => st.id === subTopicId);
    if (!subTopic) {
      throw new Error(`Subtopic ${subTopicId} not found in topic ${topicId}`);
    }

    return {
      name: topic.name,
      description: topic.description,
      subTopic: {
        name: subTopic.name,
        description: subTopic.description
      }
    };
  }

  /**
   * Creates a formal exam with proper topic names and descriptions
   * @throws Error if topic data is invalid or missing
   */
  private createFormalExam(examData: ExamData, session?: ExamSession): FormalExam {
    if (!examData?.id) {
      throw new Error('Invalid exam data: missing exam ID');
    }

    if (!Array.isArray(examData.topics)) {
      throw new Error(`Exam ${examData.id} is missing required topics array`);
    }

    // First validate and normalize topics
    const validTopics = examData.topics.filter(topic => {
      if (!topic.topic_id || !Array.isArray(topic.sub_topics)) {
        console.error(`Skipping invalid topic in exam ${examData.id}: missing required fields`);
        return false;
      }
      return true;
    });

    if (validTopics.length === 0) {
      throw new Error(`Exam ${examData.id} has no valid topics`);
    }

    // Load complete topic data from subject files
    const topics: Topic[] = validTopics.map((topic, index) => {
      // Find the subject file containing this topic
      let subjectData;
      if (csProgrammingFundamentals.topics.some(t => t.id === topic.topic_id)) {
        subjectData = csProgrammingFundamentals;
      } else if (csDataStructures.topics.some(t => t.id === topic.topic_id)) {
        subjectData = csDataStructures;
      } else {
        throw new Error(`Topic ${topic.topic_id} not found in any subject file`);
      }

      // Get complete topic data
      const topicData = subjectData.topics.find(t => t.id === topic.topic_id);
      if (!topicData) {
        throw new Error(`Topic ${topic.topic_id} not found in subject data`);
      }

      // Validate topic data
      if (!topicData.name || !topicData.description || !Array.isArray(topicData.subTopics)) {
        throw new Error(`Invalid topic data structure for ${topic.topic_id}`);
      }

      // Map subtopics with complete data
      return {
        id: `${examData.id}_${topic.topic_id}`,
        code: topic.topic_id,
        topic_id: topic.topic_id,
        name: topicData.name,
        description: topicData.description,
        order: index,
        subTopics: topic.sub_topics
          .map(subTopicId => {
            const subTopicData = topicData.subTopics.find(st => st.id === subTopicId);
            if (!subTopicData) {
              console.error(`Skipping invalid subtopic ${subTopicId} in topic ${topic.topic_id}`);
              return null;
            }

            const subTopic: SubTopic = {
              id: `${examData.id}_${topic.topic_id}_${subTopicId}`,
              code: subTopicId,
              name: subTopicData.name,
              description: subTopicData.description,
              questionTemplate: subTopicData.questionTemplate,
              order: topic.sub_topics.indexOf(subTopicId)
            };
            return subTopic;
          })
          .filter((subTopic): subTopic is NonNullable<typeof subTopic> => subTopic !== null)
      };
    });

    return {
      id: examData.id,
      title: examData.names.medium,
      description: `${examData.code} - ${examData.names.full}`,
      names: examData.names,
      duration: 180,
      totalQuestions: topics.reduce((total, topic) => total + topic.subTopics.length, 0),
      examType: examData.exam_type === ExamType.BAGRUT ? 'bagrut' : 'mahat',
      status: session?.status,
      score: session?.score,
      startedAt: session?.startedAt,
      completedAt: session?.completedAt,
      topics
    };
  }

  /**
   * Gets all exams of a specific type.
   * @param examType Type of exams to load (bagrut/mahat)
   */
  async getExamsByType(examType: ExamType): Promise<FormalExam[]> {
    // Load from imported JSON
    const data = examType === ExamType.BAGRUT ? bagrutExams : mahatExams;
    
    // Cache exam data for future use
    data.exams.forEach(exam => this.examCache.set(exam.id, exam));
    
    // Convert to formal exams with any existing session data
    return data.exams.map(exam => 
      this.createFormalExam(exam, this.sessionCache.get(exam.id))
    );
  }

  /**
   * Gets a specific exam by ID.
   * @param examId Unique exam identifier
   */
  async getExamById(examId: string): Promise<FormalExam | null> {
    // Try cache first
    let examData = this.examCache.get(examId);
    
    if (!examData) {
      // Load from appropriate data based on ID prefix
      const [examType] = examId.split('_');
      const data = examType === 'bagrut' ? bagrutExams : mahatExams;
      examData = data.exams.find(exam => exam.id === examId);
      
      if (!examData) {
        return null;
      }
      
      this.examCache.set(examId, examData);
    }
    
    return this.createFormalExam(examData, this.sessionCache.get(examId));
  }

  /**
   * Creates or updates an exam session.
   * @param examId Exam identifier
   * @param session Session data
   */
  async updateSession(examId: string, session: ExamSession): Promise<void> {
    this.sessionCache.set(examId, session);
    // TODO: Persist to backend
  }
}

export const examService = new ExamService(); 