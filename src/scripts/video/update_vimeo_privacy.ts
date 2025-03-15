import { Vimeo } from 'vimeo';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new Vimeo(
  process.env.VIMEO_CLIENT_ID!,
  process.env.VIMEO_CLIENT_SECRET!,
  process.env.VIMEO_ACCESS_TOKEN!
);

async function updateVideoPrivacy(videoId: string): Promise<void> {
  try {
    await client.request({
      method: 'PATCH',
      path: `/videos/${videoId}`,
      body: {
        privacy: {
          view: 'disable',
          embed: 'whitelist',
          // Add your domain here
          domains: ['localhost', 'ezpass.co.il']
        }
      }
    });
    console.log(`✅ Updated privacy settings for video ${videoId}`);
  } catch (error) {
    console.error(`❌ Failed to update privacy for video ${videoId}:`, error);
  }
}

async function updateAllVideosPrivacy() {
  try {
    // Read the video data file
    const videoDataPath = path.join(process.cwd(), 'public', 'data', 'courses', 'construction_safety_video_course', 'video_data.json');
    const videoData = JSON.parse(fs.readFileSync(videoDataPath, 'utf8'));

    console.log(`Found ${videoData.length} videos to process`);

    // Update privacy settings for each video
    for (const video of videoData) {
      await updateVideoPrivacy(video.vimeoId);
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Completed updating privacy settings for all videos');
  } catch (error) {
    console.error('❌ Failed to process videos:', error);
  }
}

// Run the script
updateAllVideosPrivacy(); 