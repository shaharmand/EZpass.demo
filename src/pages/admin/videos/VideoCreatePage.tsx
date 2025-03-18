import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Space, Select, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { CreateVideoContentInput, VideoSource } from '../../../types/videoContent';
import { VideoContentStorage } from '../../../services/admin/videoContentStorage';
import { getSupabase } from '../../../lib/supabase';
import { VideoPlayer } from '../../../components/practice/VideoPlayer';

const { TextArea } = Input;

const PageContainer = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const HeaderContainer = styled.div`
  margin-bottom: 24px;
`;

// Helper functions to parse video URLs
const getVimeoIdFromUrl = (url: string): string | null => {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/.*\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const getYoutubeIdFromUrl = (url: string): string | null => {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const parseVideoUrl = (url: string): { videoSource: VideoSource; vimeo_id: string } | null => {
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const vimeoId = vimeoMatch[1];
    return { videoSource: VideoSource.VIMEO, vimeo_id: vimeoId };
  }

  const youtubeMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (youtubeMatch) {
    const youtubeId = youtubeMatch[1];
    return { videoSource: VideoSource.YOUTUBE, vimeo_id: youtubeId };
  }

  return null;
};

export const VideoCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [previewVideoId, setPreviewVideoId] = useState<string>('');
  const [previewVideoSource, setPreviewVideoSource] = useState<VideoSource>(VideoSource.VIMEO);
  const storage = new VideoContentStorage(getSupabase());

  const handleSubmit = async (values: CreateVideoContentInput) => {
    setLoading(true);
    try {
      const videoInfo = parseVideoUrl(values.vimeo_id);
      if (!videoInfo) {
        message.error('Invalid video URL');
        return;
      }

      const videoData = {
        ...values,
        vimeo_id: videoInfo.vimeo_id
      };

      const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoInfo.vimeo_id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video metadata');
      }

      const metadata = await response.json();
      videoData.title = metadata.title;
      videoData.description = metadata.description;
      videoData.duration = formatDuration(metadata.duration);

      await storage.createVideo(videoData);
      message.success('Video created successfully');
      navigate('/admin/videos');
    } catch (error) {
      message.error('Failed to create video');
      console.error('Failed to create video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    const vimeo_id = form.getFieldValue('vimeo_id');
    const videoSource = form.getFieldValue('videoSource');
    if (vimeo_id) {
      setPreviewVideoId(vimeo_id);
    }
  };

  const handleUrlPaste = async (url: string) => {
    if (!url) return;
    
    const videoInfo = parseVideoUrl(url);
    if (!videoInfo) {
      message.error('Invalid video URL. Please enter a valid YouTube or Vimeo URL.');
      return;
    }

    setFetchingMetadata(true);
    
    try {
      // Set video source and ID immediately
      form.setFieldsValue({
        videoSource: videoInfo.videoSource,
        vimeo_id: videoInfo.vimeo_id
      });

      // Attempt to fetch video metadata
      if (videoInfo.videoSource === VideoSource.YOUTUBE) {
        // You would need to set up a YouTube API key and implement this
        message.info('YouTube metadata fetching not implemented yet');
      } else {
        // For Vimeo, use their oEmbed API
        const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoInfo.vimeo_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch Vimeo metadata');
        }
        
        const data = await response.json();
        
        // Format duration from seconds to MM:SS
        const duration = data.duration 
          ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` 
          : '';

        // Update form with fetched data
        form.setFieldsValue({
          title: data.title || '',
          description: data.description || '',
          duration,
          thumbnail: data.thumbnail_url || ''
        });

        message.success('Video information loaded successfully');
      }

      // Show preview
      setPreviewVideoId(videoInfo.vimeo_id);
      setPreviewVideoSource(videoInfo.videoSource);
    } catch (error) {
      console.error('Failed to fetch video metadata:', error);
      message.warning('Could not fetch video metadata. Please fill in the details manually.');
    } finally {
      setFetchingMetadata(false);
    }
  };

  return (
    <PageContainer>
      <HeaderContainer>
        <h1>Add New Video</h1>
      </HeaderContainer>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
            tags: [],
            videoSource: VideoSource.VIMEO
          }}
        >
          <Form.Item
            name="vimeo_id"
            label="Video URL"
            rules={[{ required: true, message: 'Please enter video URL' }]}
            extra={
              <Button type="link" onClick={handlePreview}>
                Preview Video
              </Button>
            }
          >
            <Input placeholder="Enter Vimeo or YouTube video URL" />
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input disabled={fetchingMetadata} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} disabled={fetchingMetadata} />
          </Form.Item>

          <Form.Item
            name="videoSource"
            label="Video Source"
            rules={[{ required: true, message: 'Please select video source' }]}
          >
            <Select>
              <Select.Option value={VideoSource.VIMEO}>Vimeo</Select.Option>
              <Select.Option value={VideoSource.YOUTUBE}>YouTube</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subtopicId"
            label="Subtopic ID"
            rules={[{ required: true, message: 'Please enter subtopic ID' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Duration"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <Input placeholder="e.g. 5:30" />
          </Form.Item>

          <Form.Item
            name="thumbnail"
            label="Thumbnail URL"
            extra="If not provided, will use video platform's thumbnail"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="order"
            label="Order"
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags"
          >
            <Select mode="tags" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create
              </Button>
              <Button onClick={() => navigate('/admin/videos')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <VideoPlayer
        videoSource={previewVideoSource}
        videoId={previewVideoId}
        title="תצוגה מקדימה"
        isOpen={!!previewVideoId}
        onClose={() => setPreviewVideoId('')}
      />
    </PageContainer>
  );
}; 