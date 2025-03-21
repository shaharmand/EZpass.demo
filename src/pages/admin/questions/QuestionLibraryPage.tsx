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
  CloseOutlined,
  LeftOutlined,
  RightOutlined
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
  REVIEW_STATUS_DESCRIPTIONS,
  MoedType
} from '../../../types/question';
import { SubTopic, Topic } from '../../../types/subject';
import { questionStorage } from '../../../services/admin/questionStorage';
import { universalTopics } from '../../../services/universalTopics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/he';
import { questionLibrary, QuestionFilters } from '../../../services/questionLibrary';
import { getEnumTranslation, enumMappings } from '../../../utils/translations';
import styled from 'styled-components';
import { debounce } from 'lodash';
import { examService } from '../../../services/examService';
import { supabase } from '../../../lib/supabase';
import { UserRole } from '../../../types/userTypes';
import { ExamType } from '../../../types/examTemplate';
import { useSearchResults } from '../../../contexts/SearchResultsContext';

dayjs.extend(relativeTime);
dayjs.locale('he');

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PageContainer = styled.div`
  width: 100%;
  padding: 0 16px 16px;
  box-sizing: border-box;
`;

const FiltersCard = styled(Card)`
  margin-bottom: 16px;
  
  .ant-card-body {
    padding: 16px;
  }
  
  .ant-form-item {
    margin-bottom: 0;
  }
  
  .ant-select, .ant-input-search {
    width: 160px;
  }
  
  .ant-row {
    row-gap: 12px;
  }
`;

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  padding: 0;
  height: calc(100vh - 300px);
  min-height: 400px;
  max-height: 800px;
  margin-bottom: 24px;
  
  .table-wrapper {
    flex: 1;
    overflow: auto;
    position: relative;
  }
  
  .pagination-container {
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    border-radius: 8px 8px 0 0;
    position: sticky;
    top: 0;
    z-index: 5;
    margin-bottom: 0;
  }
