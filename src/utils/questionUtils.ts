import { universalTopics } from '../services/universalTopics';
import { Question } from '../types/question';

/**
 * Gets the most specific topic info available for a question
 * Returns subtopic info if exists, otherwise topic info
 */
export function getQuestionTopicName(question: Question): string {
  const { topicId, subtopicId } = question.metadata;
  return universalTopics.getMostSpecificTopicName(topicId, subtopicId);
} 

export const getQuestionTypeLabel = (type: string) => {
    switch(type) {
      case 'multiple_choice': return 'סגורה';
      case 'open': return 'פתוחה';
      case 'code': return 'תכנות';
      case 'step_by_step': return 'חישובית';
      default: return type;
    }
};
  