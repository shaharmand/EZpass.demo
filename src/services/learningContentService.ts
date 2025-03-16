import { VideoContent } from '../types/videoContent';
import { Question } from '../types/question';
import { videoContentService } from './videoContentService';
import { embeddingService } from './embeddingService';

interface LearningContentMatch {
  content: VideoContent;
  score: number;
}

function isVideoContent(content: VideoContent | Question): content is VideoContent {
  return 'videoId' in content;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export class LearningContentService {
  private static readonly SIMILARITY_THRESHOLD = 0.2;

  static async findRelatedContent(
    currentContent: VideoContent | Question,
    allContent: VideoContent[],
    maxResults: number = 4
  ): Promise<VideoContent[]> {
    // Filter out the current content if it's a video
    const otherContent = isVideoContent(currentContent) ? 
      allContent.filter(c => c.id !== currentContent.id) : 
      allContent;
    
    // Calculate similarity scores and create matches
    const matches: LearningContentMatch[] = await Promise.all(
      otherContent.map(async content => {
        const score = await this.calculateSimilarity(currentContent, content);
        return { content, score };
      })
    );

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    // Find the cutoff point where the gap becomes too large
    let cutoffIndex = 0;
    for (let i = 1; i < matches.length && i < maxResults; i++) {
      const gap = matches[i - 1].score - matches[i].score;
      if (gap > this.SIMILARITY_THRESHOLD) {
        cutoffIndex = i;
        break;
      }
      cutoffIndex = i;
    }

    // Return the content up to the cutoff point
    return matches
      .slice(0, Math.min(cutoffIndex + 1, maxResults))
      .map(match => match.content);
  }

  static async findVideosForQuestion(
    question: Question,
    videos: VideoContent[],
    maxResults: number = 4
  ): Promise<VideoContent[]> {
    return this.findRelatedContent(question, videos, maxResults);
  }

  static async calculateSimilarity(content1: VideoContent | Question, content2: VideoContent): Promise<number> {
    let score = 0;
    
    // Base similarity from same subtopic
    if (isVideoContent(content1)) {
      if (content1.subtopicId === content2.subtopicId) {
        score += 0.025; // 2.5% boost for same subtopic
      }
    } else if (content1.metadata.subtopicId === content2.subtopicId) {
      score += 0.025; // 2.5% boost for same subtopic
    }

    // Get embeddings
    const embedding2 = await videoContentService.getVideoEmbedding(content2.id);
    if (!embedding2) return score;

    // Get question embedding using the embedding service
    let embedding1: number[] | null = null;
    if (isVideoContent(content1)) {
      embedding1 = await videoContentService.getVideoEmbedding(content1.id);
    } else {
      try {
        embedding1 = await embeddingService.getQuestionEmbedding(content1);
      } catch (error) {
        console.error('Error getting question embedding:', error);
        return score;
      }
    }

    if (!embedding1) return score;

    // Calculate cosine similarity between embeddings
    score += cosineSimilarity(embedding1, embedding2);

    return score;
  }
} 