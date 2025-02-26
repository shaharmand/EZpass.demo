import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Button, Input, Select, Tag, Typography, message, Modal, Tooltip, Row, Col } from 'antd';
import { 
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  BookOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  FolderOutlined,
  FileTextOutlined,
  MenuOutlined
} from '@ant-design/icons/lib/icons';
import { Link, useNavigate } from 'react-router-dom';
import { Question, QuestionType } from '../../../types/question';
import { questionStorage } from '../../../services/admin/questionStorage';
import { universalTopics } from '../../../services/universalTopics';
import type { ColumnType } from 'antd/lib/table';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;

// Add CSS for resizable columns
const tableStyles = `
  .ant-table-thead th {
    position: relative;
    border-right: 1px solid #f0f0f0;
  }
  
  .ant-table-thead th::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 4px;
    height: 100%;
    background-color: transparent;
    cursor: col-resize;
  }

  .ant-table-thead th:hover::after {
    background-color: #1890ff;
  }
`;

export const QuestionLibrary: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filters, setFilters] = useState({
    subject: '',
    domain: '',
    topic: '',
    type: '',
    difficulty: undefined as number | undefined
  });

  const [sortedInfo, setSortedInfo] = useState<{
    columnKey?: string;
    order?: 'ascend' | 'descend';
  }>({});

  const navigate = useNavigate();

  // Get unique subjects and their domains
  const subjects = universalTopics.getAllSubjects();
  const selectedSubject = subjects.find(s => s.id === filters.subject);
  const domains = selectedSubject?.domains || [];
  const selectedDomain = domains.find(d => d.id === filters.domain);
  const topics = selectedDomain?.topics || [];

  // Load questions whenever filters change
  useEffect(() => {
    loadQuestions();
  }, [filters, searchText]);

  // Reset dependent filters when parent filter changes
  useEffect(() => {
    if (!filters.subject) {
      setFilters(prev => ({ ...prev, domain: '', topic: '' }));
    }
  }, [filters.subject]);

  useEffect(() => {
    if (!filters.domain) {
      setFilters(prev => ({ ...prev, topic: '' }));
    }
  }, [filters.domain]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const loadedQuestions = await questionStorage.getFilteredQuestions({
        ...filters,
        searchText: searchText || undefined
      });
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
          loadQuestions();
        } catch (error) {
          message.error('Failed to delete question');
          console.error('Delete error:', error);
        }
      },
    });
  };

  const handleChange = (pagination: any, filters: any, sorter: any) => {
    setSortedInfo(sorter);
  };

  const columns: ColumnType<Question>[] = [
    {
      title: 'תוכן',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
      sorter: (a, b) => (a.content?.text || '').localeCompare(b.content?.text || ''),
      sortOrder: sortedInfo.columnKey === 'content' ? sortedInfo.order : null,
      render: (content: Question['content']) => (
        <Tooltip title={content?.text || 'No content'}>
          <Text>{content?.text ? `${content.text.substring(0, 100)}...` : 'No content'}</Text>
        </Tooltip>
      )
    },
    {
      title: 'נושא',
      key: 'topic',
      width: 150,
      ellipsis: true,
      sorter: (a, b) => {
        const topicA = universalTopics.getTopic(a.metadata?.topicId || '')?.name || '';
        const topicB = universalTopics.getTopic(b.metadata?.topicId || '')?.name || '';
        return topicA.localeCompare(topicB);
      },
      sortOrder: sortedInfo.columnKey === 'topic' ? sortedInfo.order : null,
      render: (_, record: Question) => {
        const topic = record.metadata?.topicId ? 
          universalTopics.getTopic(record.metadata.topicId) : 
          undefined;
        return topic?.name || 'N/A';
      }
    },
    {
      title: 'תת נושא',
      key: 'subtopic',
      width: 150,
      ellipsis: true,
      sorter: (a, b) => {
        const subtopicA = a.metadata?.subtopicId ? 
          universalTopics.getSubtopicInfo(a.metadata.topicId, a.metadata.subtopicId)?.name || '' : '';
        const subtopicB = b.metadata?.subtopicId ? 
          universalTopics.getSubtopicInfo(b.metadata.topicId, b.metadata.subtopicId)?.name || '' : '';
        return subtopicA.localeCompare(subtopicB);
      },
      sortOrder: sortedInfo.columnKey === 'subtopic' ? sortedInfo.order : null,
      render: (_, record: Question) => {
        if (!record.metadata?.topicId || !record.metadata?.subtopicId) return 'N/A';
        const subtopic = universalTopics.getSubtopicInfo(
          record.metadata.topicId,
          record.metadata.subtopicId
        );
        return subtopic?.name || 'N/A';
      }
    },
    {
      title: 'סוג',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      ellipsis: true,
      sorter: (a, b) => a.type.localeCompare(b.type),
      sortOrder: sortedInfo.columnKey === 'type' ? sortedInfo.order : null,
      render: (type: string) => {
        const typeLabels = {
          multiple_choice: 'רב ברירה',
          open: 'פתוח',
          code: 'קוד',
          step_by_step: 'שלב אחר שלב'
        };
        return <Text>{typeLabels[type as keyof typeof typeLabels] || type}</Text>;
      }
    },
    {
      title: 'רמת קושי',
      dataIndex: ['metadata', 'difficulty'],
      key: 'difficulty',
      width: 100,
      sorter: (a, b) => (a.metadata?.difficulty || 0) - (b.metadata?.difficulty || 0),
      sortOrder: sortedInfo.columnKey === 'difficulty' ? sortedInfo.order : null,
      render: (difficulty: number) => (
        <Tag color={difficulty > 3 ? 'error' : undefined}>
          <Space>
            <StarOutlined />
            <span>{difficulty || 'N/A'}</span>
          </Space>
        </Tag>
      )
    },
    {
      title: 'מזהה',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      ellipsis: true,
      sorter: (a, b) => a.id.localeCompare(b.id),
      sortOrder: sortedInfo.columnKey === 'id' ? sortedInfo.order : null,
      render: (id: string) => (
        <Text style={{ direction: 'ltr' }} copyable>{id}</Text>
      )
    },
    {
      title: 'פעולות',
      key: 'actions',
      width: 100,
      fixed: 'right',
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
    <>
      <style>{tableStyles}</style>
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
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Select
                  placeholder="תחום לימוד"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.subject}
                  onChange={value => setFilters(prev => ({ ...prev, subject: value }))}
                >
                  {subjects.map(subject => (
                    <Option key={subject.id} value={subject.id}>{subject.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="נושא"
                  style={{ width: '100%' }}
                  allowClear
                  disabled={!filters.subject}
                  value={filters.domain}
                  onChange={value => setFilters(prev => ({ ...prev, domain: value }))}
                >
                  {domains.map(domain => (
                    <Option key={domain.id} value={domain.id}>{domain.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="תת נושא"
                  style={{ width: '100%' }}
                  allowClear
                  disabled={!filters.domain}
                  value={filters.topic}
                  onChange={value => setFilters(prev => ({ ...prev, topic: value }))}
                >
                  {topics.map(topic => (
                    <Option key={topic.id} value={topic.id}>{topic.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Input.Search
                  placeholder="חפש שאלות..."
                  allowClear
                  onSearch={value => setSearchText(value)}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <Select
                  placeholder="סוג שאלה"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.type}
                  onChange={value => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <Option value="multiple_choice">רב ברירה</Option>
                  <Option value="open">פתוח</Option>
                  <Option value="code">קוד</Option>
                  <Option value="step_by_step">שלב אחר שלב</Option>
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="רמת קושי"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.difficulty}
                  onChange={value => setFilters(prev => ({ ...prev, difficulty: value }))}
                >
                  {[1, 2, 3, 4, 5].map(level => (
                    <Option key={level} value={level}>{level}</Option>
                  ))}
                </Select>
              </Col>
            </Row>

            <Table<Question>
              columns={columns}
              dataSource={questions.map(q => ({ ...q, key: q.id }))}
              loading={loading}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys
              }}
              pagination={{ 
                defaultPageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `סה"כ ${total} שאלות`
              }}
              scroll={{ x: 1200 }}
              onChange={handleChange}
            />
          </Space>
        </Card>
      </Space>
    </>
  );
}; 