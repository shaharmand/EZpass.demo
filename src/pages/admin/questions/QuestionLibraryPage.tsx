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
  ExclamationCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons/lib/icons';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Question, 
  DatabaseQuestion,
  ValidationStatus,
  QuestionType,
  PublicationStatusEnum,
  ImportInfo,
  DifficultyLevel
} from '../../../types/question';
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
import styled from 'styled-components';
import { debounce } from 'lodash';

dayjs.extend(relativeTime);
dayjs.locale('he');

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 32px;
`;

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

type TableQuestion = DatabaseQuestion & { key: string };

const StatsCard = styled(Card)`
  margin-bottom: 16px;
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .stat-group {
    padding: 12px;
    border-radius: 8px;
    background: #fafafa;
  }

  .stat-title {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 500;
    color: #262626;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    &.active {
      background: #e6f4ff;
    }
  }

  .stat-label {
    font-size: 14px;
  }

  .stat-number {
    font-weight: 500;
  }
`;

export const QuestionLibraryPage: React.FC = () => {
  const [questions, setQuestions] = useState<DatabaseQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [statistics, setStatistics] = useState<any>(null);

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

  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    content: 300,
    topic: 150,
    subtopic: 150,
    type: 100,
    difficulty: 100,
    validation_status: 120,
    publication_status: 120,
    createdAt: 150,
    updatedAt: 150,
    id: 140,
    actions: 100,
    source: 150
  });

  // Add new state for active filters
  const [activeStatFilter, setActiveStatFilter] = useState<{
    type: 'publication' | 'review' | 'validation';
    value: string;
  } | null>(null);

  // Debounced search handler
  const debouncedSearch = React.useCallback(
    debounce((value: string) => {
      setFilters(prev => ({
        ...prev,
        searchText: value || undefined
      }));
    }, 500),
    []
  );

  // Load questions whenever filters change
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const loadedQuestions = await questionStorage.getFilteredQuestions(filters);
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
        console.error('Failed to load questions:', error);
        message.error('Failed to load questions. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [filters]); // Only depend on filters

  // Auto-select domain if there's only one option - with safeguard
  useEffect(() => {
    if (domains.length === 1 && !filters.domain && !filters.topic && !filters.subtopic) {
      questionLibrary.updateCurrentList({
        ...filters,
        domain: domains[0].id
      });
    }
  }, [filters.subject]); // Only depend on subject change

  // Reset dependent filters when parent filter changes - with safeguard
  useEffect(() => {
    if (!filters.subject && (filters.domain || filters.topic || filters.subtopic)) {
      setFilters(prev => ({ ...prev, domain: '', topic: '', subtopic: '' }));
    }
  }, [filters.subject]);

  useEffect(() => {
    if (!filters.domain && (filters.topic || filters.subtopic)) {
      setFilters(prev => ({ ...prev, topic: '', subtopic: '' }));
    }
  }, [filters.domain]);

  useEffect(() => {
    if (!filters.topic && filters.subtopic) {
      setFilters(prev => ({ ...prev, subtopic: '' }));
    }
  }, [filters.topic]);

  // Load statistics
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const stats = await questionStorage.getQuestionStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      message.error('Failed to load question statistics');
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

  // Handle search changes through debounce
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      const dateRange = {
        start: dates[0]?.toDate(),
        end: dates[1]?.toDate()
      };
      setDateRange([dateRange.start, dateRange.end]);
      setFilters(prev => ({
        ...prev,
        dateRange
      }));
    } else {
      setDateRange([undefined, undefined]);
      setFilters(prev => ({
        ...prev,
        dateRange: undefined
      }));
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
    setFilters(prev => ({
      ...prev,
      subject: value,
      domain: '',  // Reset dependent filters
      topic: '',   // Reset dependent filters
      subtopic: '' // Reset subtopic when subject changes
    }));
  };

  const handleDomainChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      domain: value,
      topic: '',    // Reset dependent filter
      subtopic: ''  // Reset subtopic when domain changes
    }));
  };

  const handleTopicChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      topic: value,
      subtopic: undefined  // Reset subtopic when topic changes
    }));
  };

  const handleSubtopicChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      subtopic: value
    }));
  };

  // Add status change handler
  const handleStatusChange = (value: PublicationStatusEnum | null) => {
    setFilters(prev => ({
      ...prev,
      publication_status: value
    }));
  };

  const handleValidation_statusChange = (value: ValidationStatus | null) => {
    setFilters(prev => ({
      ...prev,
      validation_status: value
    }));
  };

  const getStatusColor = (status: PublicationStatusEnum) => {
    switch (status) {
      case PublicationStatusEnum.PUBLISHED:
        return 'green';
      case PublicationStatusEnum.ARCHIVED:
        return 'red';
      case PublicationStatusEnum.DRAFT:
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Add handlers for stat clicks
  const handleStatClick = (type: 'publication' | 'review' | 'validation', value: string) => {
    // If clicking the same filter, clear it
    if (activeStatFilter?.type === type && activeStatFilter?.value === value) {
      setActiveStatFilter(null);
      setFilters(prev => ({
        ...prev,
        publication_status: undefined,
        validation_status: undefined
      }));
      return;
    }

    setActiveStatFilter({ type, value });

    // Update filters based on the stat type
    switch (type) {
      case 'publication':
        setFilters(prev => ({
          ...prev,
          publication_status: value as PublicationStatusEnum,
          validation_status: undefined // Clear other filters
        }));
        break;
      case 'review':
        if (value === 'pending') {
          setFilters(prev => ({
            ...prev,
            review_status: 'PENDING_REVIEW',
            validation_status: undefined,
            publication_status: undefined
          }));
        }
        break;
      case 'validation':
        setFilters(prev => ({
          ...prev,
          validation_status: value as ValidationStatus,
          publication_status: undefined // Clear other filters
        }));
        break;
    }
  };

  const columns: ColumnType<TableQuestion>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: columnWidths.id,
      fixed: 'left',
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: 'תוכן',
      dataIndex: 'content',
      key: 'content',
      width: columnWidths.content,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Text strong style={{ fontSize: '14px', marginBottom: '4px' }}>{record.name || 'ללא שם'}</Text>
          <Text style={{ fontSize: '13px', whiteSpace: 'normal', lineHeight: '1.5' }}>
            {record.content?.text?.substring(0, 100)}...
          </Text>
        </div>
      ),
    },
    {
      title: 'סוג',
      dataIndex: ['metadata', 'type'],
      key: 'type',
      width: columnWidths.type,
      filters: [
        { text: 'רב-ברירה', value: QuestionType.MULTIPLE_CHOICE },
        { text: 'מספרי', value: QuestionType.NUMERICAL },
        { text: 'פתוח', value: QuestionType.OPEN }
      ],
      render: (type: QuestionType) => {
        const color = type === QuestionType.MULTIPLE_CHOICE ? 'blue' : 
                     type === QuestionType.NUMERICAL ? 'green' : 'orange';
        return (
          <Tag color={color}>
            {getEnumTranslation('questionType', type)}
          </Tag>
        );
      },
    },
    {
      title: 'רמת קושי',
      dataIndex: ['metadata', 'difficulty'],
      key: 'difficulty',
      width: columnWidths.difficulty,
      filters: [1, 2, 3, 4, 5].map(level => ({
        text: `רמה ${level}`,
        value: level
      })),
      render: (difficulty: number) => (
        <Tag color={['', 'green', 'cyan', 'blue', 'purple', 'red'][difficulty]}>
          {difficulty}
        </Tag>
      ),
    },
    {
      title: 'סטטוס תיקוף',
      dataIndex: 'validation_status',
      key: 'validation_status',
      width: columnWidths.validation_status,
      render: (_, record: DatabaseQuestion) => {
        const status = record.validation_status;
        const statusConfig = {
          [ValidationStatus.VALID]: { color: 'green', text: 'תקין', icon: <CheckOutlined /> },
          [ValidationStatus.WARNING]: { color: 'orange', text: 'אזהרות', icon: <WarningOutlined /> },
          [ValidationStatus.ERROR]: { color: 'red', text: 'שגיאות תיקוף', icon: <CloseCircleOutlined /> }
        };
        
        const config = statusConfig[status];
        return (
          <Tooltip title={`סטטוס תיקוף: ${config.text}`}>
            <Tag color={config.color} icon={config.icon} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {config.text}
            </Tag>
          </Tooltip>
        );
      },
      filters: [
        { text: 'תקין', value: ValidationStatus.VALID },
        { text: 'אזהרות', value: ValidationStatus.WARNING },
        { text: 'שגיאות תיקוף', value: ValidationStatus.ERROR }
      ],
      onFilter: (value, record) => record.validation_status === value,
    },
    {
      title: 'סטטוס פרסום',
      dataIndex: 'publication_status',
      key: 'publication_status',
      width: columnWidths.publication_status,
      filters: Object.entries(enumMappings.publication_status).map(([value]) => ({
        text: getEnumTranslation('publication_status', value as PublicationStatusEnum),
        value: value
      })),
      render: (status: PublicationStatusEnum) => (
        <Tag color={getStatusColor(status)}>
          {getEnumTranslation('publication_status', status)}
        </Tag>
      ),
    },
    {
      title: 'מקור',
      dataIndex: ['metadata', 'source'],
      key: 'source',
      width: columnWidths.source,
      render: (source: Question['metadata']['source']) => {
        if (!source) return <Tag>Unknown</Tag>;
        
        if (source.type === 'exam') {
          return <Tag color="blue">{`Exam ${source.year} ${source.season} ${source.moed}`}</Tag>;
        }
        return <Tag color="green">{source.type}</Tag>;
      }
    },
    {
      title: 'פעולות',
      key: 'actions',
      width: columnWidths.actions,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="ערוך">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(record.id);
              }} 
            />
          </Tooltip>
          <Tooltip title="מחק">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(record.id);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ] as ColumnType<TableQuestion>[];

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

  const handleBulkStatusUpdate = (status: PublicationStatusEnum) => {
    if (!selectedRowKeys.length) {
      message.warning('Please select questions to update');
      return;
    }

    confirm({
      title: `Are you sure you want to update ${selectedRowKeys.length} questions to ${status}?`,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'primary',
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

  return (
    <PageContainer>
      <Space direction="vertical" style={{ width: '100%' }}>
        {statistics && (
          <StatsCard>
            <div className="stats-grid">
              <div className="stat-group">
                <div className="stat-title">סטטוס פרסום</div>
                <div 
                  className={`stat-item ${activeStatFilter?.type === 'publication' && activeStatFilter?.value === PublicationStatusEnum.PUBLISHED ? 'active' : ''}`}
                  onClick={() => handleStatClick('publication', PublicationStatusEnum.PUBLISHED)}
                >
                  <Tag color="success">פורסם</Tag>
                  <span className="stat-number">{statistics.publication.published}</span>
                </div>
                <div 
                  className={`stat-item ${activeStatFilter?.type === 'publication' && activeStatFilter?.value === PublicationStatusEnum.DRAFT ? 'active' : ''}`}
                  onClick={() => handleStatClick('publication', PublicationStatusEnum.DRAFT)}
                >
                  <Tag>טיוטה</Tag>
                  <span className="stat-number">{statistics.publication.draft}</span>
                </div>
              </div>

              <div className="stat-group">
                <div className="stat-title">סטטוס בדיקה</div>
                <div 
                  className={`stat-item ${activeStatFilter?.type === 'review' && activeStatFilter?.value === 'pending' ? 'active' : ''}`}
                  onClick={() => handleStatClick('review', 'pending')}
                >
                  <Tag color="processing">ממתין לבדיקה</Tag>
                  <span className="stat-number">{statistics.review.pending}</span>
                </div>
                <div className="stat-item">
                  <Tag>סה״כ שאלות</Tag>
                  <span className="stat-number">{statistics.review.total}</span>
                </div>
              </div>

              <div className="stat-group">
                <div className="stat-title">תקינות</div>
                <div 
                  className={`stat-item ${activeStatFilter?.type === 'validation' && activeStatFilter?.value === ValidationStatus.ERROR ? 'active' : ''}`}
                  onClick={() => handleStatClick('validation', ValidationStatus.ERROR)}
                >
                  <Tag color="error">שגיאות</Tag>
                  <span className="stat-number">{statistics.validation.error}</span>
                </div>
                <div 
                  className={`stat-item ${activeStatFilter?.type === 'validation' && activeStatFilter?.value === ValidationStatus.WARNING ? 'active' : ''}`}
                  onClick={() => handleStatClick('validation', ValidationStatus.WARNING)}
                >
                  <Tag color="warning">אזהרות</Tag>
                  <span className="stat-number">{statistics.validation.warning}</span>
                </div>
                <div 
                  className={`stat-item ${activeStatFilter?.type === 'validation' && activeStatFilter?.value === ValidationStatus.VALID ? 'active' : ''}`}
                  onClick={() => handleStatClick('validation', ValidationStatus.VALID)}
                >
                  <Tag color="success">תקין</Tag>
                  <span className="stat-number">{statistics.validation.valid}</span>
                </div>
              </div>
            </div>
          </StatsCard>
        )}

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
                  options={selectedTopic?.subTopics.map(subtopic => ({
                    label: subtopic.name,
                    value: subtopic.id
                  })) || []}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={6}>
                <Select
                  placeholder="סטטוס"
                  value={filters.publication_status}
                  onChange={handleStatusChange}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {Object.entries(enumMappings.publication_status).map(([value, label]) => (
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
              columns={columns as any}
              dataSource={questions.map(q => ({ ...q, key: q.id } as TableQuestion))}
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
      </Space>
    </PageContainer>
  );
}; 