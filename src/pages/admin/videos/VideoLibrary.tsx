import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Typography, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { VideoContent } from '../../../types/videoContent';
import { VideoContentStorage } from '../../../services/admin/videoContentStorage';
import { getSupabase } from '../../../lib/supabase';
import { VideoPlayer } from '../../../components/practice/VideoPlayer';

const { Title } = Typography;
const { TextArea } = Input;

// Initialize storage outside component to prevent recreation on each render
const storage = new VideoContentStorage(getSupabase());

export default function VideoLibrary() {
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoContent | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await storage.getVideos();
      setVideos(data);
    } catch (error) {
      message.error('Error fetching videos');
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video: VideoContent) => {
    navigate(`/admin/videos/${video.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this video?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await storage.deleteVideo(id);
          message.success('Video deleted successfully');
          fetchVideos();
        } catch (error) {
          console.error('Error deleting video:', error);
          message.error('Error deleting video');
        }
      },
    });
  };

  const handlePreview = (video: VideoContent) => {
    setPreviewVideo(video);
  };

  const columns: ColumnsType<VideoContent> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: VideoContent) => (
        <Space>
          {text}
          {!record.is_active && <Tag color="red">Inactive</Tag>}
        </Space>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        isActive ? 'Active' : 'Inactive'
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<PlayCircleOutlined />}
            onClick={() => handlePreview(record)}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Video Library</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/videos/new')}
        >
          Add New Video
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={videos}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {previewVideo && (
        <VideoPlayer
          videoId={previewVideo.vimeo_id}
          videoSource={previewVideo.videoSource}
          title={previewVideo.title}
          thumbnail={previewVideo.thumbnail}
          isOpen={!!previewVideo}
          onClose={() => setPreviewVideo(null)}
        />
      )}
    </div>
  );
} 