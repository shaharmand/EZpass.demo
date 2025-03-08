import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Space, Button, Input, Select, Tag, Typography, message, Modal, Tooltip, Row, Col, DatePicker } from 'antd';
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
  UserOutlined
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 32px;
`;

const TableStyles = styled.div`
  direction: rtl;
  
  .resizer {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 5px;
    background: rgba(0, 0, 0, 0.1);
    cursor: col-resize;
    user-select: none;
    touch-action: none;
    
    &.isResizing {
      background: blue;
      opacity: 1;
    }
  }
  
  table {
    width: 100%;
    border-spacing: 0;
    
    th, td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
      
      &:last-child {
        border-right: 0;
      }
    }

    th {
      background: #fafafa;
      font-weight: bold;
      text-align: right;
      position: relative;
      user-select: none;
      white-space: nowrap;
    }

    td {
      text-align: right;
    }
    
    tbody tr {
      &:hover {
        background-color: #f5f5f5;
      }
      
      &.selected {
        background-color: #e6f7ff;
      }

      .content-cell {
        max-width: 600px;
        min-width: 400px;
        
        .content-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .content-text {
          font-size: 13px;
          line-height: 1.5;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
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
          if (question.metadata.source) {
            if (question.metadata.source.type === 'exam') {
              mappedSource = {
                type: SourceType.EXAM,
                examTemplateId: question.metadata.source.examTemplateId,
                year: question.metadata.source.year,
                season: question.metadata.source.season,
                moed: question.metadata.source.moed
              };
            } else if (question.metadata.source.type === 'ezpass') {
              mappedSource = {
                type: SourceType.EZPASS,
                creatorType: question.metadata.source.creatorType
              };
            }
          }

          return {
            id: question.id,
            name: question.name || 'Untitled',
            content: {
              text: typeof question.content === 'string' ? question.content : 
                    typeof question.content === 'object' && 'text' in question.content ? question.content.text :
                    JSON.stringify(question.content),
              format: 'markdown' as const
            },
            metadata: {
              subjectId: question.metadata.subjectId,
              domainId: question.metadata.domainId,
              topicId: question.metadata.topicId,
              subtopicId: question.metadata.subtopicId || '',
              type: question.metadata.type,
              difficulty: question.metadata.difficulty,
              estimatedTime: question.metadata.estimatedTime || 0,
              answerFormat: question.metadata.answerFormat,
              source: mappedSource
            },
            validation_status: question.validation_status,
            publication_status: question.publication_status,
            review_status: question.review_status || ReviewStatusEnum.PENDING_REVIEW,
            review_metadata: question.review_metadata,
            ai_generated_fields: question.ai_generated_fields,
            import_info: question.import_info,
            created_at: question.created_at || new Date().toISOString(),
            updated_at: question.updated_at || question.created_at || new Date().toISOString()
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

  const columns = useMemo<ColumnDef<QuestionListItem>[]>(
    () => [
      {
        id: 'id',
        header: 'ID',
        accessorKey: 'id',
        size: 100,
      },
      {
        id: 'content',
        header: 'תוכן',
        accessorKey: 'content',
        size: 600,
        cell: ({ row }) => (
          <div className="content-cell">
            <div className="content-title">{row.original.name}</div>
            <div className="content-text">
              {row.original.content.text}
            </div>
          </div>
        ),
      },
      {
        id: 'topic',
        header: 'נושא',
        accessorKey: 'metadata.topicId',
        size: 120,
        cell: ({ getValue }) => {
          const topicId = getValue() as string;
          const topic = topics.find((t: { id: string }) => t.id === topicId);
          return topic?.name || topicId;
        },
      },
      {
        id: 'subtopic',
        header: 'תת-נושא',
        accessorKey: 'metadata.subtopicId',
        size: 120,
        cell: ({ getValue }) => {
          const subtopicId = getValue() as string;
          const topic = topics.find(t => t.subTopics?.some(st => st.id === subtopicId));
          const subtopic = topic?.subTopics?.find(st => st.id === subtopicId);
          return subtopic?.name || subtopicId;
        },
      },
      {
        id: 'type',
        header: 'סוג',
        accessorKey: 'metadata.type',
        size: 100,
        cell: ({ getValue }) => {
          const type = getValue() as QuestionType;
          return enumMappings.questionType[type] || type;
        },
      },
      {
        id: 'difficulty',
        header: 'רמת קושי',
        accessorKey: 'metadata.difficulty',
        size: 120,
        cell: ({ getValue }) => {
          const difficulty = getValue() as DifficultyLevel;
          return (
            <Tag color={['', 'green', 'cyan', 'blue', 'purple', 'red'][difficulty]}>
              {difficulty}
            </Tag>
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
        id: 'actions',
        header: 'פעולות',
        size: 120,
        cell: ({ row }) => (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(row.original.id);
              }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.original.id);
              }}
            />
          </Space>
        ),
      },
    ],
    [topics]
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
  });

  // ... Keep existing useEffects and handlers ...

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
            {/* Search and Filters */}
            <Row gutter={16}>
              <Col>
                <Input
                  placeholder="Search questions..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={e => handleSearchChange(e.target.value)}
                  style={{ width: 200 }}
                />
              </Col>
              {/* Add other filter components */}
            </Row>

            {/* Table */}
            <TableStyles>
              <table>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id}
                          style={{ width: header.getSize() }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <div
                            className={`resizer ${
                              header.column.getIsResizing() ? 'isResizing' : ''
                            }`}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                          />
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id}
                      className={row.getIsSelected() ? 'selected' : ''}
                      onClick={() => handleEditClick(row.original.id)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableStyles>

            {/* Pagination */}
            <Row justify="end" gutter={16}>
              <Col>
                <Button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </Col>
            </Row>
          </Space>
        </Card>
      </Space>
    </PageContainer>
  );
}