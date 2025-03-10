import React, { useState, useEffect, useCallback } from 'react';
import { Card, Space, Typography, Row, Col, Button, Tag, Table, Tooltip } from 'antd';
import { 
  QuestionCircleOutlined,
  UserOutlined,
  BookOutlined,
  StarOutlined,
  PlusOutlined,
  SettingOutlined,
  RobotOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons/lib/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { questionStorage } from '../../services/admin/questionStorage';
import { supabase } from '../../lib/supabase';
import { examService } from '../../services/examService';
import { UserRole } from '../../types/userTypes';
import { ExamType } from '../../types/examTemplate';
import { PublicationStatusEnum, ValidationStatus, DatabaseQuestion, ReviewStatusEnum } from '../../types/question';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import { getEnumTranslation } from '../../utils/translations';
import { universalTopics } from '../../services/universalTopics';
import { SubTopic } from '../../types/subject';
import { ColumnType } from 'antd/es/table';
import type { TableProps } from 'antd';
import { UserManagementModal } from '../../components/UserManagementModal';
import { translations } from '../../translations/he';

dayjs.locale('he');

const { Title, Text } = Typography;

const StatsCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  }

  .stat-group {
    padding: 20px;
    border-radius: 12px;
    background: #fafafa;
    transition: all 0.3s;
    border: 1px solid #f0f0f0;

    &:hover {
      background: #f5f5f5;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
  }

  .stat-title {
    font-size: 15px;
    color: #595959;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;

    .anticon {
      font-size: 18px;
      color: #1890ff;
    }
  }

  .stat-value {
    font-size: 32px;
    font-weight: 600;
    color: #262626;
    margin-bottom: 4px;
  }

  .stat-subtitle {
    font-size: 14px;
    color: #8c8c8c;
    margin: 8px 0;
  }

  .stat-tags {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

// Create a type for our styled table component
type StyledTableProps = TableProps<ValidationIssue>;

// Create a base table component with proper typing
const BaseTable = (props: TableProps<ValidationIssue>) => <Table<ValidationIssue> {...props} />;

// Style the base table component
const StyledTable = styled(BaseTable)`
  .ant-table {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .ant-table-row {
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: #fafafa;
      transform: translateY(-1px);
    }
  }

  .ant-table-cell {
    padding: 16px !important;
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f0f0f0;
    transition: all 0.2s;
  }

  .ant-table-tbody > tr:hover > td {
    background-color: #fafafa !important;
  }

  .question-text {
    color: #595959;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
    font-size: 13px;
    margin-top: 4px;
  }

  .ant-table-pagination {
    margin: 16px 0;
  }
`;

interface DashboardStats {
  questions: {
    total: number;
    published: number;
    draft: number;
    validation: {
      valid: number;
      warning: number;
      error: number;
    };
  };
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
    activeToday: number;
    subscriptions: {
      free: number;
      plus: number;
      pro: number;
    };
  };
  exams: {
    total: number;
    byType: Record<string, number>;
    completedToday: number;
  };
}

interface UserStats {
  role: UserRole;
}

interface ValidationIssue {
  id: string;
  name: string;
  text: string;
  status: ValidationStatus;
  type: string;
  topic: string;
  subtopic: string;
  updatedAt: string;
  review_status: ReviewStatusEnum;
}

interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
  subscription_tier?: string;
}

// Add a styled wrapper for the entire dashboard
const DashboardWrapper = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;

  .dashboard-header {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #f0f0f0;
  }

  .section-card {
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border-radius: 8px;

    .ant-card-head {
      border-bottom: 1px solid #f0f0f0;
      padding: 16px 24px;
      min-height: auto;

      .ant-card-head-title {
        padding: 0;
      }
    }

    .ant-card-body {
      padding: 24px;
    }
  }
`;

// Add pagination locale settings
const tableLocale = {
  emptyText: 'אין נתונים להצגה',
  triggerDesc: 'לחץ למיון בסדר יורד',
  triggerAsc: 'לחץ למיון בסדר עולה',
  cancelSort: 'לחץ לביטול המיון',
  pagination: {
    items_per_page: '/ דף',
    jump_to: 'עבור לדף',
    jump_to_confirm: 'אישור',
    page: 'דף',
    prev_page: 'הדף הקודם',
    next_page: 'הדף הבא',
    prev_5: '5 דפים אחורה',
    next_5: '5 דפים קדימה',
    prev_3: '3 דפים אחורה',
    next_3: '3 דפים קדימה',
  }
};

const StyledCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .ant-card-body {
    padding: 20px;
  }

  .stat-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #fafafa;
    border-radius: 6px;
    
    &:hover {
      background: #f0f0f0;
    }
  }

  .exam-tag {
    min-width: 80px;
    text-align: center;
    margin: 0;
  }

  .count {
    font-weight: bold;
    font-size: 16px;
  }
`;

