/**
 * Represents a subtopic within a topic.
 */
export interface SubTopic {
  /** Unique identifier for the subtopic */
  id: string;
  /** Display name of the subtopic */
  name: string;
  /** Description of the subtopic */
  description: string;
  /** Display order in UI */
  order: number;
  /** Template for typical questions in this subtopic (optional) */
  questionTemplate?: string;
  /** List of typical questions for this subtopic (optional) */
  typicalQuestions?: string[];
  /** Percentage of total exam weight for this subtopic */
  percentageOfTotal?: number;
}

/**
 * Represents a topic within a subject.
 */
export interface Topic {
  /** Unique identifier for the topic */
  id: string;
  /** Display name of the topic */
  name: string;
  /** Description of the topic */
  description: string;
  /** Display order in UI */
  order: number;
  /** List of subtopics under this topic */
  subTopics: SubTopic[];
}

/**
 * Represents a domain that contains multiple subjects.
 */
export interface Domain {
  /** Unique identifier for the domain */
  id: string;
  /** Three-letter code for the domain used in question IDs */
  code: string;
  /** Name of the domain */
  name: string;
  /** Description of the domain */
  description: string;
  /** List of subjects under this domain */
  topics: Topic[];
}

/**
 * Represents a subject that contains multiple topics.
 */
export interface Subject {
    /** Unique identifier for the subject */
    id: string;
    /** Three-letter code for the subject used in question IDs */
    code: string;
    /** Name of the subject */
    name: string;
    /** Description of the subject */
    description: string;
    /** List of topics under this subject */
    domains: Domain[];
}
