import { VideoContent } from '../types/videoContent';
import { Question } from '../types/question';
import { VideoContentService } from './videoContentService';
import { embeddingService } from './embeddingService';
import { supabase } from '../lib/supabaseClient';
import { LearningContent } from '../types/learningContent';
import { EmbeddingService } from './embeddingService';

interface LearningContentMatch {
  content: VideoContent;
  score: number;
}

interface DatabaseMatch {
  id: string;
  title: string;
  description: string;
  vimeo_id: string;
  subtopic_id: string;
  similarity: number;
}

function isVideoContent(content: any): content is VideoContent {
  return 'vimeo_id' in content;
}

function isValidEmbedding(embedding: any): embedding is number[] {
  return Array.isArray(embedding) && 
         embedding.every(val => typeof val === 'number') && 
         embedding.length > 0;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!isValidEmbedding(a) || !isValidEmbedding(b)) {
    console.error('Invalid embeddings:', { a, b });
    return 0;
  }

  if (a.length !== b.length) {
    console.error('Embeddings have different lengths:', { aLength: a.length, bLength: b.length });
    return 0;
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

export class LearningContentService {
  private static readonly SIMILARITY_THRESHOLD = 0.2;

  static async findRelatedContent(
    currentContent: VideoContent | Question,
    allContent: VideoContent[],
    maxResults: number = 4
  ): Promise<VideoContent[]> {
    try {
      // Get embedding for the current content
      let queryEmbedding: number[];
      if (isVideoContent(currentContent)) {
        const videoEmbedding = await VideoContentService.getVideoEmbedding(currentContent.vimeo_id);
        if (!videoEmbedding) {
          console.error('Could not get embedding for video:', currentContent.vimeo_id);
          return [];
        }
        queryEmbedding = videoEmbedding;
      } else {
        queryEmbedding = await embeddingService.getQuestionEmbedding(currentContent);
      }

      // Get subtopic for boosting
      const subtopic = isVideoContent(currentContent) 
        ? currentContent.subtopic_id 
        : currentContent.metadata.subtopicId;

      // Use database function for similarity search
      const { data, error } = await supabase.rpc('match_videos_weighted', {
        query_embedding: queryEmbedding,
        subtopic: subtopic || '',
        subtopic_boost: 0.025, // 2.5% boost for same subtopic
        similarity_threshold: this.SIMILARITY_THRESHOLD,
        max_results: maxResults
      });

      if (error) {
        console.error('Error finding related content:', error);
        return [];
      }

      // Get full video content for matched videos
      const videoIds = (data as DatabaseMatch[]).map(match => match.id);
      const { data: videos, error: videosError } = await supabase
        .from('video_content')
        .select('*')
        .in('id', videoIds);

      if (videosError) {
        console.error('Error fetching matched videos:', videosError);
        return [];
      }

      // Sort videos to match the similarity order
      return (data as DatabaseMatch[]).map(match => 
        videos.find(v => v.id === match.id)
      ).filter((v): v is VideoContent => v !== undefined);
    } catch (error) {
      console.error('Error in findRelatedContent:', error);
      return [];
    }
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
      if (content1.subtopic_id === content2.subtopic_id) {
        score += 0.025; // 2.5% boost for same subtopic
      }
    } else if (content1.metadata.subtopicId === content2.subtopic_id) {
      score += 0.025; // 2.5% boost for same subtopic
    }

    // Get embeddings for both content pieces
    let embedding1: number[] | null = null;
    let embedding2: number[] | null = null;

    try {
      // Get video embedding
      embedding2 = await VideoContentService.getVideoEmbedding(content2.vimeo_id);
      if (!embedding2 || !isValidEmbedding(embedding2)) {
        console.error('Invalid embedding for video:', content2.vimeo_id);
        return score;
      }

      // Get question or video embedding
      if (isVideoContent(content1)) {
        embedding1 = await VideoContentService.getVideoEmbedding(content1.vimeo_id);
      } else {
        embedding1 = await embeddingService.getQuestionEmbedding(content1);
      }

      if (!embedding1 || !isValidEmbedding(embedding1)) {
        console.error('Invalid embedding for content1:', isVideoContent(content1) ? content1.vimeo_id : 'question');
        return score;
      }

      // Calculate cosine similarity between embeddings
      score += cosineSimilarity(embedding1, embedding2);
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return score;
    }

    return score;
  }

  private async getContentEmbedding(content: LearningContent): Promise<number[] | null> {
    try {
      // For now, we only handle video content
      if (content.type === 'video' && content.content && 'vimeo_id' in content.content) {
        return await EmbeddingService.getVideoEmbedding(content.content.vimeo_id);
      }
      return null;
    } catch (error) {
      console.error('Error getting content embedding:', error);
      return null;
    }
  }

  async findRelatedContent(content: LearningContent, maxResults: number = 3): Promise<LearningContent[]> {
    try {
      // Get embedding for the content
      const embedding = await this.getContentEmbedding(content);
      if (!embedding) {
        console.error('Could not get embedding for content');
        return [];
      }

      // Use pure cosine similarity from database
      const { data, error } = await supabase.rpc('match_videos_pure', {
        query_embedding: embedding,
        similarity_threshold: 0.2,
        max_results: maxResults * 2 // Get more results to account for filtering
      });

      if (error) {
        console.error('Error finding related content:', error);
        return [];
      }

      // Apply subtopic boost in application layer
      const boostedResults = (data as DatabaseMatch[]).map(match => {
        const isSameSubtopic = match.subtopic_id === content.subtopic_id;
        const boost = isSameSubtopic ? 0.025 : 0; // 2.5% boost for same subtopic
        return {
          ...match,
          final_score: match.similarity * (1 + boost)
        };
      });

      // Sort by final score and take top results
      const sortedResults = boostedResults
        .sort((a, b) => b.final_score - a.final_score)
        .slice(0, maxResults);

      // Get full video content for matched videos
      const videoIds = sortedResults.map(match => match.id);
      const { data: videos, error: videosError } = await supabase
        .from('video_content')
        .select('*')
        .in('id', videoIds);

      if (videosError) {
        console.error('Error fetching video content:', videosError);
        return [];
      }

      // Convert to LearningContent format
      const learningContent: LearningContent[] = [];
      for (const match of sortedResults) {
        const video = videos.find(v => v.id === match.id);
        if (!video) continue;
        
        learningContent.push({
          id: video.id,
          type: 'video',
          title: video.title,
          description: video.description,
          subtopic_id: video.subtopic_id,
          duration: video.duration,
          thumbnail: video.thumbnail,
          content: video
        });
      }

      return learningContent;
    } catch (error) {
      console.error('Error in findRelatedContent:', error);
      return [];
    }
  }

  async findLessonsForQuestion(question: Question): Promise<{
    relatedLessons: LearningContent[];
    subtopicLessons: LearningContent[];
  }> {
    try {
      console.log('=== Debug: findLessonsForQuestion ===');
      console.log('Question subtopic code:', question.metadata.subtopicId);

      // Get the actual subtopic ID from the code
      const { data: subtopicData, error: subtopicError } = await supabase
        .from('subtopics')
        .select('id')
        .eq('code', question.metadata.subtopicId)
        .single();

      if (subtopicError || !subtopicData) {
        console.error('Error fetching subtopic:', subtopicError);
        return { relatedLessons: [], subtopicLessons: [] };
      }

      const subtopic_id = subtopicData.id;
      console.log('Found subtopic ID:', subtopic_id);

      // Get related videos based on content similarity
      const relatedVideos = await this.findRelatedContent({
        id: question.id,
        type: 'video',
        title: question.content.text,
        description: question.schoolAnswer?.solution?.text || '',
        subtopic_id: subtopic_id,
        content: undefined
      });
      console.log('Related videos:', relatedVideos);

      // Get full video content for related videos to ensure we have all fields
      const videoIds = relatedVideos.map(video => video.id);
      const { data: fullVideos, error: fullVideosError } = await supabase
        .from('video_content')
        .select('*')
        .in('id', videoIds);

      if (fullVideosError) {
        console.error('Error fetching full video content:', fullVideosError);
        return { relatedLessons: [], subtopicLessons: [] };
      }
      console.log('Full video content:', fullVideos);

      // Get unique lesson IDs from related videos
      const relatedLessonIds = fullVideos
        .filter(video => video.lesson_id)
        .map(video => video.lesson_id)
        .filter((id): id is number => id !== undefined);
      console.log('Related lesson IDs:', relatedLessonIds);

      // Get lesson info for related lessons
      const { data: relatedLessonsData, error: relatedError } = await supabase
        .from('lessons')
        .select('*')
        .in('id', relatedLessonIds);

      if (relatedError) {
        console.error('Error fetching related lessons:', relatedError);
        return { relatedLessons: [], subtopicLessons: [] };
      }
      console.log('Related lessons data:', relatedLessonsData);

      // Convert to LearningContent format for related lessons
      const relatedLessons: LearningContent[] = (relatedLessonsData || []).map(lesson => ({
        id: lesson.id,
        type: 'lesson',
        title: lesson.title,
        description: lesson.description || '',
        subtopic_id: subtopic_id,
        duration: 0, // We'll need to calculate this from videos if needed
        content: lesson
      }));
      console.log('Formatted related lessons:', relatedLessons);

      // Get all lessons that have videos from the same subtopic
      const { data: videoLessons, error: videoError } = await supabase
        .from('video_content')
        .select('lesson_id')
        .eq('subtopic_id', subtopic_id)
        .not('lesson_id', 'is', null);

      if (videoError) {
        console.error('Error fetching video lessons:', videoError);
        return { relatedLessons, subtopicLessons: [] };
      }
      console.log('Video lessons:', videoLessons);

      const lessonIds = videoLessons?.map(v => v.lesson_id) || [];
      console.log('Lesson IDs for subtopic:', lessonIds);

      const { data: subtopicLessonsData, error: subtopicLessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('id', lessonIds)
        .order('lesson_number', { ascending: true });

      if (subtopicLessonsError) {
        console.error('Error fetching subtopic lessons:', subtopicLessonsError);
        return { relatedLessons, subtopicLessons: [] };
      }
      console.log('Subtopic lessons data:', subtopicLessonsData);

      // Convert to LearningContent format for subtopic lessons
      const subtopicLessons: LearningContent[] = (subtopicLessonsData || []).map(lesson => ({
        id: lesson.id,
        type: 'lesson',
        title: lesson.title,
        description: lesson.description || '',
        subtopic_id: subtopic_id,
        duration: 0, // We'll need to calculate this from videos if needed
        content: lesson
      }));
      console.log('Formatted subtopic lessons:', subtopicLessons);

      return {
        relatedLessons,
        subtopicLessons
      };
    } catch (error) {
      console.error('Error in findLessonsForQuestion:', error);
      return { relatedLessons: [], subtopicLessons: [] };
    }
  }
} 