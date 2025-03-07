import { QuestionType } from '../../../../../types/question';
import { universalTopicsV2 } from '../../../../universalTopics';
import type { Topic, SubTopic } from '../../../../../types/subject';

// Question generation guidance by type - this is the added value we provide on top of universalTopics
export const CONSTRUCTION_SAFETY_GUIDANCE = {
  questionGuidance: {
    [QuestionType.MULTIPLE_CHOICE]: {
      focus: [
        'בחירת התשובה הנכונה מבין אפשרויות המשקפות מצבים מציאותיים',
        'שילוב תרחישים מעשיים מאתרי בנייה',
        'התייחסות לתקנות ותקנים רלוונטיים',
        'דגש על החלטות בטיחות קריטיות'
      ]
    },
    [QuestionType.OPEN]: {
      focus: [
        'ניתוח מקרים ותרחישים מורכבים',
        'תכנון מערכי בטיחות',
        'הסברים מפורטים של נהלים ותקנות',
        'פתרון בעיות בטיחות מעשיות'
      ]
    },
    [QuestionType.NUMERICAL]: {
      focus: [
        'חישובי עומסים ומשקלים',
        'מרחקי בטיחות ושיפועים',
        'חישובי יציבות מבנים זמניים',
        'תכנון מערכי הרמה והנפה'
      ]
    }
  }
} as const;

// Helper functions that work with universalTopics
export function findSubtopicById(subtopicId: string) {
  const domain = universalTopicsV2.getDomainSafe('civil_engineering', 'construction_safety');
  if (!domain) return null;

  for (const topic of domain.topics) {
    const subtopic = topic.subTopics.find((sub: SubTopic) => sub.id === subtopicId);
    if (subtopic) {
      return {
        topic,
        subtopic
      };
    }
  }
  return null;
}

export function getTopicById(topicId: string) {
  const domain = universalTopicsV2.getDomainSafe('civil_engineering', 'construction_safety');
  return domain?.topics.find((topic: Topic) => topic.id === topicId);
}

export function getSubtopicsForTopic(topicId: string) {
  const topic = getTopicById(topicId);
  return topic?.subTopics || [];
} 