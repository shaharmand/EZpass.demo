/**
 * Runtime exam types representing the dynamic state of exams in the application.
 * These types extend the static ExamData configuration with runtime properties
 * such as session state, progress tracking, and UI-specific fields.
 */

/**
 * Formal exam representation used throughout the application.
 * Combines static exam configuration with runtime properties.
 * 
 * @example
 * {
 *   id: "bagrut_cs_basic_java",
 *   title: "יסודות מדעי המחשב Java - בגרות",
 *   description: "899 - בחינת בגרות - יסודות מדעי המחשב ותכנות בסיסי בשפת Java",
 *   duration: 180,
 *   totalQuestions: 25,
 *   examType: "bagrut",
 *   status: "not_started",
 *   topics: [...]
 * }
 */
export interface FormalExam {
  /** Unique identifier matching ExamData.id */
  id: string;
  /** Display title (typically ExamData.names.medium) */
  title: string;
  /** Full description (typically combines code and full name) */
  description: string;
  /** All name variants */
  names: {
    short: string;
    medium: string;
    full: string;
  };
  /** Exam duration in minutes */
  duration: number;
  /** Total number of questions across all topics */
  totalQuestions: number;
  /** Type of exam (bagrut/mahat) */
  examType: 'bagrut' | 'mahat';
  /** Current session status */
  status?: 'not_started' | 'in_progress' | 'completed';
  /** Final score (0-100) if completed */
  score?: number;
  /** Timestamp when exam was completed */
  completedAt?: string;
  /** Timestamp when exam was started */
  startedAt?: string;
  /** List of topics with runtime state */
  topics?: Topic[];
}

/**
 * Topic representation with runtime state.
 * Extends TopicData with UI and progress tracking properties.
 */
export interface Topic {
  /** Unique identifier */
  id: string;
  /** Institution's topic code */
  code: string;
  /** Topic ID for subject mapping */
  topic_id: string;
  /** Display name */
  name: string;
  /** Description of the topic */
  description: string;
  /** Display order in UI */
  order: number;
  /** List of subtopics */
  subTopics: SubTopic[];
}

/**
 * Subtopic representation with runtime state.
 * Used to track progress and display in UI.
 */
export interface SubTopic {
  /** Unique identifier */
  id: string;
  /** Institution's subtopic code */
  code: string;
  /** Display name */
  name: string;
  /** Description of the subtopic */
  description: string;
  /** Display order in UI */
  order: number;
  /** Template for typical questions in this subtopic */
  questionTemplate?: string;
}

/**
 * Exam session tracking user's progress through an exam.
 * Created when user starts an exam and updated as they progress.
 */
export interface ExamSession {
  /** Unique session identifier */
  id: string;
  /** Reference to exam being taken */
  examId: string;
  /** Current session status */
  status: 'not_started' | 'in_progress' | 'completed';
  /** Final score if completed */
  score?: number;
  /** When session started */
  startedAt?: string;
  /** When session completed */
  completedAt?: string;
  /** Progress tracking by topic */
  topicProgress: {
    [topicId: string]: {
      correctAnswers: number;
      totalQuestions: number;
      timeSpent: number; // in seconds
    };
  };
}

/**
 * Utility function to convert exam data to formal exam representation.
 * Combines static configuration with runtime state.
 * 
 * @param examData Static exam configuration
 * @param session Optional session data for runtime state
 * @returns Formal exam representation
 */
export const createFormalExam = (
  examData: import('../exam').ExamData,
  session?: ExamSession
): FormalExam => {
  return {
    id: examData.id,
    title: examData.names.medium,
    description: `${examData.code} - ${examData.names.full}`,
    names: examData.names,
    duration: 180, // TODO: Make configurable
    totalQuestions: examData.topics.reduce((total, topic) => total + topic.sub_topics.length, 0),
    examType: examData.exam_type as 'bagrut' | 'mahat',
    status: session?.status,
    score: session?.score,
    startedAt: session?.startedAt,
    completedAt: session?.completedAt,
    topics: examData.topics.map((topic, index) => ({
      id: `${examData.id}_${topic.topic_id}`,
      name: topic.topic_id, // TODO: Load from subjects/*.json
      code: topic.topic_id,
      topic_id: topic.topic_id,
      description: '', // TODO: Load from subjects/*.json
      order: index,
      subTopics: topic.sub_topics.map((subTopic, subIndex) => ({
        id: `${examData.id}_${topic.topic_id}_${subTopic}`,
        code: subTopic,
        name: subTopic, // TODO: Load from subjects/*.json
        description: '', // TODO: Load from subjects/*.json
        order: subIndex
      }))
    }))
  };
};

// Database-like types that would map to actual DB tables
export interface DBExam {
  id: string;
  code: string;
  name_short: string;
  name_medium: string;
  name_full: string;
  exam_type: string;
  difficulty: number;
  programming_language?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DBTopic {
  id: string;
  exam_id: string;  // Foreign key to DBExam
  topic_id: string;
  name: string;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface DBSubTopic {
  id: string;
  topic_id: string;  // Foreign key to DBTopic
  name: string;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface DBExamSession {
  id: string;
  exam_id: string;  // Foreign key to DBExam
  user_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DBExamTopicProgress {
  id: string;
  session_id: string;  // Foreign key to DBExamSession
  topic_id: string;    // Foreign key to DBTopic
  correct_answers: number;
  total_questions: number;
  time_spent: number;  // in seconds
  created_at: string;
  updated_at: string;
}

// Utility type for converting DB exam to FormalExam
export interface ExamWithRelations {
  exam: DBExam;
  topics: (DBTopic & {
    subTopics: DBSubTopic[];
  })[];
}

// Conversion function (would typically be in a separate utility file)
export const convertDBExamToFormalExam = (examWithRelations: ExamWithRelations): FormalExam => {
  const { exam, topics } = examWithRelations;
  
  return {
    id: exam.id,
    title: exam.name_medium,
    description: `${exam.code} - ${exam.name_full}`,
    names: {
      short: exam.name_short,
      medium: exam.name_medium,
      full: exam.name_full
    },
    duration: 180, // This would come from a separate exam_settings table in real DB
    totalQuestions: topics.reduce((total, topic) => total + topic.subTopics.length, 0),
    examType: exam.exam_type as 'bagrut' | 'mahat',
    topics: topics.map(topic => ({
      id: topic.id,
      name: topic.name,
      code: topic.topic_id,
      topic_id: topic.topic_id,
      description: topic.description,
      order: topic.order,
      subTopics: topic.subTopics.map(subTopic => ({
        id: subTopic.id,
        code: subTopic.name, // The original name was the code in the JSON
        name: subTopic.name,
        description: subTopic.description,
        order: subTopic.order
      }))
    }))
  };
}; 