import { universalTopics } from "src/services/universalTopics";
import { Question } from "src/types/question";

/**
 * Gets the most specific topic name available for a question
 * Returns subtopic name if exists, otherwise topic name
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
  