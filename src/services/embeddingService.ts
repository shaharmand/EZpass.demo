import OpenAI from 'openai';
import { Question } from '../types/question';

export class EmbeddingService {
  private openai: OpenAI;
  private initialized = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  private createQuestionEmbeddingText(question: Question): string {
    // Extract all required components
    const subtopicId = question.metadata.subtopicId || '';
    const questionText = question.content.text || '';
    
    // Format options if they exist
    const hebrewLetters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];
    let optionsText = '';
    if (question.content.options && question.content.options.length > 0) {
      optionsText = '\n\n' + question.content.options
        .map((opt, i) => `${hebrewLetters[i]}. ${typeof opt === 'string' ? opt : opt.text}`)
        .join('\n');
    }
    
    // Get solution text
    const solutionText = question.schoolAnswer?.solution?.text || '';
    
    // For multiple choice questions, add the correct answer
    let answerText = '';
    if (question.content.options && question.schoolAnswer?.finalAnswer) {
      const finalAnswerValue = typeof question.schoolAnswer.finalAnswer === 'object' 
        ? question.schoolAnswer.finalAnswer.value 
        : question.schoolAnswer.finalAnswer;
      
      try {
        const index = Number(finalAnswerValue) - 1;
        const correctLetter = hebrewLetters[index];
        const correctText = question.content.options[index].text;
        answerText = `\n\nהתשובה הנכונה היא ${correctLetter}. ${correctText}`;
      } catch (e) {
        console.error('Error formatting answer text:', e);
      }
    }
    
    // Build the final text
    let result = `${questionText}${optionsText}${answerText}`;
    
    // Add explanation if it exists
    if (solutionText) {
      result += `\n\nהסבר:\n${solutionText}`;
    }
    
    return result;
  }

  async getQuestionEmbedding(question: Question): Promise<number[]> {
    const text = this.createQuestionEmbeddingText(question);
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float"
    });
    return response.data[0].embedding;
  }
}

export const embeddingService = new EmbeddingService(); 