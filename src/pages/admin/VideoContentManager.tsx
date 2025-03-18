import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { VideoContent, CreateVideoContentInput, UpdateVideoContentInput, VideoSource } from '../../types/videoContent';
import { VimeoPlayer } from '../../components/practice/VimeoPlayer';

const { Title, Text } = Typography;

const PageContainer = styled.div`
  padding: 24px;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

interface VideoContentManagerProps {
  // Add any props if needed
}

export const VideoContentManager: React.FC<VideoContentManagerProps> = () => {
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoContent | null>(null);
  const [form] = Form.useForm();
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [subtopics, setSubtopics] = useState<Array<{ id: string; name: string }>>([]); // You'll need to fetch this

  useEffect(() => {
    loadVideos();
    loadSubtopics();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/video-content');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      message.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const loadSubtopics = async () => {
    try {
      const response = await fetch('/api/admin/subtopics');
      const data = await response.json();
      setSubtopics(data);
    } catch (error) {
      message.error('Failed to load subtopics');
    }
  };

  const handleAdd = () => {
    setEditingVideo(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: VideoContent) => {
    setEditingVideo(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/video-content/${id}`, { method: 'DELETE' });
      message.success('Video deleted successfully');
      loadVideos();
    } catch (error) {
      message.error('Failed to delete video');
    }
  };

  const handleSubmit = async (values: CreateVideoContentInput | UpdateVideoContentInput) => {
    try {
      const url = editingVideo 
        ? `/api/admin/video-content/${editingVideo.id}`
        : '/api/admin/video-content';
      
      const method = editingVideo ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      message.success(`Video ${editingVideo ? 'updated' : 'added'} successfully`);
      setIsModalVisible(false);
      loadVideos();
    } catch (error) {
      message.error('Failed to save video');
    }
  };

  const columns = [
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
      title: 'Subtopic',
      dataIndex: 'subtopicId',
      key: 'subtopicId',
      render: (subtopicId: string) => 
        subtopics.find(s => s.id === subtopicId)?.name || subtopicId
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
      render: (text: boolean, record: VideoContent) => (
        <Space>
          {text ? 'Active' : 'Inactive'}
          {!record.is_active && <Tag color="red">Inactive</Tag>}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: VideoContent) => (
        <Space>
          <Button
            icon={<PlayCircleOutlined />}
            onClick={() => setPreviewVideoId(record.vimeo_id)}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this video?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <PageContainer>
      <HeaderContainer>
        <Title level={2}>Video Content Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Video
        </Button>
      </HeaderContainer>

      <Table
        columns={columns}
        dataSource={videos}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingVideo ? 'Edit Video' : 'Add New Video'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
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
            <Input.TextArea />
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
            name="vimeo_id"
            label="Video ID"
            rules={[{ required: true, message: 'Please enter video ID' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="subtopicId"
            label="Subtopic"
            rules={[{ required: true, message: 'Please select subtopic' }]}
          >
            <Select>
              {subtopics.map(subtopic => (
                <Select.Option key={subtopic.id} value={subtopic.id}>
                  {subtopic.name}
                </Select.Option>
              ))}
            </Select>
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
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags"
          >
            <Select mode="tags" />
          </Form.Item>

          {editingVideo && (
            <Form.Item
              name="is_active"
              label="Status"
              valuePropName="checked"
            >
              <Select>
                <Select.Option value={true}>Active</Select.Option>
                <Select.Option value={false}>Inactive</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingVideo ? 'Update' : 'Add'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <VimeoPlayer
        videoId={previewVideoId || ''}
        isOpen={!!previewVideoId}
        onClose={() => setPreviewVideoId(null)}
      />
    </PageContainer>
  );
}; 