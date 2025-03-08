import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Space, Button, Input, Select, Tag, Typography, message, Modal, Tooltip, Row, Col, DatePicker, InputNumber, Popover, Form } from 'antd';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  RowSelectionState,
  ColumnResizeMode,
  SortingState,
  OnChangeFn
} from '@tanstack/react-table';
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
  CloseCircleOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  UserOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons/lib/icons';
import { Link, useNavigate } from 'react-router-dom';
import { 
  QuestionListItem,
  QuestionType,
  DifficultyLevel,
  PublicationStatusEnum,
  ValidationStatus,
  DatabaseQuestion,
  Question,
  ReviewStatusEnum,
  SourceType,
  EzpassCreatorType,
  PUBLICATION_STATUS_DESCRIPTIONS,
  REVIEW_STATUS_DESCRIPTIONS
} from '../../../types/question';
import { SubTopic } from '../../../types/subject';
import { questionStorage } from '../../../services/admin/questionStorage';
import { universalTopics } from '../../../services/universalTopics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/he';
import { questionLibrary, QuestionFilters } from '../../../services/questionLibrary';
import { getEnumTranslation, enumMappings } from '../../../utils/translations';
import styled from 'styled-components';
import { debounce } from 'lodash';

dayjs.extend(relativeTime);
dayjs.locale('he');

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PageContainer = styled.div`
  width: 100%;
  padding: 0 16px 32px;
  box-sizing: border-box;
`;

const TableStyles = styled.div`
  direction: rtl;
  width: 100%;
  overflow: hidden;
  
  .table-container {
    width: 100%;
    overflow-x: auto;
    margin: 0 -16px;
    padding: 0 16px;
    
    &::-webkit-scrollbar {
      height: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f0f0f0;
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 4px;
      
      &:hover {
        background: #bbb;
      }
    }
  }
  
  table {
    width: max-content;
    min-width: 100%;
    border-spacing: 0;
    
    th, td {
      margin: 0;
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
      white-space: nowrap;
      position: relative;
      
      &:last-child {
        border-right: 0;
      }
    }

    th {
      background: #fafafa;
      font-weight: 500;
      text-align: right;
      position: relative;
      white-space: nowrap;
      color: #666;
      padding: 12px;
      user-select: none;
      
      &.sortable {
        cursor: pointer;
        
        &:hover {
          background: #f0f0f0;
        }
      }

      .resizer {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 5px;
        background: rgba(0, 0, 0, 0.05);
        cursor: col-resize;
        user-select: none;
        touch-action: none;
        opacity: 0;
        transition: opacity 0.2s;

        &.isResizing {
          background: #2196f3;
          opacity: 1;
        }
        
        &:hover {
          opacity: 1;
        }
      }

      &:hover .resizer {
        opacity: 1;
      }
    }

    td {
      text-align: right;
      background: #fff;
    }
    
    tbody tr {
      &:hover {
        background-color: #fafafa;
        
        td {
          background-color: #fafafa;
        }
      }
      
      &.selected {
        background-color: #e6f7ff;
        
        td {
          background-color: #e6f7ff;
        }
      }

      .content-cell {
        max-width: 400px;
        min-width: 300px;
        
        .content-title {
          font-weight: 500;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .content-text {
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          white-space: normal;
          line-height: 1.4;
        }
      }
    }
  }
`;

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

type ValidationStatusConfig = {
  [key in ValidationStatus]: {
    color: string;
    text: string;
    icon: React.ReactNode;
  }
};

interface ValidationStatistics {
  validation: Record<ValidationStatus, number>;
}

// Modify the EditableCell styled component
const EditableCell = styled.div`
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s;
  
  &.editable {
    cursor: pointer;
    
    &:hover {
      background: #f5f5f5;
    }
  }
  
  &.editing {
    padding: 0;
    background: #fff;
    border: 1px solid #d9d9d9;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    justify-content: flex-end;
  }
`;

const StyledRow = styled.tr`
  &:hover {
    background-color: #f5f5f5;
    
    td {
      background-color: #f5f5f5;
    }
  }
`;

