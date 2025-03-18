import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { VideoContent, VideoSource } from '../../../types/videoContent';
import { VideoContentStorage } from '../../../services/admin/videoContentStorage';
import { getSupabase } from '../../../lib/supabase';
import { VideoPlayer } from '../../../components/practice/VideoPlayer';

const { Search } = Input;
const { Option } = Select;

const PageContainer = styled.div`
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 120px);
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const TableContainer = styled.div`
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 280px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  
  .ant-table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .ant-spin-nested-loading {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ant-spin-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ant-table {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ant-table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ant-table-header {
    flex-shrink: 0;
  }

  .ant-table-body {
    flex: 1;
    overflow: auto !important;
    min-height: 0;
    max-height: calc(100vh - 380px) !important;
  }

  .ant-table-pagination {
    flex-shrink: 0;
    margin: 16px 0 0 !important;
    padding: 0 8px;
    background: #fff;
    border-radius: 0 0 8px 8px;
  }
`;

export const VideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [previewVideoSource, setPreviewVideoSource] = useState<VideoSource>(VideoSource.VIMEO);
  const storage = new VideoContentStorage(getSupabase());

  const loadVideos = async () => {
    setLoading(true);
    try {
      const filters = {
        ...(searchText && { searchText }),
        ...(statusFilter !== undefined && { is_active: statusFilter }),
      };
      const data = await storage.getVideos(filters);
      setVideos(data);
    } catch (error) {
      message.error('Failed to load videos');
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [searchText, statusFilter]);

  const handleDelete = async (id: string) => {
    try {
      await storage.deleteVideo(id);
      message.success('Video deleted successfully');
      loadVideos();
    } catch (error) {
      message.error('Failed to delete video');
      console.error('Failed to delete video:', error);
    }
  };

  const handlePreview = (video: VideoContent) => {
    setPreviewVideoId(video.vimeo_id);
    setPreviewVideoSource(video.videoSource);
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
          <Tag color={record.videoSource === VideoSource.YOUTUBE ? 'red' : 'blue'}>
            {record.videoSource === VideoSource.YOUTUBE ? 'YouTube' : 'Vimeo'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200,
      render: (date: string) => {
        if (!date) return '-';
        try {
          return new Date(date).toLocaleString();
        } catch (e) {
          return '-';
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: VideoContent) => (
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handlePreview(record)}
          >
            Watch
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/videos/${record.id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this video?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <HeaderContainer>
        <h1>Video Library</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/videos/new')}
        >
          Add Video
        </Button>
      </HeaderContainer>

      <FilterContainer>
        <Search
          placeholder="Search videos..."
          allowClear
          onSearch={value => setSearchText(value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by status"
          allowClear
          style={{ width: 200 }}
          onChange={value => setStatusFilter(value)}
        >
          <Option value={true}>Active</Option>
          <Option value={false}>Inactive</Option>
        </Select>
      </FilterContainer>

      <TableContainer>
        <Table
          columns={columns}
          dataSource={videos}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 8,
            position: ['bottomCenter'],
            style: { margin: '16px 0' }
          }}
          scroll={{ y: 'calc(100vh - 380px)' }}
          style={{ height: '100%' }}
        />
      </TableContainer>

      <VideoPlayer
        videoSource={previewVideoSource}
        videoId={previewVideoId || ''}
        isOpen={!!previewVideoId}
        onClose={() => setPreviewVideoId(null)}
        title={videos.find(v => v.vimeo_id === previewVideoId)?.title || ''}
      />
    </PageContainer>
  );
}; 