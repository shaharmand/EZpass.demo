const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateVideos() {
    try {
        // Read video mapping data
        const videoMappingPath = path.join(__dirname, '../data/videos/youtube/video_mapping.json');
        const videoMapping = JSON.parse(fs.readFileSync(videoMappingPath, 'utf8'));

        // Read embeddings
        const embeddingsDir = path.join(__dirname, '../data/videos/embeddings');
        const embeddingFiles = fs.readdirSync(embeddingsDir).filter(file => file.endsWith('.json'));

        // Process each video
        for (const [vimeoId, info] of Object.entries(videoMapping.video_info)) {
            const youtubeId = info.youtube_id;
            const title = info.title;

            // Find corresponding embedding file
            const embeddingFile = embeddingFiles.find(file => file.includes(vimeoId));
            let embedding = null;
            if (embeddingFile) {
                const embeddingData = JSON.parse(fs.readFileSync(path.join(embeddingsDir, embeddingFile), 'utf8'));
                embedding = embeddingData.embedding;
            }

            // Insert into database
            const { data, error } = await supabase
                .from('videos')
                .upsert({
                    title,
                    youtube_id: youtubeId,
                    embedding,
                    // Note: lesson_id will need to be set based on your course structure
                    // You may need to add logic to determine the correct lesson_id
                }, {
                    onConflict: 'youtube_id'
                });

            if (error) {
                console.error(`Error inserting video ${youtubeId}:`, error);
            } else {
                console.log(`Successfully migrated video: ${title}`);
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

// Run migration
migrateVideos(); 