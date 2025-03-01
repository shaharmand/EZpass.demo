import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Button, Input, Select, Tag, Typography, message, Modal, Tooltip, Row, Col, DatePicker } from 'antd';
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
  MenuOutlined,
  CalendarOutlined,
  ExportOutlined,
  CheckOutlined,
  StopOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons/lib/icons';
import { Link, useNavigate } from 'react-router-dom';
import { Question, QuestionType, ValidationStatus, QuestionStatus } from '../../../types/question';
import { questionStorage } from '../../../services/admin/questionStorage';
import { universalTopics } from '../../../services/universalTopics';
import type { ColumnType } from 'antd/lib/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/he';
import { questionLibrary, QuestionFilters } from '../../../services/questionLibrary';
import { getEnumTranslation, enumMappings } from '../../../utils/translations';
import { QuestionJsonData } from '../../../components/admin/QuestionJsonData';
import { Resizable, ResizeCallbackData } from 'react-resizable';

dayjs.extend(relativeTime);
dayjs.locale('he');

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { RangePicker } = DatePicker;

const tableStyles = `
  .react-resizable {
    position: relative;
    background-clip: padding-box;
  }

  .react-resizable-handle {
    position: absolute;
    width: 20px;
    height: 100%;
    bottom: 0;
    right: -10px;
    cursor: col-resize;
    z-index: 50;
  }

  .react-resizable-handle:hover::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 100%;
    background-color: #1890ff;
    transition: background-color 0.2s;
  }

  .ant-table-cell {
    position: relative;
  }

  .ant-table-container {
    overflow-x: auto;
  }

  .ant-table-header {
    overflow: visible !important;
    margin-bottom: 0 !important;
    background: #fafafa;
  }

  .clickable-row {
    cursor: pointer;
  }

  .clickable-row:hover {
    background: #fafafa;
  }
`;

type ResizableHeaderCellProps = {
  width?: number;
  onResize?: (e: React.SyntheticEvent<Element>, data: ResizeCallbackData) => void;
  style?: React.CSSProperties;
} & Omit<React.HTMLAttributes<any>, 'onResize'>;

