import { VideoContentStorage } from '../../services/admin/videoContentStorage';
import { VideoSource } from '../../types/videoContent';
import { logger } from '../../utils/logger';
import { getSupabase } from '../../lib/supabase';
import fs from 'fs';
import path from 'path';
import { CreateVideoContentInput } from '../../types/videoContent';

async function migrateVideos() {
    try {
        const supabase = getSupabase();
        const storage = new VideoContentStorage(supabase);
        
        // Read video data from JSON
        const videoDataPath = path.join(process.cwd(), 'src/data/course/CIV-SAF/content/video_data.json');
        const videoData = JSON.parse(fs.readFileSync(videoDataPath, 'utf8'));
        
        // Read YouTube stats for additional metadata
        const youtubeStatsPath = path.join(process.cwd(), 'src/data/videos/youtube/video_stats.json');
        const youtubeStats = JSON.parse(fs.readFileSync(youtubeStatsPath, 'utf8'));

        logger.info(`Starting video migration. Found ${videoData.videos.length} videos to process.`);

        // Process each video
        for (const video of videoData.videos) {
            try {
                // Get YouTube stats if available
                const youtubeData = youtubeStats.videos[video.vimeoId];
                
                // Create video content
                const videoContent: CreateVideoContentInput = {
                    title: video.title,
                    description: youtubeData?.stats?.description || '',
                    videoSource: VideoSource.VIMEO,
                    vimeo_id: video.vimeoId,
                    subtopic_id: video.subtopicId,
                    duration: video.duration.toString(),
                    thumbnail: `https://vumbnail.com/${video.vimeoId}.jpg`,
                    order: video.lessonNumber * 100 + video.segmentNumber,
                    tags: youtubeData?.stats?.tags || [],
                    is_active: true
                };

                // Insert into database
                await storage.createVideo(videoContent);
                logger.info(`Successfully migrated video: ${video.title}`);
            } catch (error) {
                logger.error(`Failed to migrate video ${video.title}:`, error);
            }
        }

        logger.info('Video migration completed successfully');
    } catch (error) {
        logger.error('Failed to complete video migration:', error);
        throw error;
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateVideos()
        .then(() => process.exit(0))
        .catch(error => {
            logger.error('Migration failed:', error);
            process.exit(1);
        });
} 