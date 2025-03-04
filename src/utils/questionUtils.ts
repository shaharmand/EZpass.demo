import { universalTopics } from '../services/universalTopics';
import { Question, QuestionType } from '../types/question';

/**
 * Gets the most specific topic info available for a question
 * Returns subtopic info if exists, otherwise topic info
 */
export function getQuestionTopicName(question: Question): string {
  const { topicId, subtopicId } = question.metadata;
  return universalTopics.getMostSpecificTopicName(topicId, subtopicId);
} 

export const getQuestionTypeLabel = (type: QuestionType): string => {
    switch(type) {
      case QuestionType.MULTIPLE_CHOICE: return 'סגורה';
      case QuestionType.NUMERICAL: return 'חישובית';
      case QuestionType.OPEN: return 'פתוחה';
      default: {
        const exhaustiveCheck: never = type;
        return exhaustiveCheck;
      }
    }
};
  