const ResizableTitle = (props: ResizableHeaderCellProps) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      draggableOpts={{ 
        enableUserSelectHack: false,
        minConstraints: [100, 0],
        maxConstraints: [800, 0]
      }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export const QuestionLibraryPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filters, setFilters] = useState<QuestionFilters>({});

  const [sortedInfo, setSortedInfo] = useState<{
    columnKey?: string;
    order?: 'ascend' | 'descend';
  }>({});

  const [dateRange, setDateRange] = useState<[Date?, Date?]>([undefined, undefined]);

  const navigate = useNavigate();

  // Get unique subjects and their domains
  const subjects = universalTopics.getAllSubjects();
  const selectedSubject = subjects.find(s => s.id === filters.subject);
  const domains = selectedSubject?.domains || [];
  const selectedDomain = domains.find(d => d.id === filters.domain);
  const topics = selectedDomain?.topics || [];
  const selectedTopic = topics.find(t => t.id === filters.topic);
  const subtopics = selectedTopic?.subTopics || [];

  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    content: 300,
    topic: 150,
    subtopic: 150,
    type: 100,
    difficulty: 100,
    validation_status: 120,
    status: 120,
    createdAt: 150,
    updatedAt: 150,
    id: 140,
    actions: 100
  });

  // Load questions whenever filters change
  useEffect(() => {
    loadQuestions();
  }, [filters, searchText]);

  // Auto-select domain if there's only one option
  useEffect(() => {
    if (domains.length === 1 && !filters.domain) {
      const newFilters = {
        ...filters,
        domain: domains[0].id
      };
      setFilters(newFilters);
      questionLibrary.updateCurrentList(newFilters);
    }
  }, [filters.subject, domains]);

  // Reset dependent filters when parent filter changes
  useEffect(() => {
    if (!filters.subject) {
      setFilters(prev => ({ ...prev, domain: '', topic: '', subtopic: '' }));
    }
  }, [filters.subject]);

  useEffect(() => {
    if (!filters.domain) {
      setFilters(prev => ({ ...prev, topic: '', subtopic: '' }));
    }
  }, [filters.domain]);

  useEffect(() => {
    if (!filters.topic) {
      setFilters(prev => ({ ...prev, subtopic: '' }));
    }
  }, [filters.topic]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // Update filters in questionLibrary service
      await questionLibrary.updateCurrentList({
        ...filters,
        searchText: searchText || undefined
      });
      
      // Load questions from storage
      const loadedQuestions = await questionStorage.getFilteredQuestions({
        ...filters,
        searchText: searchText || undefined
      });

      // Filter out test questions with proper error handling
      const filteredQuestions = loadedQuestions.filter(question => {
        try {
          return question && typeof question.id === 'string' && !question.id.startsWith('test_');
        } catch (e) {
          console.warn('Malformed question object:', question);
          return false;
        }
      });
      
      setQuestions(filteredQuestions);
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

  const handleChange = (pagination: any, tableFilters: any, sorter: any) => {
    setSortedInfo(sorter);
    
    // Preserve existing filters and update only sort information
    const newFilters = {
      ...filters, // Keep existing filters
      sortBy: sorter.columnKey === 'createdAt' ? 'created_at' as const : 
              sorter.columnKey === 'updatedAt' ? 'updated_at' as const : undefined,
      sortOrder: sorter.order === 'ascend' ? 'asc' as const : 
                sorter.order === 'descend' ? 'desc' as const : undefined
    };
    
    setFilters(newFilters);
    questionLibrary.updateCurrentList(newFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    questionLibrary.updateCurrentList({
      ...filters,
      searchText: value || undefined
    });
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      const dateRange = {
        start: dates[0]?.toDate(),
        end: dates[1]?.toDate()
      };
      setDateRange([dateRange.start, dateRange.end]);
      const newFilters = {
        ...filters,
        dateRange
      };
      setFilters(newFilters);
      questionLibrary.updateCurrentList(newFilters);
    } else {
      setDateRange([undefined, undefined]);
      const newFilters = {
        ...filters,
        dateRange: undefined
      };
      setFilters(newFilters);
      questionLibrary.updateCurrentList(newFilters);
    }
  };

  const handleEditClick = async (questionId: string) => {
    try {
      const position = await questionLibrary.getCurrentPosition(questionId);
      navigate(`/admin/questions/${questionId}`);
    } catch (error) {
      console.error('Failed to get question position:', error);
      navigate(`/admin/questions/${questionId}`);
    }
  };

  const handleSubjectChange = (value: string) => {
    const newFilters = {
      ...filters,
      subject: value,
      domain: '',  // Reset dependent filters
      topic: '',    // Reset dependent filters
      subtopic: ''  // Reset subtopic when subject changes
    };
    setFilters(newFilters);
    questionLibrary.updateCurrentList(newFilters);
  };

  const handleDomainChange = (value: string) => {
    const newFilters = {
      ...filters,
      domain: value,
      topic: '',    // Reset dependent filter
      subtopic: ''  // Reset subtopic when domain changes
    };
    setFilters(newFilters);
    questionLibrary.updateCurrentList(newFilters);
  };

  const handleTopicChange = (value: string) => {
    const newFilters = {
      ...filters,
      topic: value,
      subtopic: ''  // Reset subtopic when topic changes
    };
    setFilters(newFilters);
    questionLibrary.updateCurrentList(newFilters);
  };

  const handleSubtopicChange = (value: string) => {
    const newFilters = {
      ...filters,
      subtopic: value
    };
    setFilters(newFilters);
    questionLibrary.updateCurrentList(newFilters);
  };

  // Add status change handler
  const handleStatusChange = (value: QuestionStatus | null) => {
    const newFilters = {
      ...filters,
      status: value
    };
    setFilters(newFilters);
    questionLibrary.updateCurrentList(newFilters);
  };

  const handleValidation_statusChange = (value: ValidationStatus | null) => {
    const newFilters = {
      ...filters,
      validation_status: value
    };
    setFilters(newFilters);
    questionLibrary.updateCurrentList(newFilters);
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
        return <Text>{getEnumTranslation('questionType', type as QuestionType)}</Text>;
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
      title: 'סטטוס תיקוף',
      dataIndex: 'validation_status',
      key: 'validation_status',
      width: 120,
      sorter: (a: any, b: any) => (a.validation_status || '').localeCompare(b.validation_status || ''),
      sortOrder: sortedInfo.columnKey === 'validation_status' ? sortedInfo.order : null,
      render: (validation_status: ValidationStatus) => {
        const statusColors = {
          [ValidationStatus.Valid]: 'success',
          [ValidationStatus.Warning]: 'warning',
          [ValidationStatus.Error]: 'error'
        };
        return <Tag color={statusColors[validation_status]}>
          {getEnumTranslation('validationStatus', validation_status)}
        </Tag>;
      }
    },
    {
      title: 'סטטוס',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: (a: any, b: any) => (a.status || '').localeCompare(b.status || ''),
      sortOrder: sortedInfo.columnKey === 'status' ? sortedInfo.order : null,
      render: (status: string) => {
        const statusColors = {
          draft: 'orange',
          approved: 'green'
        };
        const statusLabels = {
          imported: 'מיובא',
          generated: 'נוצר',
          draft: 'טיוטה',
          approved: 'מאושר'
        };
        return <Tag color={statusColors[status as keyof typeof statusColors]}>{statusLabels[status as keyof typeof statusLabels]}</Tag>;
      }
    },
    {
      title: 'נוצר',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'created_at' ? sortedInfo.order : null,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
          <Space>
            <CalendarOutlined />
            <Text style={{ direction: 'rtl' }}>{dayjs(date).locale('he').fromNow()}</Text>
          </Space>
        </Tooltip>
      )
    },
    {
      title: 'עודכן',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'updated_at' ? sortedInfo.order : null,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
          <Space>
            <ClockCircleOutlined />
            <Text style={{ direction: 'rtl' }}>{dayjs(date).locale('he').fromNow()}</Text>
          </Space>
        </Tooltip>
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
            onClick={() => handleEditClick(record.id)}
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

  const handleBulkDelete = () => {
    if (!selectedRowKeys.length) {
      message.warning('Please select questions to delete');
      return;
    }

    confirm({
      title: `Are you sure you want to delete ${selectedRowKeys.length} questions?`,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map(key => questionStorage.deleteQuestion(key.toString()))
          );
          message.success(`Successfully deleted ${selectedRowKeys.length} questions`);
          setSelectedRowKeys([]);
          loadQuestions();
        } catch (error) {
          message.error('Failed to delete some questions');
          console.error('Bulk delete error:', error);
        }
      },
    });
  };

  const handleBulkStatusUpdate = (status: QuestionStatus) => {
    if (!selectedRowKeys.length) {
      message.warning('Please select questions to update');
      return;
    }

    confirm({
      title: `Are you sure you want to mark ${selectedRowKeys.length} questions as ${status}?`,
      content: 'This will update the status of all selected questions.',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map(key => 
              questionStorage.updateQuestionStatus(key.toString(), status)
            )
          );
          message.success(`Successfully updated ${selectedRowKeys.length} questions`);
          setSelectedRowKeys([]);
          loadQuestions();
        } catch (error) {
          message.error('Failed to update some questions');
          console.error('Bulk status update error:', error);
        }
      },
    });
  };

  // Add handleResize function
  const handleResize = (index: number) => (e: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
    const column = columns[index];
    if (column.key) {
      const newColumnWidths = { ...columnWidths };
      newColumnWidths[column.key as string] = Math.max(100, size.width);
      setColumnWidths(newColumnWidths);
    }
  };

  // Map columns to resizable columns
  const resizableColumns = columns.map((col, index) => ({
    ...col,
    onHeaderCell: (column: ColumnType<Question>): ResizableHeaderCellProps => ({
      width: columnWidths[col.key as string],
      onResize: handleResize(index),
    }),
  })) as ColumnType<Question>[];

  return (
    <div className="question-library">
      <style>{tableStyles}</style>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Header */}
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

          {/* Filters */}
          <Row gutter={16}>
            <Col span={6}>
              <Input
                placeholder="חיפוש..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => handleSearchChange(e.target.value)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="נושא"
                value={filters.subject}
                onChange={handleSubjectChange}
                style={{ width: '100%' }}
                allowClear
              >
                {subjects.map(subject => (
                  <Option key={subject.id} value={subject.id}>{subject.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="תחום"
                value={filters.domain}
                onChange={handleDomainChange}
                style={{ width: '100%' }}
                allowClear
                disabled={!filters.subject}
              >
                {domains.map(domain => (
                  <Option key={domain.id} value={domain.id}>{domain.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="נושא"
                value={filters.topic}
                onChange={handleTopicChange}
                style={{ width: '100%' }}
                allowClear
                disabled={!filters.domain}
              >
                {topics.map(topic => (
                  <Option key={topic.id} value={topic.id}>{topic.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="תת נושא"
                value={filters.subtopic}
                onChange={handleSubtopicChange}
                style={{ width: '100%' }}
                allowClear
                disabled={!filters.topic}
              >
                {subtopics.map(subtopic => (
                  <Option key={subtopic.id} value={subtopic.id}>{subtopic.name}</Option>
                ))}
              </Select>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={6}>
              <Select
                placeholder="סטטוס"
                value={filters.status}
                onChange={handleStatusChange}
                style={{ width: '100%' }}
                allowClear
              >
                {Object.entries(enumMappings.status).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="סטטוס תיקוף"
                value={filters.validation_status}
                onChange={handleValidation_statusChange}
                style={{ width: '100%' }}
                allowClear
              >
                {Object.entries(enumMappings.validationStatus).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                placeholder={['תאריך התחלה', 'תאריך סיום']}
              />
            </Col>
          </Row>

          {/* Table */}
          <Table
            components={{
              header: {
                cell: ResizableTitle,
              },
            }}
            columns={resizableColumns}
            dataSource={questions.map(q => ({ ...q, key: q.id }))}
            loading={loading}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: setSelectedRowKeys
            }}
            onRow={(record) => ({
              onClick: () => handleEditClick(record.id),
              className: 'clickable-row'
            })}
            pagination={{ 
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `סה"כ ${total} שאלות`
            }}
            scroll={{ x: 'max-content' }}
            onChange={handleChange}
          />
        </Space>
      </Card>
    </div>
  );
}; 