`;

const TableStyles = styled.div`
  direction: rtl;
  width: 100%;
  height: 100%;
  overflow: hidden;
  
  .table-container {
    width: 100%;
    height: 100%;
    overflow: auto;
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
    
    thead {
      position: sticky;
      top: 0;
      z-index: 2;
      background: #fafafa;
    }
    
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

      &.sticky {
        position: sticky;
        right: 0;
        z-index: 2;
        background: #fff;
        box-shadow: -2px 0 4px rgba(0,0,0,0.05);
        
        &::after {
          content: '';
          position: absolute;
          right: -1px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: #f0f0f0;
        }
      }

      &.sticky-header {
        background: #fafafa;
        z-index: 3;
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
          
          &.sticky {
            background-color: #fafafa;
          }
        }
      }
      
      &.selected {
        background-color: #e6f7ff;
        
        td {
          background-color: #e6f7ff;
          
          &.sticky {
            background-color: #e6f7ff;
          }
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
    padding: 16px;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s;

    &:hover {
      background: #f0f0f0;
    }
  }

  .stat-title {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #262626;
  }

  .stat-subtitle {
    font-size: 13px;
    color: #999;
    margin-top: 4px;
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

const FilterSection = styled(Card)`
  margin-bottom: 16px;
  
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &.has-value {
      .filter-label {
        color: #1677ff;
        font-weight: 600;
      }

      .ant-select .ant-select-selector {
        border-color: #1677ff;
        background-color: #e6f4ff;
      }

      .ant-input-affix-wrapper {
        border-color: #1677ff;
        background-color: #e6f4ff;
      }
    }
  }

  .filter-label {
    font-size: 13px;
    color: #666;
    font-weight: 500;
  }

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .search-group {
      flex: 2;
      min-width: 300px;
    }

    .type-group {
      flex: 1;
      min-width: 150px;
    }

    .topic-group {
      flex: 1.5;
      min-width: 200px;
    }

    .subtopic-group {
      flex: 1.5;
      min-width: 200px;
    }

    .difficulty-group {
      flex: 0.5;
      min-width: 100px;
    }

    .source-filters {
      display: flex;
      gap: 8px;
      flex: 2;
      min-width: 300px;

      .filter-group {
        flex: 1;
      }
    }

    .status-filters {
      display: flex;
      gap: 8px;
      flex: 3;
      min-width: 450px;

      .filter-group {
        flex: 0 1 auto;
        min-width: 120px;
      }
    }
  }
`;

const PaginationSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pagination-info {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .page-info {
    font-size: 14px;
    color: #666;
  }

  .results-info {
    font-size: 13px;
    color: #999;
  }

  .pagination-buttons {
    display: flex;
    gap: 8px;

    .ant-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      
      .anticon {
        font-size: 12px;
      }
    }
  }
`;

export function QuestionLibraryPage() {
  const [questions, setQuestions] = useState<DatabaseQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [form] = Form.useForm();

  const navigate = useNavigate();
  const { setSearchResults } = useSearchResults();

  // Get unique subjects and their domains
  const subjects = universalTopics.getAllSubjects();
  const selectedSubject = subjects.find(s => s.id === 'civil_engineering');
  const domains = selectedSubject?.domains || [];
  const selectedDomain = domains.find(d => d.id === 'construction_safety');
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

  const handleQuestionTypeChange = (value: QuestionType | null, _option: any) => {
    setFilters(prev => ({ ...prev, type: value || undefined }));
  };

  const handleDifficultyChange = (value: DifficultyLevel | null, _option: any) => {
    setFilters(prev => ({ ...prev, difficulty: value || undefined }));
  };

  const handleEditClick = useCallback((questionId: string) => {
    navigate(`/admin/questions/${questionId}`);
  }, [navigate]);

  // Add loadQuestions function
  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      // Update the questionLibrary's current list with the current filters
      await questionLibrary.updateCurrentList(filters);
      const loadedQuestions = await questionStorage.getFilteredQuestions(filters);
      setQuestions(loadedQuestions.filter(question => 
        question && typeof question.id === 'string' && !question.id.startsWith('test_')
      ));
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

  // Update search results whenever questions change
  useEffect(() => {
    setSearchResults(questions);
  }, [questions, setSearchResults]);

  const handleSaveEdit = async (questionId: string, field: string, value: any) => {
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const updatedQuestion = { ...question };
      
      switch (field) {
        case 'topic':
          updatedQuestion.data.metadata.topicId = value.topicId;
          updatedQuestion.data.metadata.subtopicId = value.subtopicId;
          break;
        case 'difficulty':
          updatedQuestion.data.metadata.difficulty = value as DifficultyLevel;
          break;
        case 'estimatedTime':
          updatedQuestion.data.metadata.estimatedTime = value as number;
          break;
        case 'type':
          updatedQuestion.data.metadata.type = value as QuestionType;
          break;
        case 'name':
          updatedQuestion.data.name = value;
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

  const columns = useMemo<ColumnDef<DatabaseQuestion>[]>(
    () => [
      {
        id: 'actions',
        header: 'פעולות',
        size: 100,
        cell: ({ row }) => (
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditClick(row.original.id)}
            >
              ערוך
            </Button>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(row.original.id)}
            />
          </Space>
        ),
        meta: {
          sticky: true
        }
      },
      {
        id: 'number',
        header: 'מספר',
        size: 80,
        cell: ({ row }) => {
          const index = row.index + 1;
          return (
            <Text style={{ color: '#8c8c8c', fontWeight: 500 }}>
              {index}
            </Text>
          );
        },
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
        id: 'type',
        header: 'סוג',
        accessorKey: 'data.metadata.type',
        size: 100,
        cell: ({ row }) => {
          const isEditing = editingCell?.id === row.original.id && editingCell?.field === 'type';
          const type = row.original.data.metadata.type;

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
        id: 'content',
        header: 'תוכן',
        accessorKey: 'data.name',
        size: 400,
        cell: ({ row }) => {
          const isEditing = editingCell?.id === row.original.id && editingCell?.field === 'name';
          
          if (isEditing) {
            return (
              <Form form={form} initialValues={{ name: row.original.data.name }}>
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
                <div className="content-title">{row.original.data.name || 'Untitled'}</div>
              </EditableCell>
              <div className="content-text" style={{ WebkitLineClamp: 1 }}>
                {row.original.data.content.text}
              </div>
            </div>
          );
        },
      },
      {
        id: 'topic',
        header: 'נושא',
        accessorKey: 'data.metadata.topicId',
        size: 200,
        cell: ({ row }) => {
          const topicId = row.original.data.metadata.topicId;
          const subtopicId = row.original.data.metadata.subtopicId;
          const subject = universalTopics.getSubjectForTopic(topicId);
          const domain = subject?.domains.find(d => d.topics.some(t => t.id === topicId));
          const topic = domain?.topics.find(t => t.id === topicId);
          const subtopic = subtopicId ? universalTopics.getSubtopicInfo(topicId, subtopicId) : undefined;

          return (
            <div>
              {subtopic && <div style={{ fontWeight: 500 }}>{subtopic.name}</div>}
              <div style={{ color: '#666' }}>{topic?.name || topicId}</div>
            </div>
          );
        },
      },
      {
        id: 'source',
        header: 'מקור',
        accessorKey: 'data.metadata.source',
        size: 150,
        cell: ({ getValue }) => {
          const source = getValue() as QuestionListItem['metadata']['source'];
          if (!source) return '-';
          if (source.type === SourceType.EXAM) {
            const exam = examService.getExamById(source.examTemplateId || '');
            const examName = exam?.names.short || source.examTemplateId;
            const year = source.year;
            const period = source.period ? getEnumTranslation('period', source.period) : '';
            const moed = source.moed ? getEnumTranslation('moed', source.moed) : '';
            
            const parts = [
              examName,
              year,
              period,
              moed
            ].filter(Boolean);
            
            return (
              <Tag icon={<BookOutlined />}>
                {parts.join(' • ')}
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
        id: 'difficulty',
        header: 'רמת קושי',
        accessorKey: 'data.metadata.difficulty',
        size: 100,
        cell: ({ row }) => {
          const isEditing = editingCell?.id === row.original.id && editingCell?.field === 'difficulty';
          const difficulty = row.original.data.metadata.difficulty;

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
                      {(([1, 2, 3, 4, 5]) as DifficultyLevel[]).map((level: DifficultyLevel) => (
                        <Option key={level} value={level}>{enumMappings.difficulty[level]}</Option>
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
        accessorKey: 'data.metadata.estimatedTime',
        size: 120,
        cell: ({ row }) => {
          const isEditing = editingCell?.id === row.original.id && editingCell?.field === 'estimatedTime';
          const estimatedTime = row.original.data.metadata.estimatedTime || 0;

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

  // Add status filter handlers
  const handleValidationStatusChange = (value: ValidationStatus | undefined) => {
    setFilters(prev => ({
      ...prev,
      validation_status: value
    }));
  };

  const handlePublicationStatusChange = (value: PublicationStatusEnum | undefined) => {
    setFilters(prev => ({
      ...prev,
      publication_status: value
    }));
  };

  const handleReviewStatusChange = (value: ReviewStatusEnum | undefined) => {
    setFilters(prev => ({
      ...prev,
      review_status: value
    }));
  };

  return (
    <PageContainer>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <FiltersCard>
          <Title level={4}>סינון שאלות</Title>
          <Form layout="inline">
            <Row gutter={[16, 8]} style={{ width: '100%' }}>
              <Col>
                <Input.Search
                  placeholder="חיפוש שאלות..."
                  onSearch={value => handleSearchChange(value)}
                  onChange={e => setSearchText(e.target.value)}
                  style={{ width: 240 }}
                  allowClear
                />
              </Col>
              <Col>
                <Select
                  placeholder="סוג שאלה"
                  style={{ width: 160 }}
                  allowClear
                  value={filters.type}
                  onChange={value => setFilters(prev => ({ ...prev, type: value }))}
                >
                  {Object.entries(enumMappings.questionType).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="רמת קושי"
                  style={{ width: 160 }}
                  allowClear
                  value={filters.difficulty}
                  onChange={value => setFilters(prev => ({ ...prev, difficulty: value }))}
                >
                  {(([1, 2, 3, 4, 5]) as DifficultyLevel[]).map((level: DifficultyLevel) => (
                    <Option key={level} value={level}>{enumMappings.difficulty[level]}</Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="נושא"
                  style={{ width: 180 }}
                  allowClear
                  value={filters.topic}
                  onChange={value => {
                    setFilters(prev => ({
                      ...prev,
                      topic: value,
                      subtopic: undefined
                    }));
                  }}
                >
                  {topics.map((topic: Topic) => (
                    <Option key={topic.id} value={topic.id}>
                      {topic.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="תת-נושא"
                  style={{ width: 180 }}
                  allowClear
                  value={filters.subtopic}
                  onChange={value => setFilters(prev => ({ ...prev, subtopic: value }))}
                  disabled={!filters.topic}
                >
                  {selectedTopic?.subTopics.map((subtopic: SubTopic) => (
                    <Option key={subtopic.id} value={subtopic.id}>
                      {subtopic.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="שנה"
                  style={{ width: 100 }}
                  allowClear
                  value={filters.source?.year}
                  onChange={value => setFilters(prev => ({
                    ...prev,
                    source: { ...prev.source, year: value }
                  }))}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="עונה"
                  style={{ width: 100 }}
                  allowClear
                  value={filters.source?.period}
                  onChange={value => setFilters(prev => ({
                    ...prev,
                    source: { ...prev.source, period: value }
                  }))}
                >
                  <Option value="Spring">אביב</Option>
                  <Option value="Summer">קיץ</Option>
                  <Option value="Winter">חורף</Option>
                  <Option value="Fall">סתיו</Option>
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="מועד"
                  style={{ width: 100 }}
                  allowClear
                  value={filters.source?.moed}
                  onChange={value => setFilters(prev => ({
                    ...prev,
                    source: { ...prev.source, moed: value }
                  }))}
                >
                  <Option value="A">א</Option>
                  <Option value="B">ב</Option>
                  <Option value="Special">ג</Option>
                </Select>
              </Col>
            </Row>
            <Row gutter={[16, 8]} style={{ width: '100%', marginTop: 8 }}>
              <Col>
                <Select
                  placeholder="סטטוס אימות"
                  style={{ width: 140 }}
                  allowClear
                  value={filters.validation_status}
                  onChange={handleValidationStatusChange}
                >
                  <Option value={ValidationStatus.VALID}>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <span>תקין</span>
                    </Space>
                  </Option>
                  <Option value={ValidationStatus.WARNING}>
                    <Space>
                      <WarningOutlined style={{ color: '#faad14' }} />
                      <span>אזהרות</span>
                    </Space>
                  </Option>
                  <Option value={ValidationStatus.ERROR}>
                    <Space>
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      <span>שגיאות</span>
                    </Space>
                  </Option>
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="סטטוס פרסום"
                  style={{ width: 140 }}
                  allowClear
                  value={filters.publication_status}
                  onChange={handlePublicationStatusChange}
                >
                  {Object.entries(PUBLICATION_STATUS_DESCRIPTIONS).map(([status, description]) => (
                    <Option key={status} value={status}>
                      <Space>
                        {status === PublicationStatusEnum.PUBLISHED ? (
                          <CheckOutlined style={{ color: '#52c41a' }} />
                        ) : status === PublicationStatusEnum.DRAFT ? (
                          <EditOutlined style={{ color: '#1677ff' }} />
                        ) : (
                          <StopOutlined style={{ color: '#ff4d4f' }} />
                        )}
                        <span>{description}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="סטטוס סקירה"
                  style={{ width: 140 }}
                  allowClear
                  value={filters.review_status}
                  onChange={handleReviewStatusChange}
                >
                  {Object.entries(REVIEW_STATUS_DESCRIPTIONS).map(([status, description]) => (
                    <Option key={status} value={status}>
                      <Space>
                        {status === ReviewStatusEnum.APPROVED ? (
                          <CheckOutlined style={{ color: '#52c41a' }} />
                        ) : status === ReviewStatusEnum.PENDING_REVIEW ? (
                          <ClockCircleOutlined style={{ color: '#faad14' }} />
                        ) : (
                          <CloseOutlined style={{ color: '#ff4d4f' }} />
                        )}
                        <span>{description}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Form>
        </FiltersCard>

        <TableContainer>
          <div className="table-wrapper">
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
                            className={`${header.column.getCanSort() ? 'sortable' : ''} ${
                              (header.column.columnDef.meta as any)?.sticky ? 'sticky sticky-header' : ''
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
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
                          <td 
                            key={cell.id}
                            className={
                              (cell.column.columnDef.meta as any)?.sticky ? 'sticky' : ''
                            }
                          >
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
          </div>
          
          <div className="pagination-container">
            <Row justify="space-between" align="middle">
              <Col>
                <Text className="results-info">{'נמצאו ' + questions.length + ' שאלות'}</Text>
                <Text className="page-info" style={{ marginRight: 12 }}>{'עמוד ' + (table.getState().pagination.pageIndex + 1) + ' מתוך ' + table.getPageCount()}</Text>
              </Col>
              <Col>
                <Space>
                  <Button
                    type="primary"
                    ghost
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    icon={<RightOutlined />}
                  >
                    הקודם
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    icon={<LeftOutlined />}
                  >
                    הבא
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>
        </TableContainer>
      </Space>
    </PageContainer>
  );
}