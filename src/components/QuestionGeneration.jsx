import { QuestionService } from '../services/api/questionService';
import { parseOpenAIResponse } from '../services/llm/service';

// Initialize the question service
const questionService = new QuestionService();

// Export the functions that are used in QuestionDisplay
export const generateQuestion = async (config, metadata, filters) => {
  return questionService.generateNewQuestion(config, filters);
};

export const generateMetadata = (config, filters) => {
  // Implementation of generateMetadata
  return {
    topic: config.selectedContent?.topics?.[0]?.name,
    subtopic: config.selectedContent?.topics?.[0]?.subtopics?.[0],
    type: filters?.type || 'open',
    difficulty: config.selectedContent?.difficulty || 3
  };
}; 