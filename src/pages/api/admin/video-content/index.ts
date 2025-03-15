import { NextApiRequest, NextApiResponse } from 'next';
import { CreateVideoContentInput, UpdateVideoContentInput } from '../../../../types/videoContent';
import { VideoContentStorage } from '../../../../services/admin/videoContentStorage';
import { getSupabase } from '../../../../lib/supabase';

// Initialize storage with Supabase client
const storage = new VideoContentStorage(getSupabase());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Get all video content
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { subtopicId, isActive, searchText, sortBy, sortOrder } = req.query;

    const filters = {
      ...(subtopicId && { subtopicId: String(subtopicId) }),
      ...(typeof isActive === 'string' && { isActive: isActive === 'true' }),
      ...(searchText && { searchText: String(searchText) }),
      ...(sortBy && { sortBy: String(sortBy) as 'order' | 'created_at' | 'updated_at' }),
      ...(sortOrder && { sortOrder: String(sortOrder) as 'asc' | 'desc' })
    };

    const videos = await storage.getVideos(filters);
    res.status(200).json(videos);
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
}

// Create new video content
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data: CreateVideoContentInput = req.body;
    const video = await storage.createVideo(data);
    res.status(201).json(video);
  } catch (error) {
    if (error instanceof Error && error.message === 'Missing required fields') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Failed to create video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
}

// Update video content
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data: UpdateVideoContentInput = req.body;

    if (!data.id) {
      return res.status(400).json({ error: 'Missing video ID' });
    }

    const video = await storage.updateVideo(data.id, data);
    res.status(200).json(video);
  } catch (error) {
    if (error instanceof Error && error.message === 'Video not found') {
      return res.status(404).json({ error: 'Video not found' });
    }
    console.error('Failed to update video:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
}

// Delete video content
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid video ID' });
    }

    await storage.deleteVideo(id);
    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
} 