export function QuestionLibraryPage() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [statistics, setStatistics] = useState<ValidationStatistics | null>(null);
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [form] = Form.useForm();

  const navigate = useNavigate();

  // Get unique subjects and their domains
  const subjects = universalTopics.getAllSubjects();
  const selectedSubject = subjects.find(s => s.id === filters.subject);
  const domains = selectedSubject?.domains || [];
  const selectedDomain = domains.find(d => d.id === filters.domain);
  const topics = selectedDomain?.topics || [];
  const selectedTopic = topics.find(t => t.id === filters.topic);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setFilters(prev => ({
        ...prev,
        searchText: value || undefined
      }));
    }, 500),
    []
  );

  // Keep existing handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleEditClick = useCallback((questionId: string) => {
    navigate(`/admin/questions/${questionId}`);
  }, [navigate]);

  // Add loadQuestions function
  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const loadedQuestions = await questionStorage.getFilteredQuestions(filters);
      const filteredQuestions = loadedQuestions
        .filter(question => question && typeof question.id === 'string' && !question.id.startsWith('test_'))
        .map(question => {
          let mappedSource: QuestionListItem['metadata']['source'] = undefined;
          if (question.data.metadata.source) {
            if (question.data.metadata.source.type === 'exam') {
              mappedSource = {
                type: SourceType.EXAM,
                examTemplateId: question.data.metadata.source.examTemplateId,
                year: question.data.metadata.source.year,
                season: question.data.metadata.source.season,
                moed: question.data.metadata.source.moed
              };
            } else if (question.data.metadata.source.type === 'ezpass') {
              mappedSource = {
                type: SourceType.EZPASS,
                creatorType: question.data.metadata.source.creatorType
              };
            }
          }

          return {
            id: question.id,
            name: question.data.name || 'Untitled',
            content: {
              text: typeof question.data.content === 'string' ? question.data.content : 
                    typeof question.data.content === 'object' && 'text' in question.data.content ? question.data.content.text :
                    JSON.stringify(question.data.content),
              format: 'markdown' as const
            },
            metadata: {
              subjectId: question.data.metadata.subjectId,
              domainId: question.data.metadata.domainId,
              topicId: question.data.metadata.topicId,
              subtopicId: question.data.metadata.subtopicId || '',
              type: question.data.metadata.type,
              difficulty: question.data.metadata.difficulty,
              estimatedTime: question.data.metadata.estimatedTime || 0,
              answerFormat: question.data.metadata.answerFormat,
              source: mappedSource
            },
            validation_status: question.validation_status,
            publication_status: question.publication_status,
            review_status: question.review_status,
            review_metadata: question.review_metadata,
            ai_generated_fields: question.ai_generated_fields,
            import_info: question.import_info,
            created_at: question.created_at,
            updated_at: question.updated_at
          };
        });
      setQuestions(filteredQuestions);
    } catch (error) {
      message.error('Failed to load questions');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Add useEffect for loading questions
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleSaveEdit = async (questionId: string, field: string, value: any) => {
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const updatedQuestion: QuestionListItem = {
        ...question,
        metadata: {
          ...question.metadata,
        }
      };
      
      switch (field) {
        case 'topic':
          updatedQuestion.metadata.topicId = value.topicId;
          updatedQuestion.metadata.subtopicId = value.subtopicId;
          break;
        case 'difficulty':
          updatedQuestion.metadata.difficulty = value as DifficultyLevel;
          break;
        case 'estimatedTime':
          updatedQuestion.metadata.estimatedTime = value as number;
          break;
        case 'type':
          updatedQuestion.metadata.type = value as QuestionType;
          break;
        case 'name':
          updatedQuestion.name = value;
          break;
      }

      await questionStorage.updateQuestion(questionId, updatedQuestion);
      await loadQuestions();
      setEditingCell(null);
      message.success('שינויים נשמרו בהצלחה');
    } catch (error) {
      message.error('שגיאה בשמירת השינויים');
      console.error('Save error:', error);
    }
  };

  const columns = useMemo<ColumnDef<QuestionListItem>[]>(
    () => [
      {
        id: 'actions',
        header: 'פעולות',
        size: 100,
        cell: ({ row }) => (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(row.original.id)}
          >
            ערוך
          </Button>
        ),
      },
      {
        id: 'id',
        header: 'ID',
        accessorKey: 'id',
        size: 120,
        cell: ({ getValue }) => {
          const id = getValue() as string;
          return id.replace(/^(\w+)-(\w+)-(\d+)$/, '$1-$2-$3');
        },
      },
      {
        id: 'content',
        header: 'תוכן',
        accessorKey: 'content',
        size: 400,
        cell: ({ row }) => {
          const isEditing = editingCell?.id === row.original.id && editingCell?.field === 'name';
          
          if (isEditing) {
            return (
              <Form form={form} initialValues={{ name: row.original.name }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item name="name">
                    <Input
                      style={{ width: '100%' }}
                      autoFocus
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                    />
                  </Form.Item>
                  <div className="edit-actions">
                    <Button 
                      size="small" 
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        const values = form.getFieldsValue();
                        handleSaveEdit(row.original.id, 'name', values.name);
                      }}
                    />
                  </div>
                </Space>
              </Form>
            );
          }

          return (
            <div className="content-cell">
              <EditableCell
                className="editable"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCell({ id: row.original.id, field: 'name' });
                }}
              >
                <div className="content-title">{row.original.name || 'Untitled'}</div>
              </EditableCell>
              <div className="content-text">
                {row.original.content.text}
              </div>
            </div>
          );
        },
      },
      {
        id: 'topic',
        header: 'נושא',
        accessorKey: 'metadata.topicId',
        size: 200,
        cell: ({ row }) => {
          const topicId = row.original.metadata.topicId;
          const subtopicId = row.original.metadata.subtopicId;
          const subject = universalTopics.getSubjectForTopic(topicId);
          const domain = subject?.domains.find(d => d.topics.some(t => t.id === topicId));
          const topic = domain?.topics.find(t => t.id === topicId);
          const subtopic = universalTopics.getSubtopicInfo(topicId, subtopicId);

          return (
            <div>
              <div>{topic?.name || topicId}</div>
              {subtopic && <small style={{ color: '#666' }}>{subtopic.name}</small>}
            </div>
          );
        },
      },
      {
        id: 'difficulty',
        header: 'רמת קושי',
        accessorKey: 'metadata.difficulty',
        size: 100,
        cell: ({ row }) => {
          const isEditing = editingCell?.id === row.original.id && editingCell?.field === 'difficulty';
          const difficulty = row.original.metadata.difficulty;

          if (isEditing) {
            return (
              <Form form={form} initialValues={{ difficulty }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item name="difficulty">
                    <Select 
                      style={{ width: '100%' }}
                      autoFocus
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                    >
                      {[1, 2, 3, 4, 5].map(level => (
                        <Option key={level} value={level}>{level}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <div className="edit-actions">
                    <Button 
                      size="small" 
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        const values = form.getFieldsValue();
                        handleSaveEdit(row.original.id, 'difficulty', values.difficulty);
                      }}
                    />
                  </div>
                </Space>
              </Form>
            );
          }

          return (
            <EditableCell
              className="editable"
              onClick={(e) => {
                e.stopPropagation();
                setEditingCell({ id: row.original.id, field: 'difficulty' });
              }}
            >
              <Tag color={['', 'green', 'cyan', 'blue', 'purple', 'red'][difficulty]}>
                {difficulty}
              </Tag>
            </EditableCell>
          );
        },
      },
      {
        id: 'estimatedTime',
        header: 'זמן מוערך',
        accessorKey: 'metadata.estimatedTime',
        size: 120,
        cell: ({ row }) => {
          const isEditing = editingCell?.id === row.original.id && editingCell?.field === 'estimatedTime';
          const estimatedTime = row.original.metadata.estimatedTime || 0;

          if (isEditing) {
            return (
              <Form form={form} initialValues={{ estimatedTime }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item name="estimatedTime">
                    <InputNumber
                      min={0}
                      max={180}
                      style={{ width: '100%' }}
                      autoFocus
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                      formatter={(value?: number) => value != null ? `${value} דקות` : ''}
                      parser={(displayValue?: string) => {
                        if (!displayValue) return 0;
                        const parsed = parseInt(displayValue.replace(/[^\d]/g, ''), 10);
                        return isNaN(parsed) ? 0 : Math.min(180, Math.max(0, parsed));
                      }}
                    />
                  </Form.Item>
                </Space>
              </Form>
            );
          }

          return (
            <EditableCell
              className="editable"
              onClick={(e) => {
                e.stopPropagation();
                setEditingCell({ id: row.original.id, field: 'estimatedTime' });
              }}
            >
              {estimatedTime > 0 ? `${estimatedTime} דקות` : '-'}
            </EditableCell>
          );
        },
      },
      {
        id: 'type',
        header: 'סוג',
        accessorKey: 'metadata.type',
        size: 100,
        cell: ({ row }) => {
          const isEditing = editingCell?.id === row.original.id && editingCell?.field === 'type';
          const type = row.original.metadata.type;

          if (isEditing) {
            return (
              <Form form={form} initialValues={{ type }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item name="type">
                    <Select
                      style={{ width: '100%' }}
                      autoFocus
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                    >
                      {Object.entries(enumMappings.questionType).map(([key, label]) => (
                        <Option key={key} value={key}>{label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <div className="edit-actions">
                    <Button 
                      size="small" 
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        const values = form.getFieldsValue();
                        handleSaveEdit(row.original.id, 'type', values.type);
                      }}
                    />
                  </div>
                </Space>
              </Form>
            );
          }

          return (
            <EditableCell
              className="editable"
              onClick={(e) => {
                e.stopPropagation();
                setEditingCell({ id: row.original.id, field: 'type' });
              }}
            >
              {enumMappings.questionType[type] || type}
            </EditableCell>
          );
        },
      },
      {
        id: 'source',
        header: 'מקור',
        accessorKey: 'metadata.source',
        size: 150,
        cell: ({ getValue }) => {
          const source = getValue() as QuestionListItem['metadata']['source'];
          if (!source) return '-';
          if (source.type === SourceType.EXAM) {
            return (
              <Tag icon={<BookOutlined />}>
                {`בחינה ${source.year} ${source.season} מועד ${source.moed}`}
              </Tag>
            );
          }
          return (
            <Tag icon={source.creatorType === EzpassCreatorType.AI ? <RobotOutlined /> : <UserOutlined />}>
              {source.creatorType === EzpassCreatorType.AI ? 'AI' : 'מורה'}
            </Tag>
          );
        },
      },
      {
        id: 'validationStatus',
        header: 'תקינות',
        accessorKey: 'validation_status',
        size: 140,
        cell: ({ getValue }) => {
          const status = getValue() as ValidationStatus;
          const config = validationStatusConfig[status];
          return (
            <Tag color={config.color} icon={config.icon}>
              {config.text}
            </Tag>
          );
        },
      },
      {
        id: 'publication_status',
        header: 'סטטוס פרסום',
        accessorKey: 'publication_status',
        size: 140,
        cell: ({ getValue }) => {
          const status = getValue() as PublicationStatusEnum;
          return (
            <Tag color={getStatusColor(status)}>
              {PUBLICATION_STATUS_DESCRIPTIONS[status]}
            </Tag>
          );
        },
      },
      {
        id: 'review_status',
        header: 'סטטוס בדיקה',
        accessorKey: 'review_status',
        size: 140,
        cell: ({ getValue }) => {
          const status = getValue() as ReviewStatusEnum;
          return (
            <Tag color={status === ReviewStatusEnum.APPROVED ? 'success' : 'warning'}>
              {REVIEW_STATUS_DESCRIPTIONS[status]}
            </Tag>
          );
        },
      },
      {
        id: 'created_at',
        header: 'נוצר',
        accessorKey: 'created_at',
        size: 150,
        cell: ({ getValue }) => dayjs(getValue() as string).format('DD/MM/YYYY HH:mm'),
      },
      {
        id: 'updated_at',
        header: 'עודכן',
        accessorKey: 'updated_at',
        size: 150,
        cell: ({ getValue }) => dayjs(getValue() as string).format('DD/MM/YYYY HH:mm'),
      },
      {
        id: 'delete',
        header: '',
        size: 50,
        cell: ({ row }) => (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(row.original.id)}
          />
        ),
      },
    ],
    [editingCell, form, universalTopics]
  );

  // Add missing validationStatusConfig
  const validationStatusConfig: ValidationStatusConfig = {
    [ValidationStatus.VALID]: {
      color: 'success',
      text: 'תקין',
      icon: <CheckCircleOutlined />
    },
    [ValidationStatus.WARNING]: {
      color: 'warning',
      text: 'אזהרה',
      icon: <WarningOutlined />
    },
    [ValidationStatus.ERROR]: {
      color: 'error',
      text: 'לא תקין',
      icon: <CloseCircleOutlined />
    }
  };

  // Add getStatusColor function
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

  // Add handleDelete function
  const handleDelete = async (questionId: string) => {
    try {
      await questionStorage.deleteQuestion(questionId);
      message.success('Question deleted successfully');
      loadQuestions();
    } catch (error) {
      message.error('Failed to delete question');
      console.error('Delete error:', error);
    }
  };

  const table = useReactTable({
    data: questions,
    columns,
    state: {
      rowSelection,
      sorting,
      columnOrder,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting as OnChangeFn<SortingState>,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode,
    enableColumnResizing: true,
  });

  // Initialize column order if not set
  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(columns.map(col => col.id as string));
    }
  }, [columns]);

  return (
    <PageContainer>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Stats Card */}
        {statistics && (
          <StatsCard>
            {/* ... existing stats card content ... */}
          </StatsCard>
        )}

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={16} align="middle" justify="space-between">
              <Col>
                <Space size="middle">
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/admin/questions/new')}
                  >
                    שאלה חדשה
                  </Button>
                  <Input
                    placeholder="חיפוש שאלות..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => handleSearchChange(e.target.value)}
                    style={{ width: 200 }}
                  />
                </Space>
              </Col>
              <Col>
                <Space>
                  <Select 
                    placeholder="סוג שאלה"
                    style={{ width: 120 }}
                    allowClear
                    onChange={value => setFilters(prev => ({ ...prev, type: value }))}
                  >
                    {Object.entries(enumMappings.questionType).map(([key, label]) => (
                      <Option key={key} value={key}>{label}</Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="רמת קושי"
                    style={{ width: 120 }}
                    allowClear
                    onChange={value => setFilters(prev => ({ ...prev, difficulty: value }))}
                  >
                    {[1, 2, 3, 4, 5].map(level => (
                      <Option key={level} value={level}>{level}</Option>
                    ))}
                  </Select>
                </Space>
              </Col>
            </Row>

            <TableStyles>
              <div className="table-container">
                <table>
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th 
                            key={header.id}
                            style={{ 
                              width: header.getSize(),
                              position: 'relative',
                              cursor: 'grab',
                            }}
                            className={header.column.getCanSort() ? 'sortable' : ''}
                            onClick={header.column.getToggleSortingHandler()}
                            draggable
                            onDragStart={e => {
                              e.dataTransfer.setData('text/plain', header.id);
                            }}
                            onDragOver={e => {
                              e.preventDefault();
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              const fromId = e.dataTransfer.getData('text/plain');
                              const toId = header.id;
                              if (fromId !== toId) {
                                const newColumnOrder = [...columnOrder];
                                const fromIndex = newColumnOrder.indexOf(fromId);
                                const toIndex = newColumnOrder.indexOf(toId);
                                newColumnOrder.splice(fromIndex, 1);
                                newColumnOrder.splice(toIndex, 0, fromId);
                                setColumnOrder(newColumnOrder);
                              }
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <div
                              {...{
                                onMouseDown: header.getResizeHandler(),
                                onTouchStart: header.getResizeHandler(),
                                className: `resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`,
                              }}
                            />
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <StyledRow 
                        key={row.id}
                        className={row.getIsSelected() ? 'selected' : ''}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </StyledRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableStyles>

            <Row justify="space-between" align="middle">
              <Col>
                <Text type="secondary">
                  {`מציג ${table.getRowModel().rows.length} מתוך ${questions.length} שאלות`}
                </Text>
              </Col>
              <Col>
                <Space>
                  <Button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    הקודם
                  </Button>
                  <Button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    הבא
                  </Button>
                </Space>
              </Col>
            </Row>
          </Space>
        </Card>
      </Space>
    </PageContainer>
  );
}