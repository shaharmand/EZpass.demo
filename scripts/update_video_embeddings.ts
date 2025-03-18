import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

async function getTextEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get embedding');
  }

  const data = await response.json() as EmbeddingResponse;
  return data.data[0].embedding;
}

async function updateVideoEmbeddings() {
  // Initialize Supabase client
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read processed summaries
    const summariesPath = path.join(process.cwd(), 'src', 'data', 'videos', 'embeddings', 'processed_summaries.json');
    const summariesData = JSON.parse(fs.readFileSync(summariesPath, 'utf-8'));
    
    // Log the structure of the data
    console.log('Data structure:', {
      hasSummaries: 'summaries' in summariesData,
      keys: Object.keys(summariesData),
      firstItem: summariesData.summaries?.[0] ? {
        keys: Object.keys(summariesData.summaries[0]),
        sample: summariesData.summaries[0]
      } : 'No summaries found'
    });

    const summaries = summariesData.summaries || [];
    console.log(`Found ${summaries.length} summaries to process`);

    // Update each video's embedding
    for (const summary of summaries) {
      // Log the full summary object
      console.log('\nProcessing summary:', summary);

      // Extract video ID from the summary and remove "video_" prefix
      const videoId = (summary.video_id || summary.id)?.replace('video_', '');
      if (!videoId) {
        console.log('Skipping summary - missing video ID');
        continue;
      }

      if (!summary.text) {
        console.log(`Skipping summary ${videoId} - missing text`);
        continue;
      }

      try {
        // Get new embedding using text-embedding-3-small
        const newEmbedding = await getTextEmbedding(summary.text);
        
        const { error } = await supabase
          .from('video_content')
          .update({ 
            embedding: newEmbedding,
            updated_at: new Date().toISOString()
          })
          .eq('vimeo_id', videoId);

        if (error) {
          console.error(`Error updating video ${videoId}:`, error);
        } else {
          console.log(`Updated embedding for video ${videoId}`);
        }
      } catch (error) {
        console.error(`Error processing video ${videoId}:`, error);
      }
    }

    console.log('Finished updating video embeddings');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the update
updateVideoEmbeddings(); 