const RTLWrapper = styled.div`
  direction: rtl;
`;

const EXAM_TYPE_OPTIONS = [
  { label: translations.examTypes.bagrut_exam, value: 'bagrut_exam', count: 4 },
  { label: translations.examTypes.mahat_exam, value: 'mahat_exam', count: 7 },
  { label: translations.examTypes.government_exam, value: 'government_exam', count: 3 },
];

const getExamTypeColor = (type: string) => {
  switch (type) {
    case 'bagrut_exam':
      return 'volcano';
    case 'mahat_exam':
      return 'green';
    case 'government_exam':
      return 'cyan';
    default:
      return 'default';
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [pendingReviewQuestions, setPendingReviewQuestions] = useState<ValidationIssue[]>([]);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const loadValidationIssues = useCallback(async () => {
    try {
      // Get questions with warnings and errors
      const questions = await questionStorage.getFilteredQuestions({
        validation_status: ValidationStatus.WARNING
      });
      
      const errorQuestions = await questionStorage.getFilteredQuestions({
        validation_status: ValidationStatus.ERROR
      });

      const issues = [...errorQuestions, ...questions].map(q => ({
        id: q.id,
        name: q.data.name || 'ללא שם',
        text: typeof q.data.content === 'string' ? q.data.content : 
              typeof q.data.content === 'object' && 'text' in q.data.content ? q.data.content.text :
              JSON.stringify(q.data.content),
        status: q.validation_status,
        type: q.data.metadata.type,
        topic: q.data.metadata.topicId,
        subtopic: q.data.metadata.subtopicId || '',
        updatedAt: q.updated_at,
        review_status: q.review_status
      }));

      setValidationIssues(issues);

      // Get questions pending review
      const pendingQuestions = await questionStorage.getFilteredQuestions({
        review_status: ReviewStatusEnum.PENDING_REVIEW
      });

      const pendingIssues = pendingQuestions.map(q => ({
        id: q.id,
        name: q.data.name || 'ללא שם',
        text: typeof q.data.content === 'string' ? q.data.content : 
              typeof q.data.content === 'object' && 'text' in q.data.content ? q.data.content.text :
              JSON.stringify(q.data.content),
        status: q.validation_status,
        type: q.data.metadata.type,
        topic: q.data.metadata.topicId,
        subtopic: q.data.metadata.subtopicId || '',
        updatedAt: q.updated_at,
        review_status: q.review_status
      }));

      setPendingReviewQuestions(pendingIssues);
    } catch (error) {
      console.error('Failed to load validation issues:', error);
    }
  }, []);

  const getSubtopicName = (topicId: string, subtopicId: string): string => {
    const allSubjects = universalTopics.getAllSubjects();
    for (const subject of allSubjects) {
      for (const domain of subject.domains) {
        for (const topic of domain.topics) {
          const subtopic = topic.subTopics?.find((st: SubTopic) => st.id === subtopicId);
          if (subtopic) {
            return subtopic.name;
          }
        }
      }
    }
    return subtopicId || '-';
  };

  const loadDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get question statistics
      const questionStats = await questionStorage.getQuestionStatistics();
      
      // Get user statistics from Supabase with debugging
      console.log('Fetching user statistics...');
      const { data: userStats, count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('id, role, created_at, subscription_tier', { count: 'exact' })
        .order('created_at', { ascending: false })
        .then((result: { data: Profile[] | null, error: any, count: number | null }) => {
          console.log('Raw Supabase response:', result);
          if (!result.data || result.data.length === 0) {
            console.warn('No users found or empty response');
          } else if (result.data.length < 5) {
            console.warn(`Only found ${result.data.length} users when expecting at least 5. This might be an RLS (Row Level Security) issue.`);
            console.log('Try running this SQL in Supabase:');
            console.log(`SELECT id, role, created_at, subscription_tier FROM profiles ORDER BY created_at DESC;`);
          }
          return result;
        });

      if (userError) {
        console.error('Error fetching users:', userError);
        console.error('This might be a permissions issue. Check RLS policies in Supabase.');
        throw userError;
      }

      // Log the full user data for debugging
      console.log('Full user data:', userStats?.map((user: Profile) => ({
        id: user.id,
        role: user.role,
        created_at: user.created_at,
        subscription_tier: user.subscription_tier
      })));

      // Make sure we have the data before counting
      const users = userStats || [];
      const students = users.filter((u: Profile) => u.role === UserRole.STUDENT).length;
      const teachers = users.filter((u: Profile) => u.role === UserRole.TEACHER).length;
      const admins = users.filter((u: Profile) => u.role === UserRole.ADMIN).length;
      
      // Count subscriptions (assuming subscription_tier is in the Profile type)
      const freeUsers = users.filter((u: Profile) => u.subscription_tier === 'free').length;
      const plusUsers = users.filter((u: Profile) => u.subscription_tier === 'plus').length;
      const proUsers = users.filter((u: Profile) => u.subscription_tier === 'pro').length;
      
      console.log('User role counts:', {
        total: users.length,
        byRole: users.reduce((acc: Record<string, number>, user: Profile) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        students,
        teachers,
        admins,
        userCount,
        expectedCount: 5,
        mismatch: userCount !== users.length ? 'Count mismatch detected!' : 'Counts match'
      });
      
      // Remove queries for non-existent tables
      const activeToday = 0; // Default to 0 since we don't have the activity table
      
      // Get exam statistics
      const examTypes = [ExamType.BAGRUT_EXAM, ExamType.MAHAT_EXAM, ExamType.GOVERNMENT_EXAM];
      const examsByType = examTypes.reduce((acc, type) => {
        acc[type] = examService.getExamsByType(type).length;
        return acc;
      }, {} as Record<string, number>);

      const totalExams = Object.values(examsByType).reduce((sum: number, count: number) => sum + count, 0);

      // Remove query for non-existent exam_sessions table
      const completedToday = 0; // Default to 0 since we don't have the exam_sessions table

      setStats({
        questions: {
          total: questionStats.review.total,
          published: questionStats.publication.published,
          draft: questionStats.publication.draft,
          validation: {
            valid: questionStats.validation[ValidationStatus.VALID] || 0,
            warning: questionStats.validation[ValidationStatus.WARNING] || 0,
            error: questionStats.validation[ValidationStatus.ERROR] || 0
          }
        },
        users: {
          total: users.length,
          students,
          teachers,
          admins,
          activeToday,
          subscriptions: {
            free: freeUsers,
            plus: plusUsers,
            pro: proUsers
          }
        },
        exams: {
          total: totalExams,
          byType: examsByType,
          completedToday // Will be 0 until we have the exam_sessions table
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
    loadValidationIssues();
    
    // Refresh stats every 5 minutes
    const interval = setInterval(() => {
      loadDashboardStats();
      loadValidationIssues();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDashboardStats, loadValidationIssues]);

  const validationColumns: ColumnType<ValidationIssue>[] = [
    {
      title: 'סטטוס',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: ValidationStatus) => (
        <Tag 
          color={status === ValidationStatus.WARNING ? 'warning' : 'error'}
          icon={status === ValidationStatus.WARNING ? <WarningOutlined /> : <CloseCircleOutlined />}
        >
          {status === ValidationStatus.WARNING ? 'אזהרה' : 'שגיאה'}
        </Tag>
      ),
    },
    {
      title: 'שם השאלה',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (name: string) => (
        <div style={{ fontWeight: 500 }}>{name}</div>
      ),
    },
    {
      title: 'תוכן השאלה',
      dataIndex: 'text',
      key: 'text',
      width: 300,
      render: (text: string) => (
        <div className="question-text">{text}</div>
      ),
    },
    {
      title: 'סוג שאלה',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: string) => getEnumTranslation('questionType', type)
    },
    {
      title: 'תת-נושא',
      dataIndex: 'subtopic',
      key: 'subtopic',
      width: 160,
      ellipsis: true,
      render: (subtopicId: string, record: ValidationIssue) => getSubtopicName(record.topic, subtopicId)
    },
    {
      title: 'עודכן',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
    },
  ];

  const reviewColumns: ColumnType<ValidationIssue>[] = [
    {
      title: 'סטטוס',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: ValidationStatus) => {
        const config = {
          [ValidationStatus.VALID]: { color: 'success', icon: <CheckCircleOutlined />, text: 'תקין' },
          [ValidationStatus.WARNING]: { color: 'warning', icon: <WarningOutlined />, text: 'אזהרה' },
          [ValidationStatus.ERROR]: { color: 'error', icon: <CloseCircleOutlined />, text: 'שגיאה' }
        };
        return (
          <Tag 
            color={config[status].color}
            icon={config[status].icon}
          >
            {config[status].text}
          </Tag>
        );
      },
    },
    {
      title: 'שם השאלה',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (name: string) => (
        <div style={{ fontWeight: 500 }}>{name}</div>
      ),
    },
    {
      title: 'תוכן השאלה',
      dataIndex: 'text',
      key: 'text',
      width: 300,
      render: (text: string) => (
        <div className="question-text">{text}</div>
      ),
    },
    {
      title: 'סוג שאלה',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: string) => getEnumTranslation('questionType', type)
    },
    {
      title: 'תת-נושא',
      dataIndex: 'subtopic',
      key: 'subtopic',
      width: 160,
      ellipsis: true,
      render: (subtopicId: string, record: ValidationIssue) => getSubtopicName(record.topic, subtopicId)
    },
    {
      title: 'עודכן',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
    },
  ];

  // Calculate total exams
  const totalExams = EXAM_TYPE_OPTIONS.reduce((sum, type) => sum + type.count, 0);

  return (
    <RTLWrapper>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Title level={2}>לוח בקרה</Title>
        </Col>
        
        {/* Questions Statistics Card */}
        <Col xs={24} md={12} lg={8}>
          <StatsCard>
            <div className="stat-group">
              <div className="stat-title">
                <QuestionCircleOutlined />
                סטטיסטיקת שאלות
              </div>
              <div className="stat-value">{stats?.questions.total || 0}</div>
              <div className="stat-subtitle">סה"כ שאלות במערכת</div>
              <div className="stat-tags">
                <Tag icon={<CheckCircleOutlined />} color="success">
                  תקין: {stats?.questions.validation.valid || 0}
                </Tag>
                <Tag icon={<WarningOutlined />} color="warning">
                  אזהרות: {stats?.questions.validation.warning || 0}
                </Tag>
                <Tag icon={<CloseCircleOutlined />} color="error">
                  שגיאות: {stats?.questions.validation.error || 0}
                </Tag>
              </div>
            </div>
          </StatsCard>
        </Col>

        {/* Users Statistics Card */}
        <Col xs={24} md={12} lg={8}>
          <StatsCard onClick={() => setIsUserManagementOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="stat-group">
              <div className="stat-title">
                <UserOutlined />
                סטטיסטיקת משתמשים
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserManagementOpen(true);
                  }}
                  style={{ marginRight: 'auto' }}
                >
                  ניהול משתמשים
                </Button>
              </div>
              <div className="stat-value">{stats?.users.total || 0}</div>
              <div className="stat-subtitle">סה"כ משתמשים פעילים</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Text type="secondary" style={{ fontSize: '13px', minWidth: '45px' }}>תפקיד:</Text>
                <div className="stat-tags" style={{ margin: 0 }}>
                  <Tag color="geekblue">תלמידים: {stats?.users.students || 0}</Tag>
                  <Tag color="purple">מורים: {stats?.users.teachers || 0}</Tag>
                  <Tag color="gold">מנהלים: {stats?.users.admins || 0}</Tag>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text type="secondary" style={{ fontSize: '13px', minWidth: '45px' }}>מנוי:</Text>
                <div className="stat-tags" style={{ margin: 0 }}>
                  <Tag color="blue">בסיסי: {stats?.users.subscriptions.free || 0}</Tag>
                  <Tag color="purple">איזיפס+: {stats?.users.subscriptions.plus || 0}</Tag>
                  <Tag color="gold">איזיפס פרו: {stats?.users.subscriptions.pro || 0}</Tag>
                </div>
              </div>
            </div>
          </StatsCard>
        </Col>

        {/* Exam Statistics Card */}
        <Col xs={24} md={12} lg={8}>
          <StatsCard>
            <div className="stat-group">
              <div className="stat-title">
                <FileTextOutlined />
                סטטיסטיקת מבחנים
              </div>
              <div className="stat-value">{totalExams}</div>
              <div className="stat-subtitle">סה"כ מבחנים במערכת</div>
              <div className="stat-tags">
                {EXAM_TYPE_OPTIONS.map(examType => (
                  <Tag key={examType.value} color={getExamTypeColor(examType.value)}>
                    {examType.label}: {examType.count}
                  </Tag>
                ))}
              </div>
            </div>
          </StatsCard>
        </Col>

        {/* Validation Issues Table */}
        <Col span={24}>
          <Card 
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>בעיות תיקוף ({validationIssues.length})</span>
              </Space>
            }
            className="section-card"
          >
            <StyledTable
              dataSource={validationIssues}
              columns={validationColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              locale={tableLocale}
              onRow={(record) => ({
                onClick: () => navigate(`/admin/questions/${record.id}`)
              })}
            />
          </Card>
        </Col>

        {/* Pending Review Questions Table */}
        <Col span={24}>
          <Card 
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <span>שאלות בהמתנה לסקירה ({pendingReviewQuestions.length})</span>
              </Space>
            }
            className="section-card"
          >
            <StyledTable
              dataSource={pendingReviewQuestions}
              columns={reviewColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              locale={tableLocale}
              onRow={(record) => ({
                onClick: () => navigate(`/admin/questions/${record.id}`)
              })}
            />
          </Card>
        </Col>

        {/* User Management Modal */}
        <UserManagementModal 
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
        />
      </Row>
    </RTLWrapper>
  );
};

export default Dashboard; 