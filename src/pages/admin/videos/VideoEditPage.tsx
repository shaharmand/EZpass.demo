import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Space, Select, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { VideoContent, UpdateVideoContentInput, VideoSource } from '../../../types/videoContent';
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

export const VideoEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [video, setVideo] = useState<VideoContent | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string>('');
  const [previewVideoSource, setPreviewVideoSource] = useState<VideoSource>(VideoSource.VIMEO);
  const storage = new VideoContentStorage(getSupabase());

  useEffect(() => {
    const loadVideo = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await storage.getVideo(id);
        if (data) {
          setVideo(data);
          form.setFieldsValue({
            title: data.title,
            description: data.description,
            videoSource: data.videoSource,
            videoId: data.videoId,
            subtopicId: data.subtopicId,
            duration: data.duration,
            thumbnail: data.thumbnail,
            order: data.order,
            tags: data.tags,
            isActive: data.isActive,
          });
        } else {
          message.error('Video not found');
          navigate('/admin/videos');
        }
      } catch (error) {
        message.error('Failed to load video');
        console.error('Failed to load video:', error);
        navigate('/admin/videos');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [id, navigate, form]);

  const handleSubmit = async (values: UpdateVideoContentInput) => {
    if (!id) return;
    
    setSaving(true);
    try {
      await storage.updateVideo(id, values);
      message.success('Video updated successfully');
      navigate('/admin/videos');
    } catch (error) {
      message.error('Failed to update video');
      console.error('Failed to update video:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const videoId = form.getFieldValue('videoId');
    const videoSource = form.getFieldValue('videoSource');
    if (videoId) {
      setPreviewVideoId(videoId);
      setPreviewVideoSource(videoSource);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Spin size="large" />
      </PageContainer>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <h1>Edit Video</h1>
      </HeaderContainer>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} />
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
            name="videoId"
            label="Video ID"
            rules={[{ required: true, message: 'Please enter video ID' }]}
            extra={
              <Button type="link" onClick={handlePreview}>
                Preview Video
              </Button>
            }
          >
            <Input placeholder="Enter Vimeo or YouTube video ID" />
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

          <Form.Item
            name="isActive"
            label="Status"
          >
            <Select>
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                Save
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
        isOpen={!!previewVideoId}
        onClose={() => setPreviewVideoId('')}
      />
    </PageContainer>
  );
}; 