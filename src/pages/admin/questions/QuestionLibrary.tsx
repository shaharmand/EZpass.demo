import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Button, Input, Select, Tag, Typography, message, Modal } from 'antd';
import { 
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  BookOutlined,
  ClockCircleOutlined
} from '@ant-design/icons/lib/icons';
import { Link, useNavigate } from 'react-router-dom';
import { Question } from '../../../types/question';
import { questionStorage } from '../../../services/admin/questionStorage';
import type { ColumnType } from 'antd/lib/table';

const { Title, Text } = Typography;
const { confirm } = Modal;

export const QuestionLibrary: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const loadedQuestions = await questionStorage.getAllQuestions();
      setQuestions(loadedQuestions);
    } catch (error) {
      message.error('Failed to load questions');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    confirm({
      title: 'Are you sure you want to delete this question?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await questionStorage.deleteQuestion(questionId);
          message.success('Question deleted successfully');
          loadQuestions(); // Reload the questions list
        } catch (error) {
          message.error('Failed to delete question');
          console.error('Delete error:', error);
        }
      },
    });
  };

  const columns: ColumnType<Question>[] = [
    {
      title: 'שאלה',
      dataIndex: 'content',
      key: 'content',
      render: (content: Question['content']) => (
        <Space>
          <BookOutlined style={{ color: '#1890ff' }} />
          <Text>{content.text.substring(0, 100)}...</Text>
        </Space>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        record.content.text.toLowerCase().includes(value.toString().toLowerCase())
    },
    {
      title: 'רמת קושי',
      dataIndex: ['metadata', 'difficulty'],
      key: 'difficulty',
      render: (difficulty: number) => (
        <Tag color={difficulty > 3 ? 'red' : difficulty > 1 ? 'orange' : 'green'}>
          <Space>
            <StarOutlined />
            <span>{difficulty}</span>
          </Space>
        </Tag>
      )
    },
    {
      title: 'זמן מוערך',
      dataIndex: ['metadata', 'estimatedTime'],
      key: 'estimatedTime',
      render: (time: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          <Text>{time} דקות</Text>
        </Space>
      )
    },
    {
      title: 'פעולות',
      key: 'actions',
      render: (_: any, record: Question) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/questions/${record.id}`)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>ספריית שאלות</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/questions/new')}
        >
          צור שאלה
        </Button>
      </div>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.Search
            placeholder="חפש שאלות..."
            allowClear
            onSearch={value => setSearchText(value)}
            size="large"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ maxWidth: '400px' }}
          />

          <Table
            columns={columns}
            dataSource={questions}
            rowKey="id"
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys
            }}
          />
        </Space>
      </Card>
    </Space>
  );